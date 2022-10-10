const puppeteer = require('puppeteer')

let mGmail = null
let browser = null


console.log('Service Starting...')


;(async () => {
    
    let mSize = 10

    console.log('Status: Start process...')


    browser = await puppeteer.launch({
        executablePath : "/usr/lib/chromium-browser/chromium-browser",
        //headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    let page = (await browser.pages())[0]

    await page.goto('https://google.com')

    console.log('success')
})()
