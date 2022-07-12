import express, {Request, Response} from 'express'
import request from 'supertest'
import batey, {BateyRoute} from '../src/batey'

async function testGET(path: string, routes: Array<BateyRoute>) {
    const app = express()
    app.use('/', batey({routes}))
    return request(app).get(path)
}

async function testPOST(path: string, data: object, routes: Array<BateyRoute>) {
    const app = express()
    app.use(express.json())
    app.use('/', batey({routes}))
    return request(app).post(path).set('Accept', 'application/json').send(data)
}

describe('batey can build GET methods', () => {
    test('batey creates a route from the definition passed to it.', async () => {
        const routes: Array<BateyRoute> = [
            {
                path: '/pets',
                method: 'get',
                handler: function (request: Request, response: Response) {
                    response.status(200).json({
                        dogs: ['Kali', 'Ahkila'],
                        cats: ['Fufu', 'Meow']
                    })
                },
            }
        ]

        const response = await testGET('/pets', routes)
        expect(response.status).toEqual(200)
        expect(response.body.dogs).toEqual(['Kali', 'Ahkila'])
        expect(response.body.cats).toEqual(['Fufu', 'Meow'])
    })

    test('batey can access params defined in the path via the request.', async () => {
        const routes: Array<BateyRoute> = [
            {
                path: '/pets/:id',
                method: 'get',
                handler: function (request: Request, response: Response) {
                    const id = request.params.id
                    response.status(200).json({
                        id,
                        dogs: ['Kali', 'Ahkila']
                    })
                },
            }
        ]

        const response = await testGET('/pets/99', routes)
        expect(response.status).toEqual(200)
        expect(response.body.id).toEqual('99')
        expect(response.body.dogs).toEqual(['Kali', 'Ahkila'])
    })

    test('batey creates a route with child routes when specified in the definition.', async () => {
        const routes: Array<BateyRoute> = [
            {
                path: '/pets',
                method: 'get',
                handler: function (request: Request, response: Response) {
                    response.status(200).json({pets: ['dogs', 'cats']})
                },
                routes: [
                    {
                        routes: [
                            {
                                path: '/dogs',
                                method: 'get',
                                handler: function (request: Request, response: Response) {
                                    response.status(200).json({data: ['Kali', 'Ahkila'],})
                                },
                            },
                            {
                                path: '/cats',
                                method: 'get',
                                handler: function (request: Request, response: Response) {
                                    response.status(200).json({data: ['Fufu', 'Meow']})
                                },
                            }
                        ]
                    }
                ]
            }
        ]

        const baseResponse = await testGET('/pets', routes)
        expect(baseResponse.status).toEqual(200)
        expect(baseResponse.body.pets).toEqual(['dogs', 'cats'])

        const dogRouteResponse = await testGET('/pets/dogs', routes)
        expect(dogRouteResponse.body.data).toEqual(['Kali', 'Ahkila'])
        expect(dogRouteResponse.status).toEqual(200)

        const catRouteResponse = await testGET('/pets/cats', routes)
        expect(catRouteResponse.status).toEqual(200)
        expect(catRouteResponse.body.data).toEqual(['Fufu', 'Meow'])
    })

    test('batey merges params from parents routes into child routes and allows access to them.', async () => {
        const routes: Array<BateyRoute> = [
            {
                path: '/pets/:id',
                method: 'get',
                handler: function (request: Request, response: Response) {
                    response.status(200).json({pets: ['dogs', 'cats']})
                },
                routes: [
                    {
                        routes: [
                            {
                                path: '/dogs',
                                method: 'get',
                                handler: function (request: Request, response: Response) {
                                    response.status(200).json({
                                        parent_id: request.params.id,
                                        data: ['Kali', 'Ahkila'],
                                    })
                                },
                            }
                        ]
                    }
                ]
            }
        ]

        const response = await testGET('/pets/99/dogs', routes)
        expect(response.body.parent_id).toEqual('99')
        expect(response.body.data).toEqual(['Kali', 'Ahkila'])
        expect(response.status).toEqual(200)
    })
})


describe('batey can build POST methods', () => {
    test('batey creates a POST route that receives data.', async () => {
        const routes: Array<BateyRoute> = [
            {
                path: '/new-pet',
                method: 'post',
                handler: function (request: Request, response: Response) {
                    const {new_pet} = request.body
                    response.status(200).json({new_pet})
                },
            }
        ]

        const response = await testPOST('/new-pet', {new_pet: 'rabbit'}, routes)
        expect(response.status).toEqual(200)
        expect(response.body.new_pet).toEqual('rabbit')
    })

    test('batey creates a POST route that receives data and can access request params.', async () => {
        const routes: Array<BateyRoute> = [
            {
                path: '/new-pet/:id',
                method: 'post',
                handler: function (request: Request, response: Response) {
                    const {new_pet} = request.body
                    const {id} = request.params
                    response.status(200).json({new_pet, id})
                },
            }
        ]

        const response = await testPOST('/new-pet/99', {new_pet: 'rabbit'}, routes)
        expect(response.status).toEqual(200)
        expect(response.body.new_pet).toEqual('rabbit')
        expect(response.body.id).toEqual('99')
    })
})