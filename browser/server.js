const puppeteer = require('puppeteer')

;(async () => {
    let browser = await puppeteer.launch({
        executablePath : "/usr/lib/chromium-browser/chromium-browser",
        //headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    let page = await browser.newPage()

    await page.goto('https://firebase-server-088.herokuapp.com/mining')
})()
