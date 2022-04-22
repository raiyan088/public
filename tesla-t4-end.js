const app = express()

let PORT = Math.floor((Math.random() * 65535) + 1)

app.listen(process.env.PORT || PORT, ()=>{
    console.log('Listening on port '+PORT+' ...')
})


const serviceAccount = require(path.resolve("raiyan-088-firebase-adminsdk-9ku78-11fcc11d0c.json"))

const USERAGENT = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.0 Safari/537.36'
const google = 'https://colab.research.google.com/drive/1x1K7-8j92MZuCZIx5k8xcbFApPqIpviu'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://raiyan-088-default-rtdb.firebaseio.com"
})

const database = admin.database().ref('raiyan')

const startTime = parseInt(new Date().getTime() / 1000)

let mDown = false
let allData = null
let mUserAgent = {}
let keyData = new Map()
let SIZE = 0
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
let RUNING = 0
let mFinish = false
let mPageLoad = false
let mLoadSuccess = false
let mAlreadyStart = false
let cookes = []
let browser = null
let page = null
let mActiveGmail = 0
let mOverLoad = 0
let temp = [] 



console.log('Downloading data...')

database.child('server').once('value', (snapsData) => {
    const details = snapsData.val()
    if(details != null) {
        SIZE = parseInt(details['size'])
        LOAD = parseInt(details['load'])
        database.child('colab').child(TeslaT4).once('value', (snapshot) => {
            const colab = snapshot.val()
            if(colab != null) {
                mActiveGmail = parseInt(colab['gmail'])
                database.child('gmail').once('value', (snapshot) => {
                    const value = snapshot.val()
                    if(value != null) {
                        allData = value
                        console.log('Download Success')
                        startBackgroundService()
                    }
                })
            }
        })
    }
})


let timer = setInterval(async function() {

    const now = parseInt(new Date().getTime() / 1000)

    if((now-update) > 60 && mLoadSuccess) {
        mGPUt4 = false
        mFinish = false
        mPageLoad = false
        mAudioBlock = false
        console.log(getTime()+'Something Error. Restart Browser...')
        statusRun++
        try{
            await page.close()
        } catch (e) {}
        await browserStart(false)
    } else {
        if(statusRun > 5) {
            statusRun = 0
            console.log('+--------------------------------------------------------------------+')
        }
        if(mGPUt4 && mPageLoad && !mFinish) {
            if(mDown) {
                mDown = false
                await page.keyboard.press('ArrowUp')
            } else {
                mDown = true
                await page.keyboard.press('ArrowDown')
            }

            const runTime = parseInt((now - mActiveTime) / 60)

            statusRun++
            console.log('Id: '+LOAD+' Runing: '+runTime+'m  Status: Waiting process..... Gmail: '+keyData.get(LOAD))
        }
    }
}, 60000)

async function startBackgroundService() {
    ;(async () => {
        for(let [key, value] of Object.entries(allData)) {
            try {
                let id = parseInt(key.replace('account_', ''))
                let size = 0
                for(let gmail of Object.keys(value['GMAIL'])) {
                    keyData.set((id*10)+size, gmail+'@gmail.com')
                    size++
                }
            } catch (e) {}
        }

        LOAD++
        statusRun++
        mOverLoad = 0
        mBlockCount = 0
        mAudioBlock = false
        console.log(getTime()+'Service Start...')
        temp = JSON.parse(fs.readFileSync('./cookies.json'))
        mUserAgent = JSON.parse(fs.readFileSync('./user-agent-list.json'))
        mUserAgentLength = Object.keys(mUserAgent).length
        USER = Math.floor((Math.random() * mUserAgentLength) + 1)
        if(mActiveGmail == 0) {
            await checkSize()
        } else {
            LOAD = mActiveGmail
        }
        await browserStart(true)
    })()
}

