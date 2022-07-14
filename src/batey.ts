import {Router, RequestHandler} from 'express'

export enum Method {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete",
    OPTIONS = "options",
}

type MethodIndexableHandler = { [method in Method]?: RequestHandler }
type RouteParams = { path: string, routes?: Array<Route>, middleware?: Array<RequestHandler> }
export type Route = MethodIndexableHandler & RouteParams

export default function Batey(routes: Array<Route>) {
    const router: Router = Router({mergeParams: true})
    routes.forEach((route: Route) => {
        route.middleware && route.middleware.forEach((middleware: RequestHandler) => router.use(middleware))
        const methods = Object.values(Method)
        methods.forEach((method: string) => route[method] && router[method](route.path, route[method]))
        route.routes && router.use(route.path, Batey(route.routes))
    })
    return router
}
