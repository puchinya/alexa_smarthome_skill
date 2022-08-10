import {getLwaTokenAsync} from "@libs/lwaTokenDb"
import axios from "axios";
import {randomUUID} from "crypto";
import {
    AlexaSmartHomeAddOrUpdateReportResponse,
    AlexaSmartHomeCauseType,
    AlexaSmartHomeChangeReportResponse, AlexaSmartHomeDeleteReportResponse,
    AlexaSmartHomeEndpointDescription
} from "@libs/alexaSmartHome";
import {LwaTokenResult} from "@libs/lwa";
import { setTimeout } from "timers/promises";

const sleep = setTimeout;

// 極東のエンドポイント
const SMART_HOME_EVENT_GATEWAY_ENDPOINT = "https://api.fe.amazonalexa.com/v3/events";
const RETRY_COUNT = 3; // Alexaのドキュメントから3回まで再送する
const RETRY_WAIT_MS = 1000;


// see https://developer.amazon.com/ja-JP/docs/alexa/smarthome/send-events-to-the-alexa-event-gateway.html
export const AlexaSmartHomeEventGatewayErrorCode = {
    /**
     * メッセージが無効です。フィールドがない、値が正しくない、正しいJSON形式ではないことが原因です。
     * ドキュメントと照合して、メッセージにすべての必須フィールドが含まれていることを確認します。
     */
    INVALID_REQUEST_EXCEPTION: "INVALID_REQUEST_EXCEPTION",
    /**
     * アクセストークンが無効、有効期限切れ、形式が正しくないのいずれかです。トークンを更新して、リクエストを再試行してください。
     * ユーザーがスキルを無効にすると、アクセストークンも無効になります。つまり、ユーザーが認可を取り消したため、
     * これらについての変更レポートの送信も停止できるということです。
     */
    INVALID_ACCESS_TOKEN_EXCEPTION: "INVALID_ACCESS_TOKEN_EXCEPTION",
    /**
     * イベントを正しい地域のエンドポイントに送信していることを確認してください。
     * たとえば、北米のイベントは北米のエンドポイントに送信します。
     */
    SKILL_NEVER_ENABLED_EXCEPTION: "SKILL_NEVER_ENABLED_EXCEPTION",
    /**
     * トークンに必要な権限がありません。スキルにAlexaイベントを送信する権限があることを確認してください。
     * 詳細は、非同期メッセージ認証のステップを参照してください
     */
    INSUFFICIENT_PERMISSION_EXCEPTION: "INSUFFICIENT_PERMISSION_EXCEPTION",
    /**
     * 指定されたIDに関連付けられたアカウント記録が存在しないか、期限が切れています。このエラーは、イベントの送信が遅すぎた場合や、
     * 無効なIDが指定された場合に発生する可能性があります。指定されたIDと認可コードが正しいことを確認してください。
     */
    ACCOUNT_NOT_FOUND_EXCEPTION: "ACCOUNT_NOT_FOUND_EXCEPTION",
    /**
     * このトークンに関連付けられたスキルIDが見つかりませんでした。このエラーは、
     * スキルが認定中などの異なるステージにあるときにユーザーのアクセストークンが生成された場合に発生します。
     * このユーザーでスキルの無効化と有効化を行ってみてください。
     */
    SKILL_NOT_FOUND_EXCEPTION: "SKILL_NOT_FOUND_EXCEPTION",
    /**
     * イベントペイロードが大きすぎます。1回のリクエストで許容されるエンドポイントの最大数は300です。
     * より小さいペイロードでメッセージを送信してください。
     */
    REQUEST_ENTITY_TOO_LARGE_EXCEPTION: "REQUEST_ENTITY_TOO_LARGE_EXCEPTION",
    /**
     * リクエスト数が多すぎます。メッセージを最大3回再送してください。再送の間隔は、1秒以上空けてください。
     */
    THROTTLING_EXCEPTION: "THROTTLING_EXCEPTION",
    /**
     * Alexaでエラーが発生したため、メッセージを処理できませんでした。メッセージを最大3回再送してください。
     * 再送の間隔は、1秒以上空けてください。問題が解消されない場合、Alexa開発者向け問い合わせ窓口にお問い合わせください。
     */
    INTERNAL_SERVICE_EXCEPTION: "INTERNAL_SERVICE_EXCEPTION",
    /**
     * Alexaがメッセージを受け付けられませんでした。メッセージを最大3回再送してください。
     * 再送の間隔は、1秒以上空けてください。問題が解消されない場合、Alexa開発者向け問い合わせ窓口にお問い合わせください。
     */
    SERVICE_UNAVAILABLE_EXCEPTION: "SERVICE_UNAVAILABLE_EXCEPTION"
}

