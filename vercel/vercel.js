const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const numberApi = require('./number-api.js')
const axios = require('axios')
const fs = require('fs')

let browser = null
let page = null
let account = null
let mData = {}
let USER = null
let cookies = null
let NUMBER = null
let mVercel = null
let mRender = null

let loginUrl = 'https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&emr=1&followup=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&ifkv=ASKXGp2AT5TaGFB2r-BGOTTaCsPqKzVi_ysRafPiaNTd67ESvokaq2QE4wy0pqB9z1sgy8PdFFnU&osid=1&passive=1209600&service=mail&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S1442849146%3A1701858698016724&theme=glif'

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')


const mNumberAPI = new numberApi()


puppeteer.use(StealthPlugin())

readData()

async function readData() {
    try {
        cookies = JSON.parse(fs.readFileSync('cookies.json'))

        let response = await getAxios(BASE_URL+'github/render.json?orderBy="$key"&limitToFirst=1')
        
        mData = response.data

        for(let key of Object.keys(mData)) {
            USER = key
        }

        if (mData[USER]['vercel']) {
            NUMBER = await mNumberAPI.getMobileNumber()
        } 

        await startBrowser()
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

        let cookie = mData[USER]['cookies'].split('; ')
        let map = {}

        for (let i = 0; i < cookie.length; i++) {
            try {
                let split = cookie[i].split('=')
                if (split.length == 2) {
                    map[split[0]] = split[1]
                }
            } catch (error) {}
        }

        for (let i = 0; i < cookies.length; i++) {
            try {
                let name = cookies[i]['name']
                if (map[name]) {
                    cookies[i]['value'] = map[name]
                }
            } catch (error) {}
        }

        await page.setCookie(...cookies)
    
        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        if (mData[USER]['render']) {
            console.log('---LOGIN---')

            await logInGmail(mData[USER])
        }

        if (mData[USER]['vercel']) {
            console.log('---VERCEL---')

            await createVercel()
        }
        
        if (mData[USER]['render']) {
            console.log('---RENDER---')

            await createRender()
        }
        
        await saveData()

        console.log('---COMPLETED----')
        process.exit(0)
    } catch (error) {
        console.log('---EXIT----')
        process.exit(0)
    }
}

async function createVercel() {
    account = await browser.newPage()

    await account.goto('https://vercel.com/login', { waitUntil: 'load', timeout: 0 })
    await delay(1000)
    let mSuccess = await waitForVercelSingUp()
    if (mSuccess) {
        await account.goto('https://vercel.com/new/', { waitUntil: 'load', timeout: 0 })
        let url = await account.url()
        if (url.endsWith('/')) {
            url = url.substring(0, url.length-1)
        }
        await account.goto(url+'/import?s=https%3A%2F%2Fgithub.com%2F'+USER+'%2F'+USER+'&hasTrialAvailable=1&showOptionalTeamCreation=false&project-name='+USER+'&framework=other&totalProjects=1&remainingProjects=1', { waitUntil: 'load', timeout: 0 })
        await delay(2000)
        try {
            let id = await account.evaluate(() => document.querySelector('input[id="new-project-name"]').value)
            await waitForRenderDeploy()

            mVercel = id+'_vercel_app'

            console.log(mVercel)

            console.log('---CREATED---')
        } catch (error) {
            console.log('---ERROR---')
        }
    } else {
        console.log('---ERROR---')
    }
}

async function waitForRenderDeploy() {
    let timeout = 0
    while (true) {
        timeout++
        try {
            let exists = await account.evaluate(() => {
                let root = document.querySelectorAll('button[type="submit"]')
                if (root && root.length > 0) {
                    let click = false
                    for (let i = 0; i < root.length; i++) {
                        try {
                            if (root[i].innerText == 'Deploy') {
                                root[i].click()
                                click = true
                            }
                        } catch (error) {}
                    }
                    return click
                }
                return false
            })

            if (exists) {
                break
            }
        } catch (error) {}

        if (timeout > 5) {
            break
        }

        await delay(1000)
    }

    timeout = 0
    while (true) {
        timeout++
        try {
            let url = await account.url()

            if (url.includes('success?')) {
                break
            }
        } catch (error) {}

        if (timeout > 30) {
            break
        }

        await delay(1000)
    }
}

