const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')
const fs = require('fs')

let GITHUB_NAME = 'valied'

let browser = null
let page = null
let account = null
let mData = {}
let USER = null
let GMAIL = null
let cookies = null
let mRender = null
let mAuth = null
let mUserID = null
let mRequestId = null
let mHeader = null
let PASSWORD = ''

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')


puppeteer.use(StealthPlugin())

startPrecess()

async function startPrecess() {
    try {
        cookies = JSON.parse(fs.readFileSync('cookies.json'))

        let mLink = await getRenderData()

        console.log('---START---')

        await startBrowser(mLink)
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
            //headless: 'new',
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
                if (ststus == 'GIT' || ststus == 'ERROR') {
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
        //process.exit(0)
    } catch (error) {
        console.log('---EXIT----')
        //process.exit(0)
    }
}

async function getRenderData() {
    let mLink = null

    while (true) {
        try {
            let response = await getAxios(BASE_URL+'render.json?orderBy="$key"&limitToFirst=1')
        
            if (response && response.data != null && response.data != 'null') {
                let data = response.data
                
                for(let key of Object.keys(data)) {
                    GMAIL = key
                }

                PASSWORD = data[GMAIL]['pass']

                mLink = data[GMAIL]['link']
                break
            }
        } catch (error) {}

        await delay(10000)
    }

    return mLink
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

    try {
        await axios.delete(BASE_URL+'render/'+GMAIL+'.json')
    } catch (error) {}
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
