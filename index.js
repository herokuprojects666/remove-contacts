const Nick = require("nickjs")
const _ = require("underscore")
var parseArgs = require('minimist')
const fs = require('fs')
let blacklist = {}
try {
	blacklist = fs.readFileSync('blacklist.json', {'encoding': 'utf8'})
}
catch (e) {

}
console.log('blacklist is ', blacklist)