const puppeteer = require('puppeteer')
const axios = require('axios')

let browser = null
let page = null
let account = null
let mData = {}
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

let USER = getRandomUser()
let PASSWORD = getRandomPassword()

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')


startPrecess()

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
                process.exit(0)
            }
        } else {
            console.log('---CREATE-FAILED---')
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
        
        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        
        await page.goto(mLink, { waitUntil: 'load', timeout: 0 })
        
        await delay(5000)

        await putAxios(BASE_URL+'render/'+USER+'.json', JSON.stringify({ pass:PASSWORD }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        console.log('---COMPLETED---')
        process.exit(0)
    } catch (error) {
        console.log('---EXIT----')
        process.exit(0)
    }
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

        await delay(10000)
    }

    return token
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

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
