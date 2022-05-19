
const USERAGENT = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.0 Safari/537.36'
const google = 'https://colab.research.google.com/drive/1x1K7-8j92MZuCZIx5k8xcbFApPqIpviu'

const raiyan = 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/'

const database = new admin()

const startTime = parseInt(new Date().getTime() / 1000)

let mDown = false
let allData = null
let mUserAgent = {}
let keyData = new Map()
let mBefore = 0
let USER = 1
let LOAD = 0
let mUserAgentLength = 0
let update = startTime
let statusRun = 0
let mBlockCount = 0
let mAudioBlockCount = 0

let mActiveTime = 0
let mAudioBlock = false
let mGPUt4 = false
let mGPUk80 = false
let mTotalGPUk80 = 0
let mFinish = false
let mPageLoad = 0
let mLoadSuccess = false
let mAlreadyStart = false
let cookes = []
let browser = null
let page = null
let mAuth = null
let mActiveGmail = 0
let mOverLoad = 0
let temp = [] 
let mMailName = 'gmail'



console.log('Downloading data...')


database.connect((error) => {
    if(!error) {
        request({
            url: raiyan+'server.json',
            json:true
        }, function(error, response, body){
            if(!error) {
                SIZE = parseInt(body['size'])
                LOAD = parseInt(body['load'])
                mMailName = body['mail']
                request({
                    url: raiyan+'colab/'+TeslaT4+'.json',
                    json:true
                }, function(error, response, body){
                    if(!error) {
                        mActiveGmail = parseInt(body['gmail'])
                        if(mActiveGmail != 0) {
                            LOAD = mActiveGmail
                            mMailName = body['mail']
                        }
                        request({
                            url: 'https://firebase-server-088.herokuapp.com/gmail?id='+LOAD+'&name='+mMailName,
                            json:true
                        }, function(error, response, body){
                            if(!error) {
                                allData = body
                                console.log('Downloaded Data.')
                                ;(async () => {
                                    mBefore = LOAD
                                    let gmail = await checkSize()
                                    
                                    if(gmail != mMailName) {
                                        mMailName = gmail
                                        database.set('/server/load', LOAD)
                                        database.set('/server/mail', mMailName)
                                    }
                                    await startBackgroundService()
                                })()
                            }
                        })
                    }
                })
            }
        })
    }
})



let timer = setInterval(async function() {

    const now = parseInt(new Date().getTime() / 1000)

    if((now-update) > 60 && mLoadSuccess) {
        if(mGPUt4) {
            if(mAuth) {
                database.child('ngrok').child(mAuth).set(true)
            }
        }
        mIP = null
        mAuth = null
        mNotAuth = 0
        mGPUt4 = false
        mFinish = false
        mMining = false
        mPageLoad = 0
        mAudioBlock = false
        console.log(getTime()+'Something Error. Restart Browser...')
        statusRun++
        
        console.log('---Restart Browser---')
        process.exit(1)
    } else {
        if(statusRun > 5) {
            statusRun = 0
            console.log('+--------------------------------------------------------------------+')
        }
        if(mGPUt4 && mPageLoad == 1 && !mFinish) {
            if(mDown) {
                mDown = false
                await page.keyboard.press('ArrowUp')
            } else {
                mDown = true
                await page.keyboard.press('ArrowDown')
            }

            const runTime = parseInt((now - mActiveTime) / 60)

            statusRun++
            console.log('Id: '+LOAD+' Runing: '+runTime+'m  Status: Waiting process..... Gmail: '+keyData.get(mMailName+LOAD))
        }
    }
}, 60000)

