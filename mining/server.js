const puppeteer = require('puppeteer')
const admin = require('./database')
const request = require('request')
const express = require('express')
const fs = require('fs')

let MINING = 'mining-002'

let mEtra = false

const app = express()

const database = new admin()

app.listen(process.env.PORT || 3030, () => {
    console.log('Listening on port 3000 ...')
})

const raiyan = 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/'

let colab = 'https://colab.research.google.com/drive/1aEU1oKekxX4_NyqCCx8hWUSOyYoEdKJi'

const startTime = parseInt(new Date().getTime() / 1000)

let mDown = false
let DATA = null
let mGmail = null
let mPageLoad = 0
let mAlreadyStart = false
let mActiveTime = 0
let statusRun = 0
let temp = null
let cookies = []

let browser = null
let page = null
let UPDATE = null
let mMain = false
let SERVERAuth = null
let SERVER = null


let extra = MINING.replace('mining-', '')
let exchange = parseInt(extra)
mGmail = 'ipadress4'+extra

if (exchange % 2) {
    UPDATE = getUpdate(exchange + 1)
} else {
    UPDATE = getUpdate(exchange - 1)
}

const mTime = new Date()
let date = parseInt(mTime.getDate())
let mounth = new Date(mTime.getFullYear(), mTime.getMonth()+1, 0).getDate()
let reload = 20
if(mounth == 31) {
    reload = 21
}

if(date >= reload) {
    if(reload == 20) {
        mMain = false
    } else if(date == reload) {
        let hours = parseInt(new Date().getHours())
        if(hours >= 16) {
            mMain = false
        } else {
            mMain = true
        }
    } else {
        mMain = false
    }
} else {
    mMain = true
}

console.log('Server Connecting...')

database.connect((error) => {
    if(!error) {
        request({
            url: raiyan+'colab/'+MINING+'.json',
            json:true
        }, function(error, response, body){
            if(!error) {
                let active = parseInt(body['active'])
                let restart = 0
        
                if(mMain && active == 2) {
                    restart = 1
                } else if(!mMain && active == 1) {
                    restart = 2
                }
        
                if(body['online'] == null) {
                    database.set('/colab/'+MINING+'/online', 0)
                }
        
                if(restart != 0) {
                    SERVERAuth = body['auth_'+restart]
                    SERVER = body['url_'+restart]
                    database.set('/colab/'+MINING+'/active', restart)
        
                    clearInterval(eTimer)
                    clearInterval(mTimer)
        
                    console.log('Restart Service: ' + SERVER)
                    request.delete({
                        url: 'https://api.heroku.com/apps/' + SERVER + '/dynos/',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/vnd.heroku+json; version=3',
                            'Authorization': 'Bearer ' + SERVERAuth
                        }
                    }, function (error, response, body) { })
                } else {
                    if((mEtra && !mMain) || (!mEtra && mMain)) {
                        database.set('/colab/'+MINING+'/online', startTime + 3600)
                        SERVERAuth = body['auth_'+active]
                        SERVER = body['url_'+active]
                        request({
                            url: raiyan+'ip/'+mGmail+'.json',
                            json:true
                        }, function(error, response, body){
                            if(!error) {
                                DATA = body
                                if(DATA['AUTH']) {
                                    console.log('Server Connected')
                                    startBackgroundService()
                                } else {
                                    clearInterval(eTimer)
                                    clearInterval(mTimer)
                                    console.log(getTime()+'Service Stop. Gmail Log-out...')
                                }
                            }
                        })
                    } else {
                        clearInterval(eTimer)
                        clearInterval(mTimer)
                        console.log(getTime()+'Service Stop. Strart Again 21 date 16 hours.')
                    }
                }
            }
        })
    }
})


async function startBackgroundService() {
    ;(async () => {
        if(DATA) {
            statusRun++
            console.log(getTime() + 'Service Start...')
            temp = JSON.parse(fs.readFileSync('./cookies.json'))
            await browserStart()
        } else {
            clearInterval(eTimer)
            clearInterval(mTimer)
            console.log(getTime() + 'Gmail and Data Error.')
        }
    })()
}

