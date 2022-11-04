const puppeteer = require("puppeteer")
const COLAB = require('./page-api')
const request = require('request')
const fs = require('fs')

let pages = {}
let DATA = null

process.argv.slice(2).forEach(function (val, index) {
    if(index == 0) {
        try {
            mGmail = getChild(parseInt(val))
            request({
                url: decode('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dtYWlsL21pbmluZy8=')+mGmail+'.json',
                json:true
            }, function(error, response, body) {
                if(!(error || body == null)) {
                    DATA = body
                    start()
                }
            })
        } catch (e) {}
    }
})

async function start() {

    ;(async () => {
        let mSize = 10

        let browser = await puppeteer.launch({
            executablePath : "/usr/lib/chromium-browser/chromium-browser",
            //headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        let temp = JSON.parse(fs.readFileSync('./cookies.json'))

        let mColab = new COLAB(browser, temp, DATA)

        for(let i=1; i<=mSize; i++) {
            pages[i] = await mColab.newPage(i)
        }

        await delay(5000)

        await mColab.connect(pages)

        console.log('Connection Success')

    })()

}

function getChild(size) {
    let zero = ''
    let loop = size.toString().length
    for (let i = 0; i < 3 - loop; i++) {
        zero += '0'
    }
    return 'gmail-' + zero + size
}

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    })
}

function decode(str) {
    return Buffer.from(str, 'base64').toString('ascii')
}
