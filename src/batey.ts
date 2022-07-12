import {Router, RequestHandler} from 'express'

export enum BateyMethod {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete",
    OPTIONS = "options",
}

export type BateyRoute = { [method in BateyMethod]?: RequestHandler } & {
    path: string
    routes?: Array<BateyRoute>
}

export default function Batey(routes: Array<BateyRoute>) {
    const router: Router = Router({mergeParams: true})
    routes.forEach((route: BateyRoute) => {
        Object.values(BateyMethod).forEach((method: string) => route[method] && router[method](route.path, route[method]))
        route.routes && router.use(route.path, Batey(route.routes))
    })
    return router
}
