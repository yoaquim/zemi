import {
  ZemiHandlerDefinition,
  ZemiMethod,
  ZemiRoute,
  ZemiRouteDefinition,
} from "./types/core.types";
import { NamedRoute } from "./types/helpers.types";
import { OpenApiParameterObject } from "./types/openapi.types";

/**
 * Recursive. Builds a route-definition for each ZemiRoute in the array.
 * Converts zemi paths (path that has params with their types built in)
 * into valid Express paths. Used to add route-definitions to ZemiRequest
 * object.
 * @param routes {Array<ZemiRoute>} - An array of ZemiRoutes.
 * @param [prefix] {NamedRoute} - Optional. The prefix to use for this route, if nested, so that its parent's path is added to its path.
 * @returns {Record<string, ZemiRouteDefinition>} - An object where each key is a route name and the value is that routes' route-definition.
 * @type{(routes: Array<ZemiRoute>, prefix?: NamedRoute)=> Record<string, ZemiRouteDefinition>}
 */
export function buildRouteDefinitions(
  routes: Array<ZemiRoute>,
  prefix?: NamedRoute
): Record<string, ZemiRouteDefinition> {
  const namedRoutes = routes.map((r: ZemiRoute) => {
    if (r.name) {
      const name: string = prefix ? `${prefix.name}-${r.name}` : r.name;
      const dirtyPath: string = prefix ? `${prefix.path}${r.path}` : r.path;
      const path: string = paramPathToValidExpressPath(dirtyPath);

      const mine: Record<string, ZemiRouteDefinition> = {
        [name]: buildRouteDef(path, name),
      };
      if (r.routes) {
        const toReturn: Record<string, ZemiRouteDefinition> = Object.assign(
          {},
          buildRouteDefinitions(r.routes, { name, path }),
          mine
        );
        return toReturn;
      } else {
        return mine;
      }
    }
  });
  return Object.assign({}, ...namedRoutes);
}

/**
 * Recursive. Builds an object with route names as keys and values are objects mapping
 * HTTP methods to array of response codes for those same methods. Used to add
 * allowedResponseCodes to ZemiRequest object.
 * @param routes {Array<ZemiRoute>} - An array of ZemiRoutes.
 * @param [prefix] {NamedRoute} - Optional. The prefix to use for this route, if nested, so that its parent's path is added to its path.
 * @returns {Record<string, Record<string, Array<string>>>} - An object where each key is a route name and the value is an object whose keys map to an array of allowed response codes, as strings.
 * @type{(routes: Array<ZemiRoute>, prefix?: NamedRoute)=> Record<string, Record<string, Array<string>>>}
 */
export function buildResponsesPerNamedRoute(
  routes: Array<ZemiRoute>,
  prefix?: string
): Record<string, Record<string, Array<string>>> {
  const namedRoutes = routes.map((r: ZemiRoute) => {
    if (r.name) {
      const name: string = prefix ? `${prefix}-${r.name}` : r.name;

      const methods = Object.values(ZemiMethod);
      const responsesPerMethod = methods.map((method: string) => {
        const hd: ZemiHandlerDefinition = r[method];
        if (hd && hd.responses) {
          return { [method]: Object.keys(hd.responses) };
        }
      });

      const mine = { [name]: Object.assign({}, ...responsesPerMethod) };
      if (r.routes) {
        return Object.assign(
          {},
          buildResponsesPerNamedRoute(r.routes, name),
          mine
        );
      } else {
        return mine;
      }
    }
  });
  return Object.assign({}, ...namedRoutes);
}

/**
 * Converts a zemi-style path -- where parameters are specified as
 * `{param|type}` -- to a valid Express path (parameters are defined as
 * `:param`). Used to generate paths for Express routes, from ZemiRoutes.
 * @param path {string} - A path that has parameters specified as `{param|type}`.
 * @return {string} - A valid Express path, that has parameters specified as `:param`.
 * @type{(path: string)=> string}
 */
export function paramPathToValidExpressPath(path: string): string {
  const pathBits: Array<string> = path.split("/").map((p) => {
    if (p[0] === "{" && p[p.length - 1] === "}") {
      const paramKey = p.split("{")[1].split("|")[0];
      return `:${paramKey}`;
    } else {
      return p;
    }
  });
  return pathBits.join("/");
}

/**
 * Converts a zemi-style path -- where parameters are specified as
 * `{param|type}` -- to a valid OpenApi path (parameters are defined as
 * `{param}`). Used to generate paths for OpenApi spec, from ZemiRoutes.
 * @param path {string} - A path that has parameters specified as `{param|type}`.
 * @return {string} - A valid OpenApi path, that has parameters specified as `{param}`.
 * @type{(path: string)=> string}
 */
export function paramPathToOpenApiPath(path: string): string {
  const pathBits: Array<string> = path.split("/").map((p) => {
    if (p[0] === "{" && p[p.length - 1] === "}") {
      const paramKey = p.split("{")[1].split("|")[0];
      return `{${paramKey}}`;
    } else {
      return p;
    }
  });
  return pathBits.join("/");
}

/**
 * Converts a zemi-style path -- where parameters are specified as
 * `{param|type}` -- to an OpenApi ParameterObject.
 * Used when generating ParameterObjects, from ZemiRoutes, for OpenApi spec generation.
 * @param path {string} - A path that has parameters specified as `{param|type}`.
 * @return {Array<OpenApiParameterObject>} - An array of OpenApi ParameterObject.
 * @type{(path: string)=> Array<OpenApiParameterObject>}
 */
export function paramPathToOpenApiParamObject(
  path: string
): Array<OpenApiParameterObject> {
  const paramBits: Array<string> = path
    .split("/")
    .filter((p) => p[0] === "{" && p[p.length - 1] === "}");
  const noBracks: Array<string> = paramBits.map((pb) =>
    pb.substring(1, pb.length - 1)
  );
  const paramsSeparatedList: Array<Array<string>> = noBracks.map((p) =>
    p.split("|")
  );
  return paramsSeparatedList.map(([name, type]: Array<string>) => {
    return {
      name,
      in: "path",
      schema: { type },
      required: true,
    };
  });
}

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
export function buildRouteDef(path: string, name: string): ZemiRouteDefinition {
  const pathArray: Array<string> = path.split("/");
  const parameters: Array<string> = pathArray
    .filter((p) => p.includes(":"))
    .map((p) => p.split(":")[1]);
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
