import axios from "axios";
import {stringifyFormData} from "@libs/formData";

const LWA_TOKEN_URI = "https://api.amazon.com/auth/o2/token";
const LWA_HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
};

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
    const timestamp = getCurrentTimestamp();
    try {
        const response = await axios.post(LWA_TOKEN_URI, stringifyFormData(data), {
            headers: LWA_HEADERS
        })

        console.log(`lwa_token:${JSON.stringify(response.data)}`);

        let result: TokenResult = response.data;
        result.access_token_timestamp = timestamp;

        return result;
    } catch (e) {
        if(axios.isAxiosError(e)) {
            //
        }
        throw e;
    }
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
    const timestamp = getCurrentTimestamp();

    try {
        const ret = await axios.post(LWA_TOKEN_URI, stringifyFormData(data), {
            headers: LWA_HEADERS
        })

        let result: TokenResult = ret.data;
        result.access_token_timestamp = timestamp;

        return result;
    } catch (e) {
        if(axios.isAxiosError(e)) {

        }
        throw e;
    }
}
