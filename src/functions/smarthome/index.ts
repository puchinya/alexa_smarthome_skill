
import { handlerPath } from '@libs/handlerResolver';

export default {
  name: "alexa-smarthome-skill",
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "lambdaRole",
  timeout: 7,
  environment: {
    LWA_CLIENT_ID: "",
    LWA_CLIENT_SECRET: ""
  },
  events: [
  ]
}
