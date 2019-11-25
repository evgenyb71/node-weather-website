const request = require('request')

const forecast = (latitude, longitude, options, callback) => {
    // https://api.darksky.net/forecast/[key]/[latitude],[longitude]
    const weatherBaseURL = 'https://api.darksky.net/forecast/'
    const appKey = '734a087902696115cd095442c28edfb5'
    ///37.8267,-122.4233?units=si&lang=ru'
    const url = weatherBaseURL + appKey + '/' + latitude + ',' + longitude + options

    request({ url: url, json: true }, (error, {body}) => {
        if (error) {
            callback('Unable to connect to weather services!', undefined)
        } else if (body.error) {
            callback('Unable to get a forecasrt for this location!', undefined)
        } else {
            // console.log(response.body.currently)
            const precipProc = body.currently.precipProbability > 0 ? body.currently.precipProbability * 100 : 0
            const precipType = body.currently.precipType ? body.currently.precipType : 'rain'
            const resultForecast = body.daily.data[0].summary +
                ' It is currently ' +
                // chalk.inverse(response.body.currently.temperature) +
                body.currently.temperature + ' degrees with humidity '+
                Math.round( body.currently.humidity * 100 ) + '%. ' +
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