import {RequestHandler, NextFunction, Request, Response} from 'express'

type MethodIndexableHandler = { [method in ZemiMethod]?: ZemiRequestHandler }

interface RouteParams {
    name?: string,
    path: string,
    middleware?: Array<ZemiRequestHandler>
    routes?: Array<ZemiRoute>,
    description?: string,
    openApi?: {
        description?: string,
        responses?: Array<{
            [statusCode: string]: {
                description?: string,
                [prop: string]: any
            }
        }>,
    }
}

export enum ZemiMethod {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete",
    OPTIONS = "options",
}

export interface ZemiRequest extends Request {
    namedRoutes: Record<string, string>
}

export interface ZemiRequestHandler extends RequestHandler {
    (req: ZemiRequest, res: Response, next: NextFunction,): void
}

export type ZemiRoute = MethodIndexableHandler & RouteParams
