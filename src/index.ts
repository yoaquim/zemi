import express, {NextFunction, Response} from 'express'
import zemi from './core'
import {ZemiRoute, ZemiMethod, ZemiRequest} from './types'

const {GET, POST} = ZemiMethod
const routes: Array<ZemiRoute> = [
    {
        name: 'pets',
        path: '/pets/:id',
        middleware: [
            function (request: ZemiRequest, response: Response, next: NextFunction) {
                console.log('NAMED ROUTES:', request.namedRoutes)
                next()
            },
        ],
        [GET]: function (request: ZemiRequest, response: Response) {
            response.status(200).json(request.namedRoutes)
        },
        routes: [
            {
                name: 'dogs',
                path: '/dogs',
            },
            {
                name: 'cats',
                path: '/cats',
                routes: [
                    {
                        name: 'tigers',
                        path: '/tiggers'
                    }
                ]
            }
        ]
    }
]

const app = express()
app.use(express.json())
app.use('/', zemi(routes))
app.listen(8000, (): void => console.log(`----- SERVER START -----`))
