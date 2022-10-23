const puppeteer = require('puppeteer')
const request = require('request')
const fs = require('fs')

const raiyan = 'https://database088-default-rtdb.firebaseio.com/raiyan088/'

let url ='https://colab.research.google.com/drive/'
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

process.argv.slice(2).forEach(function (val, index) {
    if(index == 0) {
        try {
            mGmail = getChild(parseInt(val))
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
    }
})

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

        page.goto(url+colab1+'?authuser=0')

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

        if(pages[6]['page'] != null) {
            pages[6]['page'].on('response', async response => {
                try {
                    if (!response.ok() && (response.request().resourceType() == 'fetch' || response.request().resourceType() == 'xhr')) {
                        let url = response.url()
                        if (url.includes('/drive/') || url.startsWith('https://colab.research.google.com/tun/m/assign?')) {
                            let reject = 0
                            if(!url.includes('/drive/')) {
                                await delay(2000)
                                reject = await page.evaluate(() => {
                                    let dialog = document.querySelector('colab-dialog > paper-dialog')
                                    if(dialog && dialog.innerText.includes('Sorry, no backends available. Please try again later')) {
                                        return 1
                                    } else if(dialog && dialog.innerText.includes('You have too many active sessions. Terminate an existing session to continue')) {
                                        return 2
                                    }
                                    return 0
                                })
                            } else {
                                reject = 3
                            }
                            
                            if(reject != 0) {
                                request({
                                    url: 'https://'+body+'.herokuapp.com/set',
                                    method: 'POST',
                                    body: {
                                        path: '/gmail/mining/00000/mining-001',
                                        data: reject == 1 ? 'x' : reject == 2 ? 'y' : 'z'
                                    },
                                    json: true
                                }, function(error, response, body) {
                                    console.log(body)
                                })
                            }
                        }
                    }
                } catch (err) {}
            })
        }

        await delay(5000)

        while(true) {
            try {
                let active = false
                for(let i=1; i<=mSize; i++) {
                    await delay(500)
                    if(pages[i]['load'] == false) {
                        let output = await pages[i]['page'].evaluate(() => {
                            if(document && document.querySelector('colab-connect-button')) {
                                return true
                            } else {
                                return false
                            }
                        })
                        if(output == false) {
                            active = true
                        } else {
                            console.log('Status: Webside load Success... ID: '+i)
                            pages[i]['load'] = true
                        }
                    }
                }
                
                if(active) {
                    await delay(1000)
                } else {
                    break
                }
            } catch (err) {}
        }

        console.log(getTime() + 'Website Load Success '+mGmail)
        await delay(5000)

        while(true) {
            try {
                let active = false
                for(let i=1; i<=mSize; i++) {
                    let page = pages[i]['page']
                    await page.bringToFront()
                    await delay(1000)
                    if(pages[i]['status'] == 0) {
                        const value = await page.evaluate(() => {
                            let colab = document.querySelector('colab-connect-button')
                            if(colab) {
                                let display = colab.shadowRoot.querySelector('#connect-button-resource-display')
                                if (display) {
                                    let ram = display.querySelector('.ram')
                                    if (ram) {
                                        let output = ram.shadowRoot.querySelector('.label').innerText
                                        if(output) {
                                            return 'RAM'
                                        }
                                    }
                                } else {
                                    let connect = colab.shadowRoot.querySelector('#connect')
                                    if (connect) {
                                        let output = connect.innerText
                                        if(output == 'Busy') {
                                            return 'Busy'
                                        } else if(output == 'Connect') {
                                            return 'Connect'
                                        }
                                    }
                                }
                            }
                            return null
                        })
            
                        if(value && (value == 'Connect' || value == 'RAM' || value == 'Busy')) {
                            if(value == 'Busy' || value == 'RAM') {
                                await page.click('#runtime-menu-button')
                                for (var j = 0; j < 9; j++) {
                                    await page.keyboard.press('ArrowDown')
                                }
                                await delay(420)
                                await page.keyboard.down('Control')
                                await page.keyboard.press('Enter')
                                await page.keyboard.up('Control')
                                await waitForSelector(page, 'div[class="content-area"]', 10)
                                await page.keyboard.press('Enter')
                                await delay(1000)
                            }
                            await page.keyboard.down('Control')
                            await page.keyboard.press('Enter')
                            await page.keyboard.up('Control')
                            await waitForSelector(page, 'div[class="content-area"]', 10)
                            await page.keyboard.press('Tab')
                            await page.keyboard.press('Enter')
                            await delay(2000)
                            console.log('Status: Connected. ID: '+i)
                            pages[i]['down'] = false
                            pages[i]['status'] = 1
                        }
                        active = true
                    }
                }
                
                if(active) {
                    await delay(1000)
                } else {
                    break
                }
            } catch (err) {}
        }

        console.log(getTime() + 'Mining Start '+mGmail)
        await delay(5000)

        mLoadSuccess = true

        process.exit(2)
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
