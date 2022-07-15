import express from 'express'
import {ZemiRoute, ZemiMethod, ZemiRequest, ZemiResponse} from './types/core.types'
import {ZemiOpenApiDoc} from './types/openapi.types'
import Zemi from './_core'
import ZemiOpenApiDocGenerator from './_openapi'

const {GET} = ZemiMethod
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

ZemiOpenApiDocGenerator({doc, routes, options: {fileName: 'petstore-open-api'}})

const app = express()
app.use(express.json())
app.use('/', Zemi(routes))
app.listen(8000, (): void => console.log(`----- SERVER START -----`))
