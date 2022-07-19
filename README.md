# zemi

zemi is a [data-driven](#data-driven) routing library for [Express](https://expressjs.com/).

Features:

- optional, [out-of-the-box support](#openapi) for [OpenAPI](https://www.openapis.org/)
- [reverse-routing](#reverse-routing)
- supports `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS` HTTP/Express methods
- [path-parameter inheritance](#parameter-inheritance) (`mergeParams:true`)
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

Route-definitions for a route can be accessed by name-indexing.
The name for a route-definition is it's `name` property specified in the route, prefixed (by a hyphen `-`) by its all the routes it's nested in.
E.g., `pets-dogsBreeds-dogsByBreedById`.

Each route-definition contains the name, path, and path-parameters (if present) of the route.
It also contains a reverse function, which when invoked with and object mapping path-parameters to values, will return the interpolated path

E.g.:

```ts
import { ZemiRequest, ZemiResponse, ZemiRouteDefinition } from "zemi";

const petsHandler = (request: ZemiRequest, response: ZemiResponse) => {
  const routeDefinitions: Record<string, ZemiRouteDefinition> = request.routeDefinitions;
  const { path, name, parameters, reverse } = routeDefinitions["pets-dogBreeds-dogsByBreedById"];
  response.status(200).json({ path, name, parameters, reverse: reverse({ breed: 'Corgi', id: '1' }) });
};
```

This handler will return:

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

This allows you to generate links, redirect, and rename paths without having to hardcode/change paths.

### Middleware

zemi lets you define middleware functions, as an array, at the route level:

Retaking our example from the beginning:

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
          function(request: ZemiRequest, response: ZemiResponse, next: NextFunction) {
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

The middleware defined at the `dogBreeds` level will be applied to all the methods at that level (only a `GET` in this example) and all nested routes (so our `dogsByBreedById` route will gain that functionality also).

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

The `newDogsByBreedByIdDetailsSection` route (path: `/pets/dogs/:breed/:id/details/:section/new`) will have `breed`, `id`, and `section` available as request parameters in ZemiRequest.

## OpenApi

zemi supports OpenAPI out-of-the-box, but it's completely optional.

You can forgo it entirely, use every OpenApi supported feature, or use the bare-minimum as needed.

It comes with a OpenApi spec generator, which will create and save an `openapi.json` specification of your API.

It has extensive [Typescript support for OpenApi](https://github.com/yoaquim/zemi/blob/main/src/types/openapi.types.ts).

- TBD on Example

## Examples

TBD
