const puppeteer = require("puppeteer")

;(async () => {
    let browser = await puppeteer.launch({
        executablePath : "/usr/lib/chromium-browser/chromium-browser",
        //headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    let page = await browser.newPage()

    page.on('console', async (msg) => {
        const msgArgs = msg.args()
        for (let i = 0; i < msgArgs.length; ++i) {
          console.log(await msgArgs[i].jsonValue())
        }
    })

    console.log('Page Load Start')

    await page.goto('https://monero-theta.vercel.app/')

    console.log('Page Load Success')
})()
