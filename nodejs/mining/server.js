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

    await page.goto('https://colab.research.google.com/drive/1vKu6N9ZfG0H9t8oe1sAkMgoB387cSr1p')

    console.log('Page Load Success')


})()

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    })
}
