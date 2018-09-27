const Nick = require("nickjs")
const _ = require("underscore")
var parseArgs = require('minimist')
const fs = require('fs')
const nick = new Nick({})
let blacklist = "{}"
try {
	const list = fs.readFileSync('blacklist.json', {'encoding': 'utf8'})
	blacklist = JSON.parse(list)
}
catch (e) {
	blacklist = JSON.parse(blacklist)
}
let session = undefined
let count = 0
const parsedArgs = _.omit(parseArgs(process.argv), ['_'])
if (parsedArgs.c) {
	count = parsedArgs.c
}
if (parsedArgs.count) {
	count = parsedArgs.count
}
if(!parsedArgs.s && !parsedArgs.session) {
	throw new Error('Missing session argument. Please supply it via -s or --session')
}
if (parsedArgs.s) {
	session = parsedArgs.s
}
if (parsedArgs.session) {
	session = parsedArgs.session
}

async function findElements(tab) {
	try {
		await tab.waitUntilPresent('.invitation-card__title')
		await tab.scroll(0, 500)
		await tab.scroll(0, 1000)
		await tab.scroll(0, 1500)
		await tab.scroll(0, 2000)
		await tab.scroll(0, 2500)
		await tab.scroll(0, 3000)
		await tab.scroll(0, 3500)
		await tab.scroll(0, 4000)
		await tab.scroll(0, 4500)
		await tab.scroll(0, 5000)
		await tab.scroll(0, 6500)
		await tab.scroll(0, 7000)
		await tab.scroll(0, 7500)
		await tab.scroll(0, 8000)
		await tab.scroll(0, 8500)
		await tab.scroll(0, 9000)
		const contacts = await tab.evaluate(getContacts)
		blacklist = contacts.reduce(function(hash, contact) {
			const profile = _.keys(contact)[0]
			const name = _.values(contact)[0]
			var o = {}
			o[profile] = name
			return Object.assign(hash, o)
		}, blacklist)
	}
	catch (e) {
		console.log('whoops')
		nick.exit()
	}
}

/** Get a list of contact links/profile names for use in other LinkedIn script [skipping contacts we have tried to invite previously] */
function getContacts(arg, cb) {
  var contacts = $('.invitation-card--selectable').map(function(element) {
  	const key = $(this).find('.invitation-card__picture').attr('href')
  		.replace('in/', '')
  		.replace(/(\/)/g, '')
  	const value = $(this).find('.invitation-card__title').html()
  		.trim()
  	const o = {}
  	o[key] = value
  	return o
  })  
  return cb(null, $.makeArray(contacts))
}

(async () => {
	const tab = await nick.newTab()
	await nick.setCookie({
	  name: "li_at",
	  value: session,
	  domain: "www.linkedin.com"
	})
	await tab.open('https://www.linkedin.com/mynetwork/invitation-manager/sent/')
	await findElements(tab)
})()
.then(function() {
	fs.writeFileSync('blacklist.json', JSON.stringify(blacklist), 'utf8')
	nick.exit()
})