import {alexaChangeReport} from "@libs/alexaSmarthomeReport";

interface ReportEvent {
    uid: string
    state: string
}

const smarthome_report = async (event: ReportEvent, context) : Promise<any> => {

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

    const response = await alexaChangeReport(event.uid, "sample-bulb-01", properties, properties);

    return response;
}

export const main = smarthome_report;
