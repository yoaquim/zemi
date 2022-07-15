import {promises as fsPromises} from 'fs'
import {join} from 'path'
import {ZemiHandlerDefinition, ZemiMethod, ZemiRoute} from './core.types'
import {ZemiOpenApiDoc, ZemiOpenApiOptions, ZemiOpenApiParamDoc} from './openapi.types'
import {paramPathToOpenApiParamObj, paramPathToValidPath} from './helpers'

async function asyncWriteFile(filename: string, data: any) {
    try {
        await fsPromises.writeFile(join(__dirname, filename), data, {flag: 'w',})
        return await fsPromises.readFile(join(__dirname, filename), 'utf-8',)
    } catch (err) {
        console.log(err)
        return `Something went wrong when trying to write ${filename}`
    }
}

export async function ZemiOpenApiDocGenerator({doc, routes, options}: { doc: ZemiOpenApiDoc, routes: Array<ZemiRoute>, options?: ZemiOpenApiOptions }) {
    const pathDocs: Array<Record<string, any>> = buildPathDocs(routes)
    const paths = Object.assign({}, ...pathDocs)
    const document = Object.assign({}, doc, {paths})
    const filename = `${options.fileName}.json` || 'openapi.json'
    asyncWriteFile(filename, JSON.stringify(document)).then(() => console.log(`Finished writing out ${filename} OpenAPI spec.`))
    return document
}

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
