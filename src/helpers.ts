import {ZemiRoute} from './types'

interface NamedRoute {
    name: string
    path: string
}

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
