const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')

const SYMBLE = '#'
const SIZE = 6

let mPrevLog = ''
let mLoginFailed = false
let mDisconnect = false
let mLogStart = false
let mArrowUp = true
let browser = null
let SERVER = ''
let mLoad = true
let mData = 0
let PAGES = []
let STATUS = []

let COLAB = [
    '118bn_FQSqA42EDEricZusGTn5Do_gCWC',
    '1rAoQfVTS2AJ9LywvC_mGAXBoKum_MGdx',
    '1NLEVldJSzt7OnlGo3mgZrrHhxvBqjyQe',
    '1kWn3wvRf9MFdR5pnhZl5TuxGnAJ3kPjt',
    '1mmBYBL0eqzFU3RRQY7Q5twKRZmpmBUrS',
    '1x9dFHpPihtrGUKnOe3haHuNwJaDUEMUg'
]

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dtYWlsLw==', 'base64').toString('ascii')

let loginUrl = 'https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fcolab.research.google.com%2Ftun%2Fm%2Fassignments%3Fauthuser%3D0&ec=GAZAqQM&ifkv=ASKXGp2VjIgsjrAwBFLiCjhx-F5QfSM4e9q_N7QDa_b3wN-IPMZNHK_ZiTRaBByb_7kyjZ7DePjB&passive=true&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S687877650%3A1703041094123974&theme=glif'


puppeteer.use(StealthPlugin())

process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            mData = parseInt(data)
            SERVER = 'gmail_'+data
            readCookies()
        }
    } catch (error) {}
})

async function readCookies() {
    let response = await getAxios(BASE_URL+'server/'+SERVER+'.json')

    try {
        let start = true

        try {
            if (response.data['data']['block'] != null) {
                start = false
            }
        } catch (error) {}

        if (start) {
            if (response.data) {
                startBrowser(response.data)
            } else {
                console.log(SYMBLE+SYMBLE+'---NULL----'+getID(mData))
                process.exit(0)
            }
        } else {
            console.log(SYMBLE+SYMBLE+'---BLOCK---'+getID(mData))
            await changeGmail()
            await delay(1000)
            console.log(SYMBLE+SYMBLE+'---EXIT----'+getID(mData))
            process.exit(0)
        }
    } catch (error) {
        console.log(error)
        console.log(SYMBLE+SYMBLE+'---EXIT----'+getID(mData))
        process.exit(0)
    }
}

