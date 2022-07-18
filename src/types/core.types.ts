import { RequestHandler, NextFunction, Request, Response } from "express";
import {
  OpenApiOperationObject,
  OpenApiParameterObject,
  OpenApiPathItemDefinitionObject,
} from "./openapi.types";

type ZemiMethodIndexableHandlerDefinition = {
  [method in ZemiMethod]?: ZemiHandlerDefinition;
};

type ZemiRouteOptions = OpenApiPathItemDefinitionObject & {
  name: string;
  path: string;
  middleware?: Array<RequestHandler>;
  routes?: Array<ZemiRoute>;
  parameters?: Array<OpenApiParameterObject>;
};

export enum ZemiMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
  OPTIONS = "options",
}

export interface ZemiRequest extends Request {
  routeDefinitions: Record<string, ZemiRouteDefinition>;
  allowedResponseHttpCodes: Record<string, Record<string, Array<string>>>;
}

export interface ZemiResponse extends Response {}

export interface ZemiRouteDefinition {
  name: string;
  path: string;
  parameters: Array<string>;
  reverse: (parameterValues: object) => string;
}

export type ZemiRequestHandler = (
  request: ZemiRequest,
  response: ZemiResponse,
  next: NextFunction,
  routeDef: ZemiRouteDefinition
) => void;

export type ZemiHandlerDefinition = {
  handler: ZemiRequestHandler;
} & OpenApiOperationObject;

export type ZemiRoute = ZemiMethodIndexableHandlerDefinition & ZemiRouteOptions;

export interface ZemiOpenApiDocGenerationOptions {
  path: string;
}
