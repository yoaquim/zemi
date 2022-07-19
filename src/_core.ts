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
  buildRouteDef,
  paramPathToValidExpressPath,
} from "./_helpers";

/**
 * Recursive. Takes the ZemiRoutes passed in and returns an Express router
 * (either created or specified as the second argument) with each ZemiRoute as
 * an express route under it.
 * @param routes {Array<ZemiRoute>} - An array of ZemiRoutes.
 * @param [router] {Router} - Optional. An Express router to be used for adding ZemiRoutes; router is auto-created if not passed in.
 * @returns {Router} - A router with all ZemiRoutes built into it.
 * @type{(routes: Array<ZemiRoute>, router?: Router)=> Router}
 */
export default function Zemi(
  routes: Array<ZemiRoute>,
  router: Router = Router({ mergeParams: true })
): Router {
  router.use(function (
    request: ZemiRequest,
    response: ZemiResponse,
    next: NextFunction
  ) {
    request.routeDefinitions = buildRouteDefinitions(routes);
    request.allowedResponseHttpCodes = buildResponsesPerNamedRoute(routes);
    next();
  });

  routes.forEach((route: ZemiRoute) => {
    const path: string = paramPathToValidExpressPath(route.path);

    route.middleware &&
      route.middleware.forEach((middleware: RequestHandler) =>
        router.use(middleware)
      );

    const methods = Object.values(ZemiMethod);
    methods.forEach((method: string) => {
      const handlerDefinition: ZemiHandlerDefinition = route[method];
      if (handlerDefinition && handlerDefinition.handler) {
        const routeDef: ZemiRouteDefinition = buildRouteDef(path, route.name);
        router[method](
          path,
          (request: ZemiRequest, response: ZemiResponse, next: NextFunction) =>
            handlerDefinition.handler(request, response, next, routeDef)
        );
      }
    });

    route.routes && router.use(path, Zemi(route.routes));
  });

  return router;
}
