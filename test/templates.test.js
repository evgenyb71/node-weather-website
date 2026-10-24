const http = require('http')
const express = require('express')
const { assert, load, test } = require('./helpers')

const createApp = () => {
    const app = express()
    app.listen = () => {}
    const unexpected = () => { throw new Error('Page rendering must not call weather services') }
    load('src/app.js', {
        express: Object.assign(() => app, { static: express.static }),
        './utils/geocode': unexpected,
        './utils/forecast': unexpected
    })
    return app
}

const getPage = async (path) => {
    const server = http.createServer(createApp())
    await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
    })
    try {
        return await new Promise((resolve, reject) => {
            http.get({ host: '127.0.0.1', port: server.address().port, path, agent: false }, (response) => {
                let body = ''
                response.setEncoding('utf8')
                response.on('data', (chunk) => { body += chunk })
                response.on('error', reject)
                response.on('end', () => resolve({ status: response.statusCode, body, headers: response.headers }))
            }).on('error', reject)
        })
    } finally {
        await new Promise((resolve) => server.close(resolve))
    }
}

for (const [path, title, content] of [
    ['/', 'Weather', 'Use this site to get your weather'],
    ['/about', 'About page', 'This is an exercise of Node.js course.'],
    ['/help', 'Help page', 'This is Weather App'],
    ['/help/missing', '404 page', 'Help article not found'],
    ['/missing', '404', 'Page not found']
]) {
    test('templates render ' + path + ' with shared header and footer', async () => {
        const response = await getPage(path)
        // Preserve existing route status behavior, including rendered error pages.
        assert.strictEqual(response.status, 200)
        assert(response.headers['content-type'].includes('text/html'))
        assert(response.body.includes('<h1>' + title + '</h1>'))
        assert(response.body.includes(content))
        assert(response.body.includes('<a href="/help">Help</a>'))
        assert(response.body.includes('Created by EugeneB'))
        assert(!response.body.includes('{{>'))
    })
}

test('template upgrade preserves static CSS delivery', async () => {
    const response = await getPage('/css/styles.css')
    assert.strictEqual(response.status, 200)
    assert(response.headers['content-type'].includes('text/css'))
    assert(response.body.includes('body'))
})

test('templates escape HTML in view values and shared partials', async () => {
    const app = createApp()
    const html = await new Promise((resolve, reject) => {
        app.render('help', {
            title: '<script>alert(1)</script>',
            helpText: '<img src=x onerror=alert(1)>',
            name: '<b>name</b>'
        }, (error, result) => error ? reject(error) : resolve(result))
    })
    assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
    assert(html.includes('&lt;img src&#x3D;x onerror&#x3D;alert(1)&gt;'))
    assert(html.includes('Created by &lt;b&gt;name&lt;/b&gt;'))
    assert(!html.includes('<script>'))
    assert(!html.includes('<img src=x'))
})
