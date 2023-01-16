import express from "express";
import zemi, { ZemiMethod, ZemiRequest, ZemiResponse, ZemiRoute } from "zemi";

const { GET } = ZemiMethod;

const petsHandler = function (request: ZemiRequest, response: ZemiResponse) {
  response.status(200).json({ pets: ["dogs", "cats"] });
};

const dogsHandler = function (request: ZemiRequest, response: ZemiResponse) {
  response.status(200).json({ dogs: ["corgi", "labrador", "poodle"] });
};

const catsHandler = function (request: ZemiRequest, response: ZemiResponse) {
  response.status(200).json({ cats: ["persian", "bengal", "abyssinian"] });
};

const tigersHandler = function (request: ZemiRequest, response: ZemiResponse) {
  // Tigers are just cats, so redirect to the path specified in the
  // route definition named `pets-cats` (i.e. "/pets/cats")

  // This prevents hardcoding paths to handler logic and lets you easily
  // change actual paths without breaking your app
  const { path } = request.routeDefinitions["pets-cats"];
  response.redirect(path);
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
      },
      {
        name: "cats",
        path: "/cats",
        [GET]: catsHandler,
      },
      {
        name: "tigers",
        path: "/tigers",
        [GET]: tigersHandler,
      },
    ],
  },
];

const app = express();
app.use(express.json());
app.use("/", zemi(routes));
app.listen(8000, (): void => console.log(`----- SERVER START -----`));
