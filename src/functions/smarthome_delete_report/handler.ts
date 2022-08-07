import {
    alexaNotifyAddOrUpdateReportEventAsync,
    alexaNotifyChangeReportEventAsync,
    alexaNotifyDeleteReportEventAsync
} from "@libs/alexaSmarthomeReport";

interface DeleteReportEvent {
    uid: string;
    endpointId: string;
}

export async function main(event: DeleteReportEvent, context) : Promise<any>{

    const endpointId = event.endpointId;

    await alexaNotifyDeleteReportEventAsync(event.uid, [endpointId]);

    return { status: "OK" };
}
