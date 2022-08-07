
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

/**
 * @see https://developer.amazon.com/ja-JP/docs/alexa/device-apis/ja-alexa-errorresponse.html#error-types
 */
export const AlexaSmartHomeResponseErrorType = {
    /**
     * @brief エンドポイントが既に稼動中であるため、処理を実行できません。
     */
    ALREADY_IN_OPERATION: 'ALREADY_IN_OPERATION',

    /**
     * @brief ブリッジが到達できない状態であるか、オフラインになっています。たとえば、ブリッジがオフになっている、<br>
     * ユーザーのローカルエリアネットワークから切断されている、ブリッジとデバイス制御クラウドの間の接続が切断されているなどです。<br>
     * ReportStateディレクティブに応答するときに、このエラーではなくStateReportを返す必要が生じるケースがあります。<br>
     * 詳細については、Alexa.EndpointHealthを参照してください。
     */
    BRIDGE_UNREACHABLE: 'BRIDGE_UNREACHABLE',
    /**
     * @brief ターゲットとするエンドポイントが別のアクションを実行しているため、ディレクティブを処理できません。<br>
     * このアクションは、Alexaへのリクエストに基づいて実行されている場合と、そうでない場合があります。
     */
    ENDPOINT_BUSY: 'ENDPOINT_BUSY',
    /**
     * @brief エンドポイントのバッテリー残量が足りないため、ディレクティブを処理できません。
     */
    ENDPOINT_LOW_POWER: 'ENDPOINT_LOW_POWER',
    /**
     * @brief エンドポイントが到達できない状態であるか、オフラインになっています。<br>
     * たとえば、エンドポイントがオフになっている、ユーザーのローカルエリアネットワークから切断されている、<br>
     * エンドポイントとブリッジまたはエンドポイントとデバイス制御クラウドの間の接続が切断されているなどです。<br>
     * ReportStateディレクティブに応答するときに、このエラーではなくStateReportを返す必要が生じるケースがあります。<br>
     * 詳細については、Alexa.EndpointHealthを参照してください。
     */
    ENDPOINT_UNREACHABLE: 'ENDPOINT_UNREACHABLE',
    /**
     * @brief Alexaが提供する認可資格情報が期限切れです。<br>
     * ユーザーのOAuth2アクセストークンが期限切れになっている場合などです。
     */
    EXPIRED_AUTHORIZATION_CREDENTIAL: 'EXPIRED_AUTHORIZATION_CREDENTIAL',
    /**
     * @brief エンドポイントのファームウェアが期限切れになっているため、ディレクティブを処理できません。
     */
    FIRMWARE_OUT_OF_DATE: 'FIRMWARE_OUT_OF_DATE',
    /**
     * @brief エンドポイントでハードウェアの故障が発生したため、ディレクティブを処理できません。
     */
    HARDWARE_MALFUNCTION: 'HARDWARE_MALFUNCTION',
    /**
     * @brief Alexaには、指定されたアクションをエンドポイントで実行する権限がありません。
     */
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    /**
     * @brief 特定のエラータイプでは説明できないエラーが発生しました。<br>
     * ランタイム例外が発生した場合などがこれにあたりますが、常に具体的なエラータイプを送信することをお勧めします。
     */
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    /**
     * @brief Alexaが提供する認可資格情報が無効です。<br>
     * ユーザーのデバイス制御クラウドアカウントでOAuth2アクセストークンが有効でない場合などです。
     */
    INVALID_AUTHORIZATION_CREDENTIAL: 'INVALID_AUTHORIZATION_CREDENTIAL',
    /**
     * @brief ディレクティブがこのスキルでサポートされていないか、正しくありません。
     */
    INVALID_DIRECTIVE: 'INVALID_DIRECTIVE',
    /**
     * @brief ディレクティブに、ターゲットとするエンドポイントでは無効の値が含まれています。<br>
     * たとえば、暖房モード、チャンネル値、プログラム値などが無効の場合です。
     */
    INVALID_VALUE: 'INVALID_VALUE',
    /**
     * @brief ターゲットとするエンドポイントが存在しない、または存在しなくなりました。
     */
    NO_SUCH_ENDPOINT: 'NO_SUCH_ENDPOINT',
    /**
     * @brief エンドポイントが較正中（暖機中など）のため、ディレクティブを処理できません。
     */
    NOT_CALIBRATED: 'NOT_CALIBRATED',
    /**
     * @brief 現在の操作モードが原因で、エンドポイントを指定された値に設定できません。<br>
     * このエラー応答を送信する場合は、デバイスを新しい値に設定できない理由を示すcurrentDeviceModeフィールドを<br>
     * ペイロードに含めてください。たとえば、白色照明ではない電球の色温度設定は調整できません。<br>
     * 詳細については、Alexa.ColorTemperatureControlを参照してください。
     */
    NOT_SUPPORTED_IN_CURRENT_MODE: 'NOT_SUPPORTED_IN_CURRENT_MODE',
    /**
     * @brief エンドポイントが稼働していません。たとえば、スマートホームスキルがRESUMEディレクティブを受け取ったが、<br>
     * エンドポイントがOFFモードの場合、NOT_IN_OPERATIONエラーを返すことができます。
     */
    NOT_IN_OPERATION: 'NOT_IN_OPERATION',
    /**
     * @brief エンドポイントがサポートしていない電力レベルの操作がリクエストされたので、ディレクティブを処理できません。
     */
    POWER_LEVEL_NOT_SUPPORTED: 'POWER_LEVEL_NOT_SUPPORTED',
    /**
     * @brief エンドポイントまたはブリッジがディレクティブを処理できる最大レートを超えています。
     */
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    /**
     * @brief 許容される温度の範囲外であるため、エンドポイントを指定された値に設定できません。<br>
     * このエラー応答を送信する場合は、オプションとして、有効な温度範囲を示すvalidRangeフィールドをペイロードに含めることができます。<br>
     * 詳細については、例を参照してください。サーモスタット固有のその他のエラーについては、Alexa.ThermostatControllerインターフェースを参照してください。
     */
    TEMPERATURE_VALUE_OUT_OF_RANGE: 'TEMPERATURE_VALUE_OUT_OF_RANGE',
    /**
     * @brief 許容される数値の範囲外であるため、エンドポイントを指定された値に設定できません。たとえば、ユーザーが100を超えるパーセンテージ値をリクエストした場合にこのエラーを使用できます。<br>
     * 温度値には、代わりにTEMPERATURE_VALUE_OUT_OF_RANGEを使用します。このエラー応答を送信する場合は、オプションとして、有効な数値範囲を示すvalidRangeフィールドをペイロードに含めることができます。詳細については、例を参照してください。
     */
    VALUE_OUT_OF_RANGE: 'VALUE_OUT_OF_RANGE',

    /**
     * @brief AcceptGrantが失敗したときに返すエラータイプ
     */
    ACCEPT_GRANT_FAILED: 'ACCEPT_GRANT_FAILED'
} as const;