async function waitForVercelSingUp() {
    const newPagePromise = new Promise(resolve => browser.once('targetcreated', target => resolve(target.page())))
    await account.click('button[data-testid="login/github-button"]')
    let popOpPage = await newPagePromise      

    let mSuccess = false
    let timeout = 0
    let otp = null

    while (true) {
        timeout++
        try {
            let url = await popOpPage.url()
            if (url.startsWith('https://github.com/login/oauth/authorize')) {
                let exists = await popOpPage.evaluate(() => {
                    let root = document.querySelector('button[name="authorize"][value="1"]')
                    if (root && root.getAttribute('disabled') == null) {
                        return true
                    }
                    return false
                })

                if (exists) {
                    await delay(500)
                    await popOpPage.click('button[name="authorize"][value="1"]')
                    break
                }
            } else if (url.startsWith('https://vercel.com/oauth/git')) {
                break
            }
        } catch (error) {}

        if (timeout > 10) {
            break
        }

        await delay(1000)
    }

    timeout = 0

    while (true) {
        timeout++
        try {
            let url = await popOpPage.url()
            if (url.startsWith('https://vercel.com/oauth/git')) {
                let exists = await popOpPage.evaluate(() => {
                    let root = document.querySelector('input[aria-label="Phone Number"]')
                    if (root) {
                        return true
                    }
                    return false
                })

                if (exists) {
                    for (let i = 0; i < 5; i++) {
                        if (NUMBER == null) {
                            NUMBER = await mNumberAPI.getMobileNumber()
                        }

                        if (NUMBER) {
                            await popOpPage.bringToFront()
                            await delay(2000)
                            await popOpPage.type('input[aria-label="Phone Number"]', NUMBER)
                            await delay(1000)
                            await popOpPage.click('button[type="submit"]')
                            await delay(5000)
                            let error = await popOpPage.evaluate(() => {
                                let root = document.querySelector('div[class*="error_text"]')
                                if (root) {
                                    return root.innerText
                                }
                                return null
                            })

                            if(error) {
                                if (!error.startsWith('Too many requests')) {
                                    NUMBER = null
                                    await delay(30000)
                                }
                                await popOpPage.reload()
                                await delay(1000)
                            } else {
                                let newPage = await browser.newPage()
                                otp = await mNumberAPI.getVerificationCode(NUMBER, newPage)
                                await popOpPage.bringToFront()
                                if (otp) {
                                    break
                                } else {
                                    NUMBER = null
                                    await popOpPage.reload()
                                    await delay(1000)
                                }
                            }
                        } else {
                            break
                        }
                    }
                    break
                }
            }
        } catch (error) {
            try {
                if (error.toString().includes('Session closed. Most likely the page has been closed')) {
                    mSuccess = true
                    break
                }
            } catch (error) {}
        }

        if (timeout > 15) {
            break
        }

        await delay(1000)
    }

    if (otp) {
        let timeout = 0
        while (true) {
            timeout++
            try {
                let exists = await popOpPage.evaluate(() => {
                    let root = document.querySelector('input[aria-label="Verification Code"]')
                    if (root) {
                        return true
                    }
                    return false
                })

                if (exists) {
                    let number = otp.split('')

                    for (let i = 0; i < number.length; i++) {
                        await popOpPage.type('input[aria-label="Verification Code"]', number[i])
                        await delay(250)
                    }

                    await delay(3000)
                    mSuccess = true
                    break
                }
            } catch (error) {}

            if (timeout > 5) {
                break
            }

            await delay(1000)
        }

        return true
    }

    return mSuccess
}

