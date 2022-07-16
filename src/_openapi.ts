import {join, dirname} from 'path'
import {promises as fsPromises} from 'fs'
import {ZemiHandlerDefinition, ZemiMethod, ZemiRoute} from './types/core.types'
import {ZemiOpenApiDoc, ZemiOpenApiOptions, ZemiOpenApiParamDoc} from './types/openapi.types'
import {paramPathToOpenApiParamObj, paramPathToValidPath} from './_helpers'

function buildPathDocs(routes: Array<ZemiRoute>, parentPath?: string): Array<Record<string, any>> {
    return routes.flatMap((route: ZemiRoute) => {
        const path: string = route.path
        const paramPath: string = parentPath ? `${parentPath}${path}` : path
        const parameters: Array<ZemiOpenApiParamDoc> = paramPathToOpenApiParamObj(paramPath)

        const methods = Object.values(ZemiMethod).map((method: string) => {
            const methodDoc = {}
            const hd: ZemiHandlerDefinition = route[method]
            if (hd) {
                const {description, summary, responses, operationId, requestBody, tags, security} = hd
                methodDoc[method] = {parameters, description, summary, responses, operationId, requestBody, tags, security}
                return methodDoc
            }
        })
        const mine = [{[paramPathToValidPath(paramPath, true)]: Object.assign({}, ...methods)}]
        if (route.routes) {
            const childRoutesList: Array<Record<string, object>> = buildPathDocs(route.routes, path)
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

export default async function ZemiOpenApiDocGenerator({doc, routes, options}: { doc: ZemiOpenApiDoc, routes: Array<ZemiRoute>, options?: ZemiOpenApiOptions }): Promise<ZemiOpenApiDoc> {
    const whereToWrite = options && options.path ? options.path : join(dirname(require.main.filename), 'openapi.json')
    const pathDocs: Array<Record<string, any>> = buildPathDocs(routes)
    const paths = Object.assign({}, ...pathDocs)
    const document = Object.assign({}, doc, {paths})
    console.log('\n----------\n')
    console.log('OpenAPI spec:\n\n')
    console.log(JSON.stringify(document))
    console.log('\n----------\n')
    await asyncWriteFile(fsPromises.writeFile, whereToWrite, JSON.stringify(document)).then(() => console.log(`\nFinished writing out OpenAPI spec to ${whereToWrite}.\n`))
    return document
}
