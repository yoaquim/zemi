import express, { NextFunction } from "express";
import Zemi, { ZemiMethod, ZemiRequest, ZemiResponse, ZemiRoute } from "zemi";

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

const routes: Array<ZemiRoute> = [
  {
    name: "pets",
    path: "/pets",
    // This middleware will get applied to the current route and all its nested routes
    middleware: [
      function (request: ZemiRequest, response: ZemiResponse, next: NextFunction) {
        const { routeDefinitions } = request;
        console.log(JSON.stringify(routeDefinitions));
        next();
      },
    ],
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
    ],
  },
];

const app = express();
app.use(express.json());
app.use("/", Zemi(routes));
app.listen(8000, (): void => console.log(`----- SERVER START -----`));