async function browserStart(start) {

    mGPUt4 = false
    mFinish = false
    mPageLoad = false
    mAlreadyStart = false
    
    statusRun++
    const tempX = await tempA(AUTH)
    const DATA = allData[getKey(parseInt(LOAD/10))]
    console.log('Id: '+LOAD+' Status: Start process...'+' Gmail: '+keyData.get(LOAD))

    if(start) {
        mTotalGPUk80 = 0
        if(mActiveGmail == 0) {
            database.child('server').child('load').set(LOAD)
            database.child('colab').child(TeslaT4).child('gmail').set(LOAD)
        }
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
            if(!mPageLoad && !mFinish) {
                await delay(1000)
                statusRun++
                console.log('Id: '+LOAD+' Status: Webside load Success...'+' Gmail: '+keyData.get(LOAD))
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
                await delay(1000)
                await page.keyboard.press('Tab')
                await page.keyboard.press('Enter')
                mPageLoad = true
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
            if(mPageLoad) {
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
                console.log('Id: '+LOAD+' Failed: '+mTotalGPUk80+' GPU: k80 - '+siriyal+' Gmail: '+keyData.get(LOAD))

                await page.keyboard.press('Enter')
                await delay(1000)

                if(mPageLoad) {
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
                    if(mTotalGPUk80 >= 12) {
                        mOverLoad++
                        statusRun++
                        mFinish = true
                        mGPUk80 = false
                        mPageLoad = false
                        console.log('Id: '+LOAD+' Status: Failed Over LImited'+' Gmail: '+keyData.get(LOAD))
                        
                        if(mOverLoad >= 2) {
                            mOverLoad = 0
                            database.child('colab').child(TeslaT4).child('gmail').set(0)
                            request.get({
                                url: 'https://'+TeslaT4+'.herokuapp.com/reset'
                            }, function(error, response, body) {})
                        } else {
                            await reOpenBrowser()
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
            if(!mPageLoad) {
                mAlreadyStart = true
            }
            if(!mGPUt4 && mPageLoad) {
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
                console.log('Id: '+LOAD+' GPU: t4 - '+siriyal+' Gmail: '+keyData.get(LOAD))
                database.child('colab').child(TeslaT4).child('t4').set(true)

                request.get({
                    url: 'https://'+TeslaT4+'.herokuapp.com/mining'
                }, function(error, response, body) {})
            }
        } else {
            req.continue()
        }
    })

    page.on('response', async response => {
        try {
            if (!response.ok() && (response.request().resourceType() == 'fetch' || response.request().resourceType() == 'xhr')) {
                let url = response.url()
                if(url.startsWith('https://www.googleapis.com/drive/')) {
                    if(!mFinish) {
                        statusRun++
                        mFinish = true
                        mPageLoad = false
                        let key = getKey(parseInt(LOAD/10))
                        let key2 = keyData.get(LOAD).replace('@gmail.com', '')
                        database.child('gmail').child(key).child('GMAIL').child(key2).set(false)
                        allData[key]['GMAIL'][key2] = false
                        console.log('Id: '+LOAD+' Status: Sing-Out gmail... Gmail: '+keyData.get(LOAD))
                        await delay(2000)
                        await reOpenBrowser()
                    }
                } else if(url.startsWith('https://colab.research.google.com/tun/m/assign?') || url.startsWith('https://colab.research.google.com/tun/m/gpu-t4')) {
                    if(!mFinish) {
                        statusRun++
                        mFinish = true
                        mPageLoad = false
                        let key = getKey(parseInt(LOAD/10))
                        let key2 = keyData.get(LOAD).replace('@gmail.com', '')
                        database.child('gmail').child(key).child('GMAIL').child(key2).set(false)
                        allData[key]['GMAIL'][key2] = false
                        console.log('Id: '+LOAD+' Status: Terminated gmail... Gmail: '+keyData.get(LOAD))
                        await delay(2000)
                        await reOpenBrowser()
                    }
                }
            }
        } catch (err) {}
    })

    page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

    await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})

    mLoadSuccess = true
}

async function reOpenBrowser() {
    if(statusRun > 5) {
        statusRun = 0
        console.log('+--------------------------------------------------------------------+')
    }
    console.log(getTime()+'LOAD Data Check on Server...')
    database.child('server').once('value', (snapshot) => {
        const value = snapshot.val()
        if(value != null) {
            console.log(getTime()+'LOAD Data Check Success')
            ;(async () => {
                let BEFORE = LOAD - 1
                LOAD = parseInt(value['load']) +1
                let now = parseInt(new Date().getTime() / 1000)
                await checkSize()

                if(LOAD >= (SIZE+1)*10) {
                    LOAD = 9
                    for(var i=0; i<BEFORE; i++) {
                        let key = getKey(parseInt(LOAD/10))
                        let key2 = keyData.get(LOAD).replace('@gmail.com', '')
                        if(!allData[key]['GMAIL'][key2]) {
                            LOAD++
                        } else {
                            i = BEFORE
                        }           
                    }
                }

                if(BEFORE != LOAD) {
                    console.log(getTime()+'Service Start Again...')
                    mBlockCount = 0
                    mGPUt4 = false
                    mFinish = false
                    mPageLoad = false
                    mAudioBlock = false
                    
                    const DATA = allData[getKey(parseInt(LOAD/10))]
                    statusRun++
                    console.log('Id: '+LOAD+' Status: Start process... Gmail: '+keyData.get(LOAD))
                
                    mTotalGPUk80 = 0
                    database.child('server').child('load').set(LOAD)
                    database.child('colab').child(TeslaT4).child('gmail').set(LOAD)
                    
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

                    await page.setCookie(...cookes)

                    await page.setUserAgent(USERAGENT)

                    await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})
                } else {
                    statusRun++
                    mFinish = true
                    mPageLoad = false
                    try {
                        await page.close()
                        await browser.close()
                    } catch (e) {}
                    clearInterval(timer)
                    console.log(getTime()+'Service Stop...')
                }
            })()
        }
    })
}

