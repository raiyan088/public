const request = require('request')
const express = require('express')

let puppeteer = null
let chrome = {}

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    chrome = require("chrome-aws-lambda")
    puppeteer = require("puppeteer-core")
} else {
    puppeteer = require("puppeteer")
}

const app = express()

app.listen(process.env.PORT || 3000, () => {
    console.log('Listening on port 3000 ...')
})

let mLaunch = 0
let browser = null
let pages = {}
let options = {}
let start = new Date().getTime()
let end = 0
let mRequest = 0
let mReqID = 0
let mLastOpen = 1

console.log('Start: '+start)

setInterval(async () => {
    if(browser != null) {
        let temp = await browser.pages()
        let length = temp.length
        let count = (mRequest+1) - length
        if(count > 0) {
            let page = await browser.newPage()
            pages[length] = page
            length++
            page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
            page.goto('https://mybinder.org/v2/git/https%3A%2F%2Fgithub.com%2Faanksatriani%2Fmybinder.git/main')
        }
        await delay(1000)
        temp = pages[mLastOpen]
        if(temp) //await temp.bringToFront()
        
        if(mLastOpen >= length) {
            mLastOpen = 1
        } else {
            mLastOpen++
        }
    }
}, 2500)

app.get('/request', async function(req, res) {
    if(mRequest >= 10) {
        res.send('Reject')
    } else {
        mRequest++
        if(browser == null) {
            if(mLaunch != 0 && mLaunch < new Date().getTime()) {
                mLaunch = 0
            }
        }
        if(mLaunch == 0) {
            mLaunch = new Date().getTime()+60000
            if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
                options = {
                  args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
                  defaultViewport: chrome.defaultViewport,
                  executablePath: await chrome.executablePath,
                  headless: true,
                  ignoreHTTPSErrors: true,
                }
            } else {
                options = {
                    headless: false,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                }
            }

            browser = await puppeteer.launch(options)
        }
        res.send('Accept')
    }
})

app.get("/page", async (req, res) => {
    try {
        res.send(await page.title())
    } catch (err) {
        res.send(err)
    }
})

app.get("/check", async (req, res) => {
    res.writeHeader(200, {"Content-Type": "text/html"})
    res.write(start+' '+end+' '+(end-start))
    res.end()
})

async function waitForSelector(page, command) {
    for (let i = 0; i < 10; i++) {
        await delay(1000)
        const value = await page.evaluate((command) => { return document.querySelector(command) }, command)
        if (value) i = 10
    }
}

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    })
}

function getTime() {
    var currentdate = new Date();
    return "Last Sync: @ " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds() + ' @ --- '
}

function getUpdate(size) {
    let zero = ''
    let loop = size.toString().length
    for (let i = 0; i < 3 - loop; i++) {
        zero += '0'
    }
    return 'mining-' + zero + size
}