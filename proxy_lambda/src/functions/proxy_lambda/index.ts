
import { handlerPath } from '@libs/handlerResolver';

export default {
  name: "proxy-lambda",
  handler: `${handlerPath(__dirname)}/handler.main`,
  memorySize: 128,
  timeout: 8,
  role: "lambdaRole",
  environment: {
    FUNCTION_NAME: "alexa-smarthome-skill",
    FUNCTION_REGION: "ap-northeast-1"
  },
  events: [
  ]
}
