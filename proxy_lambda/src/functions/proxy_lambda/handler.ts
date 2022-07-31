import 'source-map-support/register';
import {
    LambdaClient,
    InvokeCommand
} from "@aws-sdk/client-lambda";

const FUNCTION_NAME : string = process.env.FUNCTION_NAME;
const FUNCTION_REGION : string = process.env.FUNCTION_REGION;

let lambda_client = null;

const proxy = async (event, context) : Promise<string> => {
    if(lambda_client == null) {
        lambda_client = new LambdaClient({
            region: FUNCTION_REGION
        });
    }

    //console.log(event);

    const ret = await lambda_client.send(new InvokeCommand(
        {
            FunctionName: FUNCTION_NAME,
            Payload: Uint8Array.from(Buffer.from(JSON.stringify(event)))
        }
    ));

    //console.log(ret);
    const payload = Buffer.from(ret.Payload).toString();
    //console.log(payload);

    return JSON.parse(payload);
};

export const main = proxy;
