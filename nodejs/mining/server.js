const puppeteer = require("puppeteer")
const COLAB = require('./page-api')

let cookies = []

let pages = {}


;(async () => {
    let mSize = 10
    
    let browser = await puppeteer.launch({
        executablePath : "/usr/lib/chromium-browser/chromium-browser",
        //headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    let mColab = new COLAB(browser)

    for(let i=1; i<=mSize; i++) {
        pages[i] = await mColab.newPage(cookies, i)
    }

    await delay(5000)

    await mColab.connect(pages)

    console.log('Connection Success')

})()

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    })
}
