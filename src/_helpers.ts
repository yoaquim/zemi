import {ZemiHandlerDefinition, ZemiMethod, ZemiRoute, ZemiRouteDefinition} from './types/core.types'
import {NamedRoute} from './types/helpers.types'
import {ZemiOpenApiParamDoc} from './types/openapi.types'

export function buildNamedRoutes(routes: Array<ZemiRoute>, prefix?: NamedRoute): Record<string, string> {
    const namedRoutes = routes.map((r: ZemiRoute) => {
        if (r.name) {
            const name: string = prefix ? `${prefix.name}-${r.name}` : r.name
            const path: string = prefix ? `${prefix.path}${r.path}` : r.path

            const mine = {[name]: path}
            if (r.routes) {
                return Object.assign({}, buildNamedRoutes(r.routes, {name, path}), mine)
            } else {
                return mine
            }
        }
    })
    return Object.assign({}, ...namedRoutes)
}

export function buildResponsesPerNamedRoute(routes: Array<ZemiRoute>, prefix?: string): Record<string, Record<string, Array<string>>> {
    const namedRoutes = routes.map((r: ZemiRoute) => {
        if (r.name) {
            const name: string = prefix ? `${prefix}-${r.name}` : r.name

            const methods = Object.values(ZemiMethod)
            const responsesPerMethod = methods.map((method: string) => {
                const hd: ZemiHandlerDefinition = r[method]
                if (hd && hd.responses) {
                    return {[method]: Object.keys(hd.responses)}
                }
            })

            const mine = {[name]: Object.assign({}, ...responsesPerMethod)}
            if (r.routes) {
                return Object.assign({}, buildResponsesPerNamedRoute(r.routes, name), mine)
            } else {
                return mine
            }
        }
    })
    return Object.assign({}, ...namedRoutes)
}


export function paramPathToValidPath(path: string, useBrackets: boolean = false): string {
    const pathBits: Array<string> = path.split('/').map(p => {
        if (p[0] === '{' && p[p.length - 1] === '}') {
            const paramKey = p.split('{')[1].split('|')[0]
            if (useBrackets) return `{${paramKey}}`
            else return `:${paramKey}`
        } else {
            return p
        }
    })
    return pathBits.join('/')
}

export function paramPathToOpenApiParamObj(path: string): Array<ZemiOpenApiParamDoc> {
    const paramBits: Array<string> = path.split('/').filter(p => p[0] === '{' && p[p.length - 1] === '}')
    const noBracks: Array<string> = paramBits.map(pb => pb.substring(1, pb.length - 1))
    const paramsSeparatedList: Array<Array<string>> = noBracks.map(p => p.split('|'))
    return paramsSeparatedList.map(([name, type, format]: Array<string>) => {
        return {
            name,
            in: 'path',
            required: true,
            schema: {
                type,
                format,
            }
        }
    })
}

export function buildRouteDef(path: string, name: string): ZemiRouteDefinition {
    const pathArray: Array<string> = path.split('/')
    const parameters: Array<string> = pathArray.filter(p => p.includes(':')).map(p => p.split(':')[1])
    const reverse = (paramValues: Record<string, string | number>): string => {
        const pathParts = pathArray.map((p: string) => {
            if (p.includes(':')) {
                const key = p.split(':')[1]
                return paramValues[key]
            } else return p
        })
        return pathParts.join('/')
    }
    return {name, path, parameters, reverse}
}