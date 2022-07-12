import express, {Request, Response} from 'express'
import batey, {BateyRoute} from './batey'

const routes: Array<BateyRoute> = [
    {
        path: '/pets/:id',
        method: 'get',
        handler: function (request: Request, response: Response) {
            const id: string = request.params.id
            response.status(200).json({
                id,
                dogs: ['Kali', 'Ahkila'],
                cats: ['Fufu', 'Meow']
            })
        },
        routes: [
            {
                routes: [
                    {
                        path: '/dogs/:foobar',
                        method: 'get',
                        handler: function (request: Request, response: Response) {
                            const foobar: string = request.params.foobar
                            const id: string = request.params.id
                            response.status(200).json({
                                id,
                                foobar,
                                data: ['Kali', 'Ahkila'],
                            })
                        },
                    },
                    {
                        path: '/cat',
                        method: 'get',
                        handler: function (request: Request, response: Response) {
                            response.status(200).json({
                                data: ['Fufu', 'Meow']
                            })
                        },
                    }
                ]
            }
        ]
    }
]

const app = express()
app.use('/', batey({routes}))
app.listen(8000, (): void => console.log(`----- SERVER START -----`))
