import {getDynamoDbDocClient} from "@libs/dynamoDbSingleton";
import {DeleteCommand, GetCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {
    getLwaTokenByCodeAsync,
    getLwaTokenByRefreshTokenAsync,
    isExpiresLwaToken, LwaError, LwaOAuth2ErrorCode,
    LwaTokenResult
} from "@libs/lwa";
import {ResourceNotFoundException} from "@aws-sdk/client-dynamodb";

const LWA_CLIENT_ID = process.env.LWA_CLIENT_ID;
const LWA_CLIENT_SECRET = process.env.LWA_CLIENT_SECRET;
const LWA_TOKEN_MANAGE_TABLE = process.env.LWA_TOKEN_MANAGE_TABLE;


/**
 *
 * @param uid
 * @param tokenResult
 */
async function saveLwaTokenAsync(uid: string, tokenResult: LwaTokenResult) : Promise<void> {
    const client = getDynamoDbDocClient();
    await client.send(new UpdateCommand({
        TableName: LWA_TOKEN_MANAGE_TABLE,
        Key: {
            "uid": uid
        },
        UpdateExpression: 'set #refresh_token = :refresh_token, #token_type = :token_type, #access_token = :access_token, #expires_in = :expires_in, #access_token_timestamp = :access_token_timestamp',
        ExpressionAttributeNames: {
            '#refresh_token': 'refresh_token',
            '#access_token': 'access_token',
            '#token_type': 'token_type',
            '#expires_in': 'expires_in',
            '#access_token_timestamp': 'access_token_timestamp',
        },
        ExpressionAttributeValues: {
            ':refresh_token': tokenResult.refresh_token,
            ':access_token': tokenResult.access_token,
            ':token_type': tokenResult.token_type,
            ':expires_in': tokenResult.expires_in,
            ':access_token_timestamp': tokenResult.access_token_timestamp
        }
    }));
    return;
}

/**
 * 指定したユーザーのトークンを削除します。
 * @param uid
 */
async function removeTokenAsync(uid: string) : Promise<void> {
    const client = getDynamoDbDocClient();

    try {
        await client.send(new DeleteCommand({
            TableName: LWA_TOKEN_MANAGE_TABLE,
            Key: {
                "uid": uid
            },
        }));
    } catch (e) {
        // エラーについてはメッセージ出力のみをして、もみ消す。
        console.error(e.message);
    }
}

/**
 * 認証コードを使ってLWAからLWAトークンを発行後にデータベースにLWAトークンを保存します。
 * @param uid   対象ユーザーID
 * @param code  認証コード
 * @return LWAトークン
 */
export async function issueLwaTokenByCodeAndSaveToDbAsync(uid: string, code: string) : Promise<LwaTokenResult> {
    const tokenResult = await getLwaTokenByCodeAsync(LWA_CLIENT_ID, LWA_CLIENT_SECRET, code)

    await saveLwaTokenAndCodeAsync(uid, tokenResult, code);

    return tokenResult;
}

/**
 * LWAトークンと認証コードをデータベースに保存します。
 * @param uid   対象ユーザーID
 * @param tokenResult   LWAトークン
 * @param code  認証コード
 */
async function saveLwaTokenAndCodeAsync(uid: string, tokenResult: LwaTokenResult, code: string) : Promise<void> {
    const client = getDynamoDbDocClient();
    await client.send(new UpdateCommand({
        TableName: LWA_TOKEN_MANAGE_TABLE,
        Key: {
            "uid": uid
        },
        UpdateExpression: 'set #code = :code, #refresh_token = :refresh_token, #token_type = :token_type, #access_token = :access_token, #expires_in = :expires_in, #access_token_timestamp = :access_token_timestamp',
        ExpressionAttributeNames: {
            '#code': 'code',
            '#refresh_token': 'refresh_token',
            '#access_token': 'access_token',
            '#token_type': 'token_type',
            '#expires_in': 'expires_in',
            '#access_token_timestamp': 'access_token_timestamp',
        },
        ExpressionAttributeValues: {
            ':code': code,
            ':refresh_token': tokenResult.refresh_token,
            ':access_token': tokenResult.access_token,
            ':token_type': tokenResult.token_type,
            ':expires_in': tokenResult.expires_in,
            ':access_token_timestamp': tokenResult.access_token_timestamp
        }
    }));
    return;
}

/**
 * データベースからLWAトークンを取得します。
 * @param uid   対象ユーザーID
 * @return LWAトークン
 * データベースに対象ユーザーIDのLWAトークンが登録されていないときにはnullを返します。
 */
async function getLwaTokenFromDbAsync(uid: string) : Promise<LwaTokenResult> {

    try {
        const client = getDynamoDbDocClient();

        const response = await client.send(new GetCommand({
            TableName: LWA_TOKEN_MANAGE_TABLE,
            Key: {
                "uid": uid
            }
        }));

        const item = response.Item;

        return {
            access_token: item.access_token,
            refresh_token: item.refresh_token,
            token_type: item.token_type,
            expires_in: item.expires_in,
            access_token_timestamp: item.access_token_timestamp,
        };
    } catch (e) {
        if(e instanceof ResourceNotFoundException) {
            return null;
        }
        throw e;
    }
}

/**
 * LWAトークンをデータベースから取得します。トークンが期限切れの場合にはLWAと通信をして、自動更新します。
 * @param uid   対象ユーザーID
 * @param forceRefresh  トークン強制更新の有無
 * @return LWAトークン
 * LWAトークンがデータベースに登録されていないときにはnullを返します。
 * 取得したトークンを使ったAPI呼び出しで401レスポンスが発生したときにはforceRefresh=trueで本APIを再度実行して、
 * トークンを再発行してください。
 * また、リフレッシュトークンによる再発行がinvalid_grantで失敗したときにはリフレッシュトークンが無効になっているため、
 * データベースから削除します。その後、LwaError例外を発生させますので、適切な処理を実施してください。
 */
export async function getLwaTokenAsync(uid: string, forceRefresh: boolean = false) : Promise<LwaTokenResult> {
    const tokenResult = await getLwaTokenFromDbAsync(uid);
    if(tokenResult === null) {
        return null;
    }
    if(forceRefresh || isExpiresLwaToken(tokenResult)) {
        let newTokenResult : LwaTokenResult;
        try {
            newTokenResult = await getLwaTokenByRefreshTokenAsync(tokenResult.refresh_token, LWA_CLIENT_ID, LWA_CLIENT_SECRET);
        } catch (e) {
            if(e instanceof LwaError) {
                if(e.error === LwaOAuth2ErrorCode.invalid_grant) {
                    console.warn(`refresh token of uid(${uid}) is invalid.`);
                    // リフレッシュトークンが無効になっているのでデータベースから削除します。
                    await removeTokenAsync(uid);
                }
            }
            throw e;
        }
        await saveLwaTokenAsync(uid, newTokenResult);
        return newTokenResult;
    } else {
        return tokenResult;
    }
}