export type AlexaSmartHomeEventGatewayErrorCode = typeof AlexaSmartHomeEventGatewayErrorCode[keyof typeof AlexaSmartHomeEventGatewayErrorCode];

export class AlexaSmartHomeEventGatewayError extends Error {
    httpStatus: number;
    code: AlexaSmartHomeEventGatewayErrorCode;
    description: string;
    constructor(httpStatus: number, code: AlexaSmartHomeEventGatewayErrorCode,
                description: string) {
        super(`Alexa Smart Home event gateway response error! (code:${code}, description:${description})`);
        this.httpStatus = httpStatus;
        this.code = code;
        this.description = description;
    }
}

/**
 * @brief イベントゲートウェイにAddOrUpdateReportイベントを送信します。
 * @param uid 対象ユーザーID
 * @param endpoints 追加/更新するエンドポイントのリスト
 */
export async function alexaNotifyAddOrUpdateReportEventAsync(uid: string, endpoints: AlexaSmartHomeEndpointDescription[])
    : Promise<void> {
    return await alexaNotifyAsync(uid, (lwaToken, messageId)
        : AlexaSmartHomeAddOrUpdateReportResponse => {
        return {
            "event": {
                "header": {
                    "messageId": messageId,
                    "namespace": "Alexa.Discovery",
                    "name": "AddOrUpdateReport",
                    "payloadVersion": "3"
                },
                "payload": {
                    "endpoints": endpoints,
                    "scope": {
                        "type": "BearerToken",
                        "token": lwaToken.access_token,
                    }
                }
            }
        };
    });
}

/**
 * @brief イベントゲートウェイにDeleteReportイベントを送信します。
 * @param uid 対象ユーザーID
 * @param endpointIds 削除するエンドポイントIDのリスト
 * 発生する例外についてはalexaNotifyAsyncを参照。
 */
export async function alexaNotifyDeleteReportEventAsync(uid: string, endpointIds: string[])
    : Promise<void> {

    let endpoints : {endpointId: string}[] = [];
    endpointIds.forEach((e) => {
        endpoints.push({
            endpointId: e
        })
    });

    return await alexaNotifyAsync(uid, (lwaToken, messageId)
        : AlexaSmartHomeDeleteReportResponse => {
        return {
            "event": {
                "header": {
                    "messageId": messageId,
                    "namespace": "Alexa.Discovery",
                    "name": "DeleteReport",
                    "payloadVersion": "3"
                },
                "payload": {
                    "endpoints": endpoints,
                    "scope": {
                        "type": "BearerToken",
                        "token": lwaToken.access_token,
                    }
                }
            }
        };
    });
}

/**
 * @brief イベントゲートウェイにChangeReportイベントを送信します。
 * @param uid 対象ユーザーID
 * @param endpointId 変更が発生したエンドポイントのID
 * @param changeProperties 変更が発生したプロパティ
 * @param contextProperties それ以外のプロパティ(*changePropertiesに含まれているプロパティを入れてはいけない。)
 * 発生する例外についてはalexaNotifyAsyncを参照。
 */
