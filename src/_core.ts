import {NextFunction, RequestHandler, Router} from 'express'
import {ZemiRequest, ZemiRequestHandler, ZemiMethod, ZemiRoute, ZemiResponse, ZemiHandlerDefinition, ZemiRouteDefinition} from './types/core.types'
import {buildNamedRoutes, buildResponsesPerNamedRoute, buildRouteDef, paramPathToValidPath} from './_helpers'

export default function Zemi(routes: Array<ZemiRoute>): Router {
    const router: Router = Router({mergeParams: true})

    router.use(function (request: ZemiRequest, response: ZemiResponse, next: NextFunction) {
            request.namedRoutes = buildNamedRoutes(routes)
            request.allowedResponseHttpCodes = buildResponsesPerNamedRoute(routes)
            next()
        }
    )

    routes.forEach((route: ZemiRoute) => {
        const path: string = paramPathToValidPath(route.path)

        route.middleware && route.middleware.forEach((middleware: RequestHandler) => router.use(middleware))

        const methods = Object.values(ZemiMethod)
        methods.forEach((method: string) => {
            const handlerDefinition: ZemiHandlerDefinition = route[method]
            if (handlerDefinition && handlerDefinition.handler) {
                const routeDef: ZemiRouteDefinition = buildRouteDef(path, route.name)
                router[method](path, (request: ZemiRequest, response: ZemiResponse, next: NextFunction) => handlerDefinition.handler(request, response, next, routeDef))
            }
        })

        route.routes && router.use(path, Zemi(route.routes))
    })

    return router
}