async function startBrowser(data) {
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
    
        let page = (await browser.pages())[0]
    
        console.log(SYMBLE+SYMBLE+'---START---'+getID(mData))

        if (data['cookies']) {
            await page.setCookie(...data['cookies'])
            await colabCheckConnected(page)
        } else {
            mLoginFailed = true
        }

        if (mLoginFailed) {
            console.log(SYMBLE+SYMBLE+'---LOGIN---'+getID(mData))
            let details = await getPageDetails(page)
            await logInGmail(page, data['data'], details)
            await colabCheckConnected(page)
        }

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        await page.goto('https://colab.research.google.com/drive/'+COLAB[0], { waitUntil: 'load', timeout: 0 })
        await waitForSelector(page, 'colab-connect-button')
        await setUserId(page)
        let ID = ((mData-1)*SIZE)+1
        console.log(SYMBLE+SYMBLE+'---PAGE----'+getID(ID))
        
        PAGES.push(page)
        STATUS.push(0)

        let cookies = await page.cookies()
        
        for (let i = 1; i < SIZE; i++) {
            let newPage = await browser.newPage()
            await newPage.setCookie(...cookies)
            PAGES.push(newPage)
            STATUS.push(0)
            newPage.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
            await newPage.goto('https://colab.research.google.com/drive/'+COLAB[i], { waitUntil: 'load', timeout: 0 })
            await waitForSelector(newPage, 'colab-connect-button')
            await setUserId(newPage)
            let ID = ((mData-1)*SIZE)+i+1
            console.log(SYMBLE+SYMBLE+'---PAGE----'+getID(ID))
        }

        console.log(SYMBLE+SYMBLE+'---LOAD---'+getID(mData))

        let mBlock = false

        while (true) {
            for (let i = 0; i < SIZE; i++) {
                await PAGES[i].bringToFront()
                await delay(500)
                let ID = ((mData-1)*SIZE)+i+1
                if(STATUS[i] == 0) {
                    await removeCaptha(PAGES[i])

                    let block = await PAGES[i].evaluate(() => {
                        let root = document.querySelector('[class="blocked-dialog confirm-dialog"]')
                        if (root) {
                            return true
                        }
                        return false
                    })

                    if (block) {
                        mBlock = true
                    } else {
                        let input = await PAGES[i].evaluate(() => {
                            let root = document.querySelector('div[class="output-content"]')
                            if (root) {
                                let text = root.innerText
                                if (text && text== 'Enter ID:') {
                                    return true
                                }
                            }
                            return false
                        })
            
                        if (input) {
                            console.log(i, 'Set ID')
                            await PAGES[i].keyboard.type(parseInt(ID).toString())
                            await delay(200)
                            await PAGES[i].keyboard.press('Enter')
                            STATUS[i] = 1
                        } else {
                            console.log(i, 'Input Not Show')
                            await PAGES[i].screenshot({
                                path: 'screenshot'+i+'.jpg'
                            })
                        }
                    }
                } else if(STATUS[i] == 1) {
                    let log = await getStatusLog(PAGES[i])
                    if (log == 'START') {
                        console.log(SYMBLE+SYMBLE+'---ACTIVE--'+getID(ID))
                    } else if (log == 'COMPLETED') {
                        console.log(SYMBLE+SYMBLE+'-COMPLETED-'+getID(ID))
                        await PAGES[i].goto('https://colab.research.google.com/drive/'+COLAB[i], { waitUntil: 'load', timeout: 0 })
                        await waitForSelector(PAGES[i], 'colab-connect-button')
                        await setUserId(PAGES[i])
                        STATUS[i] = 0
                    }
                }
                await delay(500)
            }

            if(mBlock) {
                console.log(SYMBLE+SYMBLE+'---BLOCK---'+getID(mData))
                await putAxios(BASE_URL+'server/'+SERVER+'/data.json', JSON.stringify({ block:true }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                process.exit(0)
            }
        }
    } catch (error) {
        console.log(SYMBLE+SYMBLE+'---EXIT----'+getID(mData))
        process.exit(0)
    }
}

async function logInGmail(page, data, details) {
    try {
        await page.emulate({"name":"Mi 9T Pro","userAgent":"Mozilla/5.0 (Linux; Android 10; Mi 9T Pro Build/QKQ1.190825.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.43 Mobile Safari/537.36","viewport":{"width":320,"height":480,"deviceScaleFactor":2,"isMobile":true,"hasTouch":true,"isLandscape":false}})
        
        await page.goto(loginUrl, { waitUntil: 'load', timeout: 0 })
        await delay(500)
        await page.waitForSelector('#identifierId')
        await page.type('#identifierId', data['user'])
        await page.waitForSelector('#identifierNext')
        await page.click('#identifierNext')

        let status = await waitForLoginStatus(page)
        if (status == 1) {
            await delay(2000)
            await waitForPasswordType(page, data['pass'])
            await delay(500)
            await page.click('#passwordNext')

            let status = await waitForLoginSuccess(page, false)

            if (status == 4) {
                await delay(2000)
                await page.click('div[data-challengetype="12"]')
                status = await waitForLoginSuccess(page, true)
                if (status == 5) {
                    let recovery = data['recovery']
                    if (!recovery.endsWith('.com')) {
                        recovery += '@gmail.com'
                    }
                    await page.type('#knowledge-preregistered-email-response', recovery)
                    await delay(500)
                    await page.click('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]')
                    await delay(2000)
                    status = await waitForLoginSuccess(page, false)
                }
            }
            
            if (status == 1) {
                console.log(SYMBLE+SYMBLE+'--LOGIN-OK-'+getID(mData))
                await delay(1000)
                await saveCookies(page)
                await setUserAgent(page, details)
            } else {
                console.log(SYMBLE+SYMBLE+'---EXIT----'+getID(mData))
                process.exit(0)
            }
        } else {
            console.log(SYMBLE+SYMBLE+'---EXIT----'+getID(mData))
            process.exit(0)
        }
    } catch (error) {
        console.log(SYMBLE+SYMBLE+'---EXIT----'+getID(mData))
        process.exit(0)
    }
}

async function colabCheckConnected(page) {
    await page.goto('https://colab.research.google.com/tun/m/assignments?authuser=0', { waitUntil: 'load', timeout: 0 })
    let list = await connectedList(page)
    if (list == null) {
        mLoginFailed = true
    } else {
        if (list.length > 0) {
            console.log(SYMBLE+SYMBLE+'---USED----'+getID(mData))
            for (let i = 0; i < list.length; i++) {
                let id = await getFatchID(page, 'https://colab.research.google.com/tun/m/'+list[i]['endpoint']+'/api/sessions?authuser=0')
                if (id) {
                    await deleteFatchID(page, 'https://colab.research.google.com/tun/m/'+list[i]['endpoint']+'/api/sessions/'+id+'?authuser=0')
                }
                await unassingFatch(page, 'https://colab.research.google.com/tun/m/unassign/'+list[i]['endpoint']+'?authuser=0')
            }
            console.log(SYMBLE+SYMBLE+'--DISMISS--'+getID(mData))
        }
    }
}

async function setUserId(page) {
    await page.keyboard.down('Control')
    await page.keyboard.press('Enter')
    await page.keyboard.up('Control')
    await waitForSelector(page, 'mwc-dialog[class="wide"]', 10)
    while (true) {
        try {
            await page.click('mwc-button[dialogaction="ok"]')
        } catch (error) {
            break
        }
        await delay(200)
    }
}

async function getPageDetails(page) {
   return await page.evaluate(() => {
        let user = navigator.userAgent
        let width = 1200
        let height = 600
        try {
            width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
            height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        } catch (error) {}

        return { user:user, width:width, height:height }
    })
}

async function setUserAgent(page, details) {
    await page.evaluateOnNewDocument((userAgent) => {
        let open = window.open

        window.open = (...args) => {
            let newPage = open(...args)
            Object.defineProperty(newPage.navigator, 'userAgent', { get: () => userAgent })
            return newPage
        }

        window.open.toString = () => 'function open() { [native code] }'

    }, details['user'])

    await page.setUserAgent(details['user'])

    await page.setViewport({
        width: details['width'],
        height: details['height'],
        deviceScaleFactor: 1,
    })
}

async function waitForLoginStatus(page) {
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

async function waitForLoginSuccess(page, selection) {
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
            
            if (pageUrl.startsWith('https://colab.research.google.com/')) {
                status = 1
                break
            } else if (pageUrl.startsWith('https://gds.google.com/web/chip')) {
                await page.goto('https://colab.research.google.com/tun/m/assignments?authuser=0', { waitUntil: 'load', timeout: 0 })
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

async function waitForPasswordType(page, password) {
    
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


async function getStatusLog(page) {
    try {
        await removeCaptha(page)

        let mDisconnect = await page.evaluate(() => {
            let root = document.querySelector('mwc-dialog[class="disconnected-dialog yes-no-dialog"]')
            if (root) {
                return true
            }
            return false
        })


        if (!mDisconnect) {
            const value = await page.evaluate(() => {
                let colab = document.querySelector('colab-connect-button')
                if(colab) {
                    let display = colab.shadowRoot.querySelector('#connect-button-resource-display')
                    if (display) {
                        let ram = display.querySelector('.ram')
                        if (ram) {
                            return ram.shadowRoot.querySelector('.label').innerText
                        }
                    } else {
                        let connect = colab.shadowRoot.querySelector('#connect')
                        if (connect) {
                            return connect.innerText
                        }
                    }
                }
                return null
            })

            if (value && value == 'Reconnect') {
                mDisconnect = true
                let has = await exists('mwc-button[dialogaction="cancel"]')
                if (has) {
                    await page.click('mwc-button[dialogaction="cancel"]')
                }
            } else {
                mDisconnect = await page.evaluate(() => {
                    let root = document.querySelector('[aria-label="Run cell"]')
                    if (root) {
                        let status = root.shadowRoot.querySelector('#status')
                        if (status) {
                            return true
                        }
                    }
                    return false
                })
            }
        } else {
            let has = await exists('mwc-button[dialogaction="cancel"]')
            if (has) {
                await page.click('mwc-button[dialogaction="cancel"]')
            }
        }

        if (mDisconnect) {
            return 'COMPLETED'
        } else {
            let data = await page.evaluate(() => {
                let root = document.querySelector('colab-static-output-renderer')
                if (root) {
                    return root.innerText
                }
                return null
            })

            if (data) {
                if (data.includes('★★★---START---★★★')) {
                    await page.evaluate(() => {
                        try {
                            let root = document.querySelector('colab-output-info')
                            if (root) {
                                let cancel = root.shadowRoot.querySelector('mwc-icon-button')
                                if (cancel) {
                                    cancel.click()
                                }
                            }
                        } catch (error) {}
                    })
                    return 'START'
                }
            }
        }
    } catch (error) {}

    return 'NULL'
}

async function waitForDisconnected() {
    await page.click('#runtime-menu-button')
    for (var j = 0; j < 9; j++) {
        await delay(100)
        let finish = await page.evaluate(() => {
            try {
                return document.querySelector('#runtime-menu-button').getAttribute('aria-owns') == ':25'
            } catch (error) {}
            return false
        })
        if (finish) {
            break
        } else {
            await page.keyboard.press('ArrowDown')
        }
    }
    await delay(420)
    await page.keyboard.down('Control')
    await page.keyboard.press('Enter')
    await page.keyboard.up('Control')
    await waitForSelector('mwc-dialog[class="yes-no-dialog"]', 10)
    await delay(500)
    await page.keyboard.press('Enter')
    await delay(5000)
}

async function removeCaptha(page) {
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

async function saveCookies(page) {
    let cookie = await page.cookies()

    let cookies = []

    for (let i = 0; i < cookie.length; i++) {
        let name = cookie[i]['name']
        if (name == 'SAPISID' || name == 'APISID' || name == 'SSID' || name == 'SID' || name == 'HSID') {
            cookies.push(cookie[i])
        }
    }

    await putAxios(BASE_URL+'server/'+SERVER+'/cookies.json', JSON.stringify(cookies), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

async function checkConnected() {
    let timeout = 0
    let connected = false

    while (true) {
        await delay(1000)
        let block = await page.evaluate(() => {
            let root = document.querySelector('[class="blocked-dialog confirm-dialog"]')
            if (root) {
                return true
            }
            return false
        })

        if (block) {
            break
        } else {
            const value = await page.evaluate(() => {
                let colab = document.querySelector('colab-connect-button')
                if(colab) {
                    let display = colab.shadowRoot.querySelector('#connect-button-resource-display')
                    if (display) {
                        let ram = display.querySelector('.ram')
                        if (ram) {
                            return ram.shadowRoot.querySelector('.label').innerText
                        }
                    } else {
                        let connect = colab.shadowRoot.querySelector('#connect')
                        if (connect) {
                            return connect.innerText
                        }
                    }
                }
                return null
            })
    
            if (value) {
                timeout++
    
                if (value != 'Connect') {
                    connected = true
                    break
                }
            }
    
            if (timeout >= 8) {
                break
            }
        }
    }
    
    return connected
}

async function connectedList(page) {
    let list = null

    while (true) {
        try {
            let pageUrl = await page.evaluate(() => window.location.href)
            
            if (pageUrl.startsWith('https://colab.research.google.com/')) {
                let body = await page.evaluate(() => document.body.innerText)
                if (body && body.includes('assignments')) {
                    try {
                        let temp = body.substring(body.indexOf('assignments'), body.length)
                        temp = temp.substring(temp.indexOf('['), temp.lastIndexOf(']')+1)
                        list = JSON.parse(temp)
                        break
                    } catch (error) {
                        list = []
                        break
                    }
                } else {
                    list = null
                    break 
                }
            } else {
                list = null
                break
            }
        } catch (error) {}

        await delay(500)
    }

    return list
}


async function getFatchID(page, url) {
    
    let id = null

    while (true) {
        let data = await page.evaluate((url) => {
            return new Promise(function(resolve) {
                fetch(url, {
                    'headers': {
                        'accept': '*/*',
                        'accept-language': 'en-US,en;q=0.9',
                        'sec-ch-ua': '"Not:A-Brand";v="99", "Chromium";v="112"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'x-colab-tunnel': 'Google'
                    },
                    'referrer': 'https://colab.research.google.com/',
                    'referrerPolicy': 'origin',
                    'body': null,
                    'method': 'GET',
                    'mode': 'cors',
                    'credentials': 'include'
                }).then((response) => response.text()).then((text) => {
                    resolve(JSON.parse(text))
                }).catch((error) => {
                    resolve(null)
                })
            })
        }, url)

        if (data) {
            if (data.length > 0) {
                id = data[0]['id']
            } else {
                id = null
            }
            break
        }
        await delay(1000)
    }
    
    return id
}

async function deleteFatchID(page, url) {
    while (true) {
        let data = await page.evaluate((url) => {
            return new Promise(function(resolve) {
                fetch(url, {
                    'headers': {
                        'accept': '*/*',
                        'accept-language': 'en-US,en;q=0.9',
                        'sec-ch-ua': '"Not:A-Brand";v="99", "Chromium";v="112"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'x-colab-tunnel': 'Google'
                    },
                    'referrer': 'https://colab.research.google.com/',
                    'referrerPolicy': 'origin',
                    'body': null,
                    'method': 'DELETE',
                    'mode': 'cors',
                    'credentials': 'include'
                }).then((response) => {
                    resolve('Success')
                }).catch((error) => {
                    resolve(null)
                })
            })
        }, url)

        if (data) {
            break
        }
        await delay(1000)
    }
}

async function unassingFatch(page, url) {
    while (true) {
        let data = await page.evaluate((url) => {
            return new Promise(function(resolve) {
                fetch(url, {
                    'headers': {
                        'accept': '*/*',
                        'accept-language': 'en-US,en;q=0.9',
                        'sec-ch-ua': '"Not:A-Brand";v="99", "Chromium";v="112"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'x-colab-tunnel': 'Google'
                    },
                    'referrer': 'https://colab.research.google.com/',
                    'referrerPolicy': 'origin',
                    'body': null,
                    'method': 'GET',
                    'mode': 'cors',
                    'credentials': 'include'
                }).then((response) => response.text()).then((text) => {
                    resolve(text)
                }).catch((error) => {
                    resolve(null)
                })
            })
        }, url)

        if (data) {
            try {
                let split = data.split('"')
                if (split.length == 5) {
                    let check = await page.evaluate((url, token) => {
                        return new Promise(function(resolve) {
                            fetch(url, {
                                'headers': {
                                    'accept': '*/*',
                                    'accept-language': 'en-US,en;q=0.9',
                                    'sec-ch-ua': '"Not:A-Brand";v="99", "Chromium";v="112"',
                                    'sec-ch-ua-mobile': '?0',
                                    'sec-ch-ua-platform': '"Windows"',
                                    'sec-fetch-dest': 'empty',
                                    'sec-fetch-mode': 'cors',
                                    'sec-fetch-site': 'same-origin',
                                    'x-colab-tunnel': 'Google',
                                    'x-goog-colab-token': token
                                },
                                'referrer': 'https://colab.research.google.com/',
                                'referrerPolicy': 'origin',
                                'body': null,
                                'method': 'POST',
                                'mode': 'cors',
                                'credentials': 'include'
                            }).then((response) => {
                                resolve('Success')
                            }).catch((error) => {
                                resolve(null)
                            })
                        })
                    }, url, split[3])

                    if (check) {
                        break
                    }
                }
            } catch (error) {
                break
            }
        }
        await delay(500)
    }
}

async function waitForSelector(page, element, _timeout) {
    let timeout = 60

    if (_timeout != null) {
        timeout = _timeout
    }

    while (true) {
        timeout--
        try {
            let data = await exists(page, element)
            if (data) {
                break
            }
        } catch (error) {}

        if (timeout <= 0) {
            break
        }
        await delay(500)
    }
}


async function exists(page, evement) {
    return await page.evaluate((evement) => {
        let root = document.querySelector(evement)
        if (root) {
            return true
        }
        return false
    }, evement)
}

async function changeGmail() {

    let response = await getAxios(BASE_URL+'backup.json?orderBy="pass"&limitToLast=1&print=pretty')

    try {
        let data = {}
        for (let [key, value] of Object.entries(response.data)) {
            data = value
            data['user'] = key
        }

        try {
            await axios.delete(BASE_URL+'backup/'+data['user']+'.json')
        } catch (error) {}

        await putAxios(BASE_URL+'server/'+SERVER+'/data.json', JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    } catch (error) {}
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

function getID(data) {
    let id = data.toString()
    if (id.length == 1) {
        return SYMBLE+'00'+data+SYMBLE
    } else if (id.length == 2) {
        return SYMBLE+'0'+data+SYMBLE
    }
    return SYMBLE+data+SYMBLE
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
