import 'source-map-support/register';
import {
  DynamoDBClient, UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb'
import axios from "axios";
import jwt_decode from 'jwt-decode';

// -*- coding: utf-8 -*-

// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License (the "License")
// You may not use this file except in compliance with the License.
// A copy of the License is located at http://aws.amazon.com/asl/
//
// This file is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific
// language governing permissions and limitations under the License.

let dynamodb_client : DynamoDBClient = null;
let dynamodb_doc_client : DynamoDBDocumentClient = null;

const ALEXA_USER_INFO_TABLE = "alexaUserInfoTable";

function get_dynamodb_client() : DynamoDBClient {
  if(dynamodb_client == null) {
    dynamodb_client = new DynamoDBClient({});
  }

  return dynamodb_client;
}

function get_dynamodb_doc_client() : DynamoDBDocumentClient {
  if(dynamodb_doc_client == null) {
    dynamodb_doc_client = DynamoDBDocumentClient.from(get_dynamodb_client());
  }

  return dynamodb_doc_client;
}

interface TokenResult {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  timestamp: number; // unixepoch
}

const LWA_CLIENT_ID = "";
const LWA_CLIENT_SECRET = "";
const LWA_TOKEN_URI = "https://api.amazon.com/auth/o2/token";
const LWA_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
};

const ALEXA_URI = "https://api.fe.amazonalexa.com/v3/events" // update to appropriate URI for your region
const ALEXA_HEADERS = {
  "Content-Type": "application/json;charset=UTF-8"
}

function stringifyForm(obj : object) : string {
  let r = "";
  let add_and = false;
  for (const k in obj) {
    const v = obj[k];
    if(add_and) {
      r = r + '&';
    } else {
      add_and = true;
    }
    r = r + `${k}=${encodeURIComponent(v)}`;
  }

  return r;
}

function get_unix_epoch() : number {
  return Math.floor(new Date().getTime() / 1000);
}

async function get_lwa_token(client_id: string, client_secret: string, code: string) : Promise<TokenResult> {
  const data = {
    grant_type: "authorization_code",
    code: code,
    client_id: client_id,
    client_secret: client_secret
  }
  const timestamp = get_unix_epoch();
  const ret = await axios.post(LWA_TOKEN_URI, stringifyForm(data), {
    headers: LWA_HEADERS
  })
  console.log(ret);

  if(ret.status != 200) {
    return null;
  }

  let ret_json : TokenResult = ret.data;
  ret_json.timestamp = timestamp;

  return ret_json;
}

async function save_token_and_code(uid: string, token_result: TokenResult, code: string) : void {
  const client = get_dynamodb_doc_client();
  const ret = await client.send(new UpdateCommand({
    TableName: ALEXA_USER_INFO_TABLE,
    Key: {
      "uid": uid
    },
    UpdateExpression: 'set #code = :code, #refresh_token = :refresh_token, #token_type = :token_type, #access_token = :access_token, #expires_in = :expires_in, #access_token_timestamp = :access_token_timestamp',
    ExpressionAttributeNames: {
      '#code': 'code',
      '#refresh_token': 'refresh_token',
      '#access_token': 'access_token',
      '#token_type': 'token_type',
      '#expires_in': 'expires_in',
      '#access_token_timestamp': 'access_token_timestamp',
    },
    ExpressionAttributeValues: {
      ':code': code,
      ':refresh_token': token_result.refresh_token,
      ':access_token': token_result.refresh_token,
      ':token_type': token_result.token_type,
      ':expires_in': token_result.expires_in,
      ':access_token_timestamp': token_result.timestamp
    }
  }));
  console.log(ret);
  return;
}

function decode_jwt(token: string) : any {
  const ret = jwt_decode(token)
  return ret;
}

const smarthome = async (request, context) => {
  if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
    log("DEBUG:", "Discover request",  JSON.stringify(request));
    handleDiscovery(request, context);
  }
  else if (request.directive.header.namespace === 'Alexa.PowerController') {
    if (request.directive.header.name === 'TurnOn' || request.directive.header.name === 'TurnOff') {
      log("DEBUG:", "TurnOn or TurnOff Request", JSON.stringify(request));
      handlePowerControl(request, context);
    }
  }
  else if (request.directive.header.namespace === 'Alexa.Authorization' && request.directive.header.name === 'AcceptGrant') {
    await handleAuthorization(request, context)
  }

  async function handleAuthorization(request, context) {
    // Send the AcceptGrant response
    let payload = {};
    const header = request.directive.header;
    header.name = "AcceptGrant.Response";
    console.log(JSON.stringify(request));

    const requestToken = request.directive.payload.grantee.token;
    const jwt = decode_jwt(requestToken);
    console.log(jwt);
    const uid : string = jwt.sub;

    const code = request["directive"]["payload"]["grant"]["code"];
    const token_result = await get_lwa_token(LWA_CLIENT_ID, LWA_CLIENT_SECRET, code)

    await save_token_and_code(uid, token_result, code);

    log("DEBUG", "AcceptGrant Response: ", JSON.stringify({ header: header, payload: payload }));
    context.succeed({ event: { header: header, payload: payload } });
  }

  function handleDiscovery(request, context) {
    // Send the discovery response
    var payload = {
      "endpoints":
          [
            {
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
            }
          ]
    };
    var header = request.directive.header;
    header.name = "Discover.Response";
    log("DEBUG", "Discovery Response: ", JSON.stringify({ header: header, payload: payload }));
    context.succeed({ event: { header: header, payload: payload } });
  }

  function log(message, message1, message2) {
    console.log(message + message1 + message2);
  }

  function handlePowerControl(request, context) {
    // get device ID passed in during discovery
    var requestMethod = request.directive.header.name;
    var responseHeader = request.directive.header;
    responseHeader.namespace = "Alexa";
    responseHeader.name = "Response";
    responseHeader.messageId = responseHeader.messageId + "-R";
    // get user token pass in request
    var requestToken = request.directive.endpoint.scope.token;
    var powerResult;

    if (requestMethod === "TurnOn") {

      // Make the call to your device cloud for control
      // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
      powerResult = "ON";
    }
    else if (requestMethod === "TurnOff") {
      // Make the call to your device cloud for control and check for success
      // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
      powerResult = "OFF";
    }
    // Return the updated powerState.  Always include EndpointHealth in your Alexa.Response
    var contextResult = {
      "properties": [{
        "namespace": "Alexa.PowerController",
        "name": "powerState",
        "value": powerResult,
        "timeOfSample": "2017-09-03T16:20:50.52Z", //retrieve from result.
        "uncertaintyInMilliseconds": 50
      },
        {
          "namespace": "Alexa.EndpointHealth",
          "name": "connectivity",
          "value": {
            "value": "OK"
          },
          "timeOfSample": "2022-03-09T22:43:17.877738+00:00",
          "uncertaintyInMilliseconds": 0
        }]
    };
    var response = {
      context: contextResult,
      event: {
        header: responseHeader,
        endpoint: {
          scope: {
            type: "BearerToken",
            token: requestToken
          },
          endpointId: "sample-bulb-01"
        },
        payload: {}
      }
    };
    log("DEBUG", "Alexa.PowerController ", JSON.stringify(response));
    context.succeed(response);
  }
};

export const main = smarthome;
