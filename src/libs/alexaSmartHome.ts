
export interface AlexaSmartHomeProperty {
    namespace: string,
    instance?: string,
    name: string,
    value: any,
    timeOfSample: string,
    uncertaintyInMilliseconds: number
}

export interface AlexaSmartHomeContext {
    properties?: AlexaSmartHomeProperty[];
}

export interface AlexaSmartHomeHeader {
    namespace: string;
    name: string;
    messageId: string;
    correlationToken?: string;
    payloadVersion: string;
}

export interface AlexaSmartHomeScope {
    type: string;
    token: string;
    partition?: string;
    userId?: string;
}

export interface AlexaSmartHomeEndpoint {
    endpointId: string;
    scope?: AlexaSmartHomeScope;
    cookie?: string[];
}

export interface AlexaSmartHomeEvent<PayloadType> {
    header: AlexaSmartHomeHeader;
    endpoint: AlexaSmartHomeEndpoint;
    payload: PayloadType;
}

export interface AlexaSmartHomeDirective<PayloadType> {
    header: AlexaSmartHomeHeader;
    endpoint: AlexaSmartHomeEndpoint;
    payload: PayloadType;
}

export interface AlexaSmartHomeRequest<PayloadType> {
    directive: AlexaSmartHomeDirective<PayloadType>;
    context: AlexaSmartHomeContext;
}

export interface AlexaSmartHomeAuthorizationPayload {
    grantee : {type, token};
    grant : {code};
}

export type AlexaSmartHomeAuthorizationRequest = AlexaSmartHomeRequest<AlexaSmartHomeAuthorizationPayload>;

export interface AlexaSmartHomeResponse<PayloadType> {
    event: AlexaSmartHomeEvent<PayloadType>;
    context: AlexaSmartHomeContext;
}

export enum AlexaSmartHomeCauseType {
    APP_INTERACTION = "APP_INTERACTION",
    PERIODIC_POLL = "PERIODIC_POLL",
    PHYSICAL_INTERACTION = "PHYSICAL_INTERACTION",
    VOICE_INTERACTION = "VOICE_INTERACTION"
}

export interface AlexaSmartHomeCause {
    type: AlexaSmartHomeCauseType;
}

export interface AlexaSmartHomeChangeReportResponsePayload {
    change: {
      cause : AlexaSmartHomeCause;
      properties: AlexaSmartHomeProperty[];
    };
}

export type AlexaSmartHomeChangeReportResponse = AlexaSmartHomeResponse<AlexaSmartHomeChangeReportResponsePayload>;
