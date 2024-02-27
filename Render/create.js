const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')
const fs = require('fs')

const GMAIL_NAME = 'token'
let GITHUB_NAME = 'valied'

let browser = null
let page = null
let account = null
let mData = {}
let USER = null
let GMAIL = null
let mGmail = null
let cookies = null
let mRender = null
let TOKEN = null
let H_TOKEN = null
let mAuth = null
let mUserID = null
let mRequestId = null
let mHeader = null
let PASSWORD = ''

let loginUrl = 'https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&emr=1&followup=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&ifkv=ASKXGp2AT5TaGFB2r-BGOTTaCsPqKzVi_ysRafPiaNTd67ESvokaq2QE4wy0pqB9z1sgy8PdFFnU&osid=1&passive=1209600&service=mail&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S1442849146%3A1701858698016724&theme=glif'

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')


puppeteer.use(StealthPlugin())

startPrecess()

async function startPrecess() {
    try {
        cookies = JSON.parse(fs.readFileSync('cookies.json'))

        let response = await getAxios(BASE_URL+'render.json?orderBy="$key"&limitToFirst=1')
        
        if (response && response.data != null && response.data != 'null') {
            let data = response.data

            for(let key of Object.keys(data)) {
                GMAIL = key
            }

            PASSWORD = data[GMAIL]['pass']

            await startBrowser(data[GMAIL]['link'])
        } else {
            console.log('---DATA-NULL---')
            process.exit(0)
        }
    } catch (error) {
        console.log(error)
        console.log('---EXIT---')
        process.exit(0)
    }
}

async function startBrowser(mLink) {
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

        page.on('request', request => {
            if (mAuth == null && request.url() == 'https://api.render.com/graphql') {
                if(request.method() == 'POST') {
                    try {
                        let header = request.headers()
                        if (header['authorization'].startsWith('Bearer')) {
                            mAuth = header['authorization']
                            mRequestId = header['render-request-id']
                        }
                    } catch (error) {}
                }
            }
        })
        
        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        
        await page.goto(mLink, { waitUntil: 'load', timeout: 0 })

        await waitForAuth()

        let mNext = await checkPaymentFree()

        if (mNext) {
            while (true) {
                await setupGithub()
    
                let ststus = await renderRepoSetup()
                if (ststus == 'GIT') {
                    await changeGithub(true)
                    await delay(2000)
                } else if (ststus == 'OK') {
                    await disconnectGithub()
                    break
                } else {
                    break
                }
            }
        } else {
            console.log('---NEED-PAYMENT---')
        }

        await changeRenderGmail()

        await saveData()

        console.log('---COMPLETED---')
        process.exit(0)
    } catch (error) {
        console.log('---EXIT----')
        process.exit(0)
    }
}

async function setupGithub() {
    await getGithubAccount()

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

    if (account == null) {
        account = await browser.newPage()
    }

    await account.setCookie(...cookies)
    
    account.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
}

async function getGithubAccount() {
    try {
        let response = await getAxios(BASE_URL+'github/'+GITHUB_NAME+'.json?orderBy="$key"&limitToFirst=1')
        
        if (response && response.data != null && response.data != 'null') {
            mData = response.data

            for(let key of Object.keys(mData)) {
                USER = key
            }
        } else {
            if (GITHUB_NAME == 'valied') {
                GITHUB_NAME = 'account'
            } else {
                GITHUB_NAME = 'valied'
            }
            await getGithubAccount()
        }
    } catch (error) {}
}