async function startBackgroundService() {
        
    for(let [key, value] of Object.entries(allData)) {
        try {
            let id = 0
            let others = ''
            if(key.startsWith('account_')) {
                id = parseInt(key.replace('account_', ''))
            } else {
                others = key.substring(0, key.indexOf('_account_'))
                id = parseInt(key.replace(others+'_account_', ''))
            }

            let size = 0
            for(let gmail of Object.keys(value['GMAIL'])) {
                if(others == '') {
                    keyData.set('gmail'+((id*10)+size), gmail+'@gmail.com')
                    size++
                } else {
                    keyData.set(others+'Mail'+((id*10)+size), gmail+'@gmail.com')
                    size++
                }
            }
        } catch (e) {}
    }

    statusRun++
    mOverLoad = 0
    mBlockCount = 0
    mAudioBlock = false
    console.log(getTime()+'Service Start...')
    temp = JSON.parse(fs.readFileSync('./cookies.json'))
    mUserAgent = JSON.parse(fs.readFileSync('./user-agent-list.json'))
    mUserAgentLength = Object.keys(mUserAgent).length
    USER = Math.floor((Math.random() * mUserAgentLength) + 1)
    await browserStart()
}

async function browserStart() {

    mGPUt4 = false
    mFinish = false
    mPageLoad = 0
    mAlreadyStart = false
    
    statusRun++
    const tempX = await tempA(AUTH)
    const DATA = allData[getKey(parseInt(LOAD/10), mMailName)]
    console.log('Id: '+LOAD+' Status: Start process...'+' Gmail: '+keyData.get(mMailName+LOAD))

    mTotalGPUk80 = 0
    if(mActiveGmail == 0 || mBefore != LOAD) {
        database.set('/server/load', LOAD+1)
        database.set('/colab/'+TeslaT4+'/gmail', LOAD)
        database.set('/colab/'+TeslaT4+'/mail', mMailName)
    }

    temp.forEach(function(value){
        if(value.name == 'SSID') {
            value.value = DATA['SSID']
        } else if(value.name == 'SAPISID') {
            value.value = DATA['SAPISID']
        } else if(value.name == 'OSID') {
            value.value = DATA['OSID']
        } else if(value.name == 'SID') {
            value.value = DATA['SID']
        } else if(value.name == '__Secure-1PSID') {
            value.value = DATA['1PSID']
        } else if(value.name == 'HSID') {
            value.value = DATA['HSID']
        }
        cookes.push(value)
    })

    browser = await puppeteer.launch({
        headless: true,
        args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
    })

    page = (await browser.pages())[0]
    
    await page.setCookie(...cookes)

    await page.setUserAgent(USERAGENT)

    await page.setRequestInterception(true)
    
    page.on('request', async req => {
        const url = req.url()
        update  = parseInt(new Date().getTime() / 1000)
        if(url == 'https://colab.research.google.com/_/bscframe') {
            req.continue()
            if(mPageLoad == 0 && !mFinish) {
                await delay(1000)
                statusRun++
                mPageLoad = 2
                console.log('Id: '+LOAD+' Status: Webside load Success...'+' Gmail: '+keyData.get(mMailName+LOAD))
                if(mAlreadyStart) {
                    await waitForConnect(page)
                    await page.click('#runtime-menu-button')
                    for(var i=0; i<7; i++) {
                        await page.keyboard.press('ArrowDown')
                    }
                    await delay(420)
                    await page.keyboard.down('Control')
                    await page.keyboard.press('Enter')
                    await page.keyboard.up('Control')
                    await waitForSelector(page, 'div[class="content-area"]', 10)
                    await page.keyboard.press('Enter')
                    await waitForConnect(page)
                }
                await page.keyboard.down('Control')
                await page.keyboard.press('Enter')
                await page.keyboard.up('Control')
                await waitForSelector(page, 'div[class="content-area"]', 10)
                let block = await page.evaluate(() => {
                    let root = document.querySelector('div.content-area > div.flex')
                    if(root && root.innerText.startsWith('You may be executing code that is disallowed')) {
                        return true
                    } else {
                        return false
                    }
                })
                if(block) {
                    await delay(1000)
                    await page.keyboard.press('Tab')
                    await page.keyboard.press('Tab')
                    await page.keyboard.press('Enter')
                    await delay(1000)
                    await waitForSelector(page, 'div[class="content-area"]', 10)
                }
                await delay(1000)
                await page.keyboard.press('Tab')
                await page.keyboard.press('Enter')
                mPageLoad = 1
            }
        } else if(url.startsWith('https://www.google.com/recaptcha/api2/bframe')) {
            req.continue()

            if(!mGPUt4 && !mGPUk80) {
                if(mAudioBlock) {
                    solveV2Recaptchas()
                } else {
                    solveRecaptchas()
                }
            } else {
                await page.evaluate(() => { let recapture = document.querySelector('colab-recaptcha-dialog'); if(recapture) { recapture.shadowRoot.querySelector('mwc-button').click() } })
            }
        } else if(url.startsWith('https://colab.research.google.com/tun/m/gpu-k80')) {
            req.abort()
            if(mPageLoad == 1) {
                mGPUk80 = true
                await delay(1000)
                mTotalGPUk80++
                let siriyal = url.replace('https://colab.research.google.com/tun/m/gpu-k80-s-', '')
                let slash = siriyal.indexOf('/') 
                if(slash != -1) {
                    siriyal = siriyal.substring(0, slash)
                } else {
                    siriyal = 'null'
                }
                statusRun++
                console.log('Id: '+LOAD+' Failed: '+mTotalGPUk80+' GPU: k80 - '+siriyal+' Gmail: '+keyData.get(mMailName+LOAD))

                await page.keyboard.press('Enter')
                await delay(1000)

                if(mPageLoad == 1) {
                    await page.click('#runtime-menu-button')
                    for(var i=0; i<6; i++) {
                        await page.keyboard.press('ArrowDown')
                    }
                    await delay(420)
                    await page.keyboard.down('Control')
                    await page.keyboard.press('Enter')
                    await page.keyboard.up('Control')
                    await waitForSelector(page, 'div[class="content-area"]', 10)
                    await page.keyboard.press('Enter')
                    await delay(420)
                    if(mTotalGPUk80 >= 10) {
                        mOverLoad++
                        statusRun++
                        mFinish = true
                        mGPUk80 = false
                        mPageLoad = 0
                        console.log('Id: '+LOAD+' Status: Failed Over LImited'+' Gmail: '+keyData.get(mMailName+LOAD))
                        
                        if(mOverLoad >= 2) {
                            mOverLoad = 0
                            database.set('/colab/'+TeslaT4+'/gmail', 0)
                            request({
                                url: raiyan+'colab/'+TeslaT4+'.json',
                                json:true
                            }, function(error, response, body){
                                if(!error) {
                                    let active = parseInt(body['active'])
                                    request.get({
                                        url: 'https://' + body['url_'+active] + '.herokuapp.com/reset'
                                    }, function (error, response, body) { })
                                }
                            })
                        }
                    } else {
                        await delay(1000)
                        await page.keyboard.down('Control')
                        await page.keyboard.press('Enter')
                        await page.keyboard.up('Control')
                        mGPUk80 = false
                    }
                }
            }
        } else if(url.startsWith('https://colab.research.google.com/tun/m/gpu-t4')) {
            req.continue()
            if(mPageLoad != 1) {
                mAlreadyStart = true
            }
            if(!mGPUt4 && mPageLoad == 1) {
                mGPUt4 = true
                await delay(1000)
                mActiveTime = parseInt(new Date().getTime() / 1000)
                let siriyal = url.replace('https://colab.research.google.com/tun/m/gpu-t4-s-', '')
                let slash = siriyal.indexOf('/')
                if(slash != -1) {
                    siriyal = siriyal.substring(0, slash)
                } else {
                    siriyal = 'null'
                }
                statusRun++
                console.log('Id: '+LOAD+' GPU: t4 - '+siriyal+' Gmail: '+keyData.get(mMailName+LOAD))
                database.set('/colab/'+TeslaT4+'/t4', true)

                request({
                    url: raiyan+'colab/'+TeslaT4+'.json',
                    json:true
                }, function(error, response, body){
                    if(!error) {
                        let active = parseInt(body['active'])
                        request.get({
                            url: 'https://' + body['url_'+active] + '.herokuapp.com/mining'
                        }, function (error, response, body) { })
                    }
                })
            }
        } else {
            req.continue()
        }
    })

    page.on('response', async response => {
        if (!response.ok() && (response.request().resourceType() == 'fetch' || response.request().resourceType() == 'xhr')) {
            let url = response.url()
            if(url.includes('.com/drive/')) {
                if(!mFinish) {
                    statusRun++
                    mFinish = true
                    mPageLoad = 0
                    let key = getKey(parseInt(LOAD/10), mMailName)
                    let key2 = keyData.get(mMailName+LOAD).replace('@gmail.com', '')
                    database.set('/'+mMailName+'/'+key+'/GMAIL/'+key2, false)
                    database.set('/colab/'+TeslaT4+'/gmail', 0)
                    allData[key]['GMAIL'][key2] = false
                    console.log('Id: '+LOAD+' Status: Sing-Out gmail... Gmail: '+keyData.get(mMailName+LOAD))
                    await delay(2000)
                    
                    console.log('---Restart Browser---')
                    process.exit(1)
                }
            } else if(url.startsWith('https://colab.research.google.com/tun/m/assign?') || url.startsWith('https://colab.research.google.com/tun/m/gpu-t4')) {
                if(!mFinish) {
                    statusRun++
                    mFinish = true
                    mPageLoad = 0
                    let key = getKey(parseInt(LOAD/10), mMailName)
                    let key2 = keyData.get(mMailName+LOAD).replace('@gmail.com', '')
                    database.set('/'+mMailName+'/'+key+'/GMAIL/'+key2, false)
                    database.set('/colab/'+TeslaT4+'/gmail', 0)
                    allData[key]['GMAIL'][key2] = false
                    console.log('Id: '+LOAD+' Status: Terminated gmail... Gmail: '+keyData.get(mMailName+LOAD))
                    await delay(2000)
                    
                    console.log('---Restart Browser---')
                    process.exit(1)
                }
            }
        }
    })

    page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

    await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})

    mLoadSuccess = true
}

