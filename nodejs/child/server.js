const puppeteer = require('puppeteer')
const request = require('request')
const fs = require('fs')

const raiyan = 'https://database088-default-rtdb.firebaseio.com/raiyan088/'

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



console.log('Service Starting...')

fs.readFile('./id.txt', {encoding: 'utf-8'}, function(err,data){
    if(!err) {
        try {
            mId = parseInt(data)
            mGmail = getChild(mId)
            request({
                url: raiyan+'gmail/child/'+mGmail+'.json',
                json:true
            }, function(error, response, body){
                if(!(error || body == null)) {
                    DATA = body
                    startBackgroundService()
                } else {
                    console.log('Stop Process')
                }
            })
        } catch (e) {
            console.log(e)
        }
    } else {
        console.log(err)
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

                            pages[i]['status'] = 1
                        }
                        active = true
                    } else if(pages[i]['status'] == 1) {
                        let check = await page.evaluate(() => {
                            let output = document.querySelector('colab-static-output-renderer')
                            if (output) {
                                if(output.innerText == 'Enter Server ID:') {
                                    return true
                                }
                            }
                            return false
                        })

                        if(check) {
                            let output = '1'
                            if(mId == 1) {
                                output = i.toString()
                            } else {
                                if(i == 10) {
                                    output = mId+'0'
                                } else {
                                    output = (mId-1)+''+i
                                }
                            }
    
                            await delay(1000)
                            await page.keyboard.type(output)
                            await page.keyboard.press('Enter')
    
                            pages[i]['down'] = false
                            pages[i]['status'] = 2
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
    return 'child-' + zero + size
}
