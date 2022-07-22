export type OpenApiReferenceObject = { $ref: string };
export type OpenApiCallbackObject = Record<string, OpenApiPathItemObject>;
export type OpenApiSecurityRequirementObject = Record<string, Array<string>>;
export type OpenApiParameterObjectIn = "query" | "header" | "path" | "cookie";

export interface OpenApiDiscriminatorObject {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface OpenApiXmlObject {
  name?: string;
  nameSpace?: string;
  prefix?: string;
  attribute?: boolean | false;
  wrapped?: boolean | false;
}

export interface OpenApiSchemaObject {
  // properties are taken directly from the JSON Schema definition
  title?: string;
  description?: string;
  required?: Array<string>;
  enum?: Array<string>;
  type?: string;
  items?: OpenApiReferenceObject | OpenApiSchemaObject;
  allOf?: OpenApiSchemaObject;
  properties?: Record<string, OpenApiReferenceObject | OpenApiSchemaObject>;
  default?: any;
  additionalProperties?: boolean | OpenApiReferenceObject | OpenApiSchemaObject;
  oneOf?: Array<OpenApiReferenceObject | OpenApiSchemaObject>;
  anyOf?: Array<OpenApiReferenceObject | OpenApiSchemaObject>;
  format?: string;

  // following fields MAY be used for further schema documentation
  nullable?: boolean | false;
  discriminator?: OpenApiDiscriminatorObject;
  readOnly?: boolean | false;
  writeOnly?: boolean | false;
  xml?: OpenApiXmlObject;
  externalDocs?: OpenApiExternalDocumentationObject;
  example?: any;
  deprecated?: boolean | false;
}

export interface OpenApiEncodingObject {
  contentType?: string;
  headers?: Record<string, OpenApiReferenceObject | OpenApiHeaderObject>;
  style?: string;
  explode?: boolean; // has  no default, because default depends on style prop
  allowReserved?: boolean | false;
}

export interface OpenApiMediaTypeObject {
  schema?: OpenApiReferenceObject | OpenApiSchemaObject;
  example?: any;
  examples?: Record<string, OpenApiReferenceObject | OpenApiExampleObject>;
  encoding?: Record<string, OpenApiEncodingObject>;
}

export interface OpenApiRequestBodyObject {
  description?: string;
  content?: Record<string, { schema: OpenApiReferenceObject | OpenApiMediaTypeObject }>;
  required?: boolean | false;
}

export interface OpenApiParameterObject {
  name: string;
  in: OpenApiParameterObjectIn;
  description?: string;
  required: boolean | true;
  deprecated?: boolean | false;
  allowEmptyValue?: boolean | false;
  style?: string;
  explode?: boolean | false;
  allowReserved?: boolean | false;
  schema?: OpenApiReferenceObject | OpenApiSchemaObject;
  example?: any;
  examples?: Record<string, OpenApiReferenceObject | OpenApiExampleObject>;
  content?: Record<string, OpenApiMediaTypeObject>;
}

export interface OpenApiLinkObject {
  operationRef?: string;
  operationId?: string;
  parameters?: Array<OpenApiReferenceObject | OpenApiParameterObject>;
  requestBody?: OpenApiRequestBodyObject;
  description?: string;
}

export interface OpenApiResponseObject {
  description?: string;
  headers?: Record<string, OpenApiReferenceObject | OpenApiHeaderObject>;
  links?: Record<string, OpenApiReferenceObject | OpenApiLinkObject>;
  content?: Record<string, { schema: OpenApiReferenceObject | OpenApiSchemaObject }>;
}

export interface OpenApiServerVariableObject {
  default?: string;
  enum?: Array<string>;
  description?: string;
}

export interface OpenApiServerObject {
  url: string;
  description?: string;
  variables?: Record<string, OpenApiServerVariableObject>;
}

export interface OpenApiOAuthFlowObject {
  authorizationUrl: string;
  tokenUrl: string;
  scopes: Record<string, string>;
  refreshUrl?: string;
}

export interface OpenApiOAuthFlowsObject {
  implicit?: OpenApiOAuthFlowObject;
  password?: OpenApiOAuthFlowObject;
  clientCredentials?: OpenApiOAuthFlowObject;
  authorizationCode?: OpenApiOAuthFlowObject;
}

export interface OpenApiSecuritySchemeObject {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect";
  description?: string;
  name: string;
  in: "query" | "header" | "cookie";
  scheme: string;
  bearerFormat?: string;
  flows: OpenApiOAuthFlowsObject;
  openIdConnectUrl: string;
}

export interface OpenApiOperationObject {
  tags?: Array<string>;
  summary?: string;
  description?: string;
  externalDocs?: OpenApiExternalDocumentationObject;
  operationId?: string;
  parameters?: Array<OpenApiReferenceObject | OpenApiParameterObject>;
  requestBody?: OpenApiReferenceObject | OpenApiRequestBodyObject;
  responses?: Record<string, OpenApiResponseObject>;
  callbacks?: Record<string, OpenApiReferenceObject | OpenApiCallbackObject>;
  deprecated?: boolean | false;
  security?: Array<OpenApiSecurityRequirementObject>;
  servers?: Array<OpenApiServerObject>;
}

export interface OpenApiPathItemDefinitionObject {
  $ref?: string;
  summary?: string;
  description?: string;
  servers?: Array<OpenApiServerObject>;
  parameters?: Array<OpenApiReferenceObject | OpenApiParameterObject>;
}

export type OpenApiPathItemObject = OpenApiPathItemDefinitionObject & {
  get?: OpenApiOperationObject;
  put?: OpenApiOperationObject;
  post?: OpenApiOperationObject;
  delete?: OpenApiOperationObject;
  options?: OpenApiOperationObject;
  head?: OpenApiOperationObject;
  patch?: OpenApiOperationObject;
  trace?: OpenApiOperationObject;
};

export interface OpenApiHeaderObject {
  type: string;
  description?: string;
  required?: boolean | false;
  schema: OpenApiReferenceObject | OpenApiSchemaObject;
}

export interface OpenApiExampleObject {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface OpenApiExternalDocumentationObject {
  url: string;
  description?: string;
}

export interface OpenApiInfoObject {
  version: string;
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

export interface OpenApiTagsObject {
  name: string;
  description?: string;
  externalDocs?: OpenApiExternalDocumentationObject;
}

export interface OpenApiDoc {
  openapi: string;
  info: OpenApiInfoObject;
  servers: Array<OpenApiServerObject>;
  components?: {
    schemas?: Record<string, OpenApiReferenceObject | OpenApiSchemaObject>;
    responses?: Record<string, OpenApiReferenceObject | OpenApiResponseObject>;
    parameters?: Record<string, OpenApiReferenceObject | OpenApiParameterObject>;
    examples?: Record<string, OpenApiReferenceObject | OpenApiExampleObject>;
    requestBodies?: Record<string, OpenApiReferenceObject | OpenApiRequestBodyObject>;
    headers?: Record<string, OpenApiReferenceObject | OpenApiHeaderObject>;
    securitySchemes?: Record<string, OpenApiReferenceObject | OpenApiSecuritySchemeObject>;
    links?: Record<string, OpenApiReferenceObject | OpenApiLinkObject>;
    callbacks?: Record<string, OpenApiReferenceObject | OpenApiCallbackObject>;
  };
  security?: Array<OpenApiSecurityRequirementObject>;
  tags?: Array<OpenApiTagsObject>;
  externalDocs?: Record<string, OpenApiReferenceObject | OpenApiExternalDocumentationObject>;
}
