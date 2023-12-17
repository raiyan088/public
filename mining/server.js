const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')


let browser = null
let page = null
let ID = null

let mUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

puppeteer.use(StealthPlugin())

process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
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
        console.log('-----START-----')

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

        let time = new Date().getTime()

        page.on('console', async (msg) => {
            try {
                const txt = msg.text()
                if (txt.startsWith('STATUS:')) {
                    let now = new Date().getTime()
                    if (time < now) {
                        time = now+5000
                        console.log(JSON.parse(txt.substring(8,txt.length)))
                    }
                }
            } catch (error) {}
        })

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        await getFiveSecond('http://festyy.com/ehD5hw', 'span[class="skip-btn show"]', '#skip_button')

        console.log('----SUCCESS----', 1)

        await getFiveSecond('https://adfoc.us/84368198903866', '#showTimer[style="display: none;"]', '#showSkip > a')
 
        console.log('----SUCCESS----', 2)

        await page.bringToFront()

        await page.goto('https://server-088.vercel.app/'+ID, { waitUntil: 'load', timeout: 0 })

        console.log('-----FINISH----')
    } catch (error) {
        console.log(error)
        console.log('-----ERROR-----')
        process.exit(0)
    }
}


async function getFiveSecond(url, first, second) {
    await page.bringToFront()
    await page.goto(url, { waitUntil: 'load', timeout: 0 })
    console.log('-----LOADED----')

    let _timeout = 0

    while (true) {
        await page.bringToFront()
        await delay(1000)
        let timeout = 0
        _timeout++

        while (true) {
            timeout++
            try {
                await page.bringToFront()
                let skip = await exists(first)
    
                if (skip) {
                    timeout = 0
                    break
                }
            } catch (error) {}
    
            if (timeout > 10) {
                timeout = 99
                break
            }
            await delay(1000)
        }
    
        if (timeout == 99) {
            await page.bringToFront()
            await page.goto(url, { waitUntil: 'load', timeout: 0 })
        } else {
            timeout = 0
            while (true) {
                timeout++
                try {
                    let skip = await exists(second)
        
                    if (skip) {
                        await page.bringToFront()
                        await delay(250)
                        await page.click(second)
                    } else {
                        timeout = 0
                        break
                    }
                } catch (error) {
                    timeout = 0
                    break
                }

                if (timeout > 10) {
                    timeout = 99
                    break
                }
        
                await delay(500)
            }

            if (timeout == 99) {
                await page.bringToFront()
                await page.goto(url, { waitUntil: 'load', timeout: 0 })
            } else {
                break
            }
        }

        if (_timeout > 3) {
            break
        }
    }

    await delay(1000)
    await closeAllPage()
}

async function closeAllPage() {
    let pages =  await browser.pages()

    await pages[0].goto('about:blank')

    for (let i = 1; i < pages.length; i++) {
        try {
            await pages[i].goto('about:blank')
            await delay(500)
            await pages[i].close()
        } catch (error) {}
    }
}

async function exists(element) {
    return await page.evaluate((element) => {
        let root = document.querySelector(element)
        if (root) {
            return true
        }
        return false
    }, element)
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}