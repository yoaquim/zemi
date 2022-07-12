import express, {Request, Response} from 'express'
import batey, {BateyRoute, BateyMethod} from './batey'

const {GET, POST} = BateyMethod
const routes: Array<BateyRoute> = [
    {
        path: '/pets/:id',
        [GET]: function (request: Request, response: Response) {
            const {id} = request.params
            const query = request.query
            response.status(200).json({id, pets: ['dogs', 'cats'], query})
        },
        [POST]: function (request: Request, response: Response) {
            const {id} = request.params
            const {new_pet} = request.body
            response.status(200).json({id, new_pet})
        },
        routes: [
            {
                path: '/cats',
                [GET]: function (request: Request, response: Response) {
                    const {id} = request.params
                    response.status(200).json({id, data: ['Kali', 'Ahkila']})
                }
            },
            {
                path: '/dogs',
                [GET]: function (request: Request, response: Response) {
                    const {id} = request.params
                    response.status(200).json({id, data: ['Fufu', 'Meow']})
                }
            },
        ]
    }
]

const app = express()
app.use(express.json())
app.use('/', batey(routes))
app.listen(8000, (): void => console.log(`----- SERVER START -----`))
