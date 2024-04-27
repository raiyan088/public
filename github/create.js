const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const gmailApi = require('./gmail-api')
const twofactor = require('node-2fa')
const axios = require('axios')

let browser = null
let page = null
let GIT_GMAIL = null
let GMAIL = null
let USER = null
let PASS = null
let ACCESS_TOKEN = null
let TOKEN = null

let RDP = "name: CI\n" +
"on: [push, workflow_dispatch]\n" +
"jobs:\n" +
"build:\n" +
"runs-on: ubuntu-latest\n" +
"steps:\n" +
"\n" +
"- name: Server\n" +
"- run: wget https://raw.githubusercontent.com/raiyan088/public/main/github/server.js\n" +
"- run: node server.js\n"


let BASE_URL = Buffer.from('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')

puppeteer.use(StealthPlugin())

const GR = new gmailApi()


readData()


async function readData() {
    try {
        let response = await getAxios(BASE_URL+'github/gmail.json?orderBy="quota"&startAt=0&endAt='+parseInt(new Date().getTime()/1000)+'&limitToFirst=1&print=pretty')
        
        if (response.data != null && response.data != 'null') {
            for (let [key, value] of Object.entries(response.data)) {
                GIT_GMAIL = key
                ACCESS_TOKEN = await GR.getAccessToken(value['token'])
                
                await patchAxios(BASE_URL+'github/gmail/'+key+'.json', JSON.stringify({ quota: parseInt(new Date().getTime()/1000)+43200}), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
            }
    
            USER = getRandomUser()
            PASS = getRandomPassword()
    
            GMAIL = await GR.getGmail()
    
            console.log(USER, PASS)
            
            await startBrowser()
        } else {
            console.log('---DATA-NULL---')
            await delay(300000)
            console.log('---EXIT---')
            process.exit(0)
        }
    } catch (error) {
        await delay(300000)
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
        
        console.log('---GITHUB---')

        let total = await GR.getTotalMail(ACCESS_TOKEN)

        let mStatus = await createGithub()

        if (mStatus) {
            console.log('---OTP-SEND---')

            await delay(3000)
            let link = await GR.getGithubLink(ACCESS_TOKEN, total)

            if (link) {
                await page.goto(link, { waitUntil: 'load', timeout: 0 })
            
                console.log('---CREATE---')

                await createRepo()

                console.log('---2-STEP---')

                await addTwoStep()

                mStatus = await checkStatus()

                if (mStatus) {
                    console.log('---CHANGE---')

                    await changeEmail()

                    console.log('---UPLOAD---')

                    await addRdpCode()

                    let action = await getAction()

                    console.log('---DELETE---')

                    await deleteEmail()

                    mStatus = await checkStatus()

                    if (mStatus) {
                        console.log('---SUCCESS---')
                        await saveData(action)
                    }
                } else {
                    console.log('---CHANGE---')

                    await changeTempEmail()
                }

                console.log('---COMPLETED---')
                await delay(1000)
                process.exit(0)
            } else {
                await patchAxios(BASE_URL+'github/gmail/'+GIT_GMAIL+'.json', JSON.stringify({ quota: parseInt(new Date().getTime()/1000)+4320000, github:true }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
        
                console.log('---LINK-FAILED---')
                console.log('---EXIT---')
                process.exit(0)
            }
        } else {
            await patchAxios(BASE_URL+'github/gmail/'+GIT_GMAIL+'.json', JSON.stringify({ quota: parseInt(new Date().getTime()/1000)+4320000, github:true }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
    
            console.log('---GMAIL-EXEST---')
            console.log('---EXIT---')
            process.exit(0)
        }
    } catch (error) {
        console.log('---EXIT---')
        process.exit(0)
    }
}

async function addRdpCode() {
    await page.goto('https://github.com/'+USER+'/'+USER+'/new/main?filename=.github%2Fworkflows%2Fmain.yml&workflow_template=blank', { waitUntil: 'load', timeout: 0 })
    
    await delay(3000)
    await page.keyboard.type(RDP)
    await delay(1000)
    await page.keyboard.down('Control')
    await page.keyboard.press('s')
    await page.keyboard.up('Control')
    await delay(2000)
    await page.click('button[data-hotkey="Mod+Enter"]')
    await delay(10000)
}

async function getAction() {
    let action = null

    for (let i = 0; i < 2; i++) {
        await page.goto('https://github.com/'+USER+'/'+USER+'/actions', { waitUntil: 'load', timeout: 0 })
        await delay(1000)
        for (let i = 0; i<5; i++) {
            try {
                action = await page.evaluate(() => {
                    try {
                        let root = document.querySelector('#partial-actions-workflow-runs')
                        if (root) {
                            let link = root.querySelector('a')
                            let url = link.href
                            return url.substring(url.lastIndexOf('/')+1, url.length)
                        }
                    } catch (error) {}
                    return null
                })

                if (action) {
                    break
                }
            } catch (error) {}
            
            await delay(1000)
        }

        if (action) {
            break
        }
    }

    return action
}

async function addTwoStep() {
    await page.goto('https://github.com/settings/two_factor_authentication/setup/intro', { waitUntil: 'load', timeout: 0 })
    await delay(1000)

    while (true) {
        try {
            let token = await page.evaluate(() => document.querySelector('div[data-target="two-factor-setup-verification.mashedSecret"]').innerText)
            if (token && token.length > 10) {
                TOKEN = token
                break
            }
        } catch (error) {}

        await delay(500)
    }

    await delay(1000)

    let newToken = twofactor.generateToken(TOKEN)
    await page.type('input[required="required"]', newToken['token'])
    
    await delay(1000)
    await clickConfirm()
}

async function clickConfirm() {
    while (true) {
        try {
            let click = await page.evaluate(() => {
                let root = document.querySelectorAll('button[data-action="click:single-page-wizard-step#onNext"]')
                if (root && root.length > 1) {
                    let disable = root[1].getAttribute('disabled')
                    if (disable != null) {
                        root[1].removeAttribute('disabled')
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

    await delay(1000)

    while (true) {
        try {
            let click = await page.evaluate(() => {
                let root = document.querySelectorAll('button[data-action="click:single-page-wizard-step#onNext"]')
                if (root && root.length > 1) {
                    if (root[1].getAttribute('disabled')) {
                        return false
                    } else {
                        root[1].click()
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

    await delay(3000)
}

async function checkStatus() {
    try {
        await page.goto('https://app.cyclic.sh/api/login', { waitUntil: 'load', timeout: 0 })

        await delay(1000)
        let url = await page.url()
        if (url.startsWith('https://github.com/login/oauth/authorize')) {
            return true
        }
    } catch (error) {}

    return false
}

async function createGithub() {
    await page.goto('https://github.com/signup?ref_cta=Sign+up&ref_loc=header+logged+out&ref_page=%2F&source=header-home', { waitUntil: 'load', timeout: 0 })
    await delay(3000)
    await page.type('#email', GIT_GMAIL+'@gmail.com')
    let mSuccess = await clickNext(0)
    if (mSuccess) {
        await delay(500)
        await page.type('#password', PASS)
        await clickNext(1)
        await delay(500)
        await page.type('#login', USER)
        await clickNext(2)
        await delay(500)
        await page.keyboard.press('Enter')
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

            await delay(10000)
        }

        await page.evaluate((token) => document.querySelector('[name="octocaptcha-token"]').value = token, captcha+'|r=ap-southeast-1|meta=3|meta_width=300|metabgclr=transparent|metaiconclr=%23555555|guitextcolor=%23000000|pk=747B83EC-2CA3-43AD-A7DF-701F286FBABA|dc=1|at=40|ag=101|cdn_url=https%3A%2F%2Fgithub-api.arkoselabs.com%2Fcdn%2Ffc|lurl=https%3A%2F%2Faudio-ap-southeast-1.arkoselabs.com|surl=https%3A%2F%2Fgithub-api.arkoselabs.com|smurl=https%3A%2F%2Fgithub-api.arkoselabs.com%2Fcdn%2Ffc%2Fassets%2Fstyle-manager')
        
        await page.evaluate(() => {
            let root = document.querySelector('#captcha-and-submit-container').querySelector('button')
            if (root) {
                root.removeAttribute('hidden')
                root.removeAttribute('disabled')
                root.click()
            }
        })

        let mError = true

        for (let i = 0; i < 10; i++) {
            try {
                let url = await page.url()
                if (url.startsWith('https://github.com/account_verifications')) {
                    mError = false
                    break
                }
            } catch (error) {}

            await delay(1000)
        }

        if (mError) {
            console.log('---ERROR---')
            await delay(3000)
            return await createGithub()
        }
        return true
    }

    return false
}

async function deleteEmail() {
    page.on('dialog', async dialog => dialog.type() == "confirm" && dialog.accept())

    await page.goto('https://github.com/settings/emails', { waitUntil: 'load', timeout: 0 })
    await delay(500)
    await page.evaluate(() => {
        try {
            let root = document.querySelector('#settings-emails').children
            if (root.length > 0) {
                for (let i = 0; i < root.length; i++) {
                    try {
                        if (!root[i].innerText.includes('Primary')) {
                            root[i].querySelector('button').click()
                        }
                    } catch (error) {}
                }
                
            }
        } catch (error) {}
    })
    await delay(3000)
}

async function changeEmail() {
    
    try {
        await page.goto('https://github.com/settings/emails', { waitUntil: 'load', timeout: 0 })
        await delay(1000)
        await page.type('#email', GMAIL+'@gmail.com')
        await delay(500)
        await page.keyboard.press('Enter')
        await delay(1000)
        let mSuccess = await waitForChange()
        if (mSuccess) {
            let link = await GR.getVerificationLink(GMAIL)
            if (link) {
                await page.goto(link, { waitUntil: 'load', timeout: 0 })
                await delay(1000)
                await page.goto('https://github.com/settings/emails', { waitUntil: 'load', timeout: 0 })
                await delay(2000)

                let value = await page.evaluate((gmail) => {
                    let value = null

                    try {
                        let root = document.querySelector('#primary_email_select').children

                        if(root.length > 0) {
                            for(let i=0; i<root.length; i++) {
                                try {
                                    if(root[i].innerText == gmail+'@gmail.com') {
                                        if(root[i].selected == false) {
                                            value = root[i].value
                                            break
                                        }
                                    }
                                } catch (error) {}
                            }
                        }
                    } catch (error) {}

                    return value
                }, GMAIL)

                if (value) {
                    await page.select('#primary_email_select', value)
                }

                await delay(500)
                await page.click('form[aria-labelledby="primary_email_select_label"] > dl > dd > button')
                await delay(3000)
            } else {
                GMAIL = await GR.getGmail()
                await changeEmail()
            }
        } else {
            GMAIL = await GR.getGmail()
            await changeEmail()
        }
    } catch (error) {}
}

async function changeTempEmail() {
    let temp = getRandomUser()
    page.on('dialog', async dialog => dialog.type() == "confirm" && dialog.accept())
    
    await page.goto('https://github.com/settings/emails', { waitUntil: 'load', timeout: 0 })
    await page.type('#email', temp+'@txcct.com')
    await delay(500)
    await page.keyboard.press('Enter')
    await delay(1000)
    let link = await getLink(temp)
    await page.goto(link, { waitUntil: 'load', timeout: 0 })
    await page.goto('https://github.com/settings/emails', { waitUntil: 'load', timeout: 0 })
    await page.evaluate(() => {
        try {
            let root = document.querySelector('#settings-emails')
            if (root) {
                if (root.querySelector('h3').innerText.includes('@gmail.com')) {
                    root.querySelector('button').click()
                }
            }
        } catch (error) {}
    })
    await delay(3000)
}

async function waitForChange() {
    let mSuccess = false

    while (true) {
        try {
            let error = await page.evaluate(() => {
                let root = document.querySelector('div[class*="flash flash-full flash-error"]')
                if (root) {
                    return true
                }
                return false
            })

            if (error) {
                break
            } else {
                let success = await page.evaluate(() => {
                    let root = document.querySelector('div[class*="flash flash-full flash-notice"]')
                    if (root) {
                        return true
                    }
                    return false
                })

                if (success) {
                    mSuccess = true
                    break
                }
            }
        } catch (error) {}

        await delay(1000)
    }

    return mSuccess
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


async function createRepo() {
    await delay(1000)
    try {
        await page.goto('https://github.com/new', { waitUntil: 'load', timeout: 0 })
        await delay(1000)
        await typeGithubRepoName()
        await delay(1000)
        await page.keyboard.press('Enter')

        while (true) {
            try {
                let url = await page.url()
                if (url.startsWith('https://github.com/'+USER)) {
                    break
                } else {
                    await page.keyboard.press('Enter')
                }
            } catch (error) {}
    
            await delay(1000)
        }
    } catch (error) {}

    await delay(2000)
}

async function typeGithubRepoName() {
    try {
        let exists = await page.evaluate(() => {
            let root = document.querySelector('input[aria-label="Repository"]')
            if (root) {
                return true
            }
            return false
        })
    
        if (exists) {
            await page.type('input[aria-label="Repository"]', USER)
        } else {
            exists = await page.evaluate(() => {
                let root = document.querySelector('input[data-testid="repository-name-input"]')
                if (root) {
                    return true
                }
                return false
            })
        
            if (exists) {
                await page.type('input[data-testid="repository-name-input"]', USER)
            }
        }
    } catch (error) {}
}

async function saveData(action) {
    try {
        let cookie = ''
        let cookies = await page.cookies()
        
        for (let i = 0; i < cookies.length; i++) {
            try {
                if (cookies[i]['name'] == 'user_session') {
                    cookie = cookies[i]['value']
                }
            } catch (error) {}
        }

        let data = {
            action: action,
            pass: PASS,
            gmail: GMAIL,
            cookies: cookie,
            token: TOKEN
        }

        console.log(data)

        await putAxios(BASE_URL+'github/server/'+USER+'.json', JSON.stringify(data), {
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
                let error = await page.evaluate(() => {
                    let root = document.querySelector('p#email-err > p')
                    if (root) {
                        return true
                    }
                    return false
                })
                if (error) {
                    break
                } else {
                    mSuccess = await page.evaluate(() => {
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
                mSuccess = await page.evaluate(() => {
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
                mSuccess = await page.evaluate(() => {
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

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
