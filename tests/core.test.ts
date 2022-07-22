import express, { NextFunction, Request, Response } from "express";
import request from "supertest";
import {
  ZemiRoute,
  ZemiMethod,
  ZemiRequest,
  ZemiResponse,
  ZemiRouteDefinition,
  ZemiRequestHandler,
} from "../src";
import zemi from "../src/core";

const { GET, POST } = ZemiMethod;

async function testGET(path: string, routes: Array<ZemiRoute>) {
  const app = express();
  app.use("/", zemi(routes));
  return request(app).get(path);
}

async function testPOST(path: string, data: object, routes: Array<ZemiRoute>) {
  const app = express();
  app.use(express.json());
  app.use("/", zemi(routes));
  return request(app).post(path).set("Accept", "application/json").send(data);
}

function buildRoute(
  name: string,
  path: string,
  method: ZemiMethod,
  handler: ZemiRequestHandler
): ZemiRoute {
  return {
    name,
    path,
    [method]: { handler },
  };
}

function buildBasicPetsRoute(handler: ZemiRequestHandler) {
  return buildRoute("pets", "/pets", GET, handler);
}

describe("zemi core functionality can...", () => {
  test("create a route from the definition passed to it.", async () => {
    const routes: Array<ZemiRoute> = [
      buildBasicPetsRoute(function (request: ZemiRequest, response: ZemiResponse) {
        response.status(200).json({ pets: ["dogs", "cats"] });
      }),
    ];
    const response = await testGET("/pets", routes);
    expect(response.status).toEqual(200);
    expect(response.body.pets).toEqual(["dogs", "cats"]);
  });

  test("access params defined in the path via the request.", async () => {
    const routes: Array<ZemiRoute> = [
      buildRoute("petsById", "/pets/:id", GET, function (request: Request, response: Response) {
        const id = request.params.id;
        response.status(200).json({
          id,
          dogs: ["Kali", "Ahkila"],
        });
      }),
    ];

    const response = await testGET("/pets/99", routes);
    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual("99");
    expect(response.body.dogs).toEqual(["Kali", "Ahkila"]);
  });

  test("access query object in the path via the request.", async () => {
    const routes: Array<ZemiRoute> = [
      buildBasicPetsRoute(function (request: Request, response: Response) {
        response.status(200).json({
          query: request.query,
        });
      }),
    ];

    const response = await testGET("/pets?foo=bar&baz=beez", routes);
    expect(response.status).toEqual(200);
    expect(response.body.query).toEqual({ foo: "bar", baz: "beez" });
  });

  test("create a route with child routes when specified in the definition.", async () => {
    const routes: Array<ZemiRoute> = [
      {
        name: "pets",
        path: "/pets",
        [GET]: {
          handler: function (request: Request, response: Response) {
            response.status(200).json({ pets: ["dogs", "cats"] });
          },
        },
        routes: [
          {
            name: "dogs",
            path: "/dogs",
            [GET]: {
              handler: function (request: Request, response: Response) {
                response.status(200).json({ data: ["Kali", "Ahkila"] });
              },
            },
          },
          {
            name: "cats",
            path: "/cats",
            [GET]: {
              handler: function (request: Request, response: Response) {
                response.status(200).json({ data: ["Fufu", "Meow"] });
              },
            },
          },
        ],
      },
    ];

    const baseResponse = await testGET("/pets", routes);
    expect(baseResponse.status).toEqual(200);
    expect(baseResponse.body.pets).toEqual(["dogs", "cats"]);

    const dogRouteResponse = await testGET("/pets/dogs", routes);
    expect(dogRouteResponse.body.data).toEqual(["Kali", "Ahkila"]);
    expect(dogRouteResponse.status).toEqual(200);

    const catRouteResponse = await testGET("/pets/cats", routes);
    expect(catRouteResponse.status).toEqual(200);
    expect(catRouteResponse.body.data).toEqual(["Fufu", "Meow"]);
  });

  test("merge params from parents routes into child routes and allows access to them.", async () => {
    const routes: Array<ZemiRoute> = [
      {
        name: "petsById",
        path: "/pets/:id",
        [GET]: {
          handler: function (request: Request, response: Response) {
            response.status(200).json({ pets: ["dogs", "cats"] });
          },
        },
        routes: [
          {
            name: "dogs",
            path: "/dogs",
            [GET]: {
              handler: function (request: Request, response: Response) {
                response.status(200).json({
                  parent_id: request.params.id,
                  data: ["Kali", "Ahkila"],
                });
              },
            },
          },
        ],
      },
    ];

    const response = await testGET("/pets/99/dogs", routes);
    expect(response.body.parent_id).toEqual("99");
    expect(response.body.data).toEqual(["Kali", "Ahkila"]);
    expect(response.status).toEqual(200);
  });

  test("create a POST route that receives data.", async () => {
    const routes: Array<ZemiRoute> = [
      {
        name: "newPet",
        path: "/new-pet",
        [POST]: {
          handler: function (request: Request, response: Response) {
            const { new_pet } = request.body;
            response.status(200).json({ new_pet });
          },
        },
      },
    ];

    const response = await testPOST("/new-pet", { new_pet: "rabbit" }, routes);
    expect(response.status).toEqual(200);
    expect(response.body.new_pet).toEqual("rabbit");
  });

  test("create a POST route that receives data and can access request params.", async () => {
    const routes: Array<ZemiRoute> = [
      {
        name: "newPetById",
        path: "/new-pet/:id",
        [POST]: {
          handler: function (request: Request, response: Response) {
            const { new_pet } = request.body;
            const { id } = request.params;
            response.status(200).json({ new_pet, id });
          },
        },
      },
    ];

    const response = await testPOST("/new-pet/99", { new_pet: "rabbit" }, routes);
    expect(response.status).toEqual(200);
    expect(response.body.new_pet).toEqual("rabbit");
    expect(response.body.id).toEqual("99");
  });

  test("create a POST route and a GET route that both work.", async () => {
    const routes: Array<ZemiRoute> = [
      {
        name: "newItem",
        path: "/new-item",
        [POST]: {
          handler: function (request: Request, response: Response) {
            const { new_item } = request.body;
            response.status(200).json({ new_item });
          },
        },
        [GET]: {
          handler: function (request: Request, response: Response) {
            const { id } = request.params;
            response.status(200).json({ id, message: "items" });
          },
        },
      },
    ];

    const postResponse = await testPOST("/new-item", { new_item: "sponge" }, routes);
    expect(postResponse.status).toEqual(200);
    expect(postResponse.body.new_item).toEqual("sponge");

    const getResponse = await testGET("/new-item", routes);
    expect(getResponse.status).toEqual(200);
    expect(getResponse.body.message).toEqual("items");
  });

  test("build nested routes without having a handler at the current level", async () => {
    const routes: Array<ZemiRoute> = [
      {
        name: "pets",
        path: "/pets/",
        routes: [
          {
            name: "dogs",
            path: "/dogs/",
            [GET]: {
              handler: function (request: Request, response: Response) {
                response.status(200).json({ dogs: ["Kali", "Ahkila"] });
              },
            },
          },
        ],
      },
    ];

    const nestedResponse = await testGET("/pets/dogs", routes);
    expect(nestedResponse.status).toEqual(200);
    expect(nestedResponse.body).toEqual({ dogs: ["Kali", "Ahkila"] });

    const notFoundResponse = await testGET("/pets", routes);
    expect(notFoundResponse.status).toEqual(404);
  });

  test("store route defintiions in ZemiRequest", async () => {
    const routes: Array<ZemiRoute> = [
      {
        name: "pets",
        path: "/pets/:id",
        [GET]: {
          handler: function (request: ZemiRequest, response: Response) {
            response.status(200).json(request.routeDefinitions);
          },
        },
        routes: [
          {
            name: "dogs",
            path: "/dogs",
          },
          {
            name: "cats",
            path: "/cats",
            routes: [
              {
                name: "tigers",
                path: "/tiggers",
              },
            ],
          },
        ],
      },
    ];

    const response = await testGET("/pets/99", routes);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      pets: {
        name: "pets",
        path: "/pets/:id",
        parameters: ["id"],
      },
      "pets-dogs": {
        name: "pets-dogs",
        path: "/pets/:id/dogs",
        parameters: ["id"],
      },
      "pets-cats": {
        name: "pets-cats",
        path: "/pets/:id/cats",
        parameters: ["id"],
      },
      "pets-cats-tigers": {
        name: "pets-cats-tigers",
        path: "/pets/:id/cats/tiggers",
        parameters: ["id"],
      },
    });
  });

  test("store allowed responses per rout in ZemiRequest", async () => {
    const routes: Array<ZemiRoute> = [
      {
        name: "pets",
        path: "/pets",
        [GET]: {
          description: "returns all pets",
          tags: ["pets"],
          responses: {
            "200": {
              description: "successful operation",
            },
          },
          handler: function (request: ZemiRequest, response: ZemiResponse) {
            response.status(200).json(request.allowedResponseHttpCodes);
          },
        },
        [POST]: {
          description: "creates a new pet",
          tags: ["pets"],
          responses: {
            "200": {
              description: "successful operation",
            },
            "404": {
              description: "bad request, cannot complete operation",
            },
          },
          handler: function (request: ZemiRequest, response: ZemiResponse) {
            response.status(200).json({});
          },
        },
        routes: [
          {
            name: "dogsById",
            path: "/dogs/:dogId",
            [GET]: {
              description: "returns all dogs",
              tags: ["pets", "dogs"],
              responses: {
                "200": {
                  description: "successful operation",
                },
                "404": {
                  description: "pet not found",
                },
              },
              handler: function (request: ZemiRequest, response: ZemiResponse) {
                response.status(200).json({ id: request.params.id });
              },
            },
          },
        ],
      },
      {
        name: "petsById",
        path: "/pets/:id",
        [GET]: {
          description: "returns all pets",
          tags: ["pets"],
          responses: {
            "200": {
              description: "successful operation",
            },
            "404": {
              description: "pet not found",
            },
          },
          handler: function (request: ZemiRequest, response: ZemiResponse) {
            response.status(200).json({ id: request.params.id });
          },
        },
      },
    ];

    const response = await testGET("/pets", routes);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      pets: {
        get: ["200"],
        post: ["200", "404"],
      },
      "pets-dogsById": {
        get: ["200", "404"],
      },
      petsById: {
        get: ["200", "404"],
      },
    });
  });

  test("correctly build paths for defined-routes when object being access by nested routes", async () => {
    const petsHandler = function (request: ZemiRequest, response: ZemiResponse) {
      const { routeDefinitions } = request;
      response.status(200).json({ routeDefinitions });
    };

    const dogsHandler = function (request: ZemiRequest, response: ZemiResponse) {
      response.status(200).json({ dogs: ["corgi", "labrador", "poodle"] });
    };

    const catsHandler = function (request: ZemiRequest, response: ZemiResponse) {
      const routeDefs = request.routeDefinitions;
      response.status(200).json({ routeDefs });
    };

    const tigersHandler = function (request: ZemiRequest, response: ZemiResponse) {
      // Tigers are just cats, so redirect to /cats
      const routeDefinitions = request.routeDefinitions;
      response.json({ routeDefinitions });
    };

    const routes: Array<ZemiRoute> = [
      {
        name: "pets",
        path: "/pets",
        [GET]: { handler: petsHandler },
        routes: [
          {
            name: "dogs",
            path: "/dogs",
            [GET]: { handler: dogsHandler },
          },
          {
            name: "cats",
            path: "/cats",
            [GET]: { handler: catsHandler },
          },
          {
            name: "tigers",
            path: "/tigers",
            [GET]: { handler: tigersHandler },
          },
        ],
      },
    ];

    const response = await testGET("/pets/tigers", routes);
    expect(response.body).toEqual({
      routeDefinitions: {
        pets: { name: "pets", path: "/pets", parameters: [] },
        "pets-dogs": { name: "pets-dogs", path: "/pets/dogs", parameters: [] },
        "pets-cats": { name: "pets-cats", path: "/pets/cats", parameters: [] },
        "pets-tigers": {
          name: "pets-tigers",
          path: "/pets/tigers",
          parameters: [],
        },
      },
    });
  });

  test("correctly add the complete routeDefinition as the fourth argument in the ZemiRequestHandler fn", async () => {
    const tigersHandler = (
      request: ZemiRequest,
      response: ZemiResponse,
      _: NextFunction,
      routeDefinition: ZemiRouteDefinition
    ) => {
      response.json({ routeDefinition });
    };

    const routes: Array<ZemiRoute> = [
      {
        name: "pets",
        path: "/pets",
        routes: [
          {
            name: "dogs",
            path: "/dogs",
          },
          {
            name: "cats",
            path: "/cats",
            routes: [
              {
                name: "tigers",
                path: "/tigers",
                [GET]: { handler: tigersHandler },
              },
            ],
          },
        ],
      },
    ];

    const response = await testGET("/pets/tigers", routes);
    expect(response.body.routeDefinition.name).toEqual("pets-cats-tigers");
    expect(response.body.routeDefinition.path).toEqual("/pets/cats/tigers");
  });
});

describe("zemi middleware functionality can...", () => {
  test("attach middleware to router before routes are defined", async () => {
    const mockOne = jest.fn();
    const mockTwo = jest.fn();
    const routes: Array<ZemiRoute> = [
      {
        name: "pets",
        path: "/pets",
        middleware: [
          function (request: Request, response: Response, next: NextFunction) {
            mockOne();
            next();
          },
          function (request: Request, response: Response, next: NextFunction) {
            mockTwo();
            next();
          },
        ],
        [GET]: {
          handler: function (request: Request, response: Response) {
            response.status(200).json({ pets: ["dogs", "cats"] });
          },
        },
      },
    ];

    const response = await testGET("/pets", routes);
    expect(mockOne).toHaveBeenCalled();
    expect(mockTwo).toHaveBeenCalled();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({ pets: ["dogs", "cats"] });
  });
});
