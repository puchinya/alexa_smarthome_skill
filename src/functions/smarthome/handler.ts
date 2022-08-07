import 'source-map-support/register';

import {issueLwaTokenByCodeAndSaveToDbAsync} from "@libs/lwaTokenDb"
import jwt_decode from 'jwt-decode';
import {
  AlexaSmartHomeAuthorizationRequest, AlexaSmartHomeError,
  alexaSmartHomeMakeErrorResponse,
  alexaSmartHomeMakeErrorResponseFromError,
  AlexaSmartHomeRequest,
  AlexaSmartHomeResponse,
  AlexaSmartHomeResponseErrorType,
  isAlexaSmartHomeError
} from '@libs/alexaSmartHome'
import {getDeviceStatusAsync, registerDeviceAsync, updateDeviceStatusAsync} from "@libs/deviceImplement";

function decodeToken(token: string) : any {
  try {
    const ret = jwt_decode(token);
    if(ret !== null && ret !== undefined) {
      return ret;
    }
  } catch (e) {
    throw new AlexaSmartHomeError(AlexaSmartHomeResponseErrorType.INVALID_AUTHORIZATION_CREDENTIAL,
        "token is invalid", null, e);
  }

  throw new AlexaSmartHomeError(AlexaSmartHomeResponseErrorType.INVALID_AUTHORIZATION_CREDENTIAL,
      "token is invalid");
}

async function handleAuthorizationAsync(request: AlexaSmartHomeAuthorizationRequest, context)
    : Promise<AlexaSmartHomeResponse<object>> {
  // Send the AcceptGrant response
  const header = request.directive.header;
  const requestToken = request.directive.payload.grantee.token;

  try {
    const jwt = decodeToken(requestToken);
    const uid: string = jwt.sub;

    const code = request.directive.payload.grant.code;

    await issueLwaTokenByCodeAndSaveToDbAsync(uid, code);

    header.name = "AcceptGrant.Response";

    return {event: {header: header, payload: {}}};
  } catch (e) {
    throw new AlexaSmartHomeError(AlexaSmartHomeResponseErrorType.ACCEPT_GRANT_FAILED,
        "failed to get LWA tokens.", null, e);
  }
}

async function handleDiscoveryAsync(request : AlexaSmartHomeRequest<object>, context)
    : Promise<AlexaSmartHomeResponse<object>> {

  const requestToken = request.directive.payload.scope.token;
  const jwt = decodeToken(requestToken);
  const uid: string = jwt.sub;

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

  await registerDeviceAsync(uid, "sample-bulb-01", {
    "powerState": "OFF"
  });

  const header = request.directive.header;
  header.name = "Discover.Response";

  return { event: { header: header, payload: payload } };
}

async function handleReportStateAsync(request: AlexaSmartHomeRequest<object>, context)
    : Promise<AlexaSmartHomeResponse<object>> {

  const requestToken = request.directive.endpoint.scope.token;
  const jwt = decodeToken(requestToken);
  const uid: string = jwt.sub;

  const utc = new Date().toISOString();

  const endpointId = request.directive.endpoint.endpointId;

  const deviceInfo = await getDeviceStatusAsync(uid, endpointId);

  let header = request.directive.header;
  header.name = "StateReport";
  header.messageId = header.messageId + "-R";

  const properties = [
    {
      "namespace": "Alexa.PowerController",
      "name": "powerState",
      "value": deviceInfo.status["powerState"],
      "timeOfSample": utc, //retrieve from result.
      "uncertaintyInMilliseconds": 50
    },
    {
      "namespace": "Alexa.EndpointHealth",
      "name": "connectivity",
      "value": {
        "value": "OK"
      },
      "timeOfSample": utc,
      "uncertaintyInMilliseconds": 0
    }];

  const response = {
    event: {
      header: header,
      endpoint: {
        scope: {
          type: "BearerToken",
          token: requestToken
        },
        endpointId: endpointId
      },
      payload: {}
    },
    context: {
      properties: properties
    }
  };

  return response;
}

async function handlePowerControlAsync(request: AlexaSmartHomeRequest<object>, context) : Promise<any> {

  const requestToken = request.directive.endpoint.scope.token;
  const jwt = decodeToken(requestToken);
  const uid: string = jwt.sub;

  const utc = new Date().toISOString();

  // get device ID passed in during discovery
  const requestMethod = request.directive.header.name;

  let powerResult;

  if (requestMethod === "TurnOn") {
    // Make the call to your device cloud for control
    // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
    powerResult = "ON";
  } else if (requestMethod === "TurnOff") {
    // Make the call to your device cloud for control and check for success
    // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
    powerResult = "OFF";
  } else {
    throw new AlexaSmartHomeError(AlexaSmartHomeResponseErrorType.INVALID_DIRECTIVE, "not supported operation");
  }

  const newStatus = await updateDeviceStatusAsync(uid, request.directive.endpoint.endpointId,
      {
        "powerState": powerResult
      })

  const responseHeader = request.directive.header;
  responseHeader.namespace = "Alexa";
  responseHeader.name = "Response";
  responseHeader.messageId = responseHeader.messageId + "-R";

  // Return the updated powerState.  Always include EndpointHealth in your Alexa.Response
  const contextResult = {
    "properties": [{
      "namespace": "Alexa.PowerController",
      "name": "powerState",
      "value": newStatus['powerState'],
      "timeOfSample": utc, //retrieve from result.
      "uncertaintyInMilliseconds": 50
    },
      {
        "namespace": "Alexa.EndpointHealth",
        "name": "connectivity",
        "value": {
          "value": "OK"
        },
        "timeOfSample": utc,
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

  return response;
}

async function handleRequestAsync(request:AlexaSmartHomeRequest<any>, context)
    : Promise<AlexaSmartHomeResponse<any>> {
  if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
    return await handleDiscoveryAsync(request, context);
  } else if (request.directive.header.namespace === 'Alexa.PowerController') {
    if (request.directive.header.name === 'TurnOn' || request.directive.header.name === 'TurnOff') {
      return await handlePowerControlAsync(request, context);
    }
  } else if (request.directive.header.namespace === 'Alexa') {
    if (request.directive.header.name === 'ReportState') {
      return await handleReportStateAsync(request, context);
    }
  } else if (request.directive.header.namespace === 'Alexa.Authorization' &&
      request.directive.header.name === 'AcceptGrant') {
    return await handleAuthorizationAsync(request, context)
  }

  throw new AlexaSmartHomeError(AlexaSmartHomeResponseErrorType.INVALID_DIRECTIVE, "not supported directive");
}

export async function main(request: AlexaSmartHomeRequest<any>, context:any) : Promise<AlexaSmartHomeResponse<any>> {
  console.debug(`request: ${JSON.stringify(request)}`);
  try {
    const response = await handleRequestAsync(request, context);
    console.debug(`response: ${JSON.stringify(response)}`);
    return response;
  } catch (error) {
    if(isAlexaSmartHomeError(error)) {
      console.warn(`error occurred: ${error}, request:${request}`);
      return alexaSmartHomeMakeErrorResponseFromError(request, <AlexaSmartHomeError>error);
    } else {
      console.error(`error occurred: ${error}, request:${request}`);
      return alexaSmartHomeMakeErrorResponse(request,
          AlexaSmartHomeResponseErrorType.INTERNAL_ERROR, "internal error.");
    }
  }
}
