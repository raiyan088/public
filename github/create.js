const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')
const fs = require('fs')

let mPrevLog = ''
let mLoginFailed = false
let mLogStart = false
let mArrowUp = true
let browser = null
let page = null
let github = null
let SERVER = ''
let mLog = false
let mData = 0
let mSize = 0
let mGmail = []
let cookies = null
let g_cookies = null
let USER = null
let GIT_PASS = null
let G_USER = null
let G_PASS = null
let G_RECOVERY = null

let loginUrl = 'https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&emr=1&followup=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&ifkv=ASKXGp2AT5TaGFB2r-BGOTTaCsPqKzVi_ysRafPiaNTd67ESvokaq2QE4wy0pqB9z1sgy8PdFFnU&osid=1&passive=1209600&service=mail&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S1442849146%3A1701858698016724&theme=glif'

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')

puppeteer.use(StealthPlugin())


readData()

async function readData() {
    try {
        let response = await getAxios(BASE_URL+'github/check.json?orderBy="$key"&limitToFirst=1')
        for (let [key, value] of Object.entries(response.data)) {
            G_USER = key
            G_PASS = value['pass']
            G_RECOVERY = value['recovery']
        }

        try {
            await axios.delete(BASE_URL+'github/check/'+G_USER+'.json')
        } catch (error) {}

        USER = getRandomUser()
        GIT_PASS = getRandomPassword()

        startBrowser()
    } catch (error) {
        console.log(error)
        console.log('---EXIT---')
        process.exit(0)
    }
}

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
                '--disable-dev-shm-usage'
            ]
        })
    
        page = (await browser.pages())[0]

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        
        console.log('---LOG-IN---')

        await logInGmail()

        console.log('---GITHUB---')

        await createGithub()

        console.log('---OTP---')

        await delay(1000)
        let otp = await getOTP()
            
        console.log(otp)

        await setOTP(otp)

        console.log('---CREATE---')

        await delay(1000)
        await createRepo()

        await saveData()

        console.log('---SUCCESS---')
        await delay(1000)
        process.exit(0)
    } catch (error) {
        console.log('---EXIT---')
        process.exit(0)
    }
}

async function createGithub() {
    github = await browser.newPage()

    await github.goto('https://github.com/signup?ref_cta=Sign+up&ref_loc=header+logged+out&ref_page=%2F&source=header-home', { waitUntil: 'load', timeout: 0 })
    await delay(3000)
    await github.type('#email', G_USER+'@gmail.com')
    let mSuccess = await clickNext(0)
    if (mSuccess) {
        await delay(500)
        await github.type('#password', GIT_PASS)
        await clickNext(1)
        await delay(500)
        await github.type('#login', USER)
        await clickNext(2)
        await delay(500)
        await github.keyboard.press('Enter')
        await delay(1000)

        let captcha = null

        let size = 0

        while (true) {
            size++
            try {
                let end = parseInt(new Date().getTime()/1000)
                let start = end-3600
                let response = await getAxios(BASE_URL+'github/captcha.json?orderBy=%22time%22&startAt='+start+'&endAt='+end+'&limitToFirst=1')
                for (let [key, value] of Object.entries(response.data)) {
                    captcha = value['token']

                    try {
                        await axios.delete(BASE_URL+'github/captcha/'+key+'.json')
                    } catch (error) {}
                }

                if (captcha) {
                    console.log('---TOKEN---')
                    break
                }
                console.log('---TRY-'+size+'---')
            } catch (error) {
                console.log('---TRY-'+size+'---')
            }

            await delay(5000)
        }

        await github.evaluate((token) => document.querySelector('[name="octocaptcha-token"]').value = token, captcha+'|r=ap-southeast-1|meta=3|meta_width=300|metabgclr=transparent|metaiconclr=%23555555|guitextcolor=%23000000|pk=747B83EC-2CA3-43AD-A7DF-701F286FBABA|dc=1|at=40|ag=101|cdn_url=https%3A%2F%2Fgithub-api.arkoselabs.com%2Fcdn%2Ffc|lurl=https%3A%2F%2Faudio-ap-southeast-1.arkoselabs.com|surl=https%3A%2F%2Fgithub-api.arkoselabs.com|smurl=https%3A%2F%2Fgithub-api.arkoselabs.com%2Fcdn%2Ffc%2Fassets%2Fstyle-manager')
        await github.evaluate(() => document.querySelector('#captcha-and-submit-container > button').removeAttribute('hidden'))
        await github.evaluate(() => document.querySelector('#captcha-and-submit-container > button').removeAttribute('disabled'))

        await delay(1000)

        await github.click('#captcha-and-submit-container > button')

        let mError = true

        for (let i = 0; i < 5; i++) {
            try {
                let url = await github.url()
                if (url.startsWith('https://github.com/account_verifications')) {
                    mError = false
                    break
                }
            } catch (error) {}

            await delay(1000)
        }

        if (mError) {
            console.log('---ERROR---')
            await createGithub()
        } else {
            console.log('---OTP-SEND---')
        }
    } else {
        console.log('---GMAIL-EXEST---')
        console.log('---EXIT---')
        process.exit(0)
    }
}

