import {Router, RequestHandler} from 'express'

export type BateyMethod = 'get' | 'post' | 'put' | 'delete' | 'options'

export interface BateyRoute {
    path: string
    method: BateyMethod
    handler: RequestHandler
    routes?: Array<BateyDefinition>
}

export interface BateyDefinition {
    routes: Array<BateyRoute>
}

export default function Batey(definition: BateyDefinition) {
    const router: Router = Router({mergeParams: true})
    definition.routes.map((route: BateyRoute) => {
        router[route.method](route.path, route.handler)
        route.routes?.map((bateyDefinition: BateyDefinition) => router.use(route.path, Batey(bateyDefinition)))
    })
    return router
}
