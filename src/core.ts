import { NextFunction, RequestHandler, Router } from "express";
import {
  ZemiMethod,
  ZemiRequest,
  ZemiRequestHandler,
  ZemiResponse,
  ZemiRoute,
  ZemiRouteDefinition,
} from ".";
import { buildRouteDefinitions } from "./helpers";

function Zemi(
  routes: Array<ZemiRoute>,
  router: Router = Router({ mergeParams: true }),
  __routeDefinitions: Record<string, ZemiRouteDefinition> = buildRouteDefinitions(routes),
  __parentPath?: string
): Router {
  // Attach Route Definitions to Request Object
  router.use((request: ZemiRequest, response: ZemiResponse, next: NextFunction) => {
    request.routeDefinitions = __routeDefinitions;
    next();
  });

  // For each route...
  routes.forEach((route: ZemiRoute) => {
    // Build a path depending on if route has parent or not
    const path: string = route.path;
    const fullPath = __parentPath ? `${__parentPath}${path}` : path;

    // Add middleware specified for route
    route.middleware &&
      route.middleware.forEach((middleware: RequestHandler) =>
        router.use((request: ZemiRequest, response: ZemiResponse, next: NextFunction) =>
          middleware(request, response, next)
        )
      );

    // For each child route, call Zemi on it, so it can recursively build that route
    // and all it's children. This NEEDS to happen before the current route gets defined,
    // since child routes are more specific.
    route.routes && router.use(path, Zemi(route.routes, router, __routeDefinitions, fullPath));

    // For each Zemi HTTP method...
    const methods = Object.values(ZemiMethod);
    methods.forEach((method: string) => {
      const handler: ZemiRequestHandler = route[method];
      if (handler) {
        // If there's a handler defined for the method, find the route definition...
        const routeDef: ZemiRouteDefinition = Object.keys(__routeDefinitions)
          .map((rdk: string) => __routeDefinitions[rdk])
          .filter((rd: ZemiRouteDefinition) => rd.path === fullPath)[0];
        // and create a route in ExpressJS
        router[method](path, (request: ZemiRequest, response: ZemiResponse, next: NextFunction) =>
          handler(request, response, next, routeDef)
        );
      }
    });
  });

  return router;
}

export default Zemi;
