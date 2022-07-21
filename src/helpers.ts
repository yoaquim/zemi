import {
  ZemiHandlerDefinition,
  ZemiMethod,
  ZemiRoute,
  ZemiRouteDefinition,
} from "./types/core.types";
import { NamedRoute } from "./types/helpers.types";
import { OpenApiParameterObject } from "./types/openapi.types";

type ResponsesPerRoute = Record<string, Array<string>>;

const wrappedInBrackets = (p: string): boolean => p[0] === "{" && p[p.length - 1] === "}";

const getParamKey = (p: string): string => p.split("{")[1].split("|")[0];

const wrapParameterByFramework = (p: string, framework: "express" | "openapi"): string => {
  if (wrappedInBrackets(p)) {
    if (framework === "express") return `:${getParamKey(p)}`;
    else if (framework === "openapi") return `{${getParamKey(p)}}`;
  } else {
    return p;
  }
};

const buildResponsesPerMethod = (route: ZemiRoute): Array<Record<string, Array<string>>> => {
  const methods = Object.values(ZemiMethod);
  return methods.map((method: string) => {
    const hd: ZemiHandlerDefinition = route[method];
    if (hd && hd.responses) {
      return { [method]: Object.keys(hd.responses) };
    }
  });
};

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
    const dirtyPath: string = prefix ? `${prefix.path}${route.path}` : route.path;
    const path: string = parsePathByFramework(dirtyPath, "express");

    const mine: Record<string, ZemiRouteDefinition> = {
      [name]: buildRouteDefinition(path, name),
    };
    return buildChildDefs(route, mine, name, path);
  }
};

const buildChildNamedRoutes = (
  route: ZemiRoute,
  parent: Record<string, ResponsesPerRoute>,
  name: string
): Record<string, ResponsesPerRoute> => {
  if (route.routes) {
    return Object.assign({}, buildResponsesPerNamedRoute(route.routes, name), parent);
  } else {
    return parent;
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
export function buildRouteDefinition(path: string, name: string): ZemiRouteDefinition {
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

/**
 * Recursive. Builds an object with route names as keys and values are objects mapping
 * HTTP methods to array of response codes for those same methods. Used to add
 * allowedResponseCodes to ZemiRequest object.
 * @param routes {Array<ZemiRoute>} - An array of ZemiRoutes.
 * @param [prefix] {NamedRoute} - The prefix to use for this route, if nested, so that its parent's path is added to its path.
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
      const responsesPerMethod: Array<Record<string, Array<string>>> = buildResponsesPerMethod(r);
      const mine: Record<string, ResponsesPerRoute> = {
        [name]: Object.assign({}, ...responsesPerMethod),
      };
      return buildChildNamedRoutes(r, mine, name);
    }
  });
  return Object.assign({}, ...namedRoutes);
}

/**
 * Converts a zemi-style path -- where parameters are specified as
 * `{param|type}` -- to a valid ExpressJS (parameters prefixed by ':') or
 * OpenApi path (parameters wrapped as `{param}`).
 * @param path {string} - A path that has parameters specified as `{param|type}`.
 * @param framework {"express" | "openapi"} - How and for what to parse this param: ExpressJS format or OpenApi format
 * @return {string} - A valid path for the specified framework, that has parameters wrapped accordingly.
 * @type{(path: string)=> string}
 */
export function parsePathByFramework(path: string, framework: "express" | "openapi"): string {
  const pathBits: Array<string> = path
    .split("/")
    .map((p) => wrapParameterByFramework(p, framework));
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
export function paramPathToOpenApiParamObject(path: string): Array<OpenApiParameterObject> {
  const paramBits: Array<string> = path
    .split("/")
    .filter((p) => p[0] === "{" && p[p.length - 1] === "}");
  const noBracks: Array<string> = paramBits.map((pb) => pb.substring(1, pb.length - 1));
  const paramsSeparatedList: Array<Array<string>> = noBracks.map((p) => p.split("|"));
  return paramsSeparatedList.map(([name, type]: Array<string>) => {
    return {
      name,
      in: "path",
      schema: { type },
      required: true,
    };
  });
}
