import axios from "axios";
import {stringifyFormData} from "@libs/formData";
import {setTimeout} from "timers/promises";
const sleep = setTimeout;

const LWA_TOKEN_URI = "https://api.amazon.com/auth/o2/token";
const LWA_HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
};
const RETRY_COUNT = 3;
const RETRY_WAIT_MS = 1000;
const EXPIRES_RATIO_PERCENT = 80;

export const LwaOAuth2ErrorCode = {
    invalid_grant: "invalid_grant",
    invalid_request: "invalid_request",
    invalid_client: "invalid_client",
    unauthorized_client: "unauthorized_client",
    unsupported_grant_type: "unsupported_grant_type"
}

export type LwaOAuth2ErrorCode = typeof LwaOAuth2ErrorCode[keyof typeof LwaOAuth2ErrorCode];

export class LwaError extends Error {
    error: LwaOAuth2ErrorCode;
    constructor(error:LwaOAuth2ErrorCode, message: string = undefined) {
        super(message === undefined ? `${error} error from LWA.` : message);
        this.error = error;
    }
}

export interface LwaTokenResult {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    access_token_timestamp: number; // unix epoch seconds
}

export function isExpiresLwaToken(tokenResult: LwaTokenResult) {
    return getCurrentTimestamp() >= Math.floor(tokenResult.access_token_timestamp + tokenResult.expires_in * EXPIRES_RATIO_PERCENT / 100);
}

function getCurrentTimestamp() : number {
    return Math.floor(new Date().getTime() / 1000);
}

async function getLwaTokenCore(data: object) : Promise<LwaTokenResult> {
    let retryCount = RETRY_COUNT;
    while (true) {
        const timestamp = getCurrentTimestamp();
        try {
            const response = await axios.post(LWA_TOKEN_URI, stringifyFormData(data), {
                headers: LWA_HEADERS
            })

            console.debug(`lwa_token:${JSON.stringify(response.data)}`);

            let result: LwaTokenResult = response.data;
            result.access_token_timestamp = timestamp;

            return result;
        } catch (e) {
            if (axios.isAxiosError(e)) {
                if(e.response === undefined ||
                e.response.status === 429 ||
                e.response.status === 500 ||
                e.response.status === 503) {
                    if(retryCount > 0) {
                        retryCount--;
                        await sleep(RETRY_WAIT_MS);
                        continue;
                    }
                }
                if(e.response["error"] !== undefined) {
                    const oauth2Error: string = e.response["error"];
                    throw new LwaError(oauth2Error);
                }
            }
            throw e;
        }
    }
}

/**
 * 認証コードからLWAトークンを取得します。
 * @param client_id     LWAのクライアントID
 * @param client_secret LWAのクライアントシークレット
 * @param code          認証コード
 * @return LWAトークン
 * LWAからエラーが返ってきた時にはLwaOAuth2Error例外が発生します。
 * LwaOAuth2Errorのerror属性がLwaOAuth2ErrorCode.invalid_grantの時は認証コードが無効になっています。
 */
export async function getLwaTokenByCodeAsync(client_id: string, client_secret: string, code: string) : Promise<LwaTokenResult> {
    const data = {
        grant_type: "authorization_code",
        code: code,
        client_id: client_id,
        client_secret: client_secret
    }

    return await getLwaTokenCore(data);
}

/**
 * リフレッシュトークンからLWAトークンを取得します。
 * @param refresh_token リフレッシュトークン
 * @param client_id     LWAのクライアントID
 * @param client_secret LWAのクライアントシークレット
 * LWAからエラーが返ってきた時にはLwaOAuth2Error例外が発生します。
 * LwaOAuth2Errorのerror属性がLwaOAuth2ErrorCode.invalid_grantの時はリフレッシュトークンが無効になっています。
 */
export async function getLwaTokenByRefreshTokenAsync(refresh_token: string, client_id: string, client_secret: string)
    : Promise<LwaTokenResult> {
    const data = {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
        client_id: client_id,
        client_secret: client_secret
    }

    return await getLwaTokenCore(data);
}
