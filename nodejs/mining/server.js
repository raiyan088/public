const puppeteer = require("puppeteer")
const request = require('request')
const fs = require('fs')

let pages = {}
let mId = 0
let DATA = null
let mGmail = null
let mLoadSuccess = false

let url = 'https://colab.research.google.com/drive/'
let colab1 = '1vKu6N9ZfG0H9t8oe1sAkMgoB387cSr1p'
let colab2 = '1m_GiOpqYSOges7z6ELapMRT5bz6ULPsM'
let colab3 = '1QJGvYumh900DjBbdPCr9rz8RDT_dfd0g'
let colab4 = '1WywZDhY2I4vUKu4zUiM5rtPc4mwe3fgQ'
let colab5 = '1E9ULDh8InEbsc6hTksEKrhg2iJV7GuVp'

process.argv.slice(2).forEach(function (val, index) {
    if(index == 0) {
        try {
            mId = parseInt(val)
            mGmail = getChild(mId)
            console.log(getTime()+' Server Start. Id: '+mGmail)
            request({
                url: decode('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dtYWlsL21pbmluZy8=')+mGmail+'.json',
                json:true
            }, function(error, response, body) {
                if(!(error || body == null)) {
                    DATA = body
                    start()
                } else {
                    console.log('Server Data Not Found')
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

        let cookies = JSON.parse(fs.readFileSync('./cookies.json'))

        cookies.forEach(function (value) {
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
        })

        for(let i=1; i<=mSize; i++) {
            let map = {}
            let page = null
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

            if(i == 1) {
                page = (await browser.pages())[0]
                await page.setCookie(...cookies)
                map['page'] = page
                map['load'] = false
                map['down'] = false
                map['has'] = false
                map['status'] = 0
            } else {
                page = await browser.newPage()
                map['page'] = page
                map['load'] = false
                map['down'] = false
                map['has'] = false
                map['status'] = 0
            }

            pages[i] = map

            page.on('request', async request => {
                try {
                    const url = request.url()
                    if (url == 'https://colab.research.google.com/_/bscframe') {
                        await delay(1000)
                        let fUrl = request.frame().parentFrame().url()
                        let ID = parseInt(fUrl.substring(fUrl.indexOf('id=')+3, fUrl.indexOf('&authuser=')))
                        pages[ID]['status'] = 1
                        pages[ID]['page'].off('request', request)
                    } else if (url.startsWith('https://colab.research.google.com/tun/m/m-')) {
                        let fUrl = request.frame().url()
                        let ID = parseInt(fUrl.substring(fUrl.indexOf('id=')+3, fUrl.indexOf('&authuser=')))
                        if(pages[ID]['status'] == 0) {
                            pages[ID]['has'] = true
                        }
                    }
                } catch (e) {
                    console.log(e)
                }
            })
        
            page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
            
            if(i > 5) {
                page.goto(url+colab+'?id='+i+'&authuser=1', { waitUntil: 'domcontentloaded', timeout: 0 })
            } else {
                page.goto(url+colab+'?id='+i+'&authuser=0', { waitUntil: 'domcontentloaded', timeout: 0 })
            }
        }

        console.log(getTime()+' Page Open Success')

        await delay(5000)

        //await mColab.connect()

        console.log(getTime()+' Load Success')

        //await mColab.runing(mId)

        console.log(getTime()+' Start Server')
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

    let data = pages[position]
    
    if(mLoadSuccess && data && data['page']) {
        await data['page'].bringToFront()
        await delay(500)

        if(data['down'] != null && data['down'] == true) {
            data['down'] = false
            await data['page'].keyboard.press('ArrowUp')
        } else if(data['down'] != null && data['down'] == false) {
            data['down'] = true
            await data['page'].keyboard.press('ArrowDown')
        }
    }

}, 10000)


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

function getTime() {
    var currentdate = new Date();
    return "Last Sync: @ " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds() + ' @ --- '
}

function decode(str) {
    return Buffer.from(str, 'base64').toString('ascii')
}
