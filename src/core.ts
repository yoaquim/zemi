import { NextFunction, RequestHandler, Router } from "express";
import {
  ZemiRequest,
  ZemiMethod,
  ZemiRoute,
  ZemiResponse,
  ZemiHandlerDefinition,
  ZemiRouteDefinition,
} from "./types/core.types";
import {
  buildRouteDefinitions,
  buildResponsesPerNamedRoute,
  parsePathByFramework,
} from "./helpers";

/**
 * Recursive. Takes the ZemiRoutes passed in and returns an Express router
 * (either created or specified as the second argument) with each ZemiRoute as
 * an express route under it.
 * @param routes {Array<ZemiRoute>} - An array of ZemiRoutes.
 * @param [router] {Router} - An Express router to be used for adding ZemiRoutes; router is auto-created if not passed in.
 * @param [__routeDefinitions] {Record<string, ZemiRouteDefinition>} - The route definitions for this zemi function. Initialized if not passed-in.
 * @param [__parentPath] {string} - Path of parent, use to identify current path definition.
 * @returns {Router} - A router with all ZemiRoutes built into it.
 * @type{(routes: Array<ZemiRoute>, router: Router)=> Router}
 */
export default function Zemi(
  routes: Array<ZemiRoute>,
  router: Router = Router({ mergeParams: true }),
  __routeDefinitions: Record<string, ZemiRouteDefinition> = buildRouteDefinitions(routes),
  __parentPath?: string
): Router {
  const allowedResponseHttpCodes = buildResponsesPerNamedRoute(routes);
  router.use(function (request: ZemiRequest, response: ZemiResponse, next: NextFunction) {
    request.routeDefinitions = __routeDefinitions;
    request.allowedResponseHttpCodes = allowedResponseHttpCodes;
    next();
  });

  routes.forEach((route: ZemiRoute) => {
    const path: string = parsePathByFramework(route.path, "express");
    const fullPath = __parentPath ? `${__parentPath}${path}` : path;

    route.middleware &&
      route.middleware.forEach((middleware: RequestHandler) =>
        router.use((request: ZemiRequest, response: ZemiResponse, next: NextFunction) =>
          middleware(request, response, next)
        )
      );

    const methods = Object.values(ZemiMethod);
    methods.forEach((method: string) => {
      const handlerDefinition: ZemiHandlerDefinition = route[method];
      if (handlerDefinition && handlerDefinition.handler) {
        // const routeDef: ZemiRouteDefinition = buildRouteDefinition(
        //   path,
        //   route.name
        // );
        const routeDef: ZemiRouteDefinition = Object.keys(__routeDefinitions)
          .map((rdk: string) => __routeDefinitions[rdk])
          .filter((rd: ZemiRouteDefinition) => rd.path === fullPath)[0];

        router[method](path, (request: ZemiRequest, response: ZemiResponse, next: NextFunction) =>
          handlerDefinition.handler(request, response, next, routeDef)
        );
      }
    });

    route.routes && router.use(path, Zemi(route.routes, router, __routeDefinitions, fullPath));
  });

  return router;
}
