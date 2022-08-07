import {getLwaTokenAsync} from "@libs/lwaTokenDb"
import axios from "axios";
import {randomUUID} from "crypto";
import {
    AlexaSmartHomeAddOrUpdateReportResponse,
    AlexaSmartHomeCauseType,
    AlexaSmartHomeChangeReportResponse, AlexaSmartHomeDeleteReportResponse,
    AlexaSmartHomeEndpointDescription
} from "@libs/alexaSmartHome";
import {TokenResult} from "@libs/lwa";
import { setTimeout } from "timers/promises";

// 極東のエンドポイント
const SMART_HOME_EVENT_GATEWAY_ENDPOINT = "https://api.fe.amazonalexa.com/v3/events";
const RETRY_COUNT = 3; // Alexaのドキュメントから3回まで再送する

const sleep = setTimeout;

/**
 * @brief イベントゲートウェイにAddOrUpdateReportイベントを送信します。
 * @param uid
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
 * @param uid
 * @param endpointIds 削除するエンドポイントIDのリスト
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
 *
 * @param uid
 * @param endpointId 変更が発生したエンドポイントのID
 * @param changeProperties 変更が発生したプロパティ
 * @param contextProperties それ以外のプロパティ(*changePropertiesに含まれているプロパティを入れてはいけない。)
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

export type CreateEventMessageCallback = (lwaToken: TokenResult, messageId: string) => object;

export async function alexaNotifyAsync(uid: string, callback: CreateEventMessageCallback) : Promise<void> {
    let forceRefreshToken = false;
    let retryCount = RETRY_COUNT;

    const messageId = randomUUID();

    while (true) {
        const lwaToken = await getLwaTokenAsync(uid, forceRefreshToken);

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
                // 成功時は202なら、他の200番台がきた時にはログを残す。
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
                        await sleep(1000);
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
            }

            throw e;
        }
    }
}
