const { assert, load, test, plain } = require('./helpers')
const check = (body, statusCode = 200, error) => {
    let result
    let requestedUrl
    const geocode = load('src/utils/geocode.js', {
        './get-json': (url, callback) => {
            requestedUrl = url
            callback(error, error ? undefined : { statusCode, body })
        }
    }, { process: { env: { MAPBOX_ACCESS_TOKEN: 'test-mapbox-token' } } })
    geocode('New York / Москва', (err, data) => { result = { error: err, data } })
    return { result, requestedUrl }
}
test('geocode encodes address and preserves coordinate order and location', () => {
    const { result, requestedUrl } = check({ features: [{ center: [-74, 40], place_name: 'New York' }] })
    assert(requestedUrl.includes('/New%20York%20%2F%20%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0.json?'))
    assert(requestedUrl.endsWith('&limit=1'))
    assert.strictEqual(result.error, undefined)
    assert.deepStrictEqual(plain(result.data), { longitude: -74, latitude: 40, location: 'New York' })
})
test('geocode preserves empty-result and provider error messages', () => {
    assert.strictEqual(check({ features: [] }).result.error, 'Unable to find location, try another search')
    assert.strictEqual(check({ message: 'Unauthorized' }, 401).result.error, 'Error received: Unauthorized')
})
for (const body of [null, {}, { features: null }, { features: [null] }, { features: [{}] },
    { features: [{ center: [1], place_name: 'x' }] }, { features: [{ center: ['1', 2], place_name: 'x' }] }]) {
    test('geocode safely rejects malformed payload ' + JSON.stringify(body), () => {
        assert.strictEqual(check(body).result.error, 'Unable to connect to location services!')
    })
}
test('geocode handles transport errors and non-2xx without provider messages', () => {
    assert.strictEqual(check(undefined, 200, new Error('offline')).result.error, 'Unable to connect to location services!')
    assert.strictEqual(check({ features: [] }, 500).result.error, 'Unable to connect to location services!')
})
test('geocode uses the configured token in its URL', () => {
    assert(check({ features: [] }).requestedUrl.includes('access_token=test-mapbox-token'))
})
test('geocode reports missing credentials without making a request', () => {
    const geocode = load('src/utils/geocode.js', {
        './get-json': () => { throw new Error('Unexpected outbound request') }
    }, { process: { env: {} } })
    let calls = 0
    geocode('Paris', (error, data) => {
        calls++
        assert.strictEqual(error, 'Unable to connect to location services!')
        assert.strictEqual(data, undefined)
    })
    assert.strictEqual(calls, 1)
})
