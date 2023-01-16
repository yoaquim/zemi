import express from "express";
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
    [GET]: petsHandler,
    routes: [
      {
        name: "dogs",
        path: "/dogs",
        // Note that you can also use `get` as the function's key
        // Really, any supported ZemiMethod's string value will work
        // (e.g. 'post', 'put', etc.)
        // Zemi provides those methods to be more explicit in what it supports
        get: dogsHandler,
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
