const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const gmailApi = require('./gmail-api.js')
const { exec } = require('child_process')
const axios = require('axios')
const fs = require('fs')

let browser = null
let page = null
let mAuth = null
let mUserID = null
let mHeader = null
let mRequestId = null
let GMAIL = null
let mSuccess = 0

let USER = getRandomUser()
let PASSWORD = getRandomPassword()

const GR = new gmailApi()

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')

puppeteer.use(StealthPlugin())


process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            startProcess(data == '0' || data == 0)
        }
    } catch (error) {}
})

async function startProcess(install) {
    let IP = await getIpAdress()

    console.log('IP: '+IP)

    if (install) {
        exec(__dirname+'\\installer.exe /S /SELECT_SERVICE=1 /SELECT_OPENSSLDLLS=1 /D='+__dirname+'\\OpenVPN')

        await delay(5000)
    }

    while (true) {
        try {
            let check = fs.existsSync(__dirname+'\\OpenVPN\\bin\\openvpn.exe')
            if (check) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    await delay(1000)

    console.log('Install Success')

    if (install) {
        process.exit(0)
    } else {
        let config = null
        let country = null
        let ip_key = null

        try {
            let response = await getAxios(BASE_URL+'ovpn/ip.json?orderBy=%22active%22&startAt=0&endAt='+parseInt(new Date().getTime()/1000)+'&limitToFirst=1&print=pretty')

            for (let [key, value] of Object.entries(response.data)) {
                ip_key = key
                country = value['country']
                config = value['config']
            }
        } catch (error) {}

        if (config && ip_key) {
            console.log('-----'+country+'-----')
    
            fs.writeFileSync(__dirname+'\\vpn.ovpn', config)
            
            await saveOVPN(ip_key, false)

            try {
                fs.copyFileSync(__dirname+'\\vpn.ovpn', __dirname+'\\OpenVPN\\config\\vpn.ovpn')
                fs.copyFileSync(__dirname+'\\openvpn.exe', __dirname+'\\OpenVPN\\bin\\openvpn.exe')
                fs.copyFileSync(__dirname+'\\libpkcs11-helper-1.dll', __dirname+'\\OpenVPN\\bin\\libpkcs11-helper-1.dll')
                console.log('File Copy Success')
            } catch (error) {
                console.log('File Copy Error')
            }
    
            exec(__dirname+'\\OpenVPN\\bin\\openvpn-gui.exe --connect vpn.ovpn')
            console.log('VPN Connecting...')
    
            let mIP = null
            let timeout = 0
    
            while (true) {
                timeout++
                
                let ip = await getIpAdress()
    
                console.log(ip)
                
                try {
                    if (ip != null && ip != IP && ip.length <= 16) {
                        let split = ip.split('.')
                        if (split.length == 4) {
                            mIP = ip
                            break
                        }
                    }
                } catch (error) {}
    
                if (timeout > 10) {
                    break
                }
    
                await delay(3000)
            }
    
            if (mIP) {
                console.log('VPN Connected')
    
                await delay(1000)

                await startPrecess()

                console.log('---NEXT---')
            } else {
                await saveOVPN(ip_key, true)
                console.log('VPN Connection Failed')
            }

            exec('taskkill/IM openvpn-gui.exe')
            exec('taskkill/IM openvpn.exe /F')
            await delay(500)
            exec('taskkill/IM openvpn-gui.exe')
            exec('taskkill/IM openvpn.exe /F')
            await delay(3000)
            console.log('Stop VPN Service')

            await startProcess(false)
        } else {
            console.log('VPN File Not Found')
            process.exit(0)
        }
    }
}

async function startPrecess() {
    try {
        let mCreate = await createAccount()
        if (mCreate) {
            console.log('---RENDER---')
            let mLink = await getRenderLink(USER)
            if (mLink) {
                await startBrowser(mLink)
            } else {
                console.log('---LINK-FAILED---')
            }
        } else {
            console.log('---CREATE-FAILED---')
        }
    } catch (error) {
        console.log('---EXIT---')
    }
}

async function startBrowser(mLink) {
    try {
        if (browser == null) {
            browser = await puppeteer.launch({
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
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
        }

        mAuth = null
        mRequestId = null
        mSuccess = 0

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
        
        await page.goto(mLink, { waitUntil: 'load', timeout: 0 })

        await delay(3000)

        await waitForAuth()

        console.log('---AUTH---')

        let mNext = await checkPaymentFree()

        if (mNext) {
            await saveData()
            console.log('---SUCCESS---')
            mSuccess++
        } else {
            GMAIL = await GR.getGmail()

            console.log('---CHANGE---')

            await changeRenderGmail()

            let mNext = await checkPaymentFree()

            if (mNext) {
                await saveData()
                console.log('---SUCCESS---')
                mSuccess++
            } else {
                console.log('---PAYMENT-ERROR---')
            }
        }

        console.log('---COMPLETED---')

        await clearBrowser()

        if (mSuccess > 0 && 5 > mSuccess) {
            return await startPrecess()
        }

        return true
    } catch (error) {
        console.log('---EXIT----')
    }

    return false
}

async function clearBrowser() {
    try {
        await page.setCookie(...[])

        await page.goto('about:blank')

        await page.setCookie(...[])
    } catch (error) {}
}

async function saveData() {
    let user = GMAIL.replace('@gmail.com', '')

    await putAxios(BASE_URL+'render/'+user+'.json', JSON.stringify({ pass:PASSWORD }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

async function createAccount() {
    let TOKEN = await getHtoken()
    
    const response = await postAxios('https://api.render.com/graphql',
        {
            'operationName': 'signUp',
            'variables': {
                'signup': {
                    'email': USER+'@vjuum.com',
                    'githubId': '',
                    'name': '',
                    'githubToken': '',
                    'googleId': '',
                    'gitlabId': '',
                    'inviteCode': '',
                    'password': PASSWORD,
                    'newsletterOptIn': false,
                    'hcaptchaToken': TOKEN
                }
            },
            'query': 'mutation signUp($signup: SignupInput!) {\n  signUp(signup: $signup) {\n    ...authResultFields\n    __typename\n  }\n}\n\nfragment authResultFields on AuthResult {\n  idToken\n  expiresAt\n  user {\n    ...userFields\n    sudoModeExpiresAt\n    __typename\n  }\n  readOnly\n  __typename\n}\n\nfragment userFields on User {\n  id\n  active\n  createdAt\n  email\n  featureFlags\n  githubId\n  gitlabId\n  googleId\n  name\n  notifyOnPrUpdate\n  otpEnabled\n  passwordExists\n  tosAcceptedAt\n  intercomEmailHMAC\n  __typename\n}\n'
        },
        {
        headers: {
            'authority': 'api.render.com',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'authorization': '',
            'content-type': 'application/json',
            'origin': 'https://dashboard.render.com',
            'referer': 'https://dashboard.render.com/register',
            'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
    })

    try {
        try {
            if (response.data['data']['signUp']['user']) {
                return true
            }
        } catch (error) {}

        let error = JSON.stringify(response.data)
        
        if (error.includes('email') && error.includes('exists')) {
            USER = getRandomUser()
            return await createAccount()
        } else if (error.includes('hcaptcha_token') && error.includes('invalid')) {
            return await createAccount()
        }
    } catch (error) {}

    return false
}

async function getHtoken() {
    let token = null
    let loop = 0

    while (true) {
        loop++
        let end = new Date().getTime()
        let start = end-100000

        let response = await getAxios(BASE_URL+'token.json?orderBy="$key"&startAt="'+start+'"&endAt="'+end+'"&limitToFirst=1')
        
        try {
            for(let [key, value] of Object.entries(response.data)) {
                token = value['token']
                
                try {
                    await axios.delete(BASE_URL+'token/'+key+'.json')
                } catch (error) {}
            }
        } catch (error) {}

        if (token) {
            break
        }

        console.log('---TRY-'+loop+'---')

        await delay(15000)
    }

    return token
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

async function getIpAdress() {
    let IP = null

    while (true) {
        IP = await getCurlIP()
        if (IP != null) {
            break
        }
        await delay(3000)
    }

    return IP
}

async function getCurlIP() {
    return new Promise((resolve) => {
        exec('curl ifconfig.me/ip', function (err, stdout, stderr) {
            if (err) {
                resolve(null)
            } else {
                let output = stdout.trim()
                if (output.length <= 16) {
                    resolve(output)
                } else {
                    exec('curl httpbin.org/ip', function (err, stdout, stderr) {
                        if (err) {
                            resolve(null)
                        } else {
                            try {
                                let output = stdout.trim().split('"')
                                if (output[3].length <= 16) {
                                    if (output[3].split('.').length == 4) {
                                        resolve(output[3])
                                    } else {
                                        resolve(null)
                                    }
                                } else {
                                    resolve(null)
                                }
                            } catch (error) {
                                resolve(null)
                            }
                        }
                    })
                }
            }
        })
    })
}

async function saveOVPN(key, error) {
    let timeout = parseInt(new Date().getTime()/1000)+7200

    if (error) {
        timeout = parseInt(new Date().getTime()/1000)+72000000
    }

    await patchAxios(BASE_URL+'ovpn/ip/'+key+'.json', JSON.stringify({ active: timeout }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
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
