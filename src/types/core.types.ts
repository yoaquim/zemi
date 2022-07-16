import {RequestHandler, NextFunction, Request, Response} from 'express'
import {ZemiOpenApiPathDoc} from './openapi.types'

export type ZemiHandlerDefinition = { handler: ZemiRequestHandler } & ZemiOpenApiPathDoc
type MethodIndexableHandlerDefinition = {
    [method in ZemiMethod]?: ZemiHandlerDefinition
}

interface RouteParams {
    name: string,
    path: string,
    middleware?: Array<RequestHandler>
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
    routeDefinitions: Record<string, ZemiRouteDefinition>
    allowedResponseHttpCodes: Record<string, Record<string, Array<string>>>
}

export interface ZemiResponse extends Response {
}

export interface ZemiRouteDefinition {
    name: string
    path: string
    parameters: Array<string>
    reverse: (parameterValues: object) => string
}

export type ZemiRequestHandler = (request: ZemiRequest, response: ZemiResponse, next: NextFunction, routeDef: ZemiRouteDefinition) => void

export type ZemiRoute = MethodIndexableHandlerDefinition & RouteParams
