const path = require('path')
const express = require('express')
const hbs = require('hbs')

const geocode = require('./utils/geocode')
const forecast = require('./utils/forecast')

const app = express()
const port = process.env.PORT || 3000

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')
const viewPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

// Setup handlebars engine & view location
app.set('view engine', 'hbs')
app.set('views', viewPath)
hbs.registerPartials(partialsPath)

// Setup static directory to serve
app.use(express.static(publicDirectoryPath))

app.get('', (req, res) => {
    res.render('index', {
        title: 'Weather',
        name: 'EugeneB'
    })
})
// note- I also kept about statuc!
app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About page',
        name: 'EugeneB'
    })
})

app.get('/help', (req, res) => {
    res.render('help', {
        title: 'Help page',
        helpText: 'This is Weather App',
        name: 'EugeneB'
    })
})

app.get('/weather', (req, res) => {
    if (!req.query.address) {
        return res.send({
            error: 'You must provide an address!'
        })
    }

    geocode(req.query.address, (error, {latitude, longitude, location} = {}) => {
        if(error) {
            return res.send({error})            
        }
        forecast(latitude, longitude, '', (error, forecastData) => {
            if(error) {
                return res.send({error})            
            }
            res.send( {
                address: req.query.address,
                location,
                forecast: forecastData
            })
        })
    })
})


//404 pages
app.get('/help/*', (req, res) => {
    res.render('404', {
        title: '404 page',
        errorText: 'Help article not found',
        name: 'EugeneB'
    })
})

app.get('*', (req, res) => {
    res.render('404', {
        title: '404',
        errorText: 'Page not found',
        name: 'EugeneB'
    })
})


// app.com
// app.com/about

// run the server
app.listen(port, ()=> {
    console.log('Server is up on port ' + port)
})