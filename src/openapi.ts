import {promises as fsPromises} from 'fs'
import {join} from 'path'
import {ZemiRoute} from './types'

export async function asyncWriteFile(filename: string, data: any) {
    /**
     * flags:
     *  - w = Open file for reading and writing. File is created if not exists
     *  - a+ = Open file for reading and appending. The file is created if not exists
     */
    try {
        await fsPromises.writeFile(join(__dirname, filename), data, {flag: 'a+',})

        const contents = await fsPromises.readFile(join(__dirname, filename), 'utf-8',)

        console.log(contents)

        return contents
    } catch (err) {
        console.log(err)
        return 'Something went wrong'
    }
}


export interface ZemiOpenApiDoc {
    openapi: number
    info: {
        title: string
        version: number
    }
    servers?: {
        url: string
    }
}

export async function ZemiOpenApi(doc: ZemiOpenApiDoc, routes: Array<ZemiRoute>) {
    const filename = ''
    await asyncWriteFile(filename, {})
    routes.forEach((route: ZemiRoute) => {
    })
}