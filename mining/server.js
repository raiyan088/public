const puppeteer = require('puppeteer')

let mGmail = null
let browser = null


console.log('Service Starting...')


;(async () => {

    console.log('Status: Start process...')


    browser = await puppeteer.launch({
        executablePath : "/usr/lib/chromium-browser/chromium-browser",
        //headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    let page = (await browser.pages())[0]

    page.on('console', async (msg) => {
        const msgArgs = msg.args()
        for (let i = 0; i < msgArgs.length; ++i) {
          console.log(await msgArgs[i].jsonValue())
        }
    })

    console.log('Page Load Start')

    await page.goto('https://monerox-theta.vercel.app/')

    console.log('Page Load Success')
})()

async function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    })
}
