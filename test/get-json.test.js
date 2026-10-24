const EventEmitter = require('events')
const { assert, load, test, plain } = require('./helpers')

const transport = (statusCode = 200) => {
    const request = new EventEmitter()
    const response = new EventEmitter()
    response.statusCode = statusCode
    response.complete = false
    response.setEncoding = (encoding) => assert.strictEqual(encoding, 'utf8')
    response.resume = () => { response.drained = true }
    request.destroy = (error) => {
        request.destroyed = true
        request.emit('error', error)
    }
    let onResponse
    let deadline
    let cleared = false
    const calls = []
    const getJson = load('src/utils/get-json.js', {
        https: { get: (url, callback) => {
            assert.strictEqual(url, 'https://example.test/data')
            onResponse = callback
            return request
        } }
    }, {
        setTimeout: (callback, delay) => {
            assert.strictEqual(delay, 10000)
            deadline = callback
            return 1
        },
        clearTimeout: () => { cleared = true }
    })
    getJson('https://example.test/data', (error, result) => calls.push({ error, result }))
    return {
        request, response, calls,
        respond: () => onResponse(response),
        end: (text) => {
            response.emit('data', text)
            response.complete = true
            response.emit('end')
            response.emit('close')
        },
        timeout: () => deadline(),
        cleared: () => cleared
    }
}

test('GET parses chunked UTF-8 JSON and clears its deadline', () => {
    const t = transport()
    t.respond()
    t.response.emit('data', '{"name":"Мо')
    t.end('сква"}')
    assert.deepStrictEqual(plain(t.calls[0].result), { statusCode: 200, body: { name: 'Москва' } })
    assert.strictEqual(t.calls.length, 1)
    assert.strictEqual(t.cleared(), true)
})
for (const text of ['', 'not JSON', '{']) {
    test('GET rejects invalid JSON: ' + JSON.stringify(text), () => {
        const t = transport()
        t.respond()
        t.end(text)
        assert(t.calls[0].error)
        assert.strictEqual(t.calls.length, 1)
        assert(t.cleared())
    })
}
test('GET returns non-2xx JSON for provider error handling', () => {
    const t = transport(401)
    t.respond()
    t.end('{"message":"Unauthorized"}')
    assert.deepStrictEqual(plain(t.calls[0].result), { statusCode: 401, body: { message: 'Unauthorized' } })
})
test('GET rejects and drains redirects', () => {
    const t = transport(302)
    t.respond()
    t.end('')
    assert(t.calls[0].error)
    assert(t.response.drained)
    assert.strictEqual(t.calls.length, 1)
})
test('GET handles connection failure without a response', () => {
    const t = transport()
    t.request.emit('error', new Error('DNS failure'))
    assert(t.calls[0].error)
    assert(t.cleared())
})
for (const event of ['aborted', 'error', 'close']) {
    test('GET handles interrupted response: ' + event, () => {
        const t = transport()
        t.respond()
        t.response.emit(event, new Error('interrupted'))
        t.end('{}')
        assert(t.calls[0].error)
        assert.strictEqual(t.calls.length, 1)
        assert(t.cleared())
    })
}
test('GET destroys a timed-out request and completes once despite competing events', () => {
    const t = transport()
    t.respond()
    t.timeout()
    t.response.emit('aborted')
    t.request.emit('error', new Error('late error'))
    t.end('{}')
    assert(t.request.destroyed)
    assert(t.calls[0].error)
    assert.strictEqual(t.calls.length, 1)
    assert(t.cleared())
})
test('GET handles synchronous URL/transport errors', () => {
    const getJson = load('src/utils/get-json.js', { https: { get: () => { throw new Error('Invalid URL') } } })
    let calls = 0
    getJson('invalid', (error) => { assert(error); calls++ })
    assert.strictEqual(calls, 1)
})
test('GET does not catch and repeat exceptions thrown by the caller', () => {
    let respond
    const request = new EventEmitter()
    const response = new EventEmitter()
    response.statusCode = 200
    response.setEncoding = () => {}
    const getJson = load('src/utils/get-json.js', { https: { get: (url, cb) => { respond = cb; return request } } })
    let calls = 0
    getJson('https://example.test', () => { calls++; throw new Error('Caller error') })
    respond(response)
    response.emit('data', '{}')
    assert.throws(() => response.emit('end'), /Caller error/)
    assert.strictEqual(calls, 1)
})
test('GET deadline covers a connection that never receives a response', () => {
    const t = transport()
    t.timeout()
    assert(t.request.destroyed)
    assert(t.calls[0].error)
    assert.strictEqual(t.calls.length, 1)
    assert(t.cleared())
})
