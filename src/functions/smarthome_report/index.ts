
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
        LWA_CLIENT_ID: "",
        LWA_CLIENT_SECRET: ""
    },
    events: [
    ]
}
