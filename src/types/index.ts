import { NextFunction, Request, Response, RequestHandler } from "express";

//------------------------------
// HELPER
//------------------------------
export interface NamedRoute {
  name: string;
  path: string;
}

//------------------------------
// CORE
//------------------------------
export interface ZemiRouteDefinition {
  name: string;
  path: string;
  parameters: Array<string>;
  reverse: (parameterValues: object) => string;
}

export interface ZemiResponse extends Response {}

export interface ZemiRequest extends Request {
  routeDefinitions: Record<string, ZemiRouteDefinition>;
}

export type ZemiRequestHandler = (
  request: ZemiRequest,
  response: ZemiResponse,
  next: NextFunction,
  routeDef: ZemiRouteDefinition
) => void;

export enum ZemiMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
  OPTIONS = "options",
}

interface ZemiRouteOptions {
  name: string;
  path: string;
  middleware?: Array<RequestHandler>;
  routes?: Array<ZemiRoute>;
}

type ZemiMethodIndexableHandlerDefinition = {
  [method in ZemiMethod]?: ZemiRequestHandler;
};

export type ZemiRoute = ZemiMethodIndexableHandlerDefinition & ZemiRouteOptions;
