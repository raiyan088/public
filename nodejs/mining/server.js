const puppeteer = require("puppeteer")


let url ='https://colab.research.google.com/drive/'
let colab1 = '1aEU1oKekxX4_NyqCCx8hWUSOyYoEdKJi'
let colab2 = '1qi-5bFKjDXnoh33AVGQgKIdBTpYxJH7s'
let colab3 = '1PvtWshX9XPoif-BZKfSN1KQCDhe9hB8R'
let colab4 = '1suavUZtqZutUb0AXWGFqwKfxE3IsSR8P'
let colab5 = '1Zoo8FZ8CyTnjUGfVDkEpIRlFZfjGT6tC'

let DATA = null
let mGmail = null
let mId = 1
let mLoadSuccess = false
let temp = []
let cookies = []

let browser = null
let pages = {}

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
    let mSize = 10
    
    browser = await puppeteer.launch({
        executablePath : "/usr/lib/chromium-browser/chromium-browser",
        //headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    let page = (await browser.pages())[0]
        let map = {}
        map['page'] = page
        map['load'] = false
        map['status'] = 0
        pages[1] = map

    await page.setCookie(...cookies)

    page.on('console', async (msg) => {
        const msgArgs = msg.args()
        for (let i = 0; i < msgArgs.length; ++i) {
          console.log(await msgArgs[i].jsonValue())
        }
    })

    console.log('Page Load Start')

    page.goto(url+colab1+'?authuser=0', { waitUntil: 'domcontentloaded', timeout: 0 })

        for(let i=2; i<=mSize; i++) {
            let colab = null
            if(i == 1 || i == 6) {
                colab = colab1
            } else if(i == 2 || i == 7) {
                colab = colab2
            } else if(i == 3 || i == 8) {
                colab = colab3
            } else if(i == 4 || i == 9) {
                colab = colab4
            } else if(i == 5 || i == 10) {
                colab = colab5
            }
            page = await browser.newPage()
            map = {}
            map['page'] = page
            map['load'] = false
            map['status'] = 0
            pages[i] = map
            if(i > 5) {
                page.goto(url+colab+'?authuser=1', { waitUntil: 'domcontentloaded', timeout: 0 })
            } else {
                page.goto(url+colab+'?authuser=0', { waitUntil: 'domcontentloaded', timeout: 0 })
            }
        }
    
    console.log('Page Load Success')


})()

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    })
}
