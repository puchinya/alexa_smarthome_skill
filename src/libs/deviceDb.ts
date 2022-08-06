import {GetCommand, PutCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {getDynamoDbDocClient} from "@libs/dynamoDbSingleton";

export interface DeviceInfo {
    uid: string;
    device_id: string;
    status: object;
}

const ALEXA_DEVICE_STATUS_TABLE = "alexa_device_status_table";

export async function registerDevice(uid: string, endpointId: string, status: object) : Promise<void> {
    const client = getDynamoDbDocClient();
    await client.send(new PutCommand({
        TableName: ALEXA_DEVICE_STATUS_TABLE,
        Item: {
            uid: uid,
            device_id: endpointId,
            status: JSON.stringify(status)
        }
    }));
}

export async function getDevice(uid: string, endpointId: string) : Promise<DeviceInfo> {
    const client = getDynamoDbDocClient();

    const response = await client.send(new GetCommand({
        TableName: ALEXA_DEVICE_STATUS_TABLE,
        Key: {
            "uid": uid,
            "device_id": endpointId
        }
    }));

    const item = response.Item;

    return {
        uid: item.uid,
        device_id: item.device_id,
        status: JSON.parse(item.status)
    }
}

export async function setDeviceStatus(uid: string, endpointId: string, status: object) : Promise<void> {
    const client = getDynamoDbDocClient();
    await client.send(new UpdateCommand({
        TableName: ALEXA_DEVICE_STATUS_TABLE,
        Key: {
            "uid": uid,
            "device_id": endpointId
        },
        UpdateExpression: 'set #status = :status',
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': JSON.stringify(status)
        },
        ConditionExpression: "attribute_exists(uid)"
    }));
}

