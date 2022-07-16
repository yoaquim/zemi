import {ZemiOpenApiDoc} from './src/types/openapi.types'
import ZemiOpenApiDocGenerator from './src/_openapi'
import routes from './src/routes'

const doc: ZemiOpenApiDoc = {
    openapi: '3.0.0',
    info: {
        description: 'API for pet store management',
        version: '1.0',
        title: 'Pet Store API',
        contact: {
            email: 'hello@petstore.com'
        }
    },
    tags: [
        {name: 'pets', description: 'related to pets'},
        {name: 'details', description: 'related to store details'}
    ],
    servers: [
        {url: 'https://api.bestpetstore.com/v1'}
    ]
}

ZemiOpenApiDocGenerator({doc, routes})
