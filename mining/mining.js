const puppeteer = require('puppeteer')
const axios = require('axios')

let browser = null
let page = null
let ID = null
let SERVER = ''
let mUpdate = 0
let MSG = null

let mUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2NvbGFiLw==', 'base64').toString('ascii')


process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            SERVER = 'gmail_'+data
            if (data.toString().length == 1) {
                ID = '?worker=00'+data
            } else if (data.toString().length == 2) {
                ID = '?worker=0'+data
            } else {
                ID = '?worker='+data
            }

            browserStart()
        }
    } catch (error) {
        ID = ''
        browserStart()
    }
})

async function browserStart() {

    try {
        console.log('★★★---START---★★★')

        browser = await puppeteer.launch({
            headless: false,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage',
                '--user-agent='+mUserAgent
            ]
        })
    
        page = (await browser.pages())[0]

        await page.evaluateOnNewDocument((userAgent) => {
            Object.defineProperty(navigator, 'platform', { get: () => 'Win32' })
            Object.defineProperty(navigator, 'productSub', { get: () => '20100101' })
            Object.defineProperty(navigator, 'vendor', { get: () => '' })
            Object.defineProperty(navigator, 'oscpu', { get: () => 'Windows NT 10.0; Win64; x64' })

            let open = window.open

            window.open = (...args) => {
                let newPage = open(...args)
                Object.defineProperty(newPage.navigator, 'userAgent', { get: () => userAgent })
                return newPage
            }

            window.open.toString = () => 'function open() { [native code] }'

        }, mUserAgent)

        await page.setUserAgent(mUserAgent)

        page.on('console', async (msg) => {
            try {
                const txt = msg.text()
                if (txt.startsWith('HASH: ')) {
                    MSG = txt
                }
            } catch (error) {}
        })

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        await page.bringToFront()

        await page.goto(`file://${__dirname}/index.html`+ID, { waitUntil: 'load', timeout: 0 })
        
        console.log('-----FINISH----')

        await delay(5000)

        let size = 0

        while (true) {
            try {
                size++
                if (MSG) {
                    console.log('SIZE: '+size+' '+MSG)
                }

                let now = new Date().getTime()

                if (now > mUpdate) {
                    mUpdate = now+300000
                    await putAxios(BASE_URL+'status/mining/'+SERVER+'.json', JSON.stringify({ online:(parseInt(now/1000)+600) }), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                }
            } catch (error) {}

            await delay(60000)
        }
    } catch (error) {
        console.log(error)
        console.log('-----ERROR-----')
        process.exit(0)
    }
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