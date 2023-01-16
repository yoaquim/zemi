import express from "express";
import Zemi, { ZemiMethod, ZemiRequest, ZemiResponse, ZemiRoute } from "zemi";

const { GET } = ZemiMethod;

const DOGS: Record<string, Array<string>> = {
  corgi: ["Ash", "Brock", "Misty"],
  labrador: ["Fred", "Barney", "Wilma"],
  poodle: ["Shaggy", "Scoob"],
};

const petsHandler = function (request: ZemiRequest, response: ZemiResponse) {
  response.status(200).json({ pets: ["dogs"] });
};

const dogsHandler = function (request: ZemiRequest, response: ZemiResponse) {
  response.status(200).json({ dogs: Object.keys(DOGS) });
};

const dogsBreedHandler = function (request: ZemiRequest, response: ZemiResponse) {
  const { breed } = request.params;
  response.status(200).json({ result: DOGS[breed] });
};

const favoritesHandler = function (request: ZemiRequest, response: ZemiResponse) {
  // Let's say my favorite pets are all labradors, so we can just redirect to that url
  const { reverse } = request.routeDefinitions["pets-dogs-dogsByBreeds"];
  // we need to pass in the params that that route specified, along with values
  const reversedPath = reverse({ breed: "labrador" });
  response.redirect(reversedPath);
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
            path: "/:breed",
            [GET]: dogsBreedHandler,
          },
        ],
      },
      {
        name: "favorites",
        path: "/favorites",
        [GET]: favoritesHandler,
      },
    ],
  },
];

const app = express();
app.use(express.json());
app.use("/", Zemi(routes));
app.listen(8080, (): void => console.log(`----- SERVER START -----`));
