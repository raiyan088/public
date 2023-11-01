const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')
const fs = require('fs')


let NAME = 'english'
//let NAME = 'bangle_name'


let mName = []
let page = null
let mAddAccount = 0
let mRecovery = []
let IP = null
let mError = 0
let mStatus = 0


let mStart = new Date().getTime()+90000

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dtYWlsLw==', 'base64').toString('ascii')

puppeteer.use(StealthPlugin())

setInterval(async() => {
    if (mStart < new Date().getTime()) {                                    
        try {
            await page.close()
            await delay(1000)

            mStart = new Date().getTime()+30000
            
            if (mAddAccount < 10) {
                browserStart()
            } else {
                console.log('|*|-IP CHANGE-')
                process.exit(0)
            }
        } catch (error) {
            console.log('|*|---ERROR---')
            process.exit(0)
        }
    }
}, 20000)

console.log('|R|---START---|R|')
console.log('|X|---'+getStringTime()+'---')

startWork()

async function startWork() {
    try {
        mRecovery = JSON.parse(fs.readFileSync('recovery.json'))

        mName = await getNameList()

        if (mName.length > 0) {
            try {
                let api = await getAxios('http://ip-api.com/json')
                let data = api.data
                IP = data['query']
                console.log('|T|----'+data['countryCode']+'-----')
                
                let key = IP.replace(/[.]/g, '_')
                let mIP = await getAxios(BASE_URL+'ip/'+key+'.json')

                if (mIP.data && mIP.data != 'null') {
                    if (mIP.data['time'] < parseInt(new Date().getTime()/1000)) {
                        mAddAccount = 0
                    } else {
                        mAddAccount = mIP.data['add']
                    }
                } else {
                    mAddAccount = 0
                }

                if (mAddAccount < 10) {
                    browserStart()
                } else {
                    console.log('|*|-IP CHANGE-')
                    process.exit(0)
                }
            } catch (error) {
                console.log('|*|---ERROR---')
                process.exit(0)
            }
        } else {
            console.log('|*|--N: NULL--')
            process.exit(0)
        }
    } catch (error) {
        console.log('|*|---ERROR---')
        process.exit(0)
    }
}


