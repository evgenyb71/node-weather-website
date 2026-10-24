const getJson = require('./get-json')

const forecast = (latitude, longitude, options, callback) => {
    // https://api.darksky.net/forecast/[key]/[latitude],[longitude]
    const weatherBaseURL = 'https://api.darksky.net/forecast/'
    const appKey = process.env.DARKSKY_API_KEY
    if (!appKey) {
        return callback('Unable to connect to weather services!', undefined)
    }
    ///37.8267,-122.4233?units=si&lang=ru'
    const url = weatherBaseURL + encodeURIComponent(appKey) + '/' + latitude + ',' + longitude + options

    getJson(url, (error, response) => {
        const body = response && response.body
        if (error) {
            callback('Unable to connect to weather services!', undefined)
        } else if (body && body.error) {
            callback('Unable to get a forecasrt for this location!', undefined)
        } else if (response.statusCode < 200 || response.statusCode >= 300 ||
            !body || !body.currently || !body.daily ||
            !Array.isArray(body.daily.data) || !body.daily.data[0] ||
            typeof body.daily.data[0].summary !== 'string' ||
            ![body.currently.temperature, body.currently.humidity,
                body.currently.precipProbability, body.daily.data[0].temperatureHigh,
                body.daily.data[0].temperatureLow].every(Number.isFinite)) {
            callback('Unable to connect to weather services!', undefined)
        } else {
            // console.log(response.body.currently)
            const precipProc = body.currently.precipProbability > 0 ? body.currently.precipProbability * 100 : 0
            const precipType = body.currently.precipType ? body.currently.precipType : 'rain'
            const resultForecast = body.daily.data[0].summary +
                ' It is currently ' +
                // chalk.inverse(response.body.currently.temperature) +
                body.currently.temperature + ' degrees with humidity '+
                Math.round( body.currently.humidity * 100 ) + '%. ' +
                'The high today is ' + body.daily.data[0].temperatureHigh + 
                ' with a low of ' + body.daily.data[0].temperatureLow + '. ' +
                'There is a ' +
                // chalk.inverse(precipProc) +
                precipProc +
                '% chance of ' +
                //chalk.inverse(precipType)
                precipType

            callback(undefined, resultForecast)
        }
    })
}

module.exports = forecast