async function browserStart() {

    mPageLoad = 0
    mAlreadyStart = false

    statusRun++
    console.log('Status: Start process...' + ' ID: ' + mGmail)

    temp.forEach(function (value) {
        if (value.name == 'SSID') {
            value.value = DATA['SSID']
        } else if (value.name == 'SAPISID') {
            value.value = DATA['SAPISID']
        } else if (value.name == 'OSID') {
            value.value = DATA['OSID']
        } else if (value.name == 'SID') {
            value.value = DATA['SID']
        } else if (value.name == '__Secure-1PSID') {
            value.value = DATA['1PSID']
        } else if (value.name == 'HSID') {
            value.value = DATA['HSID']
        }
        cookies.push(value)
    })

    browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    page = (await browser.pages())[0]

    await page.setCookie(...cookies)

    await page.setRequestInterception(true)

    page.on('request', async request => {
        const url = request.url()
        request.continue()
        update = parseInt(new Date().getTime() / 1000)
        if (url == 'https://colab.research.google.com/_/bscframe') {
            if (mPageLoad == 0) {
                await delay(2000)
                statusRun++
                mPageLoad = 2
                console.log('Status: Webside load Success... ID: ' + mGmail, mAlreadyStart)
                if(mAlreadyStart) {
                    await waitForConnect(page)
                    await delay(1000)
                    await page.click('#runtime-menu-button')
                    for (var i = 0; i < 9; i++) {
                        await page.keyboard.press('ArrowDown')
                    }
                    await delay(420)
                    await page.keyboard.down('Control')
                    await page.keyboard.press('Enter')
                    await page.keyboard.up('Control')
                    await waitForSelector(page, 'div[class="content-area"]', 10)
                    await page.keyboard.press('Enter')
                    await delay(2000)
                }
                await page.keyboard.down('Control')
                await page.keyboard.press('Enter')
                await page.keyboard.up('Control')
                await waitForSelector(page, 'div[class="content-area"]', 10)
                let block = await page.evaluate(() => {
                    let root = document.querySelector('div.content-area > div.flex')
                    if(root && root.innerText.startsWith('You may be executing code that is disallowed')) {
                        return true
                    } else {
                        return false
                    }
                })
                if(block) {
                    await delay(1000)
                    await page.keyboard.press('Tab')
                    await page.keyboard.press('Tab')
                    await page.keyboard.press('Enter')
                    await delay(1000)
                    await waitForSelector(page, 'div[class="content-area"]', 10)
                }
                await delay(1000)
                await page.keyboard.press('Tab')
                await page.keyboard.press('Enter')
                await waitForConnect(page)
                console.log('Status: Connected. ID: ' + mGmail)
                mActiveTime = parseInt(new Date().getTime() / 1000)
                mPageLoad = 1
            }
        } else if (url.startsWith('https://www.google.com/recaptcha/api2/bframe')) {
            await page.evaluate(() => { let recapture = document.querySelector('colab-recaptcha-dialog'); if (recapture) { recapture.shadowRoot.querySelector('mwc-button').click() } })
        } else if (url.startsWith('https://colab.research.google.com/tun/m/m-')) {
            if (mPageLoad != 1) {
                mAlreadyStart = true
            }
        }
    })

    page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

    await page.goto(colab, { waitUntil: 'domcontentloaded', timeout: 0 })

    //await page.bringToFront();
}