async function checkSize() {
    let valid = 0
    let hasData = false
    let mBreak = false
    let mExtra = false
    let mOthers = ''
    for(let [key, value] of Object.entries(allData)) {
        try {
            let id = 0
            let extra = false
            let others = ''
            if(key.startsWith('account_')) {
                extra = false
                id = parseInt(key.replace('account_', '')) * 10
            } else {
                extra = true
                others = key.substring(0, key.indexOf('_account_'))
                id = parseInt(key.replace(others+'_account_', '')) * 10
            }
            let size = 0
            for(let check of Object.values(value['GMAIL'])) {
                if(valid == 0) {
                    if(check) {
                        valid = id
                        mExtra = extra
                        mOthers = others
                    }
                }

                if(!hasData) {
                    if(LOAD == id) {
                        hasData = true
                    }
                }

                if(hasData) {
                    if(!check) {
                        LOAD++
                    } else {
                        mBreak = true
                        break
                    }
                }
                id++
            }
        } catch (e) {}

        if(mBreak) {
            break
        }
    }

    if(!hasData && valid != 0) {
        LOAD = valid
    }

    if(mExtra) {
        return mOthers+'Mail'
    } else {
        return 'gmail'
    }
}

async function solveRecaptchas() {

    statusRun++
    const time = parseInt(new Date().getTime() / 1000)
    console.log('Id: '+LOAD+' Status: Recaptcha starting...'+' Gmail: '+keyData.get(mMailName+LOAD))
    
    await page.setUserAgent(mUserAgent[USER])

    try {
        let frames = await page.frames()
        let mSecend = false
        const recaptchaFrame = frames.find(frame => {
            if(frame.url().includes('api2/anchor')) {
                if(mSecend) {
                    return frame
                } else {
                    mSecend = true
                }
            }
        })

        const checkbox = await recaptchaFrame.$('#recaptcha-anchor')
        await checkbox.click()
        let hasBframe = false

        for(let i=0; i<10; i++) {
            await delay(500)
            const value = await page.evaluate(() => {
                return document.querySelector('iframe[src*="api2/bframe"]')
            })
            if(value) {
                i = 10
                hasBframe = true
            }
        }

        if(hasBframe) {
            frames = await page.frames()
            const imageFrame = frames.find(frame => frame.url().includes('api2/bframe'))
            let hasAudioButton = false

            for(let i=0; i<10; i++) {
                await delay(500)
                const value = await imageFrame.evaluate(() => {
                    var audio = document.querySelector('#recaptcha-audio-button')
                    if(audio) {
                        audio.click()
                        return true
                    } else {
                        return null
                    }
                })
                
                if(value) {
                    i = 10
                    hasAudioButton = true
                }
            }

            if(hasAudioButton) {
                while (true) {
                    const value = await imageFrame.evaluate(() => {
                        return document.querySelector('#audio-source')
                    })
                    if(value) {
                        const audioLink = await imageFrame.evaluate(() => {
                            return document.querySelector('#audio-source').src
                        })
                        const audioBytes = await imageFrame.evaluate(audioLink => {
                            return (async () => {
                                const response = await window.fetch(audioLink)
                                const buffer = await response.arrayBuffer()
                                return Array.from(new Uint8Array(buffer))
                            })()
                        }, audioLink)
                  
                        const httsAgent = new https.Agent({ rejectUnauthorized: false })
                        const response = await axios({
                            httsAgent,
                            method: 'post',
                            url: 'https://api.wit.ai/speech?v=2021092',
                            data: new Uint8Array(audioBytes).buffer,
                            headers: {
                                Authorization: 'Bearer JVHWCNWJLWLGN6MFALYLHAPKUFHMNTAC',
                                'Content-Type': 'audio/mpeg3'
                            }
                        })
                        
                        let audioTranscript = null
                  
                        try{
                            audioTranscript = response.data.match('"text": "(.*)",')[1].trim()
                        } catch(e){
                            const reloadButton = await imageFrame.$('#recaptcha-reload-button')
                            await reloadButton.click()
                            continue
                        }
                  
                        const input = await imageFrame.$('#audio-response')
                        await input.click()
                        await input.type(audioTranscript)
                  
                        const verifyButton = await imageFrame.$('#recaptcha-verify-button')
                        await verifyButton.click()

                        await delay(1000)
                        try {
                            const error = await imageFrame.evaluate(() => {
                                return document.querySelector('.rc-audiochallenge-error-message')
                            })
                            if(error) {
                                await delay(4000)
                                continue
                            } else {
                                if(!mFinish && !mGPUt4 && !mGPUk80) {
                                    statusRun++
                                    try {
                                        await page.setUserAgent(USERAGENT)
                                    } catch (e) {}
                                    const now = parseInt(new Date().getTime() / 1000)
                                    console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha Success... Gmail: '+keyData.get(mMailName+LOAD))
                                }
                                return 'success'
                            }
                        } catch (e) {
                            if(!mFinish && !mGPUt4 && !mGPUk80) {
                                statusRun++
                                try {
                                    await page.setUserAgent(USERAGENT)
                                } catch (e) {}
                                const now = parseInt(new Date().getTime() / 1000)
                                console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha Success... Gmail: '+keyData.get(mMailName+LOAD))
                            }
                            return 'success'
                        }
                    } else {
                        await delay(5000)
                        const block = await imageFrame.evaluate(() => {
                            return document.querySelector('div[class="rc-doscaptcha-header"]')
                        })
                        if(block && !mGPUt4 && !mGPUk80) {
                            if(mAudioBlockCount >= 3) {
                                request({
                                    url: raiyan+'colab/'+TeslaT4+'.json',
                                    json:true
                                }, function(error, response, body){
                                    if(!error) {
                                        let active = parseInt(body['active'])
                                        request.get({
                                            url: 'https://' + body['url_'+active] + '.herokuapp.com/reset'
                                        }, function (error, response, body) { })
                                    }
                                })
                            } else {
                                if(mBlockCount >= 2) {
                                    mAudioBlock = true
                                }
                            }
                            
                            statusRun++
                            mBlockCount++
                            const now = parseInt(new Date().getTime() / 1000)
                            USER = Math.floor((Math.random() * mUserAgentLength) + 1)
                            console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha falied. Audio Tamporary block... Gmail: '+keyData.get(mMailName+LOAD))
                            captchaFailed()
                            return 'block'
                        } else {
                            continue
                        }
                    }
                }
            } else {
                await recaptchasError(time, 'Recaptcha falied. Audio frame not found...')
                return 'error'
            }
        } else {
            if(!mFinish && !mGPUt4 && !mGPUk80) {
                statusRun++
                try {
                    await page.setUserAgent(USERAGENT)
                } catch (e) {}
                const now = parseInt(new Date().getTime() / 1000)
                console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha Auto Solve... Gmail: '+keyData.get(mMailName+LOAD))
            }
            return 'success'
        }
    } catch (e) {
        //await recaptchasError(time, 'Somthing Error: '+e)
        const now = parseInt(new Date().getTime() / 1000)
        console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: '+'Somthing Error: '+e+' Gmail: '+keyData.get(mMailName+LOAD))
        return 'error'
    }
}