async function browserStart() {

    try {
        mStart = new Date().getTime()+90000

        let browser = await puppeteer.launch({
            //headless: false,
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

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        await createAccount()
        
    } catch (error) {
        console.log('|*|---ERROR---')
        process.exit(0)
    }
}

async function createAccount() {
    console.log('|*|-START: '+getAccountSize()+'-')

    let user = mName[0].toLowerCase().replace(/[^a-z]/g, '')+getRandomNumber()
    let recovery = mRecovery[Math.floor((Math.random() * mRecovery.length))]
    let name = mName[0].split(' ')
    let map = {}
    map['password'] = getRandomPassword()
    map['recovery'] = recovery+'@gmail.com'
    map['create'] = parseInt(new Date().getTime()/1000)

    await page.goto('https://accounts.google.com/signup/v2/createaccount?continue=https%3A%2F%2Fmyaccount.google.com%2Frecovery%2Femail&theme=glif&flowName=GlifWebSignIn&flowEntry=SignUp&hl=en', { waitUntil: 'load', timeout: 0 })
    await delay(1000)
    await page.type('#firstName', name[0])
    await delay(500)
    await page.type('#lastName', name[1])
    await delay(500)
    await page.click('#collectNameNext')
    let success = await waitForPage(0)
    if (success) {
        mStatus = 1
        let TL = await getTL()
        if (TL) {
            let year = getRandomYear()
            let month = getRandomMonth()
            let day = getRandomDay()
            await page.goto('https://accounts.google.com/signup/v2/birthdaygender?continue=https%3A%2F%2Fmyaccount.google.com%2Frecovery%2Femail&source=com.google.android.gms&xoauth_display_name=Android%20Phone&canFrp=1&canSk=1&mwdm=MWDM_QR_CODE&lang=en&langCountry=en_us&hl=en-US&cc=us&multilogin=1&use_native_navigation=0&cbsc=1&flowName=EmbeddedSetupAndroid&TL='+TL, { waitUntil: 'load', timeout: 0 })
            let next = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]'
            let input = 'input[class="whsOnd zHQkBf"]'
            await delay(1000)
            await page.select('#month', month)
            await delay(500)
            await page.type('#day', day)
            await delay(500)
            await page.type('#year', year)
            await delay(500)
            await page.select('#gender', '1')
            await delay(500)
            await page.click(next)
            success = await waitForPage(1)
            if (success) {
                mStatus = 2
                await page.type(input, user)
                await delay(500)
                await page.click(next)
                success = await waitForPage(2)
                if (success) {
                    mStatus = 3
                    await page.type(input, map['password'])
                    await delay(500)
                    await page.click(next)
                    success = await waitForPage(3)
                    if (success) {
                        mStatus = 4
                        await delay(1000)
                        await skipNumber()
                        success = await waitForPage(4)
                        if (success) {
                            mStatus = 5
                            await page.click(next)
                            await page.waitForNavigation({ waitUntil: ['load'] })
                            success = await waitForPage(5)
                            if (success) {
                                mStatus = 6
                                await page.click(next)
                                await delay(1000)
                                await dialogConfirm()
                                success = await waitForPage(6)
                                if (success) {
                                    mStatus = 7
                                    await page.goto('https://myaccount.google.com/recovery/email', { waitUntil: 'load', timeout: 0 })
                                    await delay(1000)
                                    success = await waitForRecoveryType(map['recovery'], false)
                                    if (success) {
                                        mStatus = 9
                                        await delay(500)
                                        await addRecovery()
                                        await delay(500)
                                        success = await waitForPage(7)
                                        if (success) {
                                            mStatus = 10
                                            await saveData(user, map)
                                            await delay(1000)
                                            await page.close()
                                            await delay(1000)

                                            mStart = new Date().getTime()+30000

                                            console.log('|*|--END: '+getAccountSize()+'--')
                                            console.log('|*|---'+getStringTime()+'---')
                                            
                                            try {
                                                if (mAddAccount < 10) {
                                                    browserStart()
                                                } else {
                                                    console.log('|*|-IP CHANGE-')
                                                    process.exit(0)
                                                }
                                            } catch (error) {
                                                console.log('|*|---ERROR---')
                                                process.exit(0)
                                            }
                                        } else {
                                            console.log('|*|-TIMEOUT:9-')
                                            await errorHandling()
                                        }
                                    } else {
                                        console.log('|*|-TIMEOUT:8-')
                                        await errorHandling()
                                    }
                                } else {
                                    console.log('|*|-TIMEOUT:7-')
                                    await errorHandling()
                                }
                            } else {
                                console.log('|*|-TIMEOUT:6-')
                                await errorHandling()
                            }
                        } else {
                            console.log('|*|-TIMEOUT:5-')
                            await errorHandling()
                        }
                    } else {
                        console.log('|*|-TIMEOUT:4-')
                        await errorHandling()
                    }
                } else {
                    console.log('|*|-TIMEOUT:3-')
                    await errorHandling()
                }
            } else {
                console.log('|*|-TIMEOUT:2-')
                await errorHandling()
            }
        } else {
            console.log('|*|-TIMEOUT:1-')
            await errorHandling()
        }
    } else {
        console.log('|*|-TIMEOUT:0-')
        await errorHandling()
    }
}

async function errorHandling() {
    try {
        mError++

        if (mError > 3) {
            console.log('|*|-IP CHANGE-')
            process.exit(0)
        } else {
            await page.close()
            await delay(1000)
    
            mName.shift()
            mAddAccount++
    
            if (mAddAccount < 10) {
                browserStart()
            } else {
                console.log('|*|-IP CHANGE-')
                process.exit(0)
            }
        }
    } catch (error) {
        console.log('|*|---ERROR---')
        process.exit(0)
    }
}


async function waitForRecoveryType(recovery, again) {
    let timeout = 0
    while (true) {
        timeout++
        
        let exists = await page.evaluate(() => {
            let root = document.querySelector('input[type="email"]')
            if (root) {
                return true
            }
            return false
        })

        if (exists) {
            await page.type('input[type="email"]', recovery)
            await delay(500)
            let success = await page.evaluate((recovery) => {
                try {
                    let data = document.querySelector('input[type="email"]').value
                    if (data == recovery) {
                        return true
                    }
                } catch (error) {}

                return false
            }, recovery)

            if (success) {
                timeout = 0
                break
            } else {
                await delay(1000)
            }
        } else {
            await delay(1000)
        }

        if (timeout > 10) {
            timeout = 99
            break
        }
    }

    if (timeout == 0) {
        if(!again) {
            mStatus = 8
        }
        return true
    } else if (again) {
        return false
    } else {
        await page.goto('https://myaccount.google.com/recovery/email', { waitUntil: 'load', timeout: 0 })
        await delay(1000)
        return await waitForRecoveryType(recovery, true)
    }
}

async function waitForPage(type) {
    let timeout = 0

    while (true) {
        timeout++
        await delay(1000)
        let url = await page.url()
        if (type == 0 && url.startsWith('https://accounts.google.com/signup/v2/birthdaygender') || url.startsWith('https://accounts.google.com/birthdaygender')) {
            let data = await exists('#gender')
            if (data) {
                timeout = 0
                break
            }
        } else if (type == 1 && url.startsWith('https://accounts.google.com/signup/v2/createusername') || url.startsWith('https://accounts.google.com/createusername')) {
            let data = await exists('#domainSuffix')
            if (data) {
                timeout = 0
                break
            }
        } else if (type == 2 && url.startsWith('https://accounts.google.com/createpassword')) {
            let data = await exists('input[name="Passwd"]')
            if (data) {
                timeout = 0
                break
            }
        } else if (type == 3 && url.startsWith('https://accounts.google.com/addrecoveryphone')) {
            let data = await exists('#phoneNumberId')
            if (data) {
                timeout = 0
                break
            }
        } else if (type == 4 && url.startsWith('https://accounts.google.com/signup/v2/confirmation')) {
            let data = await exists('div[class="wLBAL"]')
            if (data) {
                timeout = 0
                break
            }
        } else if(type == 5 && url.startsWith('https://accounts.google.com/lifecycle/steps/signup/termsofservice')) {
            let data = await exists('#headingText')
            if (data) {
                timeout = 0
                break
            }
        } else if(type == 5 && url.startsWith('https://accounts.google.com/lifecycle/steps/signup/personalizationchoice')) {
            let data = await exists('div[class="zJKIV y5MMGc sD2Hod"]')
            if (data) {
                timeout = 0
                break
            }
        } else if(type == 6) {
            timeout++
            await delay(1000)
            try {
                let OSID = 0
                let cookies = await page.cookies()

                for (let i = 0; i < cookies.length; i++) {
                    if (cookies[i]['name'] == 'SSID') {
                        OSID++
                    } else if (cookies[i]['name'] == 'HSID') {
                        OSID++
                    } else if (cookies[i]['name'] == 'APISID') {
                        OSID++
                    }
                }

                if (OSID == 3) {
                    timeout = 0
                    break
                }
            } catch (error) {}
        } else if (type == 7) {
            let data = await exists('input[type="text"][inputmode="numeric"]')
            if (data) {
                timeout = 0
                break
            }
        }

        if (timeout >= 30) {
            timeout = 99
            break
        }
    }
    await delay(1000)

    return timeout == 0
}

async function addRecovery() {
    let element = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 wMI9H"]'
    let data = await exists(element)
    if (data) {
        await page.click(element)
    } else {
        element = 'button[class="UywwFc-LgbsSe UywwFc-LgbsSe-OWXEXe-dgl2Hf wMI9H"]'
        data = await exists(element)
        if (data) {
            await page.click(element)
        }
    }
}

async function getTL() {
    let pageUrl = await page.url()

    if (pageUrl.includes('TL=')) {
        let temp = pageUrl.substring(pageUrl.indexOf('TL=')+3, pageUrl.length)
        let index = temp.indexOf('&')
        if (index > 0) {
            return temp.substring(0, index)
        } else {
            return temp
        }
    }

    return null
}

async function skipNumber() {
    return await page.evaluate(() => {
        let root = document.querySelector('#skip')
        if (root) {
            root.click()
        } else {
            root = document.querySelector('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-dgl2Hf ksBjEc lKxP2d LQeN7 uRo0Xe TrZEUc lw1w4b"]')
            if (root) {
                root.click()
            }
        }
    })
}

async function exists(evement) {
    let loading = await page.evaluate(() => {
        let root = document.querySelector('#initialView[aria-busy="true"]')
        if (root) {
            return true
        }
        return false
    })

    if (loading) {
        return false
    }
    
    return await page.evaluate((evement) => {
        let root = document.querySelector(evement)
        if (root) {
            return true
        }
        return false
    }, evement)
}

async function dialogConfirm() {
    let data = await exists('div[class="XfpsVe J9fJmf"]')
    if (data) {
        await page.click('div[class="XfpsVe J9fJmf"] > div[data-id="ssJRIf"]')
    }
}

async function saveData(user, map) {
    try {
        mName.shift()
        mAddAccount++
        let key = IP.replace(/[.]/g, '_')
        let value = {
            time: parseInt(new Date().getTime()/1000)+86400,
            add: mAddAccount
        }

        await patchAxios(BASE_URL+'new/'+user+'.json', JSON.stringify(map), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        await patchAxios(BASE_URL+'ip/'+key+'.json', JSON.stringify(value), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        fs.writeFileSync('temp_name.json', JSON.stringify(mName))
    } catch (error) {
        console.log('|*|---ERROR---')
    }
}

async function getAxios(url) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            responce = await axios.get(url, {
                timeout: 10000
            })
            break
        } catch (error) {
            loop++

            if (loop >= 5) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}


async function patchAxios(url, body, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            data.timeout = 10000
            responce = await axios.patch(url, body, data)
            break
        } catch (error) {
            loop++

            if (loop >= 5) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}

async function getNameList() {
    let output = []
    try {
        output = JSON.parse(fs.readFileSync('temp_name.json'))
    } catch (error) {}

    if (output.length > 0) {
        return output
    }

    let response = await getAxios(BASE_URL+'name/'+NAME+'.json?orderBy=%22list%22&limitToLast=20&print=pretty')

    try {
        let list = []
        for (let key of Object.keys(response.data)) {
            list.push(key)
        }
        let name =  list[Math.floor((Math.random() * list.length))]
        try {
            await axios.delete(BASE_URL+'name/'+NAME+'/'+name+'.json')
        } catch (error) {}

        output = response.data[name]['list']

        fs.writeFileSync('temp_name.json', JSON.stringify(output))
    } catch (error) {}

    return output
}

async function getRecovery() {
    let output = []
    try {
        output = JSON.parse(fs.readFileSync('temp_recovery.json'))
    } catch (error) {}

    if (output.length > 0) {
        return output
    }

    let response = await getAxios(BASE_URL+'recovery.json')
    
    try {
        output = []
        for (let value of Object.values(response.data)) {
            output.push(value)
        }
        fs.writeFileSync('temp_recovery.json', JSON.stringify(output))
    } catch (error) {}

    return output
}

function getRandomNumber() {
    let N = ['0','1','2','3','4','5','6','7','8','9']
    
    let pass = N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    
    return pass
}

function getRandomPassword() {
    let C = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    let S = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    let N = ['0','1','2','3','4','5','6','7','8','9']
    let U = ['#','$','@']
    
    let pass = C[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    //pass += U[Math.floor((Math.random() * 3))]
    //pass += U[Math.floor((Math.random() * 3))]
    
    return pass
}

function getRandomYear() {
    let N = ['1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999', '2000', '2001', '2002']
    return  N[Math.floor((Math.random() * 15))]
}

function getRandomMonth() {
    return  (Math.floor((Math.random() * 11))+1).toString()
}

function getRandomDay() {
    return  (Math.floor((Math.random() * 28))+1).toString()
}

function getStringTime() {
    var d = new Date(),
        hour = ''+d.getHours(),
        minute = ''+d.getMinutes()

    if (hour.length < 2) 
        hour = '0' + hour
    if (minute.length < 2) 
        minute = '0' + minute

    return [hour, minute].join(':')
}

function getAccountSize() {
    let size = ''+(mAddAccount+1)
    if (size.length == 1) {
        return '0'+size
    }
    return size
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}