# zemi

[![build](https://github.com/yoaquim/zemi/actions/workflows/ci.yml/badge.svg)](https://github.com/yoaquim/zemi/actions/workflows/ci.yml)
[![Code Climate Coverage](https://codeclimate.com/github/yoaquim/zemi/badges/coverage.svg)](https://codeclimate.com/github/yoaquim/zemi/coverage)
[![Code Climate Maintainability](https://codeclimate.com/github/yoaquim/zemi/badges/gpa.svg)](https://codeclimate.com/github/yoaquim/zemi)
[![Snyk.io Vulnerabilities](https://snyk.io/test/github/yoaquim/zemi/badge.svg?targetFile=package.json)](https://snyk.io/test/github/yoaquim/zemi?targetFile=package.json)

[![npm Version](https://img.shields.io/npm/v/zemi?color=137dc2&logo=npm)](https://www.npmjs.com/package/zemi)
[![Types](https://badgen.net/npm/types/zemi)](https://github.com/yoaquim/zemi/tree/main/src/types)
[![Dependencies](https://badgen.net/bundlephobia/dependency-count/zemi)](https://github.com/yoaquim/zemi/blob/main/package.json#L20-L23)
[![Install Size](https://packagephobia.com/badge?p=zemi)](https://packagephobia.com/result?p=zemi)
[![License](https://badgen.net/npm/license/zemi)](https://github.com/yoaquim/zemi/blob/main/LICENSE.md)

<br>

zemi is a [data-driven](#data-driven) routing library for [Express](https://expressjs.com/), built with Typescript.

Features:

- [reverse-routing](#reverse-routing)
- [path-parameter inheritance](#parameter-inheritance)
- route-level [middleware support](#middleware)

<br>

# Table of Contents

1. [Routing](#routing)
    1. [Data-driven](#data-driven)
    2. [Reverse-routing](#reverse-routing)
    3. [Middleware](#middleware)
    4. [Parameter Inheritance](#parameter-inheritance)
2. [Types](#types)
    1. [ZemiMethod](#zemimethod)
    2. [ZemiRequestHandler](#zemirequesthandler)
    3. [ZemiRequest](#zemirequest)
    4. [ZemiResponse](#zemiresponse)
    5. [ZemiRouteDefinition](#zemiroutedefinition)
    6. [ZemiRoute](#zemiroute)
3. [Examples](#examples)
   1. [Simple](https://github.com/yoaquim/zemi/blob/main/examples/simple.ts)
   2. [With Middleware](https://github.com/yoaquim/zemi/blob/main/examples/with-middleware.ts)
   3. [Using Named Routes For Redirects](https://github.com/yoaquim/zemi/blob/main/examples/using-named-routes-for-redirect.ts)
   4. [Using Reverse Routing](https://github.com/yoaquim/zemi/blob/main/examples/using-reverse-routing.ts)
   5. [With Param Inheritance from Parent Routes](https://github.com/yoaquim/zemi/blob/main/examples/nested-route-param-inheritance.ts)
4. [Limitations](#limitations)

<br>

## Routing

### Data-driven

Assume you have the following functions defined: `petsHandler`, `dogBreedHandler`, `dogBreedsIdHandler`, `catsByIdHandler` ; e.g.:

```ts
const petsHandler = (request: ZemiRequest, response: ZemiResponse) => {
  // do something with this request and respond
  response.status(200).json({ pets: ["dogs", "cats"] });
};

const dogBreedHandler = (request: ZemiRequest, response: ZemiResponse) => {
   //...
};

const dogBreedsIdHandler = (request: ZemiRequest, response: ZemiResponse) => {
   //...
};

const catsByIdHandler = (request: ZemiRequest, response: ZemiResponse) => {
   //...
};
```

Then the following code:

```ts
import express from "express";
import zemi, { ZemiRoute, ZemiMethod } from "zemi";

const { GET } = ZemiMethod;

const routes: Array<ZemiRoute> = [
  {
    name: "pets",
    path: "/pets",
    [GET]: petsHandler,
    routes: [
      {
        name: "dogBreeds",
        path: "/dogs/:breed",
        [GET]: dogBreedHandler,
        routes: [
          {
            name: "dogsByBreedById",
            path: "/:id",
            [GET]: dogBreedsIdHandler
          }
        ]
      },
      {
        name: "catsById",
        path: "/cats/:id",
        [GET]: catsByIdHandler
      }
    ]
  }
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

E.g. a handler like this:

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
    [GET]: petsHandler,
    routes: [
      {
        name: "dogBreeds",
        path: "/dogs/:breed",
        [GET]: dogBreedHandler,
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
            [GET]: dogBreedsIdHandler
          }
        ]
      },
      {
        name: "catsById",
        path: "/cats/:id",
        [GET]: { handler: catsByIdHandler }
      }
    ]
  }
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
    [GET]: petsHandler,
    routes: [
      {
        name: "dogBreeds",
        path: "/dogs/:breed",
        [GET]: dogBreedHandler,
        routes: [
          {
            name: "dogsByBreedById",
            path: "/:id",
            [GET]: dogBreedsIdHandler,
            routes: [
              {
                name: "dogsByBreedByIdDetailsSection",
                path: "/details/:section",
                [GET]: dogBreedsIdDetailsSectionHandler,
                routes: [
                  {
                    name: "newDogsByBreedByIdDetailsSection",
                    path: "/new",
                    [POST]: newDogsByBreedByIdDetailsSectionHandler
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];
```

The `newDogsByBreedByIdDetailsSection` route (path: `/pets/dogs/:breed/:id/details/:section/new`) will have `breed`, `id`, and `section` available as request parameters in the ZemiRequest object.

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

```ts
{
  routeDefinitions: Record<string, ZemiRouteDefinition>;
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

It must be provided a `name: string` and `path: string`; a [[`ZemiMethod`](#zemimethod)]:[`ZemiRequestHandler`](#zemirequesthandler) needs to be provided if that path should have functionality, but doesn't need to be if the path is just present as a path-prefix for nested routes.

```
{
   [ZemiMethod]: ZemiRequestHandler;
   name: string;
   path: string;
   middleware?: Array<RequestHandler>;
   routes?: Array<ZemiRoute>;
}
```

<br>

## Examples

Examples are available in the [examples](https://github.com/yoaquim/zemi/blob/main/examples) dir:

1. [Simple](https://github.com/yoaquim/zemi/blob/main/examples/simple.ts)

2. [With Middleware](https://github.com/yoaquim/zemi/blob/main/examples/with-middleware.ts)

3. [Using Named Routes For Redirects](https://github.com/yoaquim/zemi/blob/main/examples/using-named-routes-for-redirect.ts)
 
4. [Using Reverse Routing](https://github.com/yoaquim/zemi/blob/main/examples/using-reverse-routing.ts)

5. [With Param Inheritance from Parent Routes](https://github.com/yoaquim/zemi/blob/main/examples/nested-route-param-inheritance.ts)

<br>

## Limitations

zemi is a recursive library: it uses recursion across a number of operations in order to facilitate a low footprint and straightforward, declarative definitions.

Recursive operations can break the call-stack by going over its limit, generating `Maximum call stack size exceeded` errors. This means that the recursive function was called too many times, and exceeded the limit placed on it by Node.

While recursive functions _can_ be optimized via [tail call optimization](https://stackoverflow.com/questions/310974/what-is-tail-call-optimization) (TCO), that feature _has_ to be present in the environment being run for optimization to work.

Unfortunately — as of Node 8.x — TCO is [no](https://stackoverflow.com/questions/23260390/node-js-tail-call-optimization-possible-or-not) [longer](https://stackoverflow.com/questions/42788139/es6-tail-recursion-optimisation-stack-overflow/42788286#42788286) [supported](https://bugs.chromium.org/p/v8/issues/detail?id=4698).

This means that, depending on what you're building and the size of your API, zemi might not be the right fit for you. zemi uses recursion when dealing with nested routes, so if your application has a very high number of nested-routes within nested-routes, chances are you might exceed the call stack.