async function changeEmail() {
    github.on('dialog', async dialog => dialog.type() == "confirm" && dialog.accept())
    
    await github.goto('https://github.com/settings/emails', { waitUntil: 'load', timeout: 0 })
    await github.type('#email', USER+'@txcct.com')
    await delay(500)
    await github.keyboard.press('Enter')
    await delay(1000)
    let link = await getLink(USER)
    await github.goto(link, { waitUntil: 'load', timeout: 0 })
    await github.goto('https://github.com/settings/emails', { waitUntil: 'load', timeout: 0 })
    await deleteGmail(github)
    await delay(3000)
}

async function getLink(user) {
    let link = null
    let id = null
    
    while (true) {
        try {
            let response = await getAxios('https://www.1secmail.com/api/v1/?action=getMessages&login='+user+'&domain=txcct.com')
            let list = response.data
            for (let i = 0; i < list.length; i++) {
                if (list[i]['from'] == 'noreply@github.com') {
                    id = list[i]['id']
                }
            }

            if (id) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    while (true) {
        try {
            let response = await getAxios('https://www.1secmail.com/api/v1/?action=readMessage&login='+user+'&domain=txcct.com&id='+id)
            
            response.data['textBody'].split(/\r?\n/).forEach(function(line){
                if (line.includes('confirm_verification')) {
                    link = line
                }
            })

            if (link) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    return link
}

async function deleteGmail(_page) {
    await _page.evaluate(() => {
        try {
            let root = document.querySelector('#settings-emails')
            if (root) {
                if (root.querySelector('h3').innerText.includes('@gmail.com')) {
                    root.querySelector('button').click()
                }
            }
        } catch (error) {}
    })
}

async function createRepo() {
    try {
        await github.goto('https://github.com/new', { waitUntil: 'load', timeout: 0 })
        await github.type('input[aria-label="Repository"]', USER)
        await delay(500)
        await github.keyboard.press('Enter')

        while (true) {
            try {
                let url = await github.url()
                if (url.startsWith('https://github.com/'+USER)) {
                    break
                } else {
                    await github.keyboard.press('Enter')
                }
            } catch (error) {}
    
            await delay(1000)
        }
    } catch (error) {}
}

async function saveData() {
    try {
        let cookie = ''
        let g_cookies = await github.cookies()
        
        for (let i = 0; i < g_cookies.length; i++) {
            try {
                cookie += g_cookies[i]['name']+'='+g_cookies[i]['value']+'; '
            } catch (error) {}
        }

        let data = {
            g_user: G_USER,
            g_pass: G_PASS,
            g_recovery: G_RECOVERY,
            pass: GIT_PASS,
            cookies: cookie,
            quota: parseInt(new Date().getTime()/1000)
        }

        await putAxios(BASE_URL+'github/repo/'+USER+'.json', JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    } catch (error) {}
}

async function clickNext(params) {
    let mSuccess = false

    let start = new Date().getTime()
    while (new Date().getTime()-start<10000) {
        try {
            if (params == 0) {
                let error = await github.evaluate(() => {
                    let root = document.querySelector('p#email-err > p')
                    if (root) {
                        return true
                    }
                    return false
                })
                if (error) {
                    break
                } else {
                    mSuccess = await github.evaluate(() => {
                        let root = document.querySelector('#email-container > div > button')
                        if (root) {
                            let disable =  root.getAttribute('disabled')
                            if (disable == null) {
                                root.click()
                                return true
                            }
                        }
                        return false
                    })

                    if (mSuccess) {
                        break
                    }
                }
            } else if (params == 1) {
                mSuccess = await github.evaluate(() => {
                    let root = document.querySelector('#password-container > div > button')
                    if (root) {
                        let disable =  root.getAttribute('disabled')
                        if (disable == null) {
                            root.click()
                            return true
                        }
                    }
                    return false
                })

                if (mSuccess) {
                    break
                }
            } else if (params == 2) {
                mSuccess = await github.evaluate(() => {
                    let root = document.querySelector('#username-container > div > button')
                    if (root) {
                        let disable =  root.getAttribute('disabled')
                        if (disable == null) {
                            root.click()
                            return true
                        }
                    }
                    return false
                })

                if (mSuccess) {
                    break
                }
            }
        } catch (error) {}

        await delay(1000)
    }

    return mSuccess
}
 
async function logInGmail() {

    try {
        await page.goto(loginUrl, { waitUntil: 'load', timeout: 0 })
        await delay(500)
        await page.waitForSelector('#identifierId')
        await page.type('#identifierId', G_USER)
        await page.waitForSelector('#identifierNext')
        await page.click('#identifierNext')

        let status = await waitForLoginStatus()
        if (status == 1) {
            await delay(2000)
            await waitForPasswordType(G_PASS)
            await delay(500)
            await page.click('#passwordNext')

            let status = await waitForLoginSuccess(false)

            if (status == 4) {
                await delay(2000)
                await page.click('div[data-challengetype="12"]')
                status = await waitForLoginSuccess(true)
                if (status == 5) {
                    let recovery = G_RECOVERY
                    if (!recovery.endsWith('.com')) {
                        recovery += '@gmail.com'
                    }
                    await page.type('#knowledge-preregistered-email-response', recovery)
                    await delay(500)
                    await page.click('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]')
                    await delay(2000)
                    status = await waitForLoginSuccess(false)
                }
            }
            
            if (status == 1) {
                console.log('--LOGIN-OK-')
                await page.goto('about:blank')
            } else {
                if (status == 9) {
                    await putAxios(BASE_URL+'github/suspend/'+G_USER+'.json', JSON.stringify({ pass:G_PASS, recoery:g_recovery }), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                }
                console.log('---EXIT---')
                process.exit(0)
            }
        } else {
            console.log('Login:', status)
            console.log('---EXIT---')
            process.exit(0)
        }
    } catch (error) {
        console.log('---EXIT---')
        process.exit(0)
    }
}

async function getOTP() {
    let OTP = null
    await page.bringToFront()
    
    await page.goto('https://mail.google.com/mail/u/0/#search/noreply%40github.com', { waitUntil: 'load', timeout: 0 })

    await delay(3000)

    while (true) {
        try {
            let click = await page.evaluate(() => {
                let root = document.querySelector('table[class="F cf zt"] > tbody')
                if (root) {
                    let child = root.childNodes

                    if (child && child.length>0) {
                        child[0].click()
                        return true
                    }
                }
                return false
            })

            if (click) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    await delay(2000)

    while (true) {
        try {
            OTP = await page.evaluate(() => {
                let otp = null

                try {
                    let root = document.querySelectorAll('a')
                    if (root && root.length>0) {
                        for (let i = 0; i < root.length; i++) {
                            try {
                                let url = root[i].href
                                if (url.startsWith('https://github.com/users') && url.includes('confirm_verification')) {
                                    let temp = url.substring(url.indexOf('confirm_verification')+21, url.length)
                                    otp = temp.substring(0, temp.indexOf('?'))
                                    break
                                }
                            } catch (error) {}
                        }
                    }
                } catch (error) {}

                return otp
            })

            if (OTP) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    return OTP
}

async function setOTP(otp) {
    await github.bringToFront()
    await github.goto('https://github.com', { waitUntil: 'load', timeout: 0 })
    
    try {
        let number = otp.split('')
        await github.type('[name="launch_code[]"]', number[0])
        for (let i = 1; i < number.length; i++) {
            github.keyboard.type(number[i])
            await delay(100)
        }
    } catch (error) {}

    await delay(5000)

    let timeout = 0
    while (true) {
        timeout++
        try {
            let url = await github.url()
            if (url == 'https://github.com' || url == 'https://github.com/') {
                break
            }
        } catch (error) {}

        await delay(1000)

        if (timeout > 15) {
            await putAxios(BASE_URL+'github/suspend/'+G_USER+'.json', JSON.stringify({ pass:G_PASS, recoery:g_recovery }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            console.log('---TIMEOUT---')
            process.exit(0)
        }
    }

    await delay(1000)
}

async function waitForLoginStatus() {
    let status = 0
    let timeout = 0
    while (true) {
        timeout++
        if (timeout >= 50) {
            status = 0
            break
        }
        await delay(500)

        try {
            let pageUrl = await page.evaluate(() => window.location.href)
            
            if (pageUrl) {
                if (pageUrl.startsWith('https://accounts.google.com/v3/signin/identifier')) {
                    let captcha = await page.waitForRequest(req => req.url())
                    if (captcha.url().startsWith('https://accounts.google.com/Captcha')) {
                        status = 9
                        break
                    }

                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/pwd') || pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/pwd')) {
                    status = 1
                    break
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/rejected')) {
                    status = 2
                    break
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/dp')) {
                    status = 3
                    break
                } else if (pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/selection')) {
                    status = 4
                    break
                } else if(pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/pk/presend')) {
                    status = 5
                    break
                }
            }
        } catch (error) {}
    }
    return status
}

async function waitForLoginSuccess(selection) {
    let status = 0
    let timeout = 0
    
    while (true) {
        timeout++
        if (timeout >= 50) {
            status = 0
            break
        }
        await delay(2000)

        try {
            let pageUrl = await page.evaluate(() => window.location.href)
            
            if (pageUrl.startsWith('https://mail.google.com/')) {
                status = 1
                break
            } else if (pageUrl.startsWith('https://gds.google.com/web/chip')) {
                status = 1
                break
            } else if (pageUrl.startsWith('https://accounts.google.com/') && pageUrl.includes('challenge') && pageUrl.includes('pwd')) {
                let wrong = await page.evaluate(() => {
                    let root = document.querySelector('div[class="OyEIQ uSvLId"] > div')
                    if (root) {
                        return true
                    }
                    return false
                })

                if (wrong) {
                    status = 2
                    break
                }
            } else if (pageUrl.startsWith('https://accounts.google.com/') && pageUrl.includes('challenge') && pageUrl.includes('ipp') && pageUrl.includes('collec')) {
                status = 3
                break
            } else if (pageUrl.startsWith('https://accounts.google.com/') && pageUrl.includes('challenge') && pageUrl.includes('selection')) {
                status = 4
                break
            } else if (pageUrl.startsWith('https://support.google.com/')) {
                status = 9
                break
            }  else if (selection) {
                if (pageUrl.startsWith('https://accounts.google.com/') && pageUrl.includes('challenge') && pageUrl.includes('kpe')) {
                    let data = await page.evaluate(() => {
                        let root = document.querySelector('#knowledge-preregistered-email-response') 
                        if (root) {
                            return true
                        }
                        return false
                    })
    
                    if (data) {
                        status = 5
                        break
                    }
                }
            }
        } catch (error) {}
    }

    return status
}

async function waitForPasswordType(password) {
    
    while (true) {
        await delay(1000)

        try {
            let data = await exists(page, 'input[type="password"]')
            if (data) {
                await page.type('input[type="password"]', password)

                let success = await page.evaluate((password) => {
                    try {
                        let root = document.querySelector('input[type="password"]')
                        if (root && root.value == password) {
                            return true
                        }
                    } catch (error) {}

                    return false
                }, password)

                if (success) {
                    break
                }
            }
        } catch (error) {}
    }
}

async function waitForFinish() {
    let time = 0
    while (true) {
        await delay(3000)
        time += 3
        try {
            let check = await page.evaluate(() => {
                let root = document.querySelector('[aria-label="Run cell"]')
                if (root) {
                    let status = root.shadowRoot.querySelector('#status')
                    if (status) {
                        return true
                    }
                }
                return false
            })

            if (check) {
                break
            } else {
                await removeCaptha()

                if (time >= 60) {
                    time = 0
                    if(mArrowUp) {
                        mArrowUp = false
                        await page.keyboard.press('ArrowDown')
                    } else {
                        mArrowUp = true
                        await page.keyboard.press('ArrowUp')
                    }
                }
                
                let data = await page.evaluate(() => {
                    let root = document.querySelector('colab-static-output-renderer')
                    if (root) {
                        return root.innerText
                    }
                    return null
                })

                if (data) {
                    if (data.includes('|R|---START---|R|')) {
                        mLogStart = true
                    }
                    
                    if (mLogStart) {
                        let log = data.replace(mPrevLog, '').trimStart().trimEnd()
                        if (log.length > 0) {
                            let split = log.split('\n')
                            for (let i = 0; i < split.length; i++) {
                                console.log(split[i]+getID())
                            }
                        }
                        mPrevLog = data
                    }
                }
            }
        } catch (error) {}
    }
}

async function waitForDisconnected() {
    await page.click('#runtime-menu-button')
    for (var j = 0; j < 9; j++) {
        await delay(50)
        await page.keyboard.press('ArrowDown')
    }
    await delay(420)
    await page.keyboard.down('Control')
    await page.keyboard.press('Enter')
    await page.keyboard.up('Control')
    await waitForSelector('mwc-dialog[class="yes-no-dialog"]')
    await delay(500)
    await page.keyboard.press('Enter')
    await delay(2000)
}

async function removeCaptha() {
    await page.evaluate(() => { 
        let recapture = document.querySelector('colab-recaptcha-dialog')
        if(recapture) { 
            let cancel = recapture.shadowRoot.querySelector('mwc-button')
            if (cancel) {
                cancel.click()
            }
        } 
    })
}


async function waitForSelector(element) {
    while (true) {
        await delay(1000)
        try {
            let data = await exists(page, element)
            if (data) {
                break
            }
        } catch (error) {}
    }
}


async function exists(_page, evement) {
    return await _page.evaluate((evement) => {
        let root = document.querySelector(evement)
        if (root) {
            return true
        }
        return false
    }, evement)
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
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += U[Math.floor((Math.random() * 3))]
    pass += U[Math.floor((Math.random() * 3))]
    
    return pass
}

function getRandomUser() {
    let S = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    let N = ['0','1','2','3','4','5','6','7','8','9']
    
    let pass = S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]

    return pass
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


async function putAxios(url, body, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            data.timeout = 10000
            responce = await axios.put(url, body, data)
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

function getID() {
    let id = mData.toString()
    if (id.length == 1) {
        return '|0'+mData+'|'
    }
    return '|'+mData+'|'
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
