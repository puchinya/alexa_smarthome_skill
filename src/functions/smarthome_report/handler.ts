import {alexaNotifyChangeReportEventAsync} from "@libs/alexaSmarthomeReport";
import {setDeviceStatus} from "@libs/deviceDb";

interface ReportEvent {
    uid: string
    state: string
}

const smarthome_report = async (event: ReportEvent, context) : Promise<any> => {

    const endpointId = "sample-bulb-01";

    setDeviceStatus(event.uid, endpointId,
        {
            "powerState": event.state
        })

    const utc = new Date().toISOString();

    let properties = [
        {
            "namespace": "Alexa.PowerController",
            "name": "powerState",
            "value": event.state,
            "timeOfSample": utc, //retrieve from result.
            "uncertaintyInMilliseconds": 50
        }
    ];

    const response = await alexaNotifyChangeReportEventAsync(event.uid, endpointId, properties, []);

    return response;
}

export const main = smarthome_report;
