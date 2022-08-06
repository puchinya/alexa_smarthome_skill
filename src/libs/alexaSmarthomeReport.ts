import {getLwaToken} from "@libs/lwaTokenDb"
import axios from "axios";
import {randomUUID} from "crypto";

const SMARTHOME_EVENT_GATEWAY_ENDPOINT = "https://api.fe.amazonalexa.com/v3/events";

export interface ChnageReportResponse {
    code: string
}

export async function alexaChangeReport(uid: string, endpointId: string, changeProperties:any[], contextProperties:any[]) : Promise<ChnageReportResponse> {
    let forceRefreshToken = false;
    let retryCount = 3;

    while (true) {
        const lwaToken = await getLwaToken(uid, forceRefreshToken);

        console.log(`token:${lwaToken}`);

        const messageId = randomUUID();

        let changeReportEvent = {
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
                            "type": "PHYSICAL_INTERACTION"
                        },
                        "properties": changeProperties
                    }
                }
            }
        };

        try {
            const ret = await axios.post(SMARTHOME_EVENT_GATEWAY_ENDPOINT, JSON.stringify(changeReportEvent), {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${lwaToken.token_type} ${lwaToken.access_token}`
                }
            })

            if (ret.status !== 202) {
                return {
                    code: ret.data.response.data.payload.code
                };
            }

            return {
                "code": "OK"
            }
        } catch (e) {
            if (axios.isAxiosError(e)) {
                const code = e.response.data.payload.code;
                if(code == 'INVALID_ACCESS_TOKEN_EXCEPTION') {
                    if(!forceRefreshToken) {
                        forceRefreshToken = true;
                        continue;
                    }
                } else if(code == 'THROTTLING_EXCEPTION' ||
                code == 'INTERNAL_SERVICE_EXCEPTION' ||
                code == 'SERVICE_UNAVAILABLE_EXCEPTION')
                {
                    if(retryCount > 0) {
                        retryCount--;
                        continue;
                    }
                }
                return {
                    code: code
                };
            }
            throw e;
        }
    }
}