async function tempA(a) {
    let i1 = a.substring(16,20); i1 = i1+''+a.substring(0,4);
    let i2 = a.substring(20,24); i2 = i2+''+a.substring(4,8);
    let i3 = a.substring(24,28); i3 = i3+''+a.substring(8,12);
    let i4 = a.substring(28,32); i4 = i4+''+a.substring(12,16);
    return i3+i4+i1+' '+i2+i3+i1+i2+i1+i2+i3+' '+i4+i1+i2+i3+
                        i4+i3+i4+(AUTH=i1+i2+i3+i4)+
                i3+i4+i1+' '+i2+i3+i1+i2+i1+i2+i3+' '+i4+i1+i2+i3+i4
}

async function recaptchasError(time, status) {
    if(mPageLoad == 1 && !mGPUt4 && !mGPUk80) {
        statusRun++
        mIP = null
        mAuth = null
        mFinish = false
        mMining = false
        mNotAuth = 0
        mPageLoad = 0
        const now = parseInt(new Date().getTime() / 1000)
        console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: '+status+' Gmail: '+keyData.get(mMailName+LOAD))
        await page.setUserAgent(USERAGENT)
        console.log('Id: '+LOAD+' Status: Reload page... Gmail: '+keyData.get(mMailName+LOAD))
        await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})
    }
}

