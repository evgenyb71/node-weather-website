const http = require('http')
const express = require('express')
const { assert, load, test } = require('./helpers')

const weather = async (query, geocode, forecast) => {
    const app = express()
    app.listen = () => {} // Load existing route registration without starting the production listener.
    load('src/app.js', { express: Object.assign(() => app, { static: express.static }),
        './utils/geocode': geocode, './utils/forecast': forecast })
    const server = http.createServer(app)
    await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
    })
    try {
        return await new Promise((resolve, reject) => {
            http.get({ host: '127.0.0.1', port: server.address().port, path: '/weather' + query, agent: false }, (response) => {
                let text = ''
                response.setEncoding('utf8')
                response.on('data', (chunk) => { text += chunk })
                response.on('error', reject)
                response.on('end', () => {
                    try { resolve(JSON.parse(text)) } catch (error) { reject(error) }
                })
            }).on('error', reject)
        })
    } finally {
        await new Promise((resolve) => server.close(resolve))
    }
}
const unexpected = () => { throw new Error('Unexpected service call') }
test('/weather requires an address before calling services', async () => {
    assert.deepStrictEqual(await weather('', unexpected, unexpected), { error: 'You must provide an address!' })
})
test('/weather forwards geocoding failures without calling forecast', async () => {
    assert.deepStrictEqual(await weather('?address=Paris', (address, cb) => cb('Location failed'), unexpected), { error: 'Location failed' })
})
const geocode = (address, cb) => {
    assert.strictEqual(address, 'Paris')
    cb(undefined, { latitude: 48, longitude: 2, location: 'Paris, France' })
}
test('/weather forwards forecast failures', async () => {
    assert.deepStrictEqual(await weather('?address=Paris', geocode, (lat, lon, opts, cb) => cb('Forecast failed')), { error: 'Forecast failed' })
})
test('/weather preserves its public JSON response and helper arguments', async () => {
    const result = await weather('?address=Paris', geocode, (lat, lon, opts, cb) => {
        assert.strictEqual(lat, 48)
        assert.strictEqual(lon, 2)
        assert.strictEqual(opts, '')
        cb(undefined, 'Sunny')
    })
    assert.deepStrictEqual(result, { address: 'Paris', location: 'Paris, France', forecast: 'Sunny' })
})