async function changeGithub(error) {
    let name = 'account'
    if(error) {
        name = 'render_git'
    }

    await putAxios(BASE_URL+'github/'+name+'/'+USER+'.json', JSON.stringify(mData), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    
    try {
        await axios.delete(BASE_URL+'github/'+GITHUB_NAME+'/'+USER+'.json')
    } catch (error) {}
}

async function renderRepoSetup() {
    let mGithub = false
    let mSuccess = false

    await page.bringToFront()
    await delay(200)

    await page.goto('https://dashboard.render.com/select-repo?type=web', { waitUntil: 'load', timeout: 0 })
    await delay(2000)
    
    let connected = await page.evaluate(() => {
        let root = document.querySelector('button[data-testid="connect-GITHUB-button"]')
        if (root) {
            return true
        }
        return false
    })

    if (connected) {
        await delay(500)
        await page.click('button[data-testid="connect-GITHUB-button"]')
        await delay(2000)

        for (let i = 0; i < 15; i++) {
            try {
                let url = await page.url()
                if (url.startsWith('https://github.com/settings/installations')) {
                    mSuccess = true
                    break
                } else if (url.startsWith('https://dashboard.render.com/github/exists')) {
                    mGithub = true
                    break
                } else if (url.startsWith('https://dashboard.render.com/select-repo')) {
                    mSuccess = true
                    break
                }
            } catch (error) {
                break
            }

            await delay(1000)
        }

        if (mGithub) {
            return 'GIT'
        }

        if (!mSuccess) {
            return 'ERROR'
        }

        await page.goto('https://dashboard.render.com/select-repo?type=web', { waitUntil: 'load', timeout: 0 })
        await delay(2000)
    }
    
    mSuccess = await connectRenderRepo()
    if (mSuccess) {
        await delay(1000)

        let empty = await page.evaluate(() => {
            let root = document.querySelector('#serviceName')
            if (root && root.value.length > 2) {
                return false
            }
            return true
        })

        if (empty) {
            await page.type('#serviceName', getRandomUser())
            await delay(500)
        }
        await page.focus('#buildCommand')
        await page.keyboard.down('Control')
        await page.keyboard.press('A')
        await page.keyboard.up('Control')
        await page.keyboard.press('Backspace')
        await delay(500)
        await page.type('#buildCommand', 'npm install')
        await delay(500)
        await page.click('div[id*="headlessui-radiogroup-option"]')
        await delay(1000)
        await page.click('button[type="submit"]')
        await delay(2000)

        console.log('---CREATEING---')

        let id = null
        
        for (let i = 0; i < 30; i++) {
            try {
                let url = await page.evaluate(() => {
                    let root = document.querySelector('a[href*=".onrender.com"]')
                    if (root) {
                        return root.href
                    }
                    return null
                })

                if (url) {
                    id = url.substring(url.indexOf('https://')+8, url.indexOf('.onrender.com'))
                    break
                }
            } catch (error) {}

            await delay(1000)
        }

        if (id) {
            let start = new Date().getTime()+60000
            while (start > new Date().getTime()) {
                try {
                    let response = await axios.get('https://'+id+'.onrender.com/', { timeout:10000 })
                    let data = response.data
                    if (data.startsWith('SOLVED')) {
                        break
                    }
                } catch (error) {}

                await delay(2000)
            }

            mRender = id+'_onrender_com'
            
            console.log('---CREATED---')
        } else {
            console.log('---ID-ERROR---')
        }
    } else {
        console.log('---ERROR---')
    }

    return 'OK'
}

async function connectRenderRepo() {
    let mSuccess = false

    for (let i = 0; i < 5; i++) {
        try {
            let exists = await page.evaluate(() => {
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
                mSuccess = true
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    if (!mSuccess) {
        return false
    }

    for (let i = 0; i <10; i++) {
        try {
            let exists = await page.evaluate(() => {
                try {
                    let root = document.querySelector('#serviceName')
                    if (root) {
                        return true
                    }
                } catch (error) {}
                return false
            })

            if (exists) {
                mSuccess = true
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    return mSuccess
}

async function getRenderLink(user) {
    let link = null
    let id = null
    
    for (let i = 0; i < 30; i++) {
        try {
            let response = await getAxios('https://www.1secmail.com/api/v1/?action=getMessages&login='+user+'&domain=vjuum.com')
            let list = response.data
            for (let i = 0; i < list.length; i++) {
                if (list[i]['from'].endsWith('bounces.render.com')) {
                    id = list[i]['id']
                }
            }

            if (id) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    if (id) {
        for (let i = 0; i < 10; i++) {
            try {
                let response = await getAxios('https://www.1secmail.com/api/v1/?action=readMessage&login='+user+'&domain=vjuum.com&id='+id)
    
                response.data['textBody'].split(/\r?\n/).forEach(function(line){
                    if (line.includes('dashboard.render.com')) {
                        link = line.trim()
                    }
                })
    
                if (link) {
                    break
                }
            } catch (error) {}
    
            await delay(1000)
        }
    }

    return link
}

async function checkPaymentFree() {
    let response = await postAxios('https://api.render.com/graphql', { 
        'operationName': 'ownerBilling',
        'variables': {
            'ownerId': mUserID
        },
        'query': 'query ownerBilling($ownerId: String!) {\n  owner(ownerId: $ownerId) {\n    ...ownerFields\n    ...ownerBillingFields\n    __typename\n  }\n}\n\nfragment ownerBillingFields on Owner {\n  cardBrand\n  cardLast4\n  __typename\n}\n\nfragment ownerFields on Owner {\n  id\n  billingStatus\n  email\n  featureFlags\n  notEligibleFeatureFlags\n  projectsEnabled\n  tier\n  logEndpoint {\n    endpoint\n    token\n    updatedAt\n    __typename\n  }\n  userPermissions {\n    addTeamMember\n    deleteTeam\n    readBilling\n    removeTeamMember\n    updateBilling\n    updateFeatureFlag\n    updateTeam2FA\n    updateTeamEmail\n    updateTeamMemberRole\n    updateTeamName\n    __typename\n  }\n  permissions {\n    addTeamMember {\n      ...permissionResultFields\n      __typename\n    }\n    deleteTeam {\n      ...permissionResultFields\n      __typename\n    }\n    readBilling {\n      ...permissionResultFields\n      __typename\n    }\n    removeTeamMember {\n      ...permissionResultFields\n      __typename\n    }\n    updateBilling {\n      ...permissionResultFields\n      __typename\n    }\n    updateFeatureFlag {\n      ...permissionResultFields\n      __typename\n    }\n    updateTeam2FA {\n      ...permissionResultFields\n      __typename\n    }\n    updateTeamEmail {\n      ...permissionResultFields\n      __typename\n    }\n    updateTeamMemberRole {\n      ...permissionResultFields\n      __typename\n    }\n    updateTeamName {\n      ...permissionResultFields\n      __typename\n    }\n    __typename\n  }\n  userRole\n  __typename\n}\n\nfragment permissionResultFields on PermissionResult {\n  permissionLevel\n  message\n  __typename\n}\n'
    }, { headers: mHeader })

    try {
        let data = response.data['data']['owner']
        if (data['billingStatus'] == 'PAYMENT_METHOD_REQUIRED') {
            return false
        }
    } catch (error) {}

    return true
}

async function changeRenderGmail() {
    let user = getRandomUser()

    let response = await axios.post('https://api.render.com/graphql',{
          'operationName': 'requestEmailReset',
          'variables': {
            'newEmail': user+'@vjuum.com'
          },
          'query': 'mutation requestEmailReset($newEmail: String!) {\n  requestEmailReset(newEmail: $newEmail)\n}\n'
    }, { headers: mHeader })

    let mError = true
    try {
        if(response.data['data']['requestEmailReset']) {
            mError = false
        }
    } catch (error) {}

    if (mError) {
        await page.goto('https://dashboard.render.com/settings', { waitUntil: 'load', timeout: 0 })
        await delay(1000)
        
        let click = await page.evaluate(() => {
            let output = false
            let root = document.querySelectorAll('button[type="button"]')
            if (root && root.length > 0) {
                for (let i = 0; i < root.length; i++) {
                    if (root[i].innerText == 'Edit') {
                        root[i].click()
                        output = true
                    }
                }
            }
            return output
        })
    
        if (click) {
            await delay(1000)
            await page.focus('input#email')
            await page.keyboard.down('Control')
            await page.keyboard.press('A')
            await page.keyboard.up('Control')
            await page.keyboard.press('Backspace')
            await delay(500)
            await page.type('input#email', user+'@vjuum.com')
            await delay(1000)
            await page.evaluate(() => {
                let root = document.querySelectorAll('button[type="submit"]')
                if (root && root.length > 0) {
                    for (let i = 0; i < root.length; i++) {
                        if (root[i].innerText == 'Save Changes') {
                            root[i].click()
                        }
                    }
                }
            })
    
            await delay(2000)
        }
    }

    let link = await getRenderLink(user)
    
    if (link) {
        await page.goto(link, { waitUntil: 'load', timeout: 0 })
        await delay(3000)
    }
}

async function waitForAuth() {
    while (true) {
        if (mAuth) {
            break
        }
        await delay(500)
    }

    let cookies = ''

    let cookie = await page.cookies()

    for (let i = 0; i < cookie.length; i++) {
        if (cookie[i]['name'] == 'ajs_user_id') {
            mUserID = cookie[i]['value']
        }
        cookies += cookie[i]['name']+'='+cookie[i]['value']+'; '
    }

    mHeader = {
        'authority': 'api.render.com',
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': mAuth,
        'content-type': 'application/json',
        'cookie': cookies,
        'origin': 'https://dashboard.render.com',
        'referer': 'https://dashboard.render.com/',
        'sec-ch-ua': '"Not:A-Brand";v="99", "Chromium";v="112"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    }

    if (mRequestId) {
        mHeader['render-request-id'] = mRequestId
    }
}

async function authGmail() {
    for (let i = 0; i < 10; i++) {
        try {
            let url = await account.url()
            if (url.includes('oauthchooseaccount')) {
                let exists = await account.evaluate(() => {
                    let root = document.querySelector('div[data-authuser="0"]')
                    if (root) {
                        return true
                    }
                    return false
                })

                if (exists) {
                    await delay(1000)
                    await account.evaluate(() => document.querySelector('div[data-authuser="0"]').click() )
                    break
                }
            }
        } catch (error) {}
        
        await delay(1000)
    }

    await delay(1000)

    for (let i = 0; i < 15; i++) {
        try {
            let url = await account.url()
            if (url.startsWith('https://accounts.google.com/signin/oauth/danger')) {
                let exists = await account.evaluate(() => {
                    let output = false
                    let root = document.querySelectorAll('a[class="xTI6Gf vh6Iad"]')
                    if (root && root.length > 0) {
                        for (let i = 0; i < root.length; i++) {
                            if (root[i].innerText.includes('Go to project')) {
                                root[i].click()
                                output = true
                            }
                        }
                    }
                    return output
                })

                if (exists) {
                    break
                }
            } else if (url.includes('consentsummary')) {
                let exists = await account.evaluate(() => {
                    let output = false
                    let root = document.querySelectorAll('button[type="button"]')
                    if (root && root.length > 0) {
                        for (let i = 0; i < root.length; i++) {
                            if (root[i].innerText == 'Continue') {
                                root[i].click()
                                output = true
                            }
                        }
                    }
                    return output
                })

                if (exists) {
                    break
                }
            } else if (url.includes('/gmail/callback')) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    await delay(2000)

    for (let i = 0; i < 15; i++) {
        try {
            let url = await account.url()
            if (url.includes('consentsummary')) {
                let exists = await account.evaluate(() => {
                    let root = document.querySelector('input[aria-label="Select all"]')
                    if (root) {
                        return true
                    }
                    return false
                })

                if (exists) {
                    await account.click('input[aria-label="Select all"]')
                    await delay(1000)
                    await account.evaluate(() => {
                        let root = document.querySelectorAll('button[type="button"]')
                        if (root && root.length > 0) {
                            for (let i = 0; i < root.length; i++) {
                                if (root[i].innerText == 'Continue') {
                                    root[i].click()
                                }
                            }
                        }
                    })
                    break
                }
            } else if (url.includes('/gmail/callback')) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }
}

async function getMessageCount() {
    try {
        let response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
            headers: {
                'authorization': 'Bearer '+TOKEN,
                'content-type': 'application/json'
            }
        })
        return response.data['messagesTotal']
    } catch (error) {
        console.log(error)
        return -1
    }
}

async function getGmailLink(count) {
    let length = 0
    let link = null

    for (let i = 0; i < 30; i++) {
        let size = await getMessageCount()
        if (size > 0 && size > count) {
            length = size-count
            break
        }

        await delay(1000)
    }

    if (length > 0) {
        try {
            let response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults='+length, {
                headers: {
                    'authorization': 'Bearer '+TOKEN,
                    'content-type': 'application/json'
                }
            })
            
            let list = response.data['messages']

            for (let i = 0; i < list.length; i++) {
                try {
                    let response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages/'+list[i]['id'], {
                        headers: {
                            'authorization': 'Bearer '+TOKEN,
                            'content-type': 'application/json'
                        }
                    })

                    let data = response.data['payload']['body']['data']
                    let message = Buffer.from(data, 'base64').toString()
                    
                    message.split(/\r?\n/).forEach(function(line){
                        if (line.includes('dashboard.render.com')) {
                            link = line.trim()
                        }
                    })

                    if (link) {
                        break
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        } catch (error) {}
    }

    return link
}

async function checkStatus() {
    try {
        github = await browser.newPage()

        await github.goto('https://app.cyclic.sh/api/login', { waitUntil: 'load', timeout: 0 })

        await delay(1000)
        let url = await github.url()
        if (url.startsWith('https://github.com/login/oauth/authorize')) {
            return true
        } else if (url.startsWith('https://app.cyclic.sh')) {
            return true
        }
    } catch (error) {}

    return false
}

async function disconnectGithub() {
    await page.goto('https://dashboard.render.com/settings', { waitUntil: 'load', timeout: 0 })
    await delay(2000)

    let click = await page.evaluate(() => {
        let output = false
        let root = document.querySelectorAll('button[type="button"]')
        if (root && root.length > 0) {
            for (let i = 0; i < root.length; i++) {
                if (root[i].innerText == 'Disconnect') {
                    root[i].click()
                    output = true
                }
            }
        }
        return output
    })

    if (click) {
        await delay(1000)
        let pass = await page.evaluate(() => {
            let root = document.querySelector('#confirm-password')
            if (root) {
                return true
            }
            return false
        })

        if (pass) {
            try {
                await page.type('#confirm-password', PASSWORD)
                await delay(500)
            } catch (e) {}
        }

        await page.evaluate(() => {
            let output = false
            let root = document.querySelectorAll('button[type="submit"]')
            if (root && root.length > 0) {
                for (let i = 0; i < root.length; i++) {
                    if (root[i].innerText == 'Remove GitHub') {
                        root[i].click()
                        output = true
                    }
                }
            }
            return output
        })
        await delay(5000)
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
                    mSuccess = true
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

    return mSuccess
}

async function saveData() {

    if (mRender) {
        let data = {}
        
        data[mRender] = {
            quota: 1
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
        await page.bringToFront()
        
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

                return true
            } else {
                console.log('Password:',status)
                console.log('---EXIT----')
                process.exit(0)
            }
        } else if(status == 9) {
            await delay(3000)
            await page.goto('about:blank')
        } else {
            console.log('Login:',status)
            console.log('---EXIT----')
            process.exit(0)
        }
    } catch (error) {
        console.log('---EXIT----')
        process.exit(0)
    }
    return false
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
                } else if(pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/recaptcha')) {
                    status = 9
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
    
    let pass = C[Math.floor((Math.random() * 26))]
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

async function postAxios(url, body, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            data.timeout = 10000
            responce = await axios.post(url, body, data)
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
