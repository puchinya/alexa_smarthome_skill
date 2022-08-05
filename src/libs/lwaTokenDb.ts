import {getDynamoDbDocClient} from "@libs/dynamoDbSingleton";
import {GetCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {getCurrentTimestamp, getLwaTokenByCode, getLwaTokenByRefreshToken, TokenResult} from "@libs/lwa";

const LWA_CLIENT_ID = process.env.LWA_CLIENT_ID;
const LWA_CLIENT_SECRET = process.env.LWA_CLIENT_SECRET;

const ALEXA_USER_INFO_TABLE = "alexa_lwa_token_table";

async function saveLwaToken(uid: string, tokenResult: TokenResult) : Promise<void> {
    const client = getDynamoDbDocClient();
    const ret = await client.send(new UpdateCommand({
        TableName: ALEXA_USER_INFO_TABLE,
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
            ':access_token': tokenResult.refresh_token,
            ':token_type': tokenResult.token_type,
            ':expires_in': tokenResult.expires_in,
            ':access_token_timestamp': tokenResult.access_token_timestamp
        }
    }));
    console.log(ret);
    return;
}

export async function issueLwaTokenByCodeAndSaveToDb(uid: string, code: string) : Promise<TokenResult> {
    const tokenResult = await getLwaTokenByCode(LWA_CLIENT_ID, LWA_CLIENT_SECRET, code)

    await saveLwaTokenAndCode(uid, tokenResult, code);

    return  tokenResult;
}

async function saveLwaTokenAndCode(uid: string, tokenResult: TokenResult, code: string) : Promise<void> {
    const client = getDynamoDbDocClient();
    const ret = await client.send(new UpdateCommand({
        TableName: ALEXA_USER_INFO_TABLE,
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
            ':access_token': tokenResult.refresh_token,
            ':token_type': tokenResult.token_type,
            ':expires_in': tokenResult.expires_in,
            ':access_token_timestamp': tokenResult.access_token_timestamp
        }
    }));
    console.log(ret);
    return;
}

async function getLwaTokenFromDb(uid: string) : Promise<TokenResult> {
    const client = getDynamoDbDocClient();

    try {
        const response = await client.send(new GetCommand({
            TableName: ALEXA_USER_INFO_TABLE,
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
        return null;
    }
}

export async function getLwaAccessToken(uid: string) : Promise<string> {
    const tokenResult = await getLwaTokenFromDb(uid);
    if(tokenResult == null) {
        return null;
    }
    if(getCurrentTimestamp() >= Math.floor(tokenResult.access_token_timestamp + tokenResult.expires_in * 8 / 10)) {
        const new_token_result = await getLwaTokenByRefreshToken(tokenResult.refresh_token, LWA_CLIENT_ID, LWA_CLIENT_SECRET);
        await saveLwaToken(uid, new_token_result);
        return new_token_result.access_token;
    } else {
        return tokenResult.access_token;
    }
}
