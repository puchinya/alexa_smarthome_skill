import {alexaNotifyChangeReportEventAsync} from "@libs/alexaSmarthomeReport";
import {updateDeviceStatusAsync} from "@libs/deviceImplement";

interface ReportEvent {
    uid: string
    state: string
}

const smarthome_report = async (event: ReportEvent, context) : Promise<any> => {

    const endpointId = "sample-bulb-01";

    await updateDeviceStatusAsync(event.uid, endpointId,
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

    await alexaNotifyChangeReportEventAsync(event.uid, endpointId, properties, []);

    return { status: "OK" };
}

export const main = smarthome_report;
