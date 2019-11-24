const request = require('request')

// Geocoding
// const geoURL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/Los%20Angeles.json?access_token=pk.eyJ1IjoiZWJvY2hrYXJldiIsImEiOiJjazE2ejQ5aGwxYXI4M2JvMzhkOTJ0YzFqIn0.bqB3eEcW_K9rsBWChTRSlw&limit=1'

const geocode = (address, callback) => {
    const mbBaseURL = 'https://api.mapbox.com/geocoding/v5/'
    const mbGeoURL = 'mapbox.places'
    const mbToken = "pk.eyJ1IjoiZWJvY2hrYXJldiIsImEiOiJjazE2ejQ5aGwxYXI4M2JvMzhkOTJ0YzFqIn0.bqB3eEcW_K9rsBWChTRSlw"
    const searchText = encodeURIComponent(address)
    
    const geoURL = mbBaseURL + mbGeoURL + '/' + searchText + '.json' + '?' +
        'access_token=' + mbToken +
        '&limit=1'
    // console.log(geoURL)

    request({ url: geoURL, json: true }, (error, {body:responseBody}) => {
        if (error) {
            callback('Unable to connect to location services!', undefined)
        } else if (!responseBody.features && responseBody.message) {
            callback('Error received: ' + responseBody.message, undefined)
        } else if (responseBody.features.length == 0) {
            callback('Unable to find location, try another search', undefined)
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