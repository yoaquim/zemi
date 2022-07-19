import express from "express";
import zemi, { ZemiMethod, ZemiRequest, ZemiResponse, ZemiRoute } from "zemi";

const { GET } = ZemiMethod;

const petsHandler = function (request: ZemiRequest, response: ZemiResponse) {
  response.status(200).json({ pets: ["dogs", "cats"] });
};

const dogsHandler = function (request: ZemiRequest, response: ZemiResponse) {
  response.status(200).json({ dogs: ["corgi", "labrador", "poodle"] });
};

const dogsBreedByIdHandler = function (
  request: ZemiRequest,
  response: ZemiResponse
) {
  const dogs = {
    corgi: ["Ash", "Brock", "Misty"],
    labrador: ['"Fred","Barney","Wilma"'],
    poodle: ["Shaggy", "Scoob"],
  };
  const { breed, id } = request.params;
  const result = dogs[breed] && dogs[breed][id];
  response.status(200).json({ result });
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
        routes: [
          {
            name: "dogsByBreeds",
            path: "/dogs/:breed",
            parameters: [
              {
                name: "breed",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: {
              "200": {
                description: "successful operation",
              },
              "404": {
                description: "breed not found",
              },
              "400": {
                description: "bad request",
              },
            },
            routes: [
              {
                name: "dogsByBreedById",
                path: "/:id",
                parameters: [
                  {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "number" },
                  },
                  {
                    name: "availableForAdoption",
                    in: "query",
                    required: false,
                    schema: { type: "boolean" },
                  },
                ],
                responses: {
                  "200": {
                    description: "successful operation",
                  },
                  "404": {
                    description: "dog not found",
                  },
                },
                [GET]: { handler: dogsBreedByIdHandler },
              },
            ],
          },
        ],
      },
    ],
  },
];

const app = express();
app.use(express.json());
app.use("/", zemi(routes));
app.listen(8000, (): void => console.log(`----- SERVER START -----`));