async function solveV2Recaptchas() {
    
    statusRun++
    const time = parseInt(new Date().getTime() / 1000)
    console.log('Id: '+LOAD+' Status: Recaptcha v2 starting... Gmail: '+keyData.get(mMailName+LOAD))
    
    try {
        const formData = {
            method: 'userrecaptcha',
            googlekey: KEY,
            key: AUTH,
            pageurl: 'https://colab.research.google.com/',
            json: 1
        }
        request.post({
            url: 'http://2captcha.com/in.php',
            form: formData
        }, function(error, response, body){
            if (error == null) {
                try {
                    ;(async() => {
                        try {
                            const response = await pollForRequestResults(JSON.parse(body).request)
                            await page.evaluate((key) => {

                                var clients = getClients()
                                var client = _flattenObject(clients[0])
                    
                                eval(client.callback).call(window, key)
                    
                                function getClients() {
                                    if (!window || !window.__google_recaptcha_client) return
                                    if (!window.___grecaptcha_cfg || !window.___grecaptcha_cfg.clients) {
                                        return
                                    }
                                    if (!Object.keys(window.___grecaptcha_cfg.clients).length) return
                                    return window.___grecaptcha_cfg.clients
                                }
                    
                                function _flattenObject(item, levels = 2, ignoreHTML = true) {
                                    const isObject = (x) => x && typeof x === 'object'
                                    const isHTML = (x) => x && x instanceof HTMLElement
                                    let newObj = {}
                                    for (let i = 0; i < levels; i++) {
                                        item = Object.keys(newObj).length ? newObj : item
                                        Object.keys(item).forEach(key => {
                                            if (ignoreHTML && isHTML(item[key])) return
                                            if (isObject(item[key])) {
                                                Object.keys(item[key]).forEach(innerKey => {
                                                    if (ignoreHTML && isHTML(item[key][innerKey])) return
                                                    const keyName = isObject(item[key][innerKey]) ? `obj_${key}_${innerKey}` : `${innerKey}`
                                                    newObj[keyName] = item[key][innerKey]
                                                })
                                            } else {
                                                newObj[key] = item[key]
                                            }
                                        })
                                    }
                                return newObj
                                }
                            }, response)
                    
                            statusRun++
                            mAudioBlockCount++
                            mBlockCount = 0
                            mAudioBlock = false
                            const now = parseInt(new Date().getTime() / 1000)
                            console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha v2 Success... Gmail: '+keyData.get(mMailName+LOAD))
                        } catch (e) {
                            const now = parseInt(new Date().getTime() / 1000)
                            console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha v2 Responce error... Gmail: '+keyData.get(mMailName+LOAD))
                            await captchaFailed()
                        }
                    })()
                } catch (e) {
                    ;(async() => {
                        const now = parseInt(new Date().getTime() / 1000)
                        console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha v2 error...'+e+' Gmail: '+keyData.get(mMailName+LOAD))
                        await captchaFailed()
                    })()
                }
            } else {
                ;(async() => {
                    const now = parseInt(new Date().getTime() / 1000)
                    console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha v2 error... Gmail: '+keyData.get(mMailName+LOAD))
                    await captchaFailed()
                })()
            }
        })
    } catch (e) {
        const now = parseInt(new Date().getTime() / 1000)
        console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha v2 error...'+e+' Gmail: '+keyData.get(mMailName+LOAD))
        await captchaFailed()
    }
}

