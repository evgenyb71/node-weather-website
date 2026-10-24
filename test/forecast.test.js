const { assert, load, test } = require('./helpers')
const fixture = () => ({
    currently: { temperature: 12, humidity: 0.556, precipProbability: 0.25, precipType: 'snow' },
    daily: { data: [{ summary: 'Cloudy.', temperatureHigh: 15, temperatureLow: 5 }] }
})
const check = (body, statusCode = 200, error) => {
    let result
    let requestedUrl
    const forecast = load('src/utils/forecast.js', {
        './get-json': (url, callback) => {
            requestedUrl = url
            callback(error, error ? undefined : { statusCode, body })
        }
    }, { process: { env: { DARKSKY_API_KEY: 'test-darksky-key' } } })
    forecast(40, -74, '?units=si&lang=ru', (err, data) => { result = { error: err, data } })
    return { result, requestedUrl }
}
test('forecast preserves URL options, output string, percentages and rounding', () => {
    const { result, requestedUrl } = check(fixture())
    assert(requestedUrl.endsWith('/40,-74?units=si&lang=ru'))
    assert.strictEqual(result.error, undefined)
    assert.strictEqual(result.data, 'Cloudy. It is currently 12 degrees with humidity 56%. The high today is 15 with a low of 5. There is a 25% chance of snow')
})
test('forecast defaults to rain and handles zero precipitation', () => {
    const body = fixture()
    delete body.currently.precipType
    body.currently.precipProbability = 0
    assert(check(body).result.data.endsWith('There is a 0% chance of rain'))
})
test('forecast preserves provider error message even on non-2xx', () => {
    assert.strictEqual(check({ error: 'Invalid location' }, 400).result.error, 'Unable to get a forecasrt for this location!')
})
for (const body of [null, {}, { currently: {} }, { currently: {}, daily: { data: [] } },
    { currently: {}, daily: { data: [null] } }, { currently: {}, daily: { data: [{}] } }]) {
    test('forecast safely rejects malformed payload ' + JSON.stringify(body), () => {
        assert.strictEqual(check(body).result.error, 'Unable to connect to weather services!')
    })
}
test('forecast handles transport errors, missing numeric fields and non-2xx', () => {
    assert.strictEqual(check(undefined, 200, new Error('offline')).result.error, 'Unable to connect to weather services!')
    assert.strictEqual(check(fixture(), 500).result.error, 'Unable to connect to weather services!')
    const body = fixture()
    delete body.currently.temperature
    assert.strictEqual(check(body).result.error, 'Unable to connect to weather services!')
})
test('forecast uses the configured key in its URL', () => {
    assert(check(fixture()).requestedUrl.includes('/forecast/test-darksky-key/'))
})
test('forecast reports missing credentials without making a request', () => {
    const forecast = load('src/utils/forecast.js', {
        './get-json': () => { throw new Error('Unexpected outbound request') }
    }, { process: { env: {} } })
    let calls = 0
    forecast(48, 2, '', (error, data) => {
        calls++
        assert.strictEqual(error, 'Unable to connect to weather services!')
        assert.strictEqual(data, undefined)
    })
    assert.strictEqual(calls, 1)
})
