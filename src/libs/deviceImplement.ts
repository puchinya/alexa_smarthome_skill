import {GetCommand, PutCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {getDynamoDbDocClient} from "@libs/dynamoDbSingleton";
import {ResourceNotFoundException} from "@aws-sdk/client-dynamodb";
import {AlexaSmartHomeError, AlexaSmartHomeResponseErrorType} from "@libs/alexaSmartHome";

export interface DeviceInfo {
    uid: string;
    device_id: string;
    status: object;
}

const ALEXA_DEVICE_STATUS_TABLE = "alexa_device_status_table";

export async function registerDeviceAsync(uid: string, endpointId: string, status: object) : Promise<void> {
    const client = getDynamoDbDocClient();

    try {
        await client.send(new PutCommand({
            TableName: ALEXA_DEVICE_STATUS_TABLE,
            Item: {
                uid: uid,
                device_id: endpointId,
                status: JSON.stringify(status)
            }
        }));
    } catch (e) {
        throw e;
    }
}

export async function getDeviceStatusAsync(uid: string, endpointId: string) : Promise<DeviceInfo> {
    const client = getDynamoDbDocClient();

    try {
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
    } catch (e) {
        if(e instanceof ResourceNotFoundException) {
            throw new AlexaSmartHomeError(AlexaSmartHomeResponseErrorType.NO_SUCH_ENDPOINT,
                "endpoint is not found", null, e);
        }
        throw e;
    }
}

/**
 *
 * @param uid
 * @param endpointId
 * @param status
 * @return new status
 */
export async function updateDeviceStatusAsync(uid: string, endpointId: string, status: object) : Promise<object> {
    const client = getDynamoDbDocClient();
    try {
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
    } catch (e) {
        if(e instanceof ResourceNotFoundException) {
            throw new AlexaSmartHomeError(AlexaSmartHomeResponseErrorType.NO_SUCH_ENDPOINT,
                "endpoint is not found", null, e);
        }
        throw e;
    }
    return status;
}

