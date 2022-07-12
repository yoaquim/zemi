import Batey, {BateyDefinition} from '../src/batey'
import {Request, Response} from 'express'

test('Batey creates a route from the definition passed to it.', ()=> {
    const definition: BateyDefinition = {
        routes: [
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
    }

    const router = Batey(definition)
})