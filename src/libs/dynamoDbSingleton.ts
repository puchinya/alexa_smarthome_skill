import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient} from "@aws-sdk/lib-dynamodb";

let dynamoDbClient : DynamoDBClient = null;
let dynamoDbDocClient : DynamoDBDocumentClient = null;

export function getDynamoDbClient() : DynamoDBClient {
    if(dynamoDbClient == null) {
        dynamoDbClient = new DynamoDBClient({});
    }

    return dynamoDbClient;
}

export function getDynamoDbDocClient() : DynamoDBDocumentClient {
    if(dynamoDbDocClient == null) {
        dynamoDbDocClient = DynamoDBDocumentClient.from(getDynamoDbClient());
    }

    return dynamoDbDocClient;
}
