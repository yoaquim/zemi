import { dirname, join } from "path";
import { promises as fsPromises } from "fs";
import {
  ZemiHandlerDefinition,
  ZemiMethod,
  ZemiOpenApiDocGenerationOptions,
  ZemiRoute,
} from "./types/core.types";
import {
  OpenApiDoc,
  OpenApiOperationObject,
  OpenApiParameterObject,
  OpenApiPathItemObject,
  OpenApiReferenceObject,
} from "./types/openapi.types";
import {
  paramPathToOpenApiParamObject,
  paramPathToOpenApiPath,
} from "./helpers";

/**
 * Generates OpenApi Operation Objects from ZemiRoutes, path-parameters, and
 * definition-parameters passed in. This method folds all parameters at a path
 * level, method level, and parameters generated from the zemi-style path
 * specified in the ZemiRoute, into a single collection. Used to automatically
 * generate each ZemiRoute's method spec for final OpenApi doc.
 * @param route {ZemiRoute} - An ZemiRoute.
 * @param pathParams {Array<OpenApiParameterObject>} - An array of OpenApi Operation objects for a path (for all methods for said path), specified in the ZemiRoute.
 * @param definitionParams {Array<OpenApiParameterObject>} - An array of OpenApi Operation objects for a method, specified in the ZemiRoute.
 * @return {Array<OpenApiOperationObject>} - An array of OpenApi Operation objects generated from the methods of the specified ZemiRoute, the {pathParams} argument, and {definitionParams} argument.
 * @type{(  routes: Array<ZemiRoute>, parentPath: string)=> Array<OpenApiOperationObject>}
 */
function buildMethodDocs(
  route: ZemiRoute,
  pathParams: Array<OpenApiParameterObject>,
  definitionParams: Array<OpenApiParameterObject>
): Array<OpenApiOperationObject> {
  return Object.values(ZemiMethod).map((method: string) => {
    const methodDoc = {};
    const hd: ZemiHandlerDefinition = route[method];
    if (hd) {
      const methodParams: Array<
        OpenApiReferenceObject | OpenApiParameterObject
      > = hd.parameters || [];
      const parameters: Array<OpenApiReferenceObject | OpenApiParameterObject> =
        [...pathParams, ...definitionParams, ...methodParams];
      const {
        description,
        summary,
        responses,
        operationId,
        requestBody,
        tags,
        security,
      } = hd;
      methodDoc[method] = {
        parameters,
        description,
        summary,
        responses,
        operationId,
        requestBody,
        tags,
        security,
      };
      return methodDoc;
    }
  });
}

/**
 * Generates OpenApi PathItem Objects from ZemiRoutes passed in.
 * Used to automatically generate each ZemiRoute's path spec for final OpenApi
 * doc.
 * @param routes {Array<ZemiRoute>} - An array of ZemiRoutes.
 * @param [parentPath] {string} - The parent's path to use for this route, if nested, so that it is added to this path.
 * @return {Array<OpenApiPathItemObject>} - An array of OpenApi PathItemObject generated from specified ZemiRoutes.
 * @type{(  routes: Array<ZemiRoute>, parentPath: string)=> Array<OpenApiPathItemObject>}
 */
function buildPathDocs(
  routes: Array<ZemiRoute>,
  parentPath?: string
): Array<OpenApiPathItemObject> {
  return routes.flatMap((route: ZemiRoute) => {
    const path: string = route.path;
    const paramPath: string = parentPath ? `${parentPath}${path}` : path;

    const pathParams: Array<OpenApiParameterObject> =
      paramPathToOpenApiParamObject(paramPath);
    const definitionParams: Array<OpenApiParameterObject> =
      route.parameters || [];
    const methods: Array<OpenApiOperationObject> = buildMethodDocs(
      route,
      pathParams,
      definitionParams
    );

    const mine: Array<OpenApiOperationObject> = [
      { [paramPathToOpenApiPath(paramPath)]: Object.assign({}, ...methods) },
    ];

    if (route.routes) {
      const childRoutesList: Array<OpenApiPathItemObject> = buildPathDocs(
        route.routes,
        path
      );
      return [...mine, ...childRoutesList];
    } else {
      return mine;
    }
  });
}

/**
 * Asynchronously write data to a file.
 * @param writeFile {(path: string, data: any, options: object) => void} - A function that will write data to a file; really just a way to pass in fs.promises.writeFile.
 * @param path {string} - The path to write to.
 * @param data {any} - Any data that we want to write to a file.
 * @return {Promise<void>}
 * @type {(
 *   writeFile: (path: string, data: any, options: object) => void,
 *   path: string,
 *   data: any
 * )=> Promise<void>}
 */
export async function asyncWriteFile(
  writeFile: (path: string, data: any, options: object) => void,
  path: string,
  data: any
): Promise<void> {
  try {
    await writeFile(path, data, { flag: "w" });
  } catch (err) {
    console.log(`-- Something went wrong when trying to write ${path}:`);
    console.log(err);
  }
}

/**
 * Generate an OpenApi JSON file that has the passed-in spec and ZemiRoutes
 * defined in it. If correctly specified, this should generate an OpenAPI
 * compliant spec. This method should write to the current dir, but can be
 * overridden via {options}; it will also return and log the generated JSON.
 *
 * Note that this is **not** an OpenApi validator.
 * @param doc {OpenApiDoc} - An OpenApi spec as an {OpenApiDoc} to be used when generating the OpenApi JSON.
 * @param routes {Array<ZemiRoute>} - An array of ZemiRoutes.
 * @param [options] {ZemiOpenApiDocGenerationOptions} - Options to use when generating the OpenApi doc.
 * @return {OpenApiDoc} - The OpenApi JSON generated from the passed in OpenApi doc and ZemiRoutes.
 * @type{(doc: OpenApiDoc, routes:Array<ZemiRoute>, options: ZemiOpenApiDocGenerationOptions)=> Promise<OpenApiDoc>}
 */
export default async function ZemiOpenApiDocGenerator({
  doc,
  routes,
  options,
}: {
  doc: OpenApiDoc;
  routes: Array<ZemiRoute>;
  options?: ZemiOpenApiDocGenerationOptions;
}): Promise<OpenApiDoc> {
  const whereToWrite =
    options && options.path
      ? options.path
      : join(dirname(require.main.filename), "openapi.json");
  const pathDocs: Array<Record<string, any>> = buildPathDocs(routes);
  const paths = Object.assign({}, ...pathDocs);
  const document = Object.assign({}, doc, { paths });

  console.log("\n====================");
  console.log("OpenAPI spec:");
  console.log("====================\n");
  console.log(JSON.stringify(document));
  console.log("\n--\n");

  await asyncWriteFile(
    fsPromises.writeFile,
    whereToWrite,
    JSON.stringify(document)
  ).then(() =>
    console.log(`Finished writing OpenAPI spec to ${whereToWrite}.\n`)
  );
  return document;
}
