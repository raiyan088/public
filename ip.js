const puppeteer = require("puppeteer")


;(async () => {

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = (await browser.pages())[0]

    await page.goto('https://ifconfig.me/ip', {waitUntil: 'domcontentloaded', timeout: 0})

    const ip = await page.evaluate(() => document.querySelector('pre').innerHTML )

    console.log(ip)

    browser.close()
})()
