const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')

let mPrevLog = ''
let mLoginFailed = false
let mLogStart = false
let mArrowUp = true
let browser = null
let page = null
let SERVER = ''
let mLog = false
let mData = 0

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dtYWlsLw==', 'base64').toString('ascii')

let loginUrl = 'https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fcolab.research.google.com%2Fdrive%2F1f0oVyQCqELtvbRQTyyBkmDpar_e4nrjY&ec=GAZAqQM&ifkv=AVQVeywxh6y4_WIE0MDR0rgdX-zq-dVw_5JlyI40eMGfPdYPrn0ax8ghA0BlXIfYbZNrWur_L03t&passive=true&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S-1677059645%3A1698307841046563&theme=glif'

puppeteer.use(StealthPlugin())

process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            mData = data
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
                console.log('||---NULL----'+getID())
                process.exit(0)
            }
        } else {
            console.log('||---BLOCK---'+getID())
            await changeGmail()
            await delay(1000)
            console.log('||---EXIT----'+getID())
            process.exit(0)
        }
    } catch (error) {
        console.log('||---EXIT----'+getID())
        process.exit(0)
    }
}

async function startBrowser(data) {
    try {
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome-stable',
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

        page.on('console', msg => {
            try {
                if(msg.text().startsWith('Failed to load resource')) {
                    mLoginFailed = true
                }
            } catch (error) {}
        })
    
        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        
        console.log('||---START---'+getID())

        if (data['cookies']) {
            await page.setCookie(...data['cookies'])
            await page.goto('https://colab.research.google.com/drive/1f0oVyQCqELtvbRQTyyBkmDpar_e4nrjY', { waitUntil: 'load', timeout: 0 })
        } else {
            mLoginFailed = true
        }

        if (mLoginFailed) {
            console.log('||---LOGIN---'+getID())
            await logInGmail(data['data'])
        }
        
        await waitForSelector('colab-connect-button')

        console.log('||---LOAD----'+getID())
        
        let hasConnected = await checkConnected()

        if (hasConnected) {
            console.log('||---USED----'+getID())
            await waitForDisconnected()
            console.log('||--DISMISS--'+getID())
        }

        await page.keyboard.down('Control')
        await page.keyboard.press('Enter')
        await page.keyboard.up('Control')
        await waitForSelector('mwc-dialog[class="wide"]')
        await delay(1000)
        await page.keyboard.press('Tab')
        await delay(200)
        await page.keyboard.press('Tab')
        await delay(200)
        await page.keyboard.press('Enter')
        let success = await checkConnected()
        if (success) {
            console.log('||-CONNECTED-'+getID())

            let start = new Date().getTime()+300000
                
            while (true) {
                mPrevLog = ''
                mLogStart = false
                await waitForFinish()
                console.log('||-COMPLETED-'+getID())
                await removeCaptha()
                await delay(1000)
                await waitForDisconnected()
                await delay(2000)
                console.log('||--DISMISS--'+getID())
                if (start < new Date().getTime()) {
                    await page.goto('https://colab.research.google.com/drive/1f0oVyQCqELtvbRQTyyBkmDpar_e4nrjY', { waitUntil: 'load', timeout: 0 })
                    await waitForSelector('colab-connect-button')
                    await delay(2000)
                    await saveCookies()
                    mArrowUp = true
                    await page.keyboard.press('ArrowUp')
                    await page.keyboard.down('Control')
                    await page.keyboard.press('Enter')
                    await page.keyboard.up('Control')
                    await waitForSelector('mwc-dialog[class="wide"]')
                    await delay(1000)
                    await page.keyboard.press('Tab')
                    await delay(200)
                    await page.keyboard.press('Tab')
                    await delay(200)
                    await page.keyboard.press('Enter')
                    start = new Date().getTime()+300000
                } else {
                    mArrowUp = true
                    await page.keyboard.press('ArrowUp')
                    await page.keyboard.down('Control')
                    await page.keyboard.press('Enter')
                    await page.keyboard.up('Control')
                }
                let success = await checkConnected()
                if (success) {
                    console.log('||-CONNECTED-'+getID())
                } else {
                    console.log('||---BLOCK---'+getID())
                    await changeGmail()
                    await delay(1000)
                    console.log('||---EXIT----'+getID())
                    process.exit(0)
                }
            }
        } else {
            console.log('||---BLOCK---'+getID())
            await changeGmail()
            await delay(1000)
            console.log('||---EXIT----'+getID())
            process.exit(0)
        }
    } catch (error) {
        console.log('||---EXIT----'+getID())
        process.exit(0)
    }
}

async function logInGmail(data) {

    try {
        await page.goto(loginUrl, { waitUntil: 'load', timeout: 0 })
        await delay(500)
        await page.waitForSelector('#identifierId')
        await page.type('#identifierId', data['user'])
        await page.waitForSelector('#identifierNext')
        await page.click('#identifierNext')

        let status = await waitForLoginStatus()
        if (status == 1) {
            await delay(2000)
            await waitForPasswordType(data['pass'])
            await delay(500)
            await page.click('#passwordNext')

            let status = await waitForLoginSuccess(false)

            if (status == 4) {
                await delay(2000)
                await page.click('div[data-challengetype="12"]')
                status = await waitForLoginSuccess(true)
                if (status == 5) {
                    let recovery = data['recovery']
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
                console.log('||--LOGIN-OK-'+getID())
                await delay(5000)
                await saveCookies()
            } else {
                console.log('||---EXIT----'+getID())
                process.exit(0)
            }
        } else {
            console.log('||---EXIT----'+getID())
            process.exit(0)
        }
    } catch (error) {
        console.log('||---EXIT----'+getID())
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
            
            if (pageUrl.startsWith('https://colab.research.google.com/')) {
                status = 1
                break
            } else if (pageUrl.startsWith('https://gds.google.com/web/chip')) {
                await page.goto('https://colab.research.google.com/drive/1f0oVyQCqELtvbRQTyyBkmDpar_e4nrjY', { waitUntil: 'load', timeout: 0 })
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

async function saveCookies() {
    let cookies = await page.cookies()

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

    if (connected) {
        while (true) {
            await delay(3000)
            let block = await page.evaluate(() => {
                let root = document.querySelector('[class="blocked-dialog confirm-dialog"]')
                if (root) {
                    return true
                }
                return false
            })

            if (block) {
                connected = false
                break
            } else {
                const value = await page.evaluate(() => {
                    let colab = document.querySelector('colab-connect-button')
                    if(colab) {
                        let display = colab.shadowRoot.querySelector('#connect-button-resource-display')
                        if (display) {
                            let ram = display.querySelector('.ram')
                            if (ram) {
                                let output = ram.shadowRoot.querySelector('.label').innerText
                                if(output) {
                                    return 'RAM'
                                }
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
        
                if (value && (value == 'Busy' || value == 'RAM')) {
                    break
                } else {
                    let waiting = await page.evaluate(() => {
                        let root = document.querySelector('colab-status-bar')
                        if (root) {
                            let status = root.shadowRoot.querySelector('div[class="connect-status"]')
                            if (status) {
                                if (status.innerText.includes('Waiting to finish the current execution')) {
                                    return true
                                }
                            }
                        }
                        return false
                    })
    
                    if (waiting) {
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
                }
            }
        }    
    }

    return connected
}


async function waitForSelector(element, _timeout) {
    let timeout = 60

    if (_timeout != null) {
        timeout = _timeout
    }

    while (true) {
        timeout--
        await delay(1000)
        try {
            let data = await exists(element)
            if (data) {
                break
            }
        } catch (error) {}

        if (timeout <= 0) {
            break
        }
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
