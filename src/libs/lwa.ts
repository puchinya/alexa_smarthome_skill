import axios from "axios";
import {stringifyFormData} from "@libs/formData";
import {setTimeout} from "timers/promises";

const LWA_TOKEN_URI = "https://api.amazon.com/auth/o2/token";
const LWA_HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
};
const RETRY_COUNT = 3;
const sleep = setTimeout;

export interface TokenResult {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    access_token_timestamp: number; // unix epoch seconds
}

export function getCurrentTimestamp() : number {
    return Math.floor(new Date().getTime() / 1000);
}

async function getLwaTokenCore(data: object) : Promise<TokenResult> {
    let retryCount = RETRY_COUNT;
    while (true) {
        const timestamp = getCurrentTimestamp();
        try {
            const response = await axios.post(LWA_TOKEN_URI, stringifyFormData(data), {
                headers: LWA_HEADERS
            })

            console.debug(`lwa_token:${JSON.stringify(response.data)}`);

            let result: TokenResult = response.data;
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
                        await sleep(1000);
                        continue;
                    }
                }
            }
            throw e;
        }
    }
}

/**
 *
 * @param client_id
 * @param client_secret
 * @param code
 */
export async function getLwaTokenByCodeAsync(client_id: string, client_secret: string, code: string) : Promise<TokenResult> {
    const data = {
        grant_type: "authorization_code",
        code: code,
        client_id: client_id,
        client_secret: client_secret
    }

    return await getLwaTokenCore(data);
}

/**
 *
 * @param refresh_token
 * @param client_id
 * @param client_secret
 */
export async function getLwaTokenByRefreshTokenAsync(refresh_token: string, client_id: string, client_secret: string)
    : Promise<TokenResult> {
    const data = {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
        client_id: client_id,
        client_secret: client_secret
    }

    return await getLwaTokenCore(data);
}
