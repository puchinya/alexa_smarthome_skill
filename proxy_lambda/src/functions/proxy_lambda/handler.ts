//import 'source-map-support/register';
import {
    LambdaClient,
    InvokeCommand
} from "@aws-sdk/client-lambda";

const FUNCTION_NAME : string = process.env.FUNCTION_NAME;
const FUNCTION_REGION : string = process.env.FUNCTION_REGION;

const lambdaClient = new LambdaClient({
    region: FUNCTION_REGION
});

export async function main(event) : Promise<any> {

    const ret = await lambdaClient.send(new InvokeCommand(
        {
            FunctionName: FUNCTION_NAME,
            Payload: Buffer.from(JSON.stringify(event))
        }
    ));

    const payload = Buffer.from(ret.Payload).toString('utf-8');

    return JSON.parse(payload);
}
