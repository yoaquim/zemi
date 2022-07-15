interface ZemiOpenApiPathResponsesDoc {
    [statusCode: string]: {
        description: string
        content?: {
            [contentType: string]: {
                schema: object
            }
        }
    }
}

export interface ZemiOpenApiPathDoc {
    description?: string,
    summary?: string,
    operationId?: string,
    requestBody?: object,
    tags?: Array<string>
    responses?: ZemiOpenApiPathResponsesDoc,
    security?: Array<Record<string, Array<string>>>,
}

export interface ZemiOpenApiDoc {
    openapi: string
    info: {
        description: string
        version: string
        title: string
        termsOfService?: string
        contact?: {
            email: string
        },
        license?: {
            name: string
            url: string
        }
    }
    tags?: Array<{
        name: string
        description: string
        externalDocs?: {
            description: string
            url: string
        }
    }>
    servers: Array<{
        url: string
    }>,
}

export interface ZemiOpenApiParamDoc {
    name: string
    in: string
    required: boolean
    schema: {
        type: string
        format: string
    }
}

export interface ZemiOpenApiOptions {
    fileName: string
}
