import express, {Request, Response} from 'express'
import bodyParser from 'body-parser'
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
        }
    },
    {
        path: '/new-pet',
        method: 'post',
        handler: function (request: Request, response: Response) {
            const {pet} = request.body
            response.status(200).json({
                new_pet: pet,
            })
        },
    }
]

const app = express()
app.use(express.json())
app.use('/', batey({routes}))
app.listen(8000, (): void => console.log(`----- SERVER START -----`))
