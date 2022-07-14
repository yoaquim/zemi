import {NextFunction, Response, Router} from 'express'
import {ZemiRequest, ZemiRequestHandler, ZemiMethod, ZemiRoute} from './types'
import {buildNamedRoutes} from './helpers'

export default function Zemi(routes: Array<ZemiRoute>) {
    const router: Router = Router({mergeParams: true})
    router.use(function (request: ZemiRequest, response: Response, next: NextFunction) {
            request.namedRoutes = buildNamedRoutes(routes)
            next()
        }
    )

    routes.forEach((route: ZemiRoute) => {
        const path: string = route.path
        route.middleware && route.middleware.forEach((middleware: ZemiRequestHandler) => router.use(middleware))
        const methods = Object.values(ZemiMethod)
        methods.forEach((method: string) => route[method] && router[method](path, route[method]))
        route.routes && router.use(path, Zemi(route.routes))
    })
    return router
}