export async function alexaNotifyChangeReportEventAsync(uid: string, endpointId: string,
                                                        changeProperties:any[], contextProperties:any[]) : Promise<void> {

    return await alexaNotifyAsync(uid, (lwaToken, messageId)
        : AlexaSmartHomeChangeReportResponse=> {
        return {
            "context": {
                "properties": contextProperties
            },
            "event": {
                "header": {
                    "messageId": messageId,
                    "namespace": "Alexa",
                    "name": "ChangeReport",
                    "payloadVersion": "3"
                },
                "endpoint": {
                    "scope": {
                        "type": "BearerToken",
                        "token": lwaToken.access_token,
                    },
                    "endpointId": endpointId
                },
                "payload": {
                    "change": {
                        "cause": {
                            "type": AlexaSmartHomeCauseType.PHYSICAL_INTERACTION
                        },
                        "properties": changeProperties
                    }
                }
            }
        };
    });
}

/**
 * @param lwaToken LWAトークン
 * @param messageId メッセージID
 */
export type CreateEventMessageCallback = (lwaToken: LwaTokenResult, messageId: string) => object;

/***
 * @brief SmartHomeのメッセージゲートウェイにメッセージを送信します。
 * @param uid   対象ユーザーIS
 * @param callback  メッセージ作成コールバック
 * 以下の例外が発生する可能性があります。
 * - LwaError: LWAトークンの取得等に失敗したとき。
 *             errorプロパティがinvalid_grantのときにはリフレッシュトークンが無効になっています。
 * - AlexaSmartHomeEventGatewayError: イベントゲートウェイからエラー応答が会った時に発生します。
 *              401:INVALID_ACCESS_TOKEN_EXCEPTION発生時のアクセストークン更新は本API内部で自動で行われます。
 *              429:THROTTLING_EXCEPTION, 500:INTERNAL_SERVICE_EXCEPTION, 503: SERVICE_UNAVAILABLE_EXCEPTION発生時の
 *              再送は本API内部で自動で行われます。
 * LWAトークンがデータベースに登録されていないときにはwarnログを出力します。例外については発生させません。
 */
export async function alexaNotifyAsync(uid: string, callback: CreateEventMessageCallback) : Promise<void> {
    let forceRefreshToken = false;
    let retryCount = RETRY_COUNT;

    const messageId = randomUUID();

    while (true) {
        const lwaToken = await getLwaTokenAsync(uid, forceRefreshToken);
        if (lwaToken === null) {
            console.warn(`failed to send event, for lwa token (uid:${uid}) is not found in the database.`)
            return;
        }

        console.log(`token:${lwaToken}`);

        let eventMessage = callback(lwaToken, messageId);

        try {
            const ret = await axios.post(SMART_HOME_EVENT_GATEWAY_ENDPOINT, JSON.stringify(eventMessage), {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${lwaToken.token_type} ${lwaToken.access_token}`
                }
            })

            if (ret.status !== 202) {
                // 成功時は202なので、他の200番台がきた時にはログを残す。
                console.warn(`invalid status code from event gateway. code: ${ret.status}`);
            }

            return;
        } catch (e) {
            if (axios.isAxiosError(e)) {
                // 通信失敗(e.response == undefined)
                // と、429(Too Many Requests),500(Internal Server Error),
                // 503 (Service Unavailable)のときは3回まで再送する
                // See:
                // https://developer.amazon.com/ja-JP/docs/alexa/smarthome/send-events-to-the-alexa-event-gateway.html
                if(e.response === undefined ||
                    e.response.status === 429 ||
                    e.response.status === 500 ||
                    e.response.status === 503) {
                    if(retryCount > 0) {
                        retryCount--;
                        // 1秒以上開けてリトライ
                        await sleep(RETRY_WAIT_MS);
                        continue;
                    }
                } else if(e.response.status === 401) {
                    // 401のときはアクセストークンを再発行して、リトライする
                    if(!forceRefreshToken) {
                        forceRefreshToken = true;
                        continue;
                    }
                } else if(e.response.status === 400) {
                    // 400は形式異常なため、ログを残す
                    console.error(`invalid request:${JSON.stringify(eventMessage)}`);
                }
                if(e.response !== undefined && e.response.data['payload'] !== undefined) {
                    throw new AlexaSmartHomeEventGatewayError(e.response.status,
                        e.response.data['payload']['code'], e.response.data['payload']['description']);
                }
            }

            throw e;
        }
    }
}
