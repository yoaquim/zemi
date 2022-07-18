import {NextFunction, RequestHandler, Router} from 'express'
import {ZemiRequest, ZemiMethod, ZemiRoute, ZemiResponse, ZemiHandlerDefinition, ZemiRouteDefinition} from './types/core.types'
import {buildRouteDefinitions, buildResponsesPerNamedRoute, buildRouteDef, paramPathToValidExpressPath} from './_helpers'

export default function Zemi(routes: Array<ZemiRoute>, router: Router = Router({mergeParams: true})): Router {
    router.use(function (request: ZemiRequest, response: ZemiResponse, next: NextFunction) {
            request.routeDefinitions = buildRouteDefinitions(routes)
            request.allowedResponseHttpCodes = buildResponsesPerNamedRoute(routes)
            next()
        }
    )

    routes.forEach((route: ZemiRoute) => {
        const path: string = paramPathToValidExpressPath(route.path)

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
