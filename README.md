# zemi

zemi is a [data-driven](#data-driven) routing library for [Express](https://expressjs.com/).

Features:

- optional, [out-of-the-box support](#openapi) for [OpenAPI](https://www.openapis.org/)
- [reverse-routing](#reverse-routing)
- supports `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- [path-parameter inheritance](#parameter-inheritance) (aka `mergeParams:true`)
- route-level [middleware support](#middleware)

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

### Reverse-routing

zemi builds route-definitions for all routes and adds them to the ZemiRequest passed to the handler function.

All route-definitions are named (index-accessible) and follow the same naming convention: `[ancestor route names]-[parent route name]-[route name]`, e.g. `pets-dogsBreeds-dogsByBreedById`.

Each route-definition contains the name, path, and path-parameters (if present) of the route.
It also contains a reverse function, which when invoked with an object mapping path-parameters to values, will return the interpolated path.

E.g.:

```ts
import { ZemiRequest, ZemiResponse, ZemiRouteDefinition } from "zemi";

const petsHandler = (request: ZemiRequest, response: ZemiResponse) => {
  const routeDefinitions: Record<string, ZemiRouteDefinition> = request.routeDefinitions;
  const { path, name, parameters, reverse } = routeDefinitions["pets-dogBreeds-dogsByBreedById"];
  response.status(200).json({ path, name, parameters, reverse: reverse({ breed: 'Corgi', id: '1' }) });
};
```

This handler returns:

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

## OpenApi

zemi supports OpenAPI out-of-the-box, but it's completely optional.

It has extensive [Typescript support for OpenApi](https://github.com/yoaquim/zemi/blob/main/src/types/openapi.types.ts).

You can forgo it entirely, use every OpenApi supported feature, or use the bare-minimum as needed.

It comes with a OpenApi spec generator — `ZemiOpenApiSpecGenerator` — which will create and save an `openapi.json` specification of your API.

### Example

Assume you have ZemiRoutes defined at `src/routes/index.ts`.

Create a file at the root (project) level named `zemi-openapi-spec-gen.ts`:

```ts
import { OpenApiDoc } from "zemi";
import ZemiOpenApiSpecGenerator from "zemi";
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

ZemiOpenApiDocGenerator({ doc, routes });

// -- With options:
// const options = { path: '/path/to/save/openapijson/to' }
// ZemiOpenApiDocGenerator({ doc, routes, options});
```
That's the minimum config you need to generate an OpenApi spec.

You can then use [`ts-node`](https://www.npmjs.com/package/ts-node) to run it:

```shell
npx ts-node zemi-openapi-spec-gen.ts
```

This will generate an `openapi.json` at that same dir level.

Note that you can pass an optional `options` object specifying the `path` you want to save it spec to.