async function createRender() {
    account = await browser.newPage()

    let mSuccess = await renderSingUp()
    if (mSuccess) {
        await connectRenderRepo()
        await delay(500)
        await account.type('#serviceName', USER)
        await delay(500)
        await account.focus('#buildCommand')
        await account.keyboard.down('Control')
        await account.keyboard.press('A')
        await account.keyboard.up('Control')
        await account.keyboard.press('Backspace')
        await delay(500)
        await account.type('#buildCommand', 'npm install')
        await delay(500)
        await account.click('div[id*="headlessui-radiogroup-option"]')
        await delay(1000)
        await account.click('button[type="submit"]')
        await delay(5000)

        mRender = USER+'_onrender_com'
        console.log(mRender)
        console.log('---CREATED---')
    } else {
        console.log('---FAILED---')
    }
}

async function renderSingUp() {
    await account.goto('https://dashboard.render.com/select-repo?type=web', { waitUntil: 'load', timeout: 0 })
    await delay(1000)
    
    let exists = await account.evaluate(() => {
        let output = false
        let root = document.querySelectorAll('button[type="button"]')
        if (root && root.length > 0) {
            for (let i = 0; i < root.length; i++) {
                if (root[i].innerText == 'Google') {
                    root[i].click()
                    output = true
                }
            }
        }
        return output
    })

    if (exists) {
        await delay(2000)
    }

    let mSuccess = false
    let mError = false

    for (let i = 0; i < 10; i++) {
        try {
            let url = await account.url()
            if (url.startsWith('https://dashboard.render.com/select-repo')) {
                let exists = await account.evaluate(() => {
                    let root = document.querySelector('button[data-testid="connect-GITHUB-button"]')
                    if (root) {
                        return true
                    }
                    return false
                })

                if (exists) {
                    await delay(500)
                    await account.click('button[data-testid="connect-GITHUB-button"]')
                    break
                } else {
                    exists = await account.evaluate(() => {
                        let root = document.querySelectorAll('button[type="button"]')
                        if (root && root.length > 0) {
                            let click = false
                            for (let i = 0; i < root.length; i++) {
                                try {
                                    if (root[i].innerText == 'Connect') {
                                        click = true
                                    }
                                } catch (error) {}
                            }
                            return click
                        }
                        return false
                    })

                    if (exists) {
                        mSuccess = true
                        break
                    }
                }
            }
        } catch (error) {}

        await delay(1000)
    }

    if (mSuccess) {
        return true
    }

    await delay(2000)

    for (let i = 0; i < 10; i++) {
        try {
            let url = await account.url()
            if (url.startsWith('https://github.com/login/oauth/authorize')) {
                let exists = await account.evaluate(() => {
                    let root = document.querySelector('button[name="authorize"][value="1"]')
                    if (root && root.getAttribute('disabled') == null) {
                        return true
                    }
                    return false
                })

                if (exists) {
                    await delay(500)
                    try {
                        await account.click('button[name="authorize"][value="1"]')
                    } catch (error) {}

                    mSuccess = true
                    break
                } else {
                    try {
                        await account.mouse.click(100, 100)
                    } catch (error) {}
                }
            }
        } catch (error) {}

        await delay(1000)
    }

    await delay(2000)

    for (let i = 0; i < 10; i++) {
        try {
            let url = await account.url()
            if (url.startsWith('https://dashboard.render.com/select-repo')) {
                let exists = await account.evaluate(() => {
                    let root = document.querySelectorAll('button[type="button"]')
                    if (root && root.length > 0) {
                        let click = false
                        for (let i = 0; i < root.length; i++) {
                            try {
                                if (root[i].innerText == 'Connect') {
                                    click = true
                                }
                            } catch (error) {}
                        }
                        return click
                    }
                    return false
                })

                if (exists) {
                    break
                }
            } else if (url.startsWith('https://dashboard.render.com/')) {
                let exists = await account.evaluate(() => {
                    let output = false
                    let root = document.querySelectorAll('button[type="button"]')
                    if (root && root.length > 0) {
                        for (let i = 0; i < root.length; i++) {
                            if (root[i].innerText == 'Google') {
                                output = true
                            }
                        }
                    }
                    return output
                })

                if (exists) {
                    mError = true
                    break
                }
            } else if (url.startsWith('https://github.com/settings')) {
                mError = true
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    if (mError) {
        console.log('---TRY-AGAIN---')
        return await renderSingUp()
    }

    await delay(2000)

    return mSuccess
}

async function connectRenderRepo() {
    let timeout = 0
    while (true) {
        timeout++
        try {
            let exists = await account.evaluate(() => {
                let root = document.querySelectorAll('button[type="button"]')
                if (root && root.length > 0) {
                    let click = false
                    for (let i = 0; i < root.length; i++) {
                        try {
                            if (root[i].innerText == 'Connect') {
                                root[i].click()
                                click = true
                            }
                        } catch (error) {}
                    }
                    return click
                }
                return false
            })

            if (exists) {
                break
            }
        } catch (error) {}

        if (timeout > 5) {
            break
        }

        await delay(1000)
    }

    timeout = 0
    while (true) {
        timeout++
        try {
            let exists = await account.evaluate(() => {
                try {
                    let root = document.querySelector('#serviceName')
                    if (root && root.value.length == 0) {
                        return true
                    }
                } catch (error) {}
                return false
            })

            if (exists) {
                await delay(1000)
                break
            }
        } catch (error) {}

        if (timeout > 10) {
            break
        }

        await delay(1000)
    }
}

async function checkRenderGithub() {
    return await account.evaluate(() => {
        let root = document.querySelector('button[data-testid="connect-GITHUB-button"]')
        if (root) {
            return true
        }
        return false
    })
}

async function saveData() {
    let data = mData[USER]

    if (data['vercel']) {
        delete data['vercel']
    }

    if (data['render']) {
        delete data['render']
    }

    await putAxios(BASE_URL+'github/account/'+USER+'.json', JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    
    try {
        await axios.delete(BASE_URL+'github/render/'+USER+'.json')
    } catch (error) {}

    if (mRender || mVercel) {
        let data = {}
        if (mRender) {
            data[mRender] = 1
        }
        if (mVercel) {
            data[mVercel] = 1
        }
        
        await patchAxios(BASE_URL+'website.json', JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    }
}
 
async function logInGmail(data) {

    try {
        await page.goto(loginUrl, { waitUntil: 'load', timeout: 0 })
        await delay(500)
        await page.waitForSelector('#identifierId')
        await page.type('#identifierId', data['g_user'])
        await page.waitForSelector('#identifierNext')
        await page.click('#identifierNext')

        let status = await waitForLoginStatus()
        if (status == 1) {
            await delay(2000)
            await waitForPasswordType(data['g_pass'])
            await delay(500)
            await page.click('#passwordNext')

            let status = await waitForLoginSuccess(false)

            if (status == 4) {
                await delay(2000)
                await page.click('div[data-challengetype="12"]')
                status = await waitForLoginSuccess(true)
                if (status == 5) {
                    let recovery = data['g_recovery']
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
                await delay(1000)
                console.log('--LOGIN-OK-')
                await page.goto('about:blank')
            } else {
                console.log('Password:',status)
                console.log('---EXIT----')
                process.exit(0)
            }
        } else {
            console.log('Login:',status)
            console.log('---EXIT----')
            process.exit(0)
        }
    } catch (error) {
        console.log('---EXIT----')
        process.exit(0)
    }
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
            }  else if (pageUrl.startsWith('https://accounts.google.com/') && pageUrl.includes('challenge') && pageUrl.includes('selection')) {
                status = 4
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
            let data = await exists('input[type="password"]')
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

async function exists(evement) {
    return await page.evaluate((evement) => {
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
