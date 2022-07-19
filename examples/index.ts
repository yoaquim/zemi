import express, { NextFunction } from "express";
import zemi, {
  ZemiMethod,
  ZemiRequest,
  ZemiResponse,
  ZemiRoute,
  ZemiRouteDefinition,
} from "../src";

const { GET } = ZemiMethod;

const petsHandler = function (request: ZemiRequest, response: ZemiResponse) {
  const routeDefinitions: Record<string, ZemiRouteDefinition> =
    request.routeDefinitions;
  const { path, name, parameters, reverse } =
    routeDefinitions["pets-dogBreeds-dogsByBreedById"];

  response.status(200).json({
    path,
    name,
    parameters,
    reverse: reverse({ breed: "corgi", id: 99 }),
  });
};

const dogBreedHandler = function (
  request: ZemiRequest,
  response: ZemiResponse
) {
  const { breed } = request.params;
  const inventory = {
    poodle: ["Ash", "Brock", "Misty", "Oak"],
    labrador: ["Fred", "Barney", "Wilma"],
    corgi: ["Tom", "Jerry"],
  };
  const result = inventory[breed];

  if (result) {
    response.status(200).json({ result });
  } else {
    response.status(400).send("Breed not available.");
  }
};

const dogBreedsIdHandler = function (
  request: ZemiRequest,
  response: ZemiResponse
) {
  const { breed, id } = request.params;
  const inventory = {
    poodle: ["Ash", "Brock", "Misty", "Oak"],
    labrador: ["Fred", "Barney", "Wilma"],
    corgi: ["Tom", "Jerry"],
  };
  const result = inventory[breed];

  if (result && result[id]) {
    response.status(200).json({ result: result[id] });
  } else {
    response.status(400).send("Dog not available.");
  }
};

const catsByIdHandler = function (
  request: ZemiRequest,
  response: ZemiResponse
) {
  const { id } = request.params;
  const inventory = [
    "Shaggy",
    "Vilma",
    "Daphne",
    "Scoob",
    "Bugs",
    "Daffy",
    "Elmer",
    "Meowth",
    "Espeon",
  ];
  const result = inventory[id];

  if (result) {
    response.status(200).json({ result });
  } else {
    response.status(400).send("Cat not available.");
  }
};

const routes: Array<ZemiRoute> = [
  {
    name: "pets",
    path: "/pets",
    [GET]: { handler: petsHandler },
    middleware: [
      function (req: ZemiRequest, res: ZemiResponse, next: NextFunction) {
        const routeDefinitions: Record<string, ZemiRouteDefinition> =
          req.routeDefinitions;
        console.log(JSON.stringify(routeDefinitions));
        next();
      },
    ],
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
app.listen(8000, (): void => console.log(`----- SERVER START -----`));
