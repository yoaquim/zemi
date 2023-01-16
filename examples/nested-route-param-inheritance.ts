import express from "express";
import Zemi, { ZemiMethod, ZemiRequest, ZemiResponse, ZemiRoute } from "zemi";

const { GET } = ZemiMethod;

const DOGS: Record<string, Array<string>> = {
  corgi: ["Ash", "Brock", "Misty"],
  labrador: ['"Fred","Barney","Wilma"'],
  poodle: ["Shaggy", "Scoob"],
};
const petsHandler = function (request: ZemiRequest, response: ZemiResponse) {
  response.status(200).json({ pets: ["dogs", "cats"] });
};

const dogsHandler = function (request: ZemiRequest, response: ZemiResponse) {
  response.status(200).json({ dogs: ["corgi", "labrador", "poodle"] });
};

const dogsBreedHandler = function (request: ZemiRequest, response: ZemiResponse) {
  const { breed } = request.params;
  response.status(200).json({ result: DOGS[breed] });
};

const dogsBreedByIdHandler = function (request: ZemiRequest, response: ZemiResponse) {
  // Here, we're accessing the `breed` param, which was specified in the parent route
  const { breed, id } = request.params;
  const i: number = parseInt(id, 10);
  const result = DOGS[breed] && DOGS[breed][i];
  response.status(200).json({ result });
};

const routes: Array<ZemiRoute> = [
  {
    name: "pets",
    path: "/pets",
    [GET]: petsHandler,
    routes: [
      {
        name: "dogs",
        path: "/dogs",
        [GET]: dogsHandler,
        routes: [
          {
            name: "dogsByBreeds",
            path: "/dogs/:breed",
            [GET]: dogsBreedHandler,
            routes: [
              {
                name: "dogsByBreedById",
                path: "/:id",
                [GET]: dogsBreedByIdHandler,
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
app.use("/", Zemi(routes));
app.listen(8000, (): void => console.log(`----- SERVER START -----`));
