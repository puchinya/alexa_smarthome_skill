import 'source-map-support/register';

import {issueLwaTokenByCodeAndSaveToDb} from "@libs/lwaTokenDb"
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

function decodeJwt(token: string) : any {
  const ret = jwt_decode(token)
  return ret;
}

function log(message, message1, message2) {
  console.log(message + message1 + message2);
}

interface AlexaSmartHomeSkillEventHeader {
  namespace: string;
  name: string;
  messageId: string;
  payloadVersion: string;
  correlationToken: string;
}

interface AlexaSmartHomeSkillDirectiveEndpointScope {
  type: string;
  token: string;
}

interface AlexaSmartHomeSkillEventEndpoint {
  scope: AlexaSmartHomeSkillDirectiveEndpointScope;
  endpointId: string;
  cookie: object;
}

interface AlexaSmartHomeSkillRequestEvent {
  header: AlexaSmartHomeSkillEventHeader;
  endpoint: AlexaSmartHomeSkillEventEndpoint;
  payload: any;
}

interface AlexaSmartHomeSkillRequest {
  directive: AlexaSmartHomeSkillRequestEvent;
}

interface AlexaSmartHomeSkillResponse {
  event: AlexaSmartHomeSkillRequestEvent;
  context: any;
}

async function handleAuthorization(request, context) : Promise<any> {
  // Send the AcceptGrant response
  let payload = {};
  const header = request.directive.header;
  header.name = "AcceptGrant.Response";

  const requestToken = request.directive.payload.grantee.token;
  const jwt = decodeJwt(requestToken);
  const uid : string = jwt.sub;

  const code = request.directive.payload.grant.code;

  await issueLwaTokenByCodeAndSaveToDb(uid, code);

  log("DEBUG", "AcceptGrant Response: ", JSON.stringify({ header: header, payload: payload }));

  return { event: { header: header, payload: payload } };
}

function handleDiscovery(request, context) : any {
  // Send the discovery response
  const payload = {
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
  const header = request.directive.header;
  header.name = "Discover.Response";
  log("DEBUG", "Discovery Response: ", JSON.stringify({ header: header, payload: payload }));
  return { header: header, payload: payload };
}

function handlePowerControl(request: AlexaSmartHomeSkillRequest, context) : any {
  // get device ID passed in during discovery
  const requestMethod = request.directive.header.name;
  const responseHeader = request.directive.header;
  responseHeader.namespace = "Alexa";
  responseHeader.name = "Response";
  responseHeader.messageId = responseHeader.messageId + "-R";
  // get user token pass in request
  const requestToken = request.directive.endpoint.scope.token;
  let powerResult;

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
  const contextResult = {
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
  const response = {
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
  return response;
}

const smarthome = async (request, context) : Promise<any> => {
  if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
    log("DEBUG:", "Discover request",  JSON.stringify(request));
    return handleDiscovery(request, context);
  }
  else if (request.directive.header.namespace === 'Alexa.PowerController') {
    if (request.directive.header.name === 'TurnOn' || request.directive.header.name === 'TurnOff') {
      log("DEBUG:", "TurnOn or TurnOff Request", JSON.stringify(request));
      return handlePowerControl(request, context);
    }
  }
  else if (request.directive.header.namespace === 'Alexa.Authorization' &&
      request.directive.header.name === 'AcceptGrant') {
    return await handleAuthorization(request, context)
  }
};

export const main = smarthome;
