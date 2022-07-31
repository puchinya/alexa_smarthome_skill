
import { handlerPath } from '@libs/handlerResolver';

export default {
  name: "alexa-smarthome-skill",
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 7,
  events: [
  ]
}
