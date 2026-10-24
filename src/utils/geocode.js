const getJson = require('./get-json')


const geocode = (address, callback) => {
    const mbBaseURL = 'https://api.mapbox.com/geocoding/v5/'
    const mbGeoURL = 'mapbox.places'
    const mbToken = process.env.MAPBOX_ACCESS_TOKEN
    if (!mbToken) {
        return callback('Unable to connect to location services!', undefined)
    }
    const searchText = encodeURIComponent(address)
    
    const geoURL = mbBaseURL + mbGeoURL + '/' + searchText + '.json' + '?' +
        'access_token=' + encodeURIComponent(mbToken) +
        '&limit=1'
    // console.log(geoURL)

    getJson(geoURL, (error, response) => {
        const responseBody = response && response.body
        if (error) {
            callback('Unable to connect to location services!', undefined)
        } else if (responseBody && !responseBody.features && responseBody.message) {
            callback('Error received: ' + responseBody.message, undefined)
        } else if (response.statusCode < 200 || response.statusCode >= 300 ||
            !responseBody || !Array.isArray(responseBody.features)) {
            callback('Unable to connect to location services!', undefined)
        } else if (responseBody.features.length == 0) {
            callback('Unable to find location, try another search', undefined)
        } else if (!responseBody.features[0] ||
            !Array.isArray(responseBody.features[0].center) ||
            !responseBody.features[0].center.slice(0, 2).every(Number.isFinite) ||
            responseBody.features[0].center.length < 2 ||
            typeof responseBody.features[0].place_name !== 'string') {
            callback('Unable to connect to location services!', undefined)
        } else {
            callback(undefined, {
                longitude: responseBody.features[0].center[0],
                latitude: responseBody.features[0].center[1],
                location: responseBody.features[0].place_name
            })
        }
    })
}

module.exports = geocode