async function captchaFailed() {
    if(mPageLoad == 1  && !mGPUt4 && !mGPUk80) {
        mIP = null
        mAuth = null
        mFinish = false
        mMining = false
        mPageLoad = 0
        mNotAuth = 0
        statusRun++
        await page.setUserAgent(USERAGENT)
        console.log('Id: '+LOAD+' Status: Reload page... Gmail: '+keyData.get(mMailName+LOAD))
        await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})
    }
}


async function waitForSelector(page, command, loop) {
    for(let i=0; i<loop; i++) {
        await delay(500)
        const value = await page.evaluate((command) => {  return document.querySelector(command) },command)
        if(value) i = loop
    }
}

async function waitForConnect(page) {
    for(let i=0; i<60; i++) {
        await delay(1000)
        const value = await page.evaluate(() => { 
            let colab = document.querySelector('colab-connect-button')
            if(colab) {
                let display = colab.shadowRoot.querySelector('#connect-button-resource-display')
                if(display) {
                    let ram = display.querySelector('.ram')
                    if(ram)  {
                        let output = ram.shadowRoot.querySelector('.label').innerText
                        if(output) {
                            return 'RAM'
                        }
                    }
                } else {
                    let connect = colab.shadowRoot.querySelector('#connect')
                    if(connect) {
                        let output = connect.innerText
                        if(output == 'Busy') {
                            return 'Busy'
                        }
                    }
                }
            }
            return null 
        })
        if(value) i = 60
    }
}
  
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    })
}