let mTimer = setInterval(async function () {

    const now = parseInt(new Date().getTime() / 1000)

    if (statusRun > 5) {
        statusRun = 0
        console.log('+--------------------------------------------------------------------+')
    }

    if(mPageLoad == 1) {
        if (mDown) {
            mDown = false
            await page.keyboard.press('ArrowUp')
        } else {
            mDown = true
            await page.keyboard.press('ArrowDown')
        }

        const runTime = parseInt((now - mActiveTime) / 60)
        if(runTime >= 60) {
            console.log('Completed Mining.')
            console.log('Restart Service: ' + SERVER)
            request.delete({
                url: 'https://api.heroku.com/apps/' + SERVER + '/dynos/',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.heroku+json; version=3',
                    'Authorization': 'Bearer ' + SERVERAuth
                }
            }, function (error, response, body) {
                if(!error) {
                    database.set('/colab/'+MINING+'/online', now+3600)
                }
            })
        } else {
            statusRun++
            console.log('Runing: '+runTime+'m'+' Status: '+'Running process.....'+' ID: '+mGmail)
        }
    }
}, 60000)

let eTimer = setInterval(async function () {

    const now = parseInt(new Date().getTime() / 1000)

    request({
        url: raiyan+'colab/'+UPDATE+'.json',
        json:true
    }, function(error, response, body){
        if(!error) {
            let active = parseInt(body['active'])
            const now = parseInt(new Date().getTime() / 1000)
            if (parseInt(body['online']) < now) {
                console.log('Restart Service: ' + body['url_'+active])
                request.delete({
                    url: 'https://api.heroku.com/apps/' + body['url_'+active] + '/dynos/',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.heroku+json; version=3',
                        'Authorization': 'Bearer ' + body['auth_'+active]
                    }
                }, function (error, response, body) {
                    if(!error) {
                        database.set('/colab/'+UPDATE+'/online', now+3600)
                    }
                })
            } else {
                console.log('Chack Active: ' + body['url_'+active])
                let url = 'https://' + body['url_'+active] + '.herokuapp.com/' + now
                request.get({
                    url: url
                }, function (error, response, body) {
                    if(!error) {
                        if(body.includes('error-pages/application-error.html')) {
                            console.log('Error Page. Restart Service: ' + body['url_'+active])
                            request.delete({
                                url: 'https://api.heroku.com/apps/' + body['url_'+active] + '/dynos/',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/vnd.heroku+json; version=3',
                                    'Authorization': 'Bearer ' + body['auth_'+active]
                                }
                            }, function (error, response, body) {
                                if(!error) {
                                    database.set('/colab/'+UPDATE+'/online', now+3600)
                                }
                            })
                        }
                    }
                })
            }
        }
    })
}, 300000)


app.get('/', async function(req, res) {
    if(page == null) {
        res.writeHeader(400, {"Content-Type": "text/html"})
        res.write('Error')
        res.end()
    } else {
        try {
            await page.screenshot({ path: './image.png' })
            fs.readFile('./image.png', function (err, data) {
                if (err) {
                    res.writeHeader(400, {"Content-Type": "text/html"})
                    res.write('Error: '+err)
                    res.end()
                }else {
                    res.writeHeader(200, {"Content-Type": "image/png"})
                    res.write(data)
                    res.end()
                }
            })
        } catch(e) {
            res.writeHeader(400, {"Content-Type": "text/html"})
            res.write('Error: '+e)
            res.end()
        }
    }
})


async function waitForSelector(page, command, loop) {
    for (let i = 0; i < loop; i++) {
        await delay(500)
        const value = await page.evaluate((command) => { return document.querySelector(command) }, command)
        if (value) i = loop
    }
}

async function waitForConnect(page) {
    for (let i = 0; i < 60; i++) {
        await delay(1000)
        const value = await page.evaluate(() => {
            let colab = document.querySelector('colab-connect-button')
            if (colab) {
                let display = colab.shadowRoot.querySelector('#connect-button-resource-display')
                if (display) {
                    let ram = display.querySelector('.ram')
                    if (ram) {
                        let output = ram.shadowRoot.querySelector('.label').innerText
                        if (output) {
                            return 'RAM'
                        }
                    }
                } else {
                    let connect = colab.shadowRoot.querySelector('#connect')
                    if (connect) {
                        let output = connect.innerText
                        if (output == 'Busy') {
                            return 'Busy'
                        }
                    }
                }
            }
            return null
        })
        if (value) i = 60
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