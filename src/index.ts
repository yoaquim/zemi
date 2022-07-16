import express from 'express'
import Zemi from './_core'
import routes from './routes'

const app = express()
app.use(express.json())
app.use('/', Zemi(routes))
app.listen(8000, (): void => console.log(`----- SERVER START -----`))
