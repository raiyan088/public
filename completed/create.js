const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const gmailApi = require('./gmail-api.js')
const axios = require('axios')
const fs = require('fs')

let GITHUB_NAME = 'account'

let browser = null
let account = null
let page = null
let mAuth = null
let mUserID = null
let mHeader = null
let mRequestId = null
let GMAIL = null
let mData = {}
let cookies = null
let mRender = null
let USER = null
let RENDER = null
let PASSWORD = null


const GR = new gmailApi()

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')

puppeteer.use(StealthPlugin())


startPrecess()


async function startPrecess() {
    try {
        GMAIL = null
        cookies = JSON.parse(fs.readFileSync('cookies.json'))

        let response = await getAxios(BASE_URL+'render.json?orderBy="$key"&limitToFirst=1')
        
        for(let [key, value] of Object.entries(response.data)) {
            RENDER = key
            PASSWORD = value['pass']

            if (value['user']) {
                GMAIL = value['user']
            }

            try {
                await axios.delete(BASE_URL+'render/'+key+'.json')
            } catch (error) {}
        }

        GITHUB_NAME = await getGitName()

        await startBrowser()
    } catch (error) {
        console.log('---EXIT---')
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

        mAuth = null
        mRequestId = null

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
        
        await page.goto('https://dashboard.render.com/login', { waitUntil: 'load', timeout: 0 })

        console.log('---PAGE---')

        await delay(2000)

        await waitForLogin()

        await delay(3000)

        let mSuccess = await waitForAuth()

        if (mSuccess) {
            console.log('---AUTH---')

            let mNext = await checkPaymentFree()

            if (!mNext) {
                GMAIL = await GR.getGmail()

                console.log(GMAIL)

                console.log('---CHANGE---')

                await changeRenderGmail()

                mNext = await checkPaymentFree()
            }

            if (mNext) {
                console.log('---CHANGE-SUCCESS---')

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

                await saveData()

                console.log('---SUCCESS---')
            } else {
                console.log('---PAYMENT-ERROR---')
            }
        } else {
            console.log('---EXISTS---')
        }
        process.exit(0)
    } catch (error) {
        console.log(error)
        console.log('---EXIT----')
        process.exit(0)
    }
}

async function renderRepoSetup() {
    let mSuccess = false

    await page.bringToFront()
    await delay(200)

    await page.goto('https://dashboard.render.com/select-repo?type=web', { waitUntil: 'load', timeout: 0 })
    await delay(2000)

    await page.screenshot({ path:'image_1.jpg' })
    
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
                } else if (url.startsWith('https://dashboard.render.com/github/exists') || url.startsWith('https://github.com/login/oauth/authorize')) {
                    break
                } else if (url.startsWith('https://dashboard.render.com/select-repo')) {
                    mSuccess = true
                    break
                } else if (url == 'https://github.com/dashboard' ||  url == 'https://github.com/dashboard/') {
                    break
                }
            } catch (error) {
                break
            }

            await delay(1000)
        }

        if (!mSuccess) {
            return 'GIT'
        }

        await page.goto('https://dashboard.render.com/select-repo?type=web', { waitUntil: 'load', timeout: 0 })
        await delay(2000)
    }
    
    mSuccess = await connectRenderRepo()
    if (mSuccess) {
        await delay(1000)

        let exists = await page.evaluate(() => {
            let root = document.querySelector('#serviceName')
            if (root && root.value.length > 2) {
                return true
            }
            return false
        })

        if (exists) {
            await page.focus('#serviceName')
            await page.keyboard.down('Control')
            await page.keyboard.press('A')
            await page.keyboard.up('Control')
            await page.keyboard.press('Backspace')
            await delay(500)
        }
        await page.type('#serviceName', getRandomUser())
        await delay(500)
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

            console.log(mRender)
            
            console.log('---CREATED---')
        } else {
            console.log('---ID-ERROR---')
        }
    } else {
        await page.screenshot({ path:'image.jpg' })
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

async function waitForLogin() {
    let user = RENDER+'@vjuum.com'

    if (GMAIL) {
        user = GMAIL
    }

    await page.type('input[name="email"]', user)
    await delay(500)
    await page.type('input[name="password"]', PASSWORD)
    await delay(1000)

    await page.click('button[type="submit"]')
}

async function saveData() {
    await changeGithub(mRender == null)

    let data = {
        user: GMAIL,
        pass:PASSWORD
    }

    if (mRender) {
        data['url'] = mRender
    }

    await putAxios(BASE_URL+'render_account/'+RENDER+'.json', JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })

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

                try {
                    await axios.delete(BASE_URL+'github/'+GITHUB_NAME+'/'+USER+'.json')
                } catch (error) {}
            }
        } else {
            if (GITHUB_NAME == 'valied') {
                GITHUB_NAME = 'account'
                await setGitName(GITHUB_NAME)
            } else if (GITHUB_NAME == 'account') {
                GITHUB_NAME = 'valied'
                await setGitName(GITHUB_NAME)
            }
            await getGithubAccount()
        }
    } catch (error) {}
}

async function changeGithub(error) {
    let name = 'account'
    if(error) {
        name = 'render_git'
    } else if (GITHUB_NAME == 'valied') {
        name = 'account'
    } else if (GITHUB_NAME == 'account') {
        name = 'valied'
    }

    await putAxios(BASE_URL+'github/'+name+'/'+USER+'.json', JSON.stringify(mData[USER]), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

async function getGitName() {
    try {
        let response = await getAxios(BASE_URL+'github/name.json')
        return response.data['active']
    } catch (error) {
        return 'account'
    }
}

async function setGitName(name) {
    await putAxios(BASE_URL+'github/name.json', JSON.stringify({ active:name }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

async function waitForAuth() {
    let mError = false

    while (true) {
        if (mAuth) {
            break
        } else {
            mError = await page.evaluate(() => {
                let root = document.querySelector('div[id*="error"]')
                if (root) {
                    return true
                }
                return false
            })

            if (mError) {
                break
            }
        }
        await delay(500)
    }

    if (mError) {
        return false
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

    return true
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
    let response = await axios.post('https://api.render.com/graphql',{
          'operationName': 'requestEmailReset',
          'variables': {
            'newEmail': GMAIL
          },
          'query': 'mutation requestEmailReset($newEmail: String!) {\n  requestEmailReset(newEmail: $newEmail)\n}\n'
    }, { headers: mHeader })

    let mError = true
    try {
        if(response.data['errors']) {
            GMAIL = await GR.getGmail()

            return await changeRenderGmail()
        } else if(response.data['data']['requestEmailReset']) {
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
            await page.type('input#email', GMAIL)
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
    
            await delay(3000)

            let error = await page.evaluate(() => {
                let root = document.querySelector('div[class*="invalid-feedback"]')
                if (root) {
                    return true
                }
                return false
            })

            if (error) {
                GMAIL = await GR.getGmail()
                return await changeRenderGmail()
            }
        }
    }

    let link = await GR.getVerificationLink(GMAIL)
    
    if (link) {
        await page.goto(link, { waitUntil: 'load', timeout: 0 })
        await delay(3000)
        
        return true
    } else {
        GMAIL = await GR.getGmail()
        return await changeRenderGmail()
    }
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
