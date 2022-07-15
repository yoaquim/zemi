import {RequestHandler, NextFunction, Request, Response} from 'express'
import {ZemiOpenApiPathDoc} from './openapi.types'

export type ZemiHandlerDefinition = { handler: ZemiRequestHandler } & ZemiOpenApiPathDoc
type MethodIndexableHandlerDefinition = {
    [method in ZemiMethod]?: ZemiHandlerDefinition
}

interface RouteParams {
    name: string,
    path: string,
    middleware?: Array<ZemiRequestHandler>
    routes?: Array<ZemiRoute>,
    description?: string,
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
    allowedResponseHttpCodes: Record<string, Record<string, Array<string>>>
}

export interface ZemiResponse extends Response {
}

export interface ZemiRequestHandler extends RequestHandler {
    (req: ZemiRequest, res: ZemiResponse, next: NextFunction,): void
}

export type ZemiRoute = MethodIndexableHandlerDefinition & RouteParams
