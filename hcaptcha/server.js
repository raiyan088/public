const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')
const fs = require('fs')

let browser = null
let page = null
let mClick = 0

let mPath = __dirname+'\\hcaptcha_solver'

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')


puppeteer.use(StealthPlugin())


startBrowser()


async function startBrowser() {
    try {
        browser = await puppeteer.launch({
            headless: false,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage',
                `--disable-extensions-except=${mPath}`,
                `--load-extension=${mPath}`,
            ]
        })
    
        page = (await browser.pages())[0]

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        
        await page.goto('chrome-extension://hlifkpholllijblknnmbfagnkjneagid/popup/popup.html', { waitUntil: 'load', timeout: 0 })

        let mInstall = await checkExtensionInstall()

        if (mInstall) {
            await page.setRequestInterception(true)

            page.on('request', request => {
                if (request.url() == 'https://api.render.com/graphql') {
                    if(request.method() == 'OPTIONS') {
                        request.continue()
                    } else {
                        try {
                            let data = JSON.parse(request.postData())
                            sendToken(data['variables']['signup']['hcaptchaToken'])
                            console.log('---TOKEN-SEND---')
                        } catch (error) {}
                        request.abort()
                    }
                } else {
                    request.continue()
                }
            })
            
            page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
            
            await pageLoad()

            console.log('---LOAD---')

            await waitForNextClick()

            console.log('---COMPLETED---')
            process.exit(0)
        } else {
            console.log('---INSTALL-FAILED----')
            process.exit(0)
        }
    } catch (error) {
        console.log(error);
        console.log('---EXIT----')
        process.exit(0)
    }
}

async function pageLoad() {
    await page.goto('https://dashboard.render.com/register', { waitUntil: 'load', timeout: 0 })

    await delay(1000)

    await page.type('input[name="email"]', 'asmamiss821@gmail.com')
    await delay(500)
    await page.type('input[name="password"]', 'hgsfhkywe')
    await delay(1000)

    mClick = new Date().getTime()+60000
    await page.click('button[type="submit"]')
}

async function sendToken(token) {
    try {
        await axios.put(BASE_URL+'token/'+new Date().getTime()+'.json', JSON.stringify({ token:token }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    } catch (error) {}

    mClick = 0
}


async function waitForNextClick() {
    while (true) {
        try {
            let end = new Date().getTime()
            let start = end-100000

            let response = await axios.get(BASE_URL+'token.json?orderBy="$key"&startAt="'+start+'"&endAt="'+end+'"&limitToFirst=1')

            if (response && (response.data == null || response.data == 'null')) {
                if (mClick == 0) {
                    mClick = new Date().getTime()+60000
                    await page.click('button[type="submit"]')
                } else if (mClick < new Date().getTime()) {
                    mClick = new Date().getTime()+60000
                    await pageLoad()
                    console.log('---RE-LOAD---')
                }
            }
        } catch (error) {}

        await delay(3000)
    }
}

async function checkExtensionInstall() {
    await delay(1000)

    return await page.evaluate(() => {
        let root = document.querySelector('script[src="popup.js"]')
        if (root) {
            return true
        }
        return false
    })
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
