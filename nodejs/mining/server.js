const puppeteer = require('puppeteer')
const request = require('request')
const fs = require('fs')

const raiyan = 'https://database088-default-rtdb.firebaseio.com/raiyan088/'

let url ='https://google.com/'
let colab1 = '1vKu6N9ZfG0H9t8oe1sAkMgoB387cSr1p'
let colab2 = '1m_GiOpqYSOges7z6ELapMRT5bz6ULPsM'
let colab3 = '1QJGvYumh900DjBbdPCr9rz8RDT_dfd0g'
let colab4 = '1WywZDhY2I4vUKu4zUiM5rtPc4mwe3fgQ'
let colab5 = '1E9ULDh8InEbsc6hTksEKrhg2iJV7GuVp'


let DATA = null
let mGmail = null
let mLoadSuccess = false
let temp = []
let cookies = []

let browser = null
let pages = {}



console.log('Service Starting...')

try {
    mGmail = getChild(1)
    request({
        url: raiyan+'gmail/mining/'+mGmail+'.json',
        json:true
    }, function(error, response, body){
        if(!(error || body == null)) {
            DATA = body
            startBackgroundService()
        }
    })
} catch (e) {
    console.log(e)
}

async function startBackgroundService() {
    ;(async () => {
        
        let mSize = 10

        console.log(getTime() + 'Service Start...')
        console.log('Status: Start process...' + ' ID: ' + mGmail)

        temp = JSON.parse(fs.readFileSync('./cookies.json'))

        temp.forEach(function (value) {
            if (value.name == 'SSID') {
                value.value = DATA['SSID']
            } else if (value.name == 'SAPISID') {
                value.value = DATA['SAPISID']
            } else if (value.name == 'SID') {
                value.value = DATA['SID']
            } else if (value.name == '__Secure-1PSID') {
                value.value = DATA['1PSID']
            } else if (value.name == 'HSID') {
                value.value = DATA['HSID']
            }
            cookies.push(value)
        })
    
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

        page.goto(url+'?authuser=0')

        for(let i=2; i<=mSize; i++) {
            
            page = await browser.newPage()
            map = {}
            map['page'] = page
            map['load'] = false
            map['status'] = 0
            pages[i] = map
            if(i > 5) {
                page.goto(url+'?authuser=1', { waitUntil: 'domcontentloaded', timeout: 0 })
            } else {
                page.goto(url+'?authuser=0', { waitUntil: 'domcontentloaded', timeout: 0 })
            }
        }

        
        console.log(getTime() + 'Website Load Success '+mGmail)
        await delay(5000)

        
        console.log(getTime() + 'Mining Start '+mGmail)
        await delay(5000)

        mLoadSuccess = true
    })()
}

let position = 0
let active = 0

setInterval(async function () {

    active++

    if(active % 6 == 0) {
        console.log('Runing: '+(active/6)+'m'+' Status: '+'Running process.....' + ' ID: ' + mGmail)
    }

    if(position >= 10) {
        position = 1
    } else {
        position ++
    }

}, 10000)


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
    return 'mining-' + zero + size
}
