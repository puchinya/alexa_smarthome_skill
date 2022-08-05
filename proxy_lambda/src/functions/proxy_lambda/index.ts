
import { handlerPath } from '@libs/handlerResolver';
import {Architecture} from "@aws-sdk/client-lambda";

export default {
  name: "proxy-lambda",
  handler: `${handlerPath(__dirname)}/handler.main`,
  memorySize: 128,
  timeout: 8,
  architecture: Architecture.arm64,
  role: "lambdaRole",
  environment: {
    FUNCTION_NAME: "alexa-smarthome-skill",
    FUNCTION_REGION: "ap-northeast-1"
  },
  events: [
  ]
}
