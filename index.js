const Nick = require("nickjs")
const _ = require("underscore")
const parseArgs = require('minimist')
const fs = require('fs')

const nick = new Nick({
	timeout: 30000
})

let badRedirect = false
let blacklist = "{}"
let count = 0
let pagesRemaining = 2
let session = undefined

/** If we fail to load the file, that means it doesn't exist. Fall back to default empty object */
try {
	const list = fs.readFileSync('blacklist.json', {'encoding': 'utf8'})
	blacklist = JSON.parse(list)
}
catch (e) {
	blacklist = JSON.parse(blacklist)
}

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

/** When all is said and done, build a new list of blacklisted contacts then write it to file system */
const buildBlacklist = function() {
	return new Promise(function(r, j) {
		fs.writeFileSync('blacklist.json', JSON.stringify(blacklist), 'utf8')
		console.log('final blacklist is ', blacklist)
		console.log(_.keys(blacklist).length)
		r()
		nick.exit()
	})
}

async function findElements(tab) {
	let willNavigate = false
	if (pagesRemaining == 0) {
		return buildBlacklist()
	}
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
		await tab.waitUntilPresent('.mn-invitation-pagination')
		const buttons = await tab.evaluate(getPages)
		const contacts = await tab.evaluate(getContacts)
		if (buttons.pages.length && buttons.selectedPage != buttons.pages[0]) {
			blacklist = contacts.reduce(function(hash, contact) {
				const profile = _.keys(contact)[0]
				const name = _.values(contact)[0]
				var o = {}
				o[profile] = name
				return Object.assign(hash, o)
			}, blacklist)
			willNavigate = true
			pagesRemaining--
			const previousIndex = buttons.previousPage
			/** Selector for selecting all contacts on the page */
			await tab.waitUntilPresent('#contact-select-checkbox')
			await tab.click('#contact-select-checkbox')
			/** Selector that isn't visible until at least one contact is selected */
			await tab.waitUntilVisible('.mn-list-toolbar__right-button')
			await tab.click('.mn-list-toolbar__right-button .button-primary-medium')
			/** Wrapper element that pops up after we remove an invite. It eventually subsides on its own so naturally makes a good check */
			await tab.waitUntilPresent('.artdeco-toast.artdeco-toast--success')
			await tab.wait(4000)
			await tab.waitWhilePresent('.artdeco-toast artdeco-toast--success')
			/** Loading spinner css */
			await tab.waitWhilePresent('.blue.loader', 20000)
			/** Unfortunately, we need a wait otherwise we will only get ever 10 results. Some js dev didn't do a good job */
			await tab.wait(4000)
			await findElements(tab)
		}
		/** We are on the first page of results. Trigger a click on last page so we can start withdrawing invites pho reals */
		if (buttons.pages.length && buttons.selectedPage == buttons.pages[0]) {
			const currentUrl = await tab.getUrl() 
			willNavigate = true
			let lastIndex = buttons.pages[buttons.pages.length - 1]
			/** If the url didn't change on our attempt to select a page that means we got redirected back to first page. [LinkedIn bug] */
			if (badRedirect) {
				const content = await tab.evaluate(getContent, {index: lastIndex})
				await tab.open(`https://www.linkedin.com${content.page}`)
				await findElements(tab)
				return
			}
			/** Click on last page in numbered list of pages */
			await tab.click(`.mn-invitation-pagination li:nth-child(${lastIndex + 1}) a`)
			/** Loading spinner css */
			await tab.waitWhilePresent('.blue.loader', 20000)
			/** Unfortunately, we need a wait otherwise we will only get ever 10 results. Some js dev didn't do a good job */
			await tab.wait(4000)
			badRedirect = currentUrl == await tab.getUrl()
			await findElements(tab)
		}
		if (!willNavigate) {
			return buildBlacklist()
		}
	}
	catch (e) {
		nick.exit()
	}
}

/** Build up a meta object that represents the list of pages/clickable buttons below the list of contacts */
function getPages(arg, cb) {
	/** Right page incrementor */
	const nextPage = $('.mn-invitation-pagination')
		.find('a')
		.find('[type="chevron-right-icon"]')
	/** Left page incrementor */
	const previousPage = $('.mn-invitation-pagination')
		.find('a')
		.find('[type="chevron-left-icon"]')
	if (previousPage && nextPage) {
		const previousIndex = $(previousPage).parent().parent().index()
		const nextIndex = $(nextPage).parent().parent().index()
		const filteredPages = $('.mn-invitation-pagination').find('a').filter(function(element) {
			return ![previousIndex, nextIndex].includes($(this).parent().index())
	  })
	  const selectedPage = $('.mn-invitation-pagination').find('a').filter(function(element) {
			return $(this).hasClass('active')
	  })
	  const pages = $(filteredPages).map(function(element) {
	  	return $(this).parent().index()
	  })
	  return cb(null, {
	  	nextPage: nextIndex,
	  	previousPage: previousIndex,
	  	selectedPage: $(selectedPage).parent().index(),
	  	pages: $.makeArray(pages)
	  })
	}
	else {
	  return cb(null, {
	  	nextPage: null,
	  	previousPage: null,
	  	selectedPage: null,
	  	pages: []
	  })
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

/** Find the "real" last page of results in LinkedIn instead of the "bad" one we got */
function getContent(arg, cb) {
	const content = $('.mn-invitation-pagination').find('a').eq(arg.index - 1).attr('href')
	return cb(null, {
		page: content.replace(/(page=)[0-9]+/g, function(text) {
			return `page=${+(text.replace('page=', '')) - 1}`
		})
	})
}

(async () => {
	const tab = await nick.newTab()
	await nick.setCookie({
	  name: "li_at",
	  value: session,
	  domain: "www.linkedin.com"
	})
	try {
		await tab.open('https://www.linkedin.com/mynetwork/invitation-manager/sent/')
		await findElements(tab)
	}
	catch (e) {
		/** The only time this should happen is when the cooke domain is wrong. Perhaps add a block in here to try the alternate domain instead. */
	}

})()
.then(function() {
	console.log('in here be dragons')
	nick.exit()
})