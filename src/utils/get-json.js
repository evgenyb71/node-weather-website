const https = require('https')

const getJson = (url, callback) => {
    let finished = false
    let request
    const finish = (error, response) => {
        if (finished) return
        finished = true
        clearTimeout(timer)
        callback(error, response)
    }
    // A total deadline also covers DNS, TLS and a stalled response body.
    const timer = setTimeout(() => {
        const error = new Error('Service request timed out')
        request.destroy(error)
        finish(error)
    }, 10000)

    try {
        request = https.get(url, (response) => {
            response.on('error', finish)
            response.on('aborted', () => finish(new Error('Service response interrupted')))
            response.on('close', () => {
                if (!response.complete) finish(new Error('Service response incomplete'))
            })
            // These fixed API endpoints must respond directly; do not follow redirects.
            if (response.statusCode >= 300 && response.statusCode < 400) {
                response.resume()
                return finish(new Error('Unexpected service redirect'))
            }
            response.setEncoding('utf8')
            let text = ''
            response.on('data', (chunk) => { text += chunk })
            response.on('end', () => {
                if (finished) return
                let body
                try {
                    body = JSON.parse(text)
                } catch (error) {
                    return finish(error)
                }
                finish(undefined, { statusCode: response.statusCode, body })
            })
        })
    } catch (error) {
        return finish(error)
    }
    request.on('error', finish)
}

module.exports = getJson
