import ZemiOpenApiDocGenerator, { asyncWriteFile } from "../src/openapi";
import {
  ZemiRequest,
  ZemiResponse,
  ZemiRoute,
  ZemiMethod,
} from "../src/types/core.types";
import { OpenApiDoc } from "../src/types/openapi.types";

//============================================
// MOCKS
//============================================
import fs from "fs";

const mockWriteFile = jest.fn();
jest.mock("fs", () => {
  return {
    promises: {
      // have to mock this way to `mockWriteFile` can be referenced and passed the the args
      writeFile: (...args) => mockWriteFile(...args),
    },
  };
});
//============================================

describe("ZemiOpenApiDocGenerator can...", () => {
  const { GET } = ZemiMethod;

  const doc: OpenApiDoc = {
    openapi: "3.0.0",
    info: {
      description: "API for pet store management",
      version: "1.0",
      title: "Pet Store API",
      contact: {
        email: "hello@petstore.com",
      },
    },
    tags: [
      { name: "pets", description: "related to pets" },
      { name: "details", description: "related to store details" },
    ],
    servers: [{ url: "https://api.bestpetstore.com/v1" }],
  };

  const routes: Array<ZemiRoute> = [
    {
      name: "petsById",
      path: "/pets/{breed|string}/{id|number}",
      [GET]: {
        description: "returns all pets",
        tags: ["pets"],
        responses: {
          "200": {
            description: "successful operation",
          },
          "400": {
            description: "pet not found",
          },
        },
        handler: function (request: ZemiRequest, response: ZemiResponse) {
          response.status(200).json({ id: request.params.id });
        },
      },
      routes: [
        {
          name: "details",
          path: "/details",
          [GET]: {
            description: "returns all pets",
            tags: ["pets", "details"],
            responses: {
              "200": {
                description: "successful operation",
              },
            },
            handler: function (request: ZemiRequest, response: ZemiResponse) {
              const { id, breed } = request.params;
              response.status(200).json({ id, breed });
            },
          },
        },
      ],
    },
  ];

  test("generate an OpenApi spec", async () => {
    console.log = jest.fn();
    const result = await ZemiOpenApiDocGenerator({ doc, routes });
    expect(result).toEqual({
      openapi: "3.0.0",
      info: {
        description: "API for pet store management",
        version: "1.0",
        title: "Pet Store API",
        contact: {
          email: "hello@petstore.com",
        },
      },
      tags: [
        {
          name: "pets",
          description: "related to pets",
        },
        {
          name: "details",
          description: "related to store details",
        },
      ],
      servers: [
        {
          url: "https://api.bestpetstore.com/v1",
        },
      ],
      paths: {
        "/pets/{breed}/{id}": {
          get: {
            parameters: [
              {
                name: "breed",
                in: "path",
                required: true,
                schema: {
                  type: "string",
                },
              },
              {
                name: "id",
                in: "path",
                required: true,
                schema: {
                  type: "number",
                },
              },
            ],
            description: "returns all pets",
            responses: {
              "200": {
                description: "successful operation",
              },
              "400": {
                description: "pet not found",
              },
            },
            tags: ["pets"],
          },
        },
        "/pets/{breed}/{id}/details": {
          get: {
            parameters: [
              {
                name: "breed",
                in: "path",
                required: true,
                schema: {
                  type: "string",
                },
              },
              {
                name: "id",
                in: "path",
                required: true,
                schema: {
                  type: "number",
                },
              },
            ],
            description: "returns all pets",
            responses: {
              "200": {
                description: "successful operation",
              },
            },
            tags: ["pets", "details"],
          },
        },
      },
    });
  });

  test("write to a specified path", async () => {
    await ZemiOpenApiDocGenerator({
      doc,
      routes,
      options: { path: "/TEST/PATH" },
    });
    expect(mockWriteFile.mock.calls[0][0]).toEqual("/TEST/PATH");
  });
});

describe("asyncWriteFile can...", () => {
  test("write file to specified path.", async () => {
    console.log = jest.fn();
    const mockWriteFile = <(path: string, data: any, options: object) => void>(
      jest.fn()
    );
    const path = "/foo/bar/baz/openapi.json";
    const data = { foo: "bar" };
    await asyncWriteFile(mockWriteFile, path, data);
    expect(mockWriteFile).toHaveBeenCalledWith(path, data, { flag: "w" });
  });

  test("console log when it fails to write a file.", async () => {
    const logger = console.log;
    console.log = jest.fn();
    const err = new Error("FAILED");
    const mockWriteFile = <(path: string, data: any, options: object) => void>(
      jest.fn(() => {
        throw err;
      })
    );

    const path = "/failed/to/write";
    await asyncWriteFile(mockWriteFile, path, {});

    expect(console.log).toHaveBeenCalledWith(
      `-- Something went wrong when trying to write ${path}:`
    );
    expect(console.log).toHaveBeenCalledWith(err);
    console.log = logger;
  });
});
