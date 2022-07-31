import 'source-map-support/register';
import {
    LambdaClient,
    InvokeCommand,
    InvocationRequest,
    InvocationResponse
} from "@aws-sdk/client-lambda";

const FUNCTION_NAME : string = process.env.FUNCTION_NAME;
const FUNCTION_REGION : string = process.env.FUNCTION_REGION;

const proxy = async (event, context) : Promise<string> => {
    const client = new LambdaClient({
        region: FUNCTION_REGION
    });

    console.log(event);

    const ret = await client.send(new InvokeCommand(
        {
            FunctionName: FUNCTION_NAME,
            Payload: Uint8Array.from(Buffer.from(JSON.stringify(event)))
        }
    ));

    console.log(ret);
    const payload = Buffer.from(ret.Payload).toString();
    console.log(payload);

    return JSON.parse(payload);
};

export const main = proxy;
