const { tests } = require('./helpers')
require('./get-json.test')
require('./geocode.test')
require('./forecast.test')
require('./weather.test')
require('./templates.test')

const run = async () => {
    let failures = 0
    for (const { name, run } of tests) {
        try {
            await run()
            console.log('PASS ' + name)
        } catch (error) {
            failures++
            console.error('FAIL ' + name, error)
        }
    }
    console.log(`${tests.length - failures}/${tests.length} tests passed`)
    if (failures) process.exitCode = 1
}
run().catch((error) => { console.error(error); process.exitCode = 1 })
