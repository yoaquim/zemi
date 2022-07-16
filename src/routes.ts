import {ZemiMethod, ZemiRequest, ZemiResponse, ZemiRouteDefinition} from './types/core.types'
import {NextFunction} from 'express'

const {GET} = ZemiMethod

export default [
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
            handler: function (request: ZemiRequest, response: ZemiResponse, __: NextFunction, routeDef: ZemiRouteDefinition) {
                const routeDefinitions = request.routeDefinitions
                const petsByIdDetails = routeDefinitions['petsById-details']
                const {name, path, parameters, reverse} = petsByIdDetails
                response.status(200).json({
                    name, path, parameters, reverse: reverse({breed: 'dog', id: 66})
                })
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
