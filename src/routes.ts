import {ZemiMethod, ZemiRequest, ZemiResponse} from './types/core.types'

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
