import 'source-map-support/register';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';

import schema from './schema';

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

const smarthome = async (request, context) => {
  if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
    log("DEBUG:", "Discover request",  JSON.stringify(request));
    handleDiscovery(request, context, "");
  }
  else if (request.directive.header.namespace === 'Alexa.PowerController') {
    if (request.directive.header.name === 'TurnOn' || request.directive.header.name === 'TurnOff') {
      log("DEBUG:", "TurnOn or TurnOff Request", JSON.stringify(request));
      handlePowerControl(request, context);
    }
  }
  else if (request.directive.header.namespace === 'Alexa.Authorization' && request.directive.header.name === 'AcceptGrant') {
    handleAuthorization(request, context)
  }

  function handleAuthorization(request, context) {
    // Send the AcceptGrant response
    var payload = {};
    var header = request.directive.header;
    header.name = "AcceptGrant.Response";
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
                        "retrievable": true
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
