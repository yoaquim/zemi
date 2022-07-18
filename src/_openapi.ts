import {dirname, join} from 'path'
import {promises as fsPromises} from 'fs'
import {ZemiHandlerDefinition, ZemiMethod, ZemiOpenApiDocGenerationOptions, ZemiRoute} from './types/core.types'
import {OpenApiDoc, OpenApiOperationObject, OpenApiParameterObject, OpenApiPathItemObject, OpenApiReferenceObject} from './types/openapi.types'
import {paramPathToOpenApiParamObject, paramPathToOpenApiPath} from './_helpers'

function buildMethodDocs(route: ZemiRoute, pathParams, definitionParams): Array<OpenApiOperationObject> {
    return Object.values(ZemiMethod).map((method: string) => {
        const methodDoc = {}
        const hd: ZemiHandlerDefinition = route[method]
        if (hd) {
            const methodParams: Array<OpenApiReferenceObject | OpenApiParameterObject> = hd.parameters || []
            const parameters: Array<OpenApiReferenceObject | OpenApiParameterObject> = [...pathParams, ...definitionParams, ...methodParams]
            const {description, summary, responses, operationId, requestBody, tags, security} = hd
            methodDoc[method] = {parameters, description, summary, responses, operationId, requestBody, tags, security}
            return methodDoc
        }
    })
}

function buildPathDocs(routes: Array<ZemiRoute>, parentPath?: string): Array<OpenApiPathItemObject> {
    return routes.flatMap((route: ZemiRoute) => {
        const path: string = route.path
        const paramPath: string = parentPath ? `${parentPath}${path}` : path

        const pathParams: Array<OpenApiParameterObject> = paramPathToOpenApiParamObject(paramPath)
        const definitionParams: Array<OpenApiParameterObject> = route.parameters || []
        const methods: Array<OpenApiOperationObject> = buildMethodDocs(route, pathParams, definitionParams)

        const mine: Array<OpenApiOperationObject> = [{[paramPathToOpenApiPath(paramPath)]: Object.assign({}, ...methods)}]

        if (route.routes) {
            const childRoutesList: Array<OpenApiPathItemObject> = buildPathDocs(route.routes, path)
            return [...mine, ...childRoutesList]
        } else {
            return mine
        }
    })
}

export async function asyncWriteFile(writeFile: (path: string, data: any, options: object) => void, path: string, data: any) {
    try {
        await writeFile(path, data, {flag: 'w',})
    } catch (err) {
        console.log(`-- Something went wrong when trying to write ${path}:`)
        console.log(err)
    }
}

export default async function ZemiOpenApiDocGenerator({doc, routes, options}: { doc: OpenApiDoc, routes: Array<ZemiRoute>, options?: ZemiOpenApiDocGenerationOptions }): Promise<OpenApiDoc> {
    const whereToWrite = options && options.path ? options.path : join(dirname(require.main.filename), 'openapi.json')
    const pathDocs: Array<Record<string, any>> = buildPathDocs(routes)
    const paths = Object.assign({}, ...pathDocs)
    const document = Object.assign({}, doc, {paths})

    console.log('\n====================')
    console.log('OpenAPI spec:')
    console.log('====================\n')
    console.log(JSON.stringify(document))
    console.log('\n--\n')

    await asyncWriteFile(fsPromises.writeFile, whereToWrite, JSON.stringify(document)).then(() => console.log(`Finished writing OpenAPI spec to ${whereToWrite}.\n`))
    return document
}
