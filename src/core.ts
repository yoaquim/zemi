import {NextFunction, Router} from 'express'
import {ZemiRequest, ZemiRequestHandler, ZemiMethod, ZemiRoute, ZemiResponse, ZemiHandlerDefinition} from './core.types'
import {buildNamedRoutes, buildResponsesPerNamedRoute, paramPathToValidPath} from './helpers'

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

        route.middleware && route.middleware.forEach((middleware: ZemiRequestHandler) => router.use(middleware))

        const methods = Object.values(ZemiMethod)
        methods.forEach((method: string) => {
            const handlerDefinition: ZemiHandlerDefinition = route[method]
            if (handlerDefinition && handlerDefinition.handler) {
                router[method](path, (request: ZemiRequest, response: ZemiResponse, next: NextFunction) => handlerDefinition.handler(request, response, next))
            }
        })

        route.routes && router.use(path, Zemi(route.routes))
    })

    return router
}
