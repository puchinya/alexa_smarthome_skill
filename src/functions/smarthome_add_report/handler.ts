import {alexaNotifyAddOrUpdateReportEventAsync, alexaNotifyChangeReportEventAsync} from "@libs/alexaSmarthomeReport";
import {registerDeviceAsync} from "@libs/deviceImplement";
import {AlexaSmartHomeEndpointDescription} from "@libs/alexaSmartHome";

interface AddReportEvent {
    uid: string;
    endpointId: string;
}

const ENDPOINT_TEMPLTE : AlexaSmartHomeEndpointDescription = {
    "endpointId": "sample-bulb-01",
    "manufacturerName": "Smart Device Company",
    "friendlyName": "Livingroom lamp",
    "description": "Virtual smart light bulb",
    "displayCategories": ["LIGHT"],
    "additionalAttributes":  {
        "manufacturer" : "Sample Manufacturer",
        "model" : "Sample Model",
        "serialNumber": "U11112233456",
        "firmwareVersion" : "1.24.2546",
        "softwareVersion": "1.036",
        "customIdentifier": "Sample custom ID"
    },
    "cookie": {
        "key1": "arbitrary key/value pairs for skill to reference this endpoint.",
        "key2": "There can be multiple entries",
        "key3": "but they should only be used for reference purposes.",
        "key4": "This is not a suitable place to maintain current endpoint state."
    },
    "capabilities":
        [
            {
                "interface": "Alexa.PowerController",
                "version": "3",
                "type": "AlexaInterface",
                "properties": {
                    "supported": [{
                        "name": "powerState"
                    }],
                    "proaciveReport": true,
                    "retrievable": true,
                }
            },
            {
                "type": "AlexaInterface",
                "interface": "Alexa.EndpointHealth",
                "version": "3.2",
                "properties": {
                    "supported": [{
                        "name": "connectivity"
                    }],
                    "retrievable": true
                }
            },
            {
                "type": "AlexaInterface",
                "interface": "Alexa",
                "version": "3"
            }
        ]
};

export async function main(event: AddReportEvent, context) : Promise<any>{

    const endpointId = event.endpointId;

    await registerDeviceAsync(event.uid, endpointId,
        {
            "powerState": "OFF"
        })

    let endpointDesc = ENDPOINT_TEMPLTE;
    endpointDesc.endpointId = endpointId;

    await alexaNotifyAddOrUpdateReportEventAsync(event.uid, [endpointDesc]);

    return { status: "OK" };
}