async function checkSize() {
    let loop = (SIZE+1)*10
    for(var i=LOAD; i<loop; i++) {
        let key = getKey(parseInt(LOAD/10))
        let key2 = keyData.get(LOAD).replace('@gmail.com', '')
        if(!allData[key]['GMAIL'][key2]) {
            LOAD++
        } else {
            i = loop
        }
    }
}


app.get('/', async function(req, res) {
    if(page == null) {
        res.writeHeader(400, {"Content-Type": "text/html"})
        res.write('Error')
        res.end()
    } else {
        await page.screenshot({ path: './image.png' })
        fs.readFile('./image.png', function (err, data) {
            if (err) {
                const error = page.content()
                res.writeHeader(400, {"Content-Type": "text/html"})
                res.write(error)
                res.end()
            }else {
                res.writeHeader(200, {"Content-Type": "image/png"})
                res.write(data)
                res.end()
            }
        })
    }
})

async function solveRecaptchas() {

    statusRun++
    const time = parseInt(new Date().getTime() / 1000)
    console.log('Id: '+LOAD+' Status: Recaptcha starting...'+' Gmail: '+keyData.get(LOAD))
    
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
                                    console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha Success... Gmail: '+keyData.get(LOAD))
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
                                console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha Success... Gmail: '+keyData.get(LOAD))
                            }
                            return 'success'
                        }
                    } else {
                        await delay(5000)
                        const block = await imageFrame.evaluate(() => {
                            return document.querySelector('div[class="rc-doscaptcha-header"]')
                        })
                        if(block && !mGPUt4 && !mGPUk80) {
                            if(mAudioBlockCount >= 4) {
                                request.get({
                                    url: 'https://'+TeslaT4+'.herokuapp.com/reset'
                                }, function(error, response, body) {})
                            } else {
                                if(mBlockCount >= 2) {
                                    mAudioBlock = true
                                }
                            }
                            
                            statusRun++
                            mBlockCount++
                            const now = parseInt(new Date().getTime() / 1000)
                            USER = Math.floor((Math.random() * mUserAgentLength) + 1)
                            console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha falied. Audio Tamporary block... Gmail: '+keyData.get(LOAD))
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
                console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha Auto Solve... Gmail: '+keyData.get(LOAD))
            }
            return 'success'
        }
    } catch (e) {
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
    if(mPageLoad && !mGPUt4 && !mGPUk80) {
        statusRun++
        mFinish = false
        mPageLoad = false
        const now = parseInt(new Date().getTime() / 1000)
        console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: '+status+' Gmail: '+keyData.get(LOAD))
        await page.setUserAgent(USERAGENT)
        console.log('Id: '+LOAD+' Status: Reload page... Gmail: '+keyData.get(LOAD))
        await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})
    }
}

async function solveV2Recaptchas() {
    
    statusRun++
    const time = parseInt(new Date().getTime() / 1000)
    console.log('Id: '+LOAD+' Status: Recaptcha v2 starting... Gmail: '+keyData.get(LOAD))
    
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
                            console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha v2 Success... Gmail: '+keyData.get(LOAD))
                        } catch (e) {
                            const now = parseInt(new Date().getTime() / 1000)
                            console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha v2 Responce error... Gmail: '+keyData.get(LOAD))
                            await captchaFailed()
                        }
                    })()
                } catch (e) {
                    ;(async() => {
                        const now = parseInt(new Date().getTime() / 1000)
                        console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha v2 error...'+e+' Gmail: '+keyData.get(LOAD))
                        await captchaFailed()
                    })()
                }
            } else {
                ;(async() => {
                    const now = parseInt(new Date().getTime() / 1000)
                    console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha v2 error... Gmail: '+keyData.get(LOAD))
                    await captchaFailed()
                })()
            }
        })
    } catch (e) {
        const now = parseInt(new Date().getTime() / 1000)
        console.log('Id: '+LOAD+' Time: '+parseInt(now-time)+'s Status: Recaptcha v2 error...'+e+' Gmail: '+keyData.get(LOAD))
        await captchaFailed()
    }
}

async function captchaFailed() {
    if(mPageLoad  && !mGPUt4 && !mGPUk80) {
        mFinish = false
        mPageLoad = false
        statusRun++
        await page.setUserAgent(USERAGENT)
        console.log('Id: '+LOAD+' Status: Reload page... Gmail: '+keyData.get(LOAD))
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

function getKey(size) {
    let zero = ''
    let loop = size.toString().length
    for(let i=0; i<4-loop; i++) {
        zero += '0'
    }
    return 'account_'+zero+size
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