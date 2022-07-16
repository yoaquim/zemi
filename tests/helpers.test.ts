import {buildNamedRoutes, buildResponsesPerNamedRoute, buildRouteDef, paramPathToOpenApiParamObj, paramPathToValidPath} from '../src/_helpers'
import {ZemiMethod, ZemiRequest, ZemiResponse, ZemiRoute} from '../src/types/core.types'

const {GET, POST} = ZemiMethod

describe('buildNamedRoutes can...', () => {
    test('return an object with the name of the route as the key, and the path of the route as the value', () => {
        const routes: Array<ZemiRoute> = [
            {
                name: 'pets',
                path: '/pets/:id',
            },
            {
                name: 'humans',
                path: '/humans',
            },
        ]

        const result = buildNamedRoutes(routes)
        expect(result).toEqual({
            'pets': '/pets/:id',
            'humans': '/humans',
        })
    })

    test('return named routes for all routes and nested routes', () => {
        const routes: Array<ZemiRoute> = [
            {
                name: 'pets',
                path: '/pets/:id',
                routes: [
                    {
                        name: 'dogs',
                        path: '/dogs',
                    },
                    {
                        name: 'cats',
                        path: '/cats',
                    }
                ]
            },
            {
                name: 'humans',
                path: '/humans?foo=bar&baz=tur',
            },
            {
                name: 'plants',
                path: '/plants',
                routes: [
                    {
                        name: 'carnivore',
                        path: '/carnivore/:name',
                        routes: [
                            {name: 'dangerous', path: '/dangerous',},
                        ]
                    }
                ]
            }
        ]

        const result = buildNamedRoutes(routes)
        expect(result).toEqual({
            'pets': '/pets/:id',
            'pets-dogs': '/pets/:id/dogs',
            'pets-cats': '/pets/:id/cats',
            'humans': '/humans?foo=bar&baz=tur',
            'plants': '/plants',
            'plants-carnivore': '/plants/carnivore/:name',
            'plants-carnivore-dangerous': '/plants/carnivore/:name/dangerous',
        })
    })
})

describe('buildResponsesPerNamedRoute can...', () => {
    test('return an object with the name of the route as the key, and an object that has the responses per named methods', () => {
        const routes: Array<ZemiRoute> = [
            {
                name: 'pets',
                path: '/pets',
                [GET]: {
                    description: "returns all pets",
                    tags: ['pets'],
                    responses: {
                        '200': {
                            description: 'successful operation'
                        }
                    },
                    handler: function (request: ZemiRequest, response: ZemiResponse) {
                        response.status(200).json(request.allowedResponseHttpCodes)
                    }
                },
                [POST]: {
                    description: "creates a new pet",
                    tags: ['pets'],
                    responses: {
                        '200': {
                            description: 'successful operation'
                        },
                        '404': {
                            description: 'bad request, cannot complete operation'
                        }
                    },
                    handler: function (request: ZemiRequest, response: ZemiResponse) {
                        response.status(200).json(request.namedRoutes)
                    }
                },
                routes: [
                    {
                        name: 'dogsById',
                        path: '/dogs/:dogId',
                        [GET]: {
                            description: "returns all dogs",
                            tags: ['pets', 'dogs'],
                            responses: {
                                '200': {
                                    description: 'successful operation'
                                },
                                '404': {
                                    description: 'pet not found'
                                }
                            },
                            handler: function (request: ZemiRequest, response: ZemiResponse) {
                                response.status(200).json({id: request.params.id})
                            }
                        }
                    }
                ]
            },
            {
                name: 'petsById',
                path: '/pets/:id',
                [GET]: {
                    description: "returns all pets",
                    tags: ['pets'],
                    responses: {
                        '200': {
                            description: 'successful operation'
                        },
                        '404': {
                            description: 'pet not found'
                        }
                    },
                    handler: function (request: ZemiRequest, response: ZemiResponse) {
                        response.status(200).json({id: request.params.id})
                    }
                }
            }
        ]

        const result = buildResponsesPerNamedRoute(routes)
        expect(result).toEqual({
            "pets": {
                "get": ['200'],
                "post": ['200', '404']
            },
            "pets-dogsById": {
                "get": ['200', '404']
            },
            "petsById": {
                "get": ['200', '404']
            },
        })
    })
})


describe('paramPathToValidPath can...', () => {
    test("convert a zemi path with params into a valid Express URL path with ':' prepended params", () => {
        const url: string = '/pets/{breed|string}/{id|number}/details'
        const result = paramPathToValidPath(url)
        expect(result).toEqual('/pets/:breed/:id/details')
    })

    test("convert a zemi path with params into an OpenAPI path with '{}' encapsulated params", () => {
        const url: string = '/pets/{breed|string}/{id|number}/details'
        const result = paramPathToValidPath(url, true)
        expect(result).toEqual('/pets/{breed}/{id}/details')
    })

    test("return a valid Express URL when no params present", () => {
        const url: string = '/pets/dogs/breeds'
        const result = paramPathToValidPath(url)
        expect(result).toEqual('/pets/dogs/breeds')
    })
})

describe('paramPathToOpenApiParamObj can...', () => {
    test("convert a zemi path with params into an OpenAPI Params object", () => {
        const url: string = '/pets/{breed|string}/{id|number}/details'
        const result = paramPathToOpenApiParamObj(url)
        expect(result).toEqual([
            {
                name: 'breed',
                in: 'path',
                required: true,
                schema: {
                    type: 'string',
                    format: undefined,
                }
            },
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: {
                    type: 'number',
                    format: undefined,
                }
            }
        ])
    })
})

describe('buildRouteDef can...', () => {
    test('return a valid ZemiRouteDef object', () => {
        const p = '/pets/:animal/available/:id'
        const n = 'availablePetsByAnimalAndId'
        const {path, name, parameters, reverse} = buildRouteDef(p, n)
        expect(path).toEqual(p)
        expect(name).toEqual(n)
        expect(parameters).toEqual(['animal', 'id'])
        expect(reverse({animal:'dog', id:'99'})).toEqual('/pets/dog/available/99')
    })
})