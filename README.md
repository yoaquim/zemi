# zemi

[![Github Build](https://github.com/yoaquim/zemi/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/yoaquim/zemi/actions/workflows/ci.yml)
[![Code Climate Coverage](https://codeclimate.com/github/yoaquim/zemi/badges/coverage.svg)](https://codeclimate.com/github/yoaquim/zemi/coverage)
[![Code Climate Maintainability](https://codeclimate.com/github/yoaquim/zemi/badges/gpa.svg)](https://codeclimate.com/github/yoaquim/zemi)
[![Snyk.io Vulnerabilities](https://snyk.io/test/github/yoaquim/zemi/badge.svg?targetFile=package.json)](https://snyk.io/test/github/yoaquim/zemi?targetFile=package.json)

[![npm Version](https://img.shields.io/npm/v/zemi?color=137dc2&logo=npm)](https://www.npmjs.com/package/zemi)
[![Types](https://badgen.net/npm/types/zemi)](https://github.com/yoaquim/zemi/tree/main/src/types)
[![Dependencies](https://badgen.net/bundlephobia/dependency-count/zemi)](https://github.com/yoaquim/zemi/blob/main/package.json#L20-L23)
[![Install Size](https://packagephobia.com/badge?p=zemi)](https://packagephobia.com/result?p=zemi)
[![License](https://badgen.net/npm/license/zemi)](https://github.com/yoaquim/zemi/blob/main/LICENSE.md)

<br>

:warning: **Zemi is in an <u>EXPERIMENTAL STATE</u>** :warning:

zemi is a [data-driven](#data-driven) routing library for [Express](https://expressjs.com/), built with Typescript.

Features:
- optional, [out-of-the-box support](#openapi) for [OpenAPI](https://www.openapis.org/)
- [reverse-routing](#reverse-routing)
- [path-parameter inheritance](#parameter-inheritance) (aka `mergeParams:true`)
- route-level [middleware support](#middleware)

<br>

# Table of Contents

1. [Routing](#routing)
    1. [Data-driven](#data-driven)
    2. [Reverse-routing](#reverse-routing)
    3. [Middleware](#middleware)
    4. [Parameter Inheritance](#parameter-inheritance)
2. [OpenApi](#openapi)
    1. [Defining Route Parameters](#defining-route-parameters)
    2. [Generating an OpenApi JSON spec](#generating-an-openapi-json-spec)
    3. [Leveraging All OpenApi Features](#leveraging-all-openapi-features)
    4. [Why is this better than directly defining an OpenApi JSON spec?](#why-is-this-better-than-directly-defining-an-openapi-json-spec)
3. [Types](#types)
    1. [ZemiMethod](#zemimethod)
    2. [ZemiHandlerDefinition](#zemihandlerdefinition)
    3. [ZemiRequestHandler](#zemirequesthandler)
    4. [ZemiRequest](#zemirequest)
    5. [ZemiResponse](#zemiresponse)
    6. [ZemiRouteDefinition](#zemiroutedefinition)
    7. [ZemiRoute](#zemiroute)
    8. [ZemiOpenApiSpecGenerator](#zemiopenapispecgenerator)
    9. [ZemiOpenApiSpecGenerationOptions](#zemiopenapispecgenerationoptions)
4. [Examples](#examples)
   1. [Simple](https://github.com/yoaquim/zemi/blob/main/examples/simple.ts)
   2. [With Middleware](https://github.com/yoaquim/zemi/blob/main/examples/with-middleware.ts)
   3. [Using Reverse Routing](https://github.com/yoaquim/zemi/blob/main/examples/using-reverse-routing.ts)
   4. [With Param Inheritance from Parent Routes](https://github.com/yoaquim/zemi/blob/main/examples/nested-route-param-inheritance.ts)
   5. [Using `{paramName|paramType}`-style Parameters in Path](https://github.com/yoaquim/zemi/blob/main/examples/using-openapi-embedded-param-paths.ts)
   6. [Using More OpenApi features](https://github.com/yoaquim/zemi/blob/main/examples/leveraging-open-api.ts)
5. [Limitations](#limitations)

<br>

## Routing

### Data-driven

Assume you have the following functions defined: `petsHandler`, `dogBreedHandler`, `dogBreedsIdHandler`, `catsByIdHandler` ; e.g.:

```ts
const petsHandler = (request: ZemiRequest, response: ZemiResponse) => {
  // do something with this request and respond
  response.status(200).json({ pets: ["dogs", "cats", "rabbits"] });
};
```

Then the following code:

```ts
import express from "express";
import zemi, { ZemiRoute, ZemiMethod } from "zemi";

const { GET } = ZemiMethod

const routes: Array<ZemiRoute> = [
  {
    name: "pets",
    path: "/pets",
    [GET]: { handler: petsHandler },
    routes: [
      {
        name: "dogBreeds",
        path: "/dogs/:breed",
        [GET]: { handler: dogBreedHandler },
        routes: [
          {
            name: "dogsByBreedById",
            path: "/:id",
            [GET]: { handler: dogBreedsIdHandler },
          },
        ],
      },
      {
        name: "catsById",
        path: "/cats/:id",
        [GET]: { handler: catsByIdHandler },
      },
    ],
  },
];

const app = express();
app.use(express.json());
app.use("/", zemi(routes));
app.listen(3000);
```

Generates an API like:

| routes                  | response                                            |
|-------------------------|-----------------------------------------------------|
| `/pets`                 | `{pets: ['dogs', 'cats', 'rabbits']}`               |
| `/pets/dogs`            | `Cannot GET /pets/dogs/` (since it was not defined) |
| `/pets/dogs/labrador`   | `{"result":["Fred","Barney","Wilma"]}`              |
| `/pets/dogs/labrador/1` | `{"result":"Barney"}`                               |
| `/pets/cats`            | `Cannot GET /pets/cats/` (since it was not defined) |
| `/pets/cats/2`          | `{"result":"Daphne"}`                               |

<br>

### Reverse-routing

zemi builds route-definitions for all routes and adds them to the [`ZemiRequest`](#zemirequest) passed to the handler function.

All route-definitions are named (index-accessible) and follow the same naming convention: `[ancestor route names]-[parent route name]-[route name]`, e.g. `basePath-greatGrandparent-grandparent-parent-myRoute`, `pets-dogsBreeds-dogsByBreedById`.

Each route-definition contains the name, path, and path-parameters (if present) of the route.
It also contains a reverse function which — when invoked with an object mapping path-parameters to values — will return the interpolated path with values.

E.g. the handler:

```ts
import { ZemiRequest, ZemiResponse, ZemiRouteDefinition } from "zemi";

const petsHandler = (request: ZemiRequest, response: ZemiResponse) => {
  const routeDefinitions: Record<string, ZemiRouteDefinition> = request.routeDefinitions;
  const { path, name, parameters, reverse } = routeDefinitions["pets-dogBreeds-dogsByBreedById"];
  response.status(200).json({ path, name, parameters, reverse: reverse({ breed: 'Corgi', id: '99' }) });
};
```

Returns:

```json
  {
  "path": "/pets/dogs/:breed/:id",
  "name": "pets-dogBreeds-dogsByBreedById",
  "parameters": [
    "breed",
    "id"
  ],
  "reverse": "/pets/dogs/corgi/99"
}
```

This allows you to generate links, redirect, and change path values without having to hardcode strings and change them later.

<br>

### Middleware

zemi lets you define middleware functions at the route level:

Retaking and tweaking our example from the beginning:

```ts
import { ZemiRequest, ZemiResponse } from "zemi";
import { NextFunction } from "express";

const routes: Array<ZemiRoute> = [
  {
    name: "pets",
    path: "/pets",
    [GET]: { handler: petsHandler },
    routes: [
      {
        name: "dogBreeds",
        path: "/dogs/:breed",
        [GET]: { handler: dogBreedHandler },
        middleware: [
          function logRouteDefs(request: ZemiRequest, response: ZemiResponse, next: NextFunction) {
            console.log(JSON.stringify(request.routeDefinitions));
            next();
          }
        ],
        routes: [
          {
            name: "dogsByBreedById",
            path: "/:id",
            [GET]: { handler: dogBreedsIdHandler },
          },
        ],
      },
      {
        name: "catsById",
        path: "/cats/:id",
        [GET]: { handler: catsByIdHandler },
      },
    ],
  },
];
```

The middleware function `logRouteDefs` defined at the `dogBreeds` level will be applied to all the methods at that level and all nested routes — which means our `dogsByBreedById` route will gain that functionality also.

<br>

### Parameter Inheritance

As show in previous examples, parameters defined at parent routes are passed and available to nested routes.

E.g. in this purposefully convoluted example:

```ts
const routes: Array<ZemiRoute> = [
  {
    name: "pets",
    path: "/pets",
    [GET]: { handler: petsHandler },
    routes: [
      {
        name: "dogBreeds",
        path: "/dogs/:breed",
        [GET]: { handler: dogBreedHandler },
        routes: [
          {
            name: "dogsByBreedById",
            path: "/:id",
            [GET]: { handler: dogBreedsIdHandler },
            routes: [
              {
                name: "dogsByBreedByIdDetailsSection",
                path: "/details/:section",
                [GET]: { handler: dogBreedsIdDetailsSectionHandler },
                routes: [
                  {
                    name: "newDogsByBreedByIdDetailsSection",
                    path: "/new",
                    [POST]: { handler: newDogsByBreedByIdDetailsSectionHandler },
                  }
                ]
              },
            ]
          },
        ],
      }
    ],
  },
];
```

The `newDogsByBreedByIdDetailsSection` route (path: `/pets/dogs/:breed/:id/details/:section/new`) will have `breed`, `id`, and `section` available as request parameters in the ZemiRequest object.

<br>

## OpenApi

zemi supports [OpenAPI](https://www.openapis.org/) out-of-the-box — but it's completely optional.

It has extensive [Typescript support for OpenApi](https://github.com/yoaquim/zemi/blob/main/src/types/openapi.types.ts).

You can forgo it entirely, use every supported feature, or just the bare-minimum as needed.

It comes with a OpenApi spec generator — [`ZemiOpenApiSpecGenerator`](#zemiopenapispecgenerator) — which will create and save an `openapi.json` specification of your API.

<br>

### Defining Route Parameters

You can pass a `parameters` array to each [`ZemiMethod`](#zemimethod) definition, where each parameter is a [`OpenApiParameterObject`][1].

Each [`OpenApiParameterObject`][1] requires the following properties:

```
{
  name: string
  in: "query"|"header"|"path"|"cookie"
  required: boolean
  schema: {
    type: string
  }
}
```

So a route with a `GET` that has the following `parameters` array:

```ts
const routes: Array<ZemiRoute> = [
  {
    name: "pets",
    path: "/pets",
    [GET]: { handler: petsHandler },
    routes: [
      {
        name: "dogBreeds",
        path: "/dogs/:breed",
        [GET]: { handler: dogBreedHandler },
        parameters: [
          {
            name: 'breed',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ],
      },
    ]
  }
];
```

will correctly have the `breed` parameter detailed in the OpenApi spec.

Alternatively, and at the expense of full features, you can specify a shorthand for `path` parameters without specifying the `parameters` array:

```ts
const routes: Array<ZemiRoute> = [
  {
    name: "pets",
    path: "/pets",
    [GET]: { handler: petsHandler },
    routes: [
      {
        name: "dogBreeds",
        path: "/dogs/{breed|string}",
        [GET]: { handler: dogBreedHandler },
      }
    ]
  }
];
```

This notation — where each parameter is captured between curly braces (`{}`) — has the name and schema type of the parameter, delimited by a pipe (`|`).

This will:

- still generate a valid Express path (where path parameters are prefixed with `:`) for actual routes
- generate a valid OpenApi path for that route
- extract the name (anything _before_ `|`) and the schema type (anything _after_ `|`) for use in the OpenApi parameter definition

<br>

### Generating an OpenApi JSON spec

Assume you have [`ZemiRoute`](#zemiroute)s defined at `src/routes/index.ts`.

Create a file at the root (project) level named `zemi-openapi-spec-gen.ts`:

```ts
import { OpenApiDoc, ZemiOpenApiSpecGenerator } from "zemi";
import routes from "./src/routes";

const doc: OpenApiDoc = {
  openapi: "3.0.0",
  info: {
    description: "API for pet store management",
    version: "1.0",
    title: "Pet Store API"
  },
  servers: [{ url: "https://api.bestpetstore.com/v1" }],
};

ZemiOpenApiSpecGenerator({ doc, routes });

// -- With options:
// const options = { path: '/path/to/save/openapijson/to' }
// ZemiOpenApiSpecGenerator({ doc, routes, options});
```

That's the minimum config you need to generate an OpenApi spec.

You can then use [`ts-node`](https://www.npmjs.com/package/ts-node) to run it:

```shell
npx ts-node zemi-openapi-spec-gen.ts
```

This will generate an `openapi.json` at that same dir level.

Note that you can pass an optional `options` object specifying the `path` you want to save the spec to.

<br>

### Leveraging All OpenApi Features

zemi breaks down OpenApi into two parts:

1. The general doc passed into the [`ZemiOpenApiSpecGenerator`](#zemiopenapispecgenerator)


2. Documentation generated from [`ZemiRoute`](#zemiroute)s

The [general doc][3] can be used to specify every valid object and definition supported by OpenApi, _except_ paths.

Paths are specified via [`ZemiRoute`](#zemiroute)s (although some general doc specifications might impact them): each _route_ supports properties specified in [OpenApiPathItemDefinitionObject][2] , and each _method_ supports properties defined in [OpenApiOperationObject][4].

Combining both of these approaches, you can build a complete OpenApi spec.

<br>

### Why is this better than directly defining an OpenApi JSON spec?

1. It's code: types, auto-completion, and all the benefits you get with code on a modern IDE.


2. Self documentation: as you're writing your API, you document it, which makes it easier to keep the spec up-to-date.


3. Path generation: path and method definitions are, at the least, partly generated; more so if you want a straightforward, simple spec.

<br>

## Types

### `ZemiMethod`

*Enum*

The HTTP methods supported by [`ZemiRoute`](#zemiroute).

| Member    | Value     |
|-----------|-----------|
| `GET`     | `get`     |
| `POST`    | `post`    |
| `PUT`     | `put`     |
| `DELETE`  | `delete`  |
| `OPTIONS` | `options` |

<br>

### `ZemiHandlerDefinition`

*extends [`OpenApiOperationObject`][4]*

The object that maps to a [`ZemiMethod`](#zemimethod); where the core of functionality resides.
This object is a wrapper for [`OpenApiOperationObject`][4] (for OpenApi spec generation purposes), but adds
the key function [`handler: ZemiRequestHandler`](#zemirequesthandler), which is where the logic for the route's method lives.

```
{
  handler: ZemiRequestHandler
  
  // inherited from OpenApiOperationObject
  
  tags?: Array<string>;
  summary?: string;
  description?: string;
  externalDocs?: OpenApiExternalDocumentationObject;
  operationId?: string;
  parameters?: Array<OpenApiReferenceObject | OpenApiParameterObject>;
  requestBody?: OpenApiReferenceObject | OpenApiRequestBodyObject;
  responses?: Record<string, OpenApiResponseObject>;
  callbacks?: Record<string, OpenApiReferenceObject | OpenApiCallbackObject>;
  deprecated?: boolean | false;
  security?: Array<OpenApiSecurityRequirementObject>;
  servers?: Array<OpenApiServerObject>;
}
```

<br>

### `ZemiRequestHandler`

How to handle incoming requests for this route method; basically `express.RequestHandler`, but gets passed its own request and response versions, plus adds that routes [`ZemiRouteDefinition`](#zemiroutedefinition) as an optional fourth param.

```ts
(
  request: ZemiRequest,
  response: ZemiResponse,
  next: express.NextFunction,
  routeDef: ZemiRouteDefinition
) => void
```

<br>

### `ZemiRequest`

*extends `express.Request`*

A wrapper for `express.Request`; adds `routeDefinitions` and `allowedResponseHttpCodes` to it.

`allowedResponseHttpCodes` is generated from  [`OpenApiOperationObject.responses`][5], if provided to the [`ZemiRoute`](#zemiroute).

```ts
{
  routeDefinitions: Record<string, ZemiRouteDefinition>;
  allowedResponseHttpCodes: Record<string, Record<string, Array<string>>>;

  // all other members from express.Request
}

```

<br>

### `ZemiResponse`

*extends `express.Response`*

Just a wrapper for future-proofing; same as `express.Response`.

<br>

### `ZemiRouteDefinition`

Route definition for a given [`ZemiRoute`](#zemiroute).
Contains the name, path, and path-parameters (if present) of the route it's defining.
Also provides a `reverse` function that, when invoked with an object that has parameter-values, will return the resolved path.

```ts
{
  name: string;
  path: string;
  parameters: Array<string>;
  reverse: (parameterValues: object) => string;
}
```

<br>

### `ZemiRoute`

*extends [`OpenApiPathItemDefinitionObject`][2]*

Overrides [`OpenApiPathItemDefinitionObject`][2]'s `parameters` property, so that it only accepts an array of [`OpenApiParameterObject`][1] and not [`OpenApiReferenceObject`][6].
This inheritance exists to support OpenApi spec generation, but most of the functional aspects are provided by the native properties of this object.

It must be provided a `name: string` and `path: string`; a [`ZemiMethod`](#zemimethod):[`ZemiHandlerDefinition`](#zemihandlerdefinition) needs to be provided if that path should have functionality, but doesn't need to be if the path is just present as a path-prefix for nested routes.

```
{
   [ZemiMethod]: ZemiHandlerDefinition;
   name: string;
   path: string;
   middleware?: Array<RequestHandler>;
   routes?: Array<ZemiRoute>;
   parameters?: Array<OpenApiParameterObject>;
}
```

<br>

### `ZemiOpenApiSpecGenerator`

Takes an [`OpenApiDoc`][3] object and an array of [`ZemiRoute`](#zemiroute)s to generate an `opeanapi.json` spec.

Accepts an optional [`ZemiOpenApiDocGenerationOptions`](#zemiopenapispecgenerationoptions).

```ts
(
  doc: OpenApiDoc,
  routes: Array<ZemiRoute>,
  options?: ZemiOpenApiDocGenerationOptions
) => void
```

<br>

### `ZemiOpenApiSpecGenerationOptions`

Lets you provide a `path: string` value that specifies the location of where to save the `openapi.json` spec.

```ts
{
  path: string
}
```

<br>

## Examples

Examples are available in the [examples](https://github.com/yoaquim/zemi/blob/main/examples) dir:

1. [Simple](https://github.com/yoaquim/zemi/blob/main/examples/simple.ts)


2. [With Middleware](https://github.com/yoaquim/zemi/blob/main/examples/with-middleware.ts)


3. [Using Reverse Routing](https://github.com/yoaquim/zemi/blob/main/examples/using-reverse-routing.ts)


4. [With Param Inheritance from Parent Routes](https://github.com/yoaquim/zemi/blob/main/examples/nested-route-param-inheritance.ts)


5. [Using `{paramName|paramType}`-style Parameters in Path](https://github.com/yoaquim/zemi/blob/main/examples/using-openapi-embedded-param-paths.ts)


6. [Using More OpenApi features](https://github.com/yoaquim/zemi/blob/main/examples/leveraging-open-api.ts)

<br>

## Limitations

zemi is a recursive library: it uses recursion across a number of operations in order to facilitate a low footprint and straightforward, declarative definitions.

Recursive operations can break the call-stack by going over its limit, generating `Maximum call stack size exceeded` errors. This means that the recursive function was called too many times, and exceeded the limit placed on it by Node.

While recursive functions _can_ be optimized via [tail call optimization](https://stackoverflow.com/questions/310974/what-is-tail-call-optimization) (TCO), that feature _has_ to be present in the environment being run for optimization to work.

Unfortunately — as of Node 8.x — TCO is [no](https://stackoverflow.com/questions/23260390/node-js-tail-call-optimization-possible-or-not) [longer](https://stackoverflow.com/questions/42788139/es6-tail-recursion-optimisation-stack-overflow/42788286#42788286) [supported](https://bugs.chromium.org/p/v8/issues/detail?id=4698).

This means that, depending on what you're building and the size of your API, zemi might not be the right fit for you. zemi uses recursion when dealing with nested routes, so if your application has a very high number of nested-routes within nested-routes, chances are you might exceed the call stack.

[1]: https://github.com/yoaquim/zemi/blob/main/src/types/openapi.types.ts#L70

[2]: https://github.com/yoaquim/zemi/blob/main/src/types/openapi.types.ts#L156

[3]:https://github.com/yoaquim/zemi/blob/main/src/types/openapi.types.ts#L216

[4]:https://github.com/yoaquim/zemi/blob/main/src/types/openapi.types.ts#L141

[5]:https://github.com/yoaquim/zemi/blob/main/src/types/openapi.types.ts#L149

[6]:https://github.com/yoaquim/zemi/blob/main/src/types/openapi.types.ts#L1
