import ZemiOpenApiDocGenerator from '../src/_openapi'
import {ZemiRequest, ZemiResponse, ZemiRoute, ZemiMethod} from '../src/types/core.types'
import {ZemiOpenApiDoc} from '../src/types/openapi.types'

const {GET} = ZemiMethod

describe('ZemiOpenApiDocGenerator can...', () => {
    test('generate an OpenApi spec', async () => {
        const doc: ZemiOpenApiDoc = {
            openapi: '3.0.0',
            info: {
                description: 'API for pet store management',
                version: '1.0',
                title: 'Pet Store API',
                contact: {
                    email: 'hello@petstore.com'
                }
            },
            tags: [
                {name: 'pets', description: 'related to pets'},
                {name: 'details', description: 'related to store details'}
            ],
            servers: [
                {url: 'https://api.bestpetstore.com/v1'}
            ]
        }

        const routes: Array<ZemiRoute> = [
            {
                name: 'petsById',
                path: '/pets/{breed|string}/{id|number}',
                [GET]: {
                    description: "returns all pets",
                    tags: ['pets'],
                    responses: {
                        '200': {
                            description: 'successful operation'
                        },
                        '400': {
                            description: 'pet not found'
                        }
                    },
                    handler: function (request: ZemiRequest, response: ZemiResponse) {
                        response.status(200).json({id: request.params.id})
                    }
                },
                routes: [
                    {
                        name: 'details',
                        path: '/details',
                        [GET]: {
                            description: "returns all pets",
                            tags: ['pets', 'details'],
                            responses: {
                                '200': {
                                    description: 'successful operation'
                                }
                            },
                            handler: function (request: ZemiRequest, response: ZemiResponse) {
                                const {id, breed} = request.params
                                response.status(200).json({id, breed})
                            }
                        }
                    }
                ]
            }
        ]

        const result = await ZemiOpenApiDocGenerator({doc, routes})
        expect(result).toEqual({
            "openapi": "3.0.0",
            "info": {
                "description": "API for pet store management",
                "version": "1.0",
                "title": "Pet Store API",
                "contact": {
                    "email": "hello@petstore.com"
                }
            },
            "tags": [
                {
                    "name": "pets",
                    "description": "related to pets"
                },
                {
                    "name": "details",
                    "description": "related to store details"
                }
            ],
            "servers": [
                {
                    "url": "https://api.bestpetstore.com/v1"
                }
            ],
            "paths": {
                "/pets/{breed}/{id}": {
                    "get": {
                        "parameters": [
                            {
                                "name": "breed",
                                "in": "path",
                                "required": true,
                                "schema": {
                                    "type": "string"
                                }
                            },
                            {
                                "name": "id",
                                "in": "path",
                                "required": true,
                                "schema": {
                                    "type": "number"
                                }
                            }
                        ],
                        "description": "returns all pets",
                        "responses": {
                            "200": {
                                "description": "successful operation"
                            },
                            "400": {
                                "description": "pet not found"
                            }
                        },
                        "tags": [
                            "pets"
                        ]
                    }
                },
                "/pets/{breed}/{id}/details": {
                    "get": {
                        "parameters": [
                            {
                                "name": "breed",
                                "in": "path",
                                "required": true,
                                "schema": {
                                    "type": "string"
                                }
                            },
                            {
                                "name": "id",
                                "in": "path",
                                "required": true,
                                "schema": {
                                    "type": "number"
                                }
                            }
                        ],
                        "description": "returns all pets",
                        "responses": {
                            "200": {
                                "description": "successful operation"
                            }
                        },
                        "tags": [
                            "pets",
                            "details"
                        ]
                    }
                }
            }
        })
    })
})