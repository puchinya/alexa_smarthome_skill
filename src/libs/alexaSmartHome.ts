
export type AlexaSmartHomeProperty = {
    namespace: string,
    instance?: string,
    name: string,
    value: any,
    timeOfSample: string,
    uncertaintyInMilliseconds: number
}

export type AlexaSmartHomeContext = {
    properties?: AlexaSmartHomeProperty[];
}

export type AlexaSmartHomeHeader = {
    namespace: string;
    name: string;
    messageId: string;
    correlationToken?: string;
    payloadVersion: string;
}

export type AlexaSmartHomeScope = {
    type: string;
    token: string;
    partition?: string;
    userId?: string;
}

export type AlexaSmartHomeEndpoint = {
    endpointId: string;
    scope?: AlexaSmartHomeScope;
    cookie?: string[];
}

export type AlexaSmartHomeEvent<PayloadType> = {
    header: AlexaSmartHomeHeader;
    endpoint?: AlexaSmartHomeEndpoint;
    payload: PayloadType;
}

export type AlexaSmartHomeDirective<PayloadType> = {
    header: AlexaSmartHomeHeader;
    endpoint: AlexaSmartHomeEndpoint;
    payload: PayloadType;
}

export type AlexaSmartHomeRequest<PayloadType> = {
    directive: AlexaSmartHomeDirective<PayloadType>;
    context: AlexaSmartHomeContext;
}

export interface AlexaSmartHomeAuthorizationPayload {
    grantee : {type, token};
    grant : {code};
}

export type AlexaSmartHomeAuthorizationRequest = AlexaSmartHomeRequest<AlexaSmartHomeAuthorizationPayload>;

export type AlexaSmartHomeResponse<PayloadType> = {
    event: AlexaSmartHomeEvent<PayloadType>;
    context?: AlexaSmartHomeContext;
}

export type AlexaSmartHomeEndpointDescription = {
    endpointId: string;
    manufacturerName: string;
    description: string;
    friendlyName: string;
    displayCategories: string[];
    additionalAttributes?: object;
    capabilities: object[];
    connections?: object[];
    relationships?: object;
    cookie?: object;
}

export enum AlexaSmartHomeCauseType {
    APP_INTERACTION = "APP_INTERACTION",
    PERIODIC_POLL = "PERIODIC_POLL",
    PHYSICAL_INTERACTION = "PHYSICAL_INTERACTION",
    VOICE_INTERACTION = "VOICE_INTERACTION"
}

export type AlexaSmartHomeCause = {
    type: AlexaSmartHomeCauseType;
}

export type AlexaSmartHomeChangeReportResponsePayload = {
    change: {
      cause : AlexaSmartHomeCause;
      properties: AlexaSmartHomeProperty[];
    };
}

export type AlexaSmartHomeAddOrUpdateReportResponsePayload = {
    endpoints: AlexaSmartHomeEndpointDescription[];
    scope: AlexaSmartHomeScope;
}

export type AlexaSmartHomeDeleteReportResponsePayload = {
    endpoints: {endpointId: string}[];
    scope: AlexaSmartHomeScope;
}

export type AlexaSmartHomeChangeReportResponse = AlexaSmartHomeResponse<AlexaSmartHomeChangeReportResponsePayload>;
export type AlexaSmartHomeAddOrUpdateReportResponse = AlexaSmartHomeResponse<AlexaSmartHomeAddOrUpdateReportResponsePayload>;
export type AlexaSmartHomeDeleteReportResponse = AlexaSmartHomeResponse<AlexaSmartHomeDeleteReportResponsePayload>;