function getKey(size, name) {
    let zero = ''
    let loop = size.toString().length
    for(let i=0; i<4-loop; i++) {
        zero += '0'
    }
    if(name == 'gmail') {
        return 'account_'+zero+size
    } else {
        return name.substring(0, name.indexOf('Mail'))+'_account_'+zero+size
    }
}

function getUrl(size) {
    if(size == 0) {
        return null
    } else {
        let zero = ''
        let loop = size.toString().length
        for(let i=0; i<3-loop; i++) {
            zero += '0'
        }
        return 'mining-'+zero+size  
    }
    
}
  
function getTime() {
    var currentdate = new Date(); 
    return "Last Sync: @ " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds() + ' @ --- '
}

async function pollForRequestResults(id, retries = 30, interval = 1500, delay = 15000) {
    await timeout(delay)
    return poll({
        taskFn: requestCaptchaResults(AUTH, id),
        interval,
        retries
    })
}


function requestCaptchaResults(apiKey, requestId) {
    const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`
    return async function() {
        return new Promise(async function(resolve, reject){
            try {
                request.get({
                    url: url,
                    json: true,
                    headers: {'User-Agent': 'request'}
                  }, (err, res, data) => {
                    if(err) {
                        return reject()
                    } else if (res.statusCode !== 200) {
                        return reject()
                    } else {
                        if (data.status === 0) return reject(data.request)
                        resolve(data.request)
                    }
                })
            } catch (e) {
                return reject()
            }
        })
    }
}

const timeout = millis => new Promise(resolve => setTimeout(resolve, millis))