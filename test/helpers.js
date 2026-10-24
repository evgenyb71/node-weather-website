const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const tests = []

const load = (file, mocks = {}, globals = {}) => {
    const filename = path.join(__dirname, '..', file)
    const module = { exports: {} }
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), Object.assign({
        module,
        exports: module.exports,
        require: (name) => Object.prototype.hasOwnProperty.call(mocks, name) ? mocks[name] : require(name),
        __dirname: path.dirname(filename),
        setTimeout,
        clearTimeout,
        process,
        console
    }, globals), { filename })
    return module.exports
}
const test = (name, run) => tests.push({ name, run })
const plain = (value) => JSON.parse(JSON.stringify(value))
module.exports = { assert, load, test, tests, plain }