export type AlexaSmartHomeResponseErrorType = typeof AlexaSmartHomeResponseErrorType[keyof typeof AlexaSmartHomeResponseErrorType];

export type AlexaSmartHomeErrorResponsePayload = {
    /**
     * @brief エラーのタイプです。Alexaはこれをユーザーと共有します。
     */
    type: AlexaSmartHomeResponseErrorType;
    /**
     * @brief エラーのエラーメッセージです。この情報はユーザーとは共有されません。
     */
    message: string;
}

export const AlexaSmartHomeCauseType = {
    APP_INTERACTION: "APP_INTERACTION",
    PERIODIC_POLL: "PERIODIC_POLL",
    PHYSICAL_INTERACTION: "PHYSICAL_INTERACTION",
    VOICE_INTERACTION: "VOICE_INTERACTION"
} as const;

export type AlexaSmartHomeCauseType = typeof AlexaSmartHomeCauseType[keyof typeof AlexaSmartHomeCauseType];

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

export type AlexaSmartHomeErrorResponse = AlexaSmartHomeResponse<AlexaSmartHomeErrorResponsePayload>;
export type AlexaSmartHomeChangeReportResponse = AlexaSmartHomeResponse<AlexaSmartHomeChangeReportResponsePayload>;
export type AlexaSmartHomeAddOrUpdateReportResponse = AlexaSmartHomeResponse<AlexaSmartHomeAddOrUpdateReportResponsePayload>;
export type AlexaSmartHomeDeleteReportResponse = AlexaSmartHomeResponse<AlexaSmartHomeDeleteReportResponsePayload>;

export function alexaSmartHomeMakeErrorResponse(request: AlexaSmartHomeRequest<any>,
                                                type:AlexaSmartHomeResponseErrorType, message:string
) : AlexaSmartHomeErrorResponse {
    let header = request.directive.header;
    header.name = 'ErrorResponse';
    header.messageId = header.messageId + '-R';

    return {
        event: {
            header: header,
            payload: {
                type: type,
                message: message
            }
        }
    }
}

export function alexaSmartHomeMakeErrorResponseFromError(request: AlexaSmartHomeRequest<any>,
                                                error:AlexaSmartHomeError
) : AlexaSmartHomeErrorResponse {
    return alexaSmartHomeMakeErrorResponse(request, error.errorType, error.errorMessage);
}

export class AlexaSmartHomeError extends Error {
    isAlexaSmartHomeError : boolean;
    errorType : AlexaSmartHomeResponseErrorType;
    errorMessage: string;
    baseError: Error;
    constructor(errorType:AlexaSmartHomeResponseErrorType, message:string, internalMessage:string = null,
                baseError: Error = null) {
        super(internalMessage == null ? message : internalMessage);
        this.isAlexaSmartHomeError = true;
        this.errorType = errorType;
        this.errorMessage = message;
        this.baseError = baseError;
    }

}

export function isAlexaSmartHomeError(error: Error) {
    return error instanceof AlexaSmartHomeError;
}
