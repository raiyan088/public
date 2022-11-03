const puppeteer = require("puppeteer")

let cookies = [

    {

      name: 'MoneroOceanAddr',

      value: '429EPxt6GmMGvfmpiXFdyvKrjFGGtr6pee91j7o6r5V4DzStvcRnH3m5pdd6mwxNENU5GpsDPUgpfewUiCr4TZfV6K3GgKw',    

      domain: 'moneroocean.stream',

      path: '/',

      expires: 1697815663,

      size: 315,

      httpOnly: false,

      secure: false,

      session: false,

      sameParty: false,

      sourceScheme: 'Secure',

      sourcePort: 443

    }

  ]

;(async () => {

    let browser = await puppeteer.launch({

        executablePath : "/usr/lib/chromium-browser/chromium-browser",

        //headless: false,

        args: ['--no-sandbox', '--disable-setuid-sandbox']

    })

    let page = await browser.newPage()

    await page.setCookie(...cookies)

    page.on('console', async (msg) => {

        const msgArgs = msg.args()

        for (let i = 0; i < msgArgs.length; ++i) {

          console.log(await msgArgs[i].jsonValue())

        }

    })

    console.log('Page Load Start')

    await page.goto('https://moneroocean.stream/')

    console.log('Page Load Success')

    await delay(3000)

    await page.evaluate(() => WebMiner())

    console.log('Mining Start')

})()




async function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    })
}

async function waitForSelector(page, command, loop) {
    for (let i = 0; i < loop; i++) {
        await delay(500)
        const value = await page.evaluate((command) => { return document.querySelector(command) }, command)
        if (value) i = loop
    }
    await delay(1000)
}

function getTime() {
    var currentdate = new Date();
    return "Last Sync: @ " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds() + ' @ --- '
}

function getChild(size) {
    let zero = ''
    let loop = size.toString().length
    for (let i = 0; i < 3 - loop; i++) {
        zero += '0'
    }
    return 'gmail-' + zero + size
}
