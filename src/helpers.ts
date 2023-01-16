import { NamedRoute, ZemiRoute, ZemiRouteDefinition } from ".";

const buildChildDefs = (
  route: ZemiRoute,
  parent: Record<string, ZemiRouteDefinition>,
  name: string,
  path: string
) => {
  if (route.routes) {
    const toReturn: Record<string, ZemiRouteDefinition> = Object.assign(
      {},
      buildRouteDefinitions(route.routes, { name, path }),
      parent
    );
    return toReturn;
  } else {
    return parent;
  }
};

const buildDef = (route: ZemiRoute, prefix: NamedRoute): Record<string, ZemiRouteDefinition> => {
  if (route.name) {
    const name: string = prefix ? `${prefix.name}-${route.name}` : route.name;
    const path: string = prefix ? `${prefix.path}${route.path}` : route.path;

    const mine: Record<string, ZemiRouteDefinition> = {
      [name]: buildRouteDefinition(name, path),
    };
    return buildChildDefs(route, mine, name, path);
  }
};

/**
 * Builds a route-definition with the name and path specified.
 * Will build an array of strings with the parameters specified in the path, and
 * a reverse function -- which will substitute params in the path for values
 * passed in via an object -- to the route-definition.
 * @param path {string} - The path for this route-definition.
 * @param name {string} - The name for this route-definition.
 * @return {ZemiRouteDefinition} - A route-definition with the name, path, parameters in the path, and reverse function for said path.
 * @type{(path: string, name:string)=> ZemiRouteDefinition}
 */
export function buildRouteDefinition(name: string, path: string): ZemiRouteDefinition {
  const pathArray: Array<string> = path.split("/");
  const parameters: Array<string> = pathArray
    .filter((p) => p.includes(":"))
    .map((p) => p.split(":")[1]);

  // This is the actual reverse function that can be called within handlers
  const reverse = (paramValues: Record<string, string | number>): string => {
    const pathParts = pathArray.map((p: string) => {
      if (p.includes(":")) {
        const key = p.split(":")[1];
        return paramValues[key];
      } else return p;
    });

    return pathParts.join("/");
  };
  return { name, path, parameters, reverse };
}

/**
 * Recursive. Builds a route-definition for each ZemiRoute in the array.
 * Converts zemi paths (path that has params with their types built in)
 * into valid Express paths. Used to add route-definitions to ZemiRequest
 * object.
 * @param routes {Array<ZemiRoute>} - An array of ZemiRoutes.
 * @param [prefix] {NamedRoute} - The prefix to use for this route, if nested, so that its parent's path is added to its path.
 * @returns {Record<string, ZemiRouteDefinition>} - An object where each key is a route name and the value is that routes' route-definition.
 * @type{(routes: Array<ZemiRoute>, prefix?: NamedRoute)=> Record<string, ZemiRouteDefinition>}
 */
export function buildRouteDefinitions(
  routes: Array<ZemiRoute>,
  prefix?: NamedRoute
): Record<string, ZemiRouteDefinition> {
  const namedRoutes = routes.map((route: ZemiRoute) => buildDef(route, prefix));
  return Object.assign({}, ...namedRoutes);
}
