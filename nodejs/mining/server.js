const puppeteer = require("puppeteer")
const COLAB = require('./colab-api')

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
        await mColab.newPage((data, position) => {
            pages[position] = data
        }, cookies, i)
    }

    console.log('load Success')

})()

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    })
}
