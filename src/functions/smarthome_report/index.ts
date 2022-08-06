
import { handlerPath } from '@libs/handlerResolver';
import {Architecture} from "@aws-sdk/client-lambda";

export default {
    name: "alexa-smarthome-skill-report",
    handler: `${handlerPath(__dirname)}/handler.main`,
    role: "lambdaRole",
    timeout: 30,
    architecture: Architecture.arm64,
    memorySize: 256,
    environment: {
        LWA_CLIENT_ID: "amzn1.application-oa2-client.e7b1e99a38be41428d8b1072cf075d92",
        LWA_CLIENT_SECRET: "d7db2db893c48967797a5fc9f9c9a5986624f771e7659ee8095bd5bfd3a73f7c"
    },
    events: [
    ]
}
