import {buildNamedRoutes} from '../src/helpers'
import {ZemiRoute} from '../src/types'

describe('buildNamedRoutes can...', () => {
    test('returns an object with the name of the route as the key, and the path of the route as the value', () => {
        const routes: Array<ZemiRoute> = [
            {
                name: 'pets',
                path: '/pets/:id',
            },
            {
                name: 'humans',
                path: '/humans',
            },
        ]

        const result = buildNamedRoutes(routes)
        expect(result).toEqual({
            'pets': '/pets/:id',
            'humans': '/humans',
        })
    })

    test('returns named routes for all routes and nested routes', () => {
        const routes: Array<ZemiRoute> = [
            {
                name: 'pets',
                path: '/pets/:id',
                routes: [
                    {
                        name: 'dogs',
                        path: '/dogs',
                    },
                    {
                        name: 'cats',
                        path: '/cats',
                    }
                ]
            },
            {
                name: 'humans',
                path: '/humans?foo=bar&baz=tur',
            },
            {
                name: 'plants',
                path: '/plants',
                routes: [
                    {
                        name: 'carnivore',
                        path: '/carnivore/:name',
                        routes: [
                            {name: 'dangerous', path: '/dangerous',},
                        ]
                    }
                ]
            }
        ]

        const result = buildNamedRoutes(routes)
        expect(result).toEqual({
            'pets': '/pets/:id',
            'pets-dogs': '/pets/:id/dogs',
            'pets-cats': '/pets/:id/cats',
            'humans': '/humans?foo=bar&baz=tur',
            'plants': '/plants',
            'plants-carnivore': '/plants/carnivore/:name',
            'plants-carnivore-dangerous': '/plants/carnivore/:name/dangerous',
        })
    })
})