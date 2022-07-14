import express, {NextFunction, Request, Response} from 'express'
import batey, {Route, Method} from './batey'

const {GET, POST} = Method
const routes: Array<Route> = [
    {
        path: '/pets/:id',
        middleware: [
            function (request: Request, response: Response, next: NextFunction) {
                console.log('QUERY:', JSON.stringify(request.query))
                next()
            },
            function (request: Request, response: Response, next: NextFunction) {
                console.log('BODY:', JSON.stringify(request.body))
                next()
            }
        ],
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
                path: '/dogs',
                middleware: [
                    function (request: Request, response: Response, next: NextFunction) {
                        console.log('PARAMS:', JSON.stringify(request.params))
                        next()
                    },
                ],
                [GET]: function (request: Request, response: Response) {
                    const {id} = request.params
                    response.status(200).json({id, data: ['Kali', 'Ahkila']})
                }
            },
            {
                path: '/cats',
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
