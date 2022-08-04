const COLAB_API = require('./colab-api')
const puppeteer = require('puppeteer')
const request = require('request')
const fs = require('fs')


const raiyan = 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/'

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

fs.readFile('./id.txt', {encoding: 'utf-8'}, function(err,data){
    if(!err) {
        try {
            mGmail = getChild(parseInt(data))
            request({
                url: raiyan+'gmail/mining/'+mGmail+'.json',
                json:true
            }, function(error, response, body){
                if(!error) {
                    DATA = body
                    startBackgroundService()
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
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
    
        loadColabData(1)

    })()
}

function loadColabData(position) {
    let colab = null
    if(position == 1 || position == 6) {
        colab = colab1
    } else if(position == 2 || position == 7) {
        colab = colab2
    } else if(position == 3 || position == 8) {
        colab = colab3
    } else if(position == 4 || position == 9) {
        colab = colab4
    } else if(position == 5 || position == 10) {
        colab = colab5
    }

    if(position <= 10) {
        new COLAB_API().connect(browser, position, colab, cookies, false, (type, data) => {
            if(type == 'page') {
                let map = {}
                map['page'] = data
                pages[position] = map
            } else if(type == 'completed') {
                pages[position]['time'] = data
                pages[position]['down'] = false

                ;(async () => {
                    if(position == 5) {
                        await delay(1000)
                        await pageCheckResponce(1)
                        await pageCheckResponce(2)
                        await pageCheckResponce(3)
                        await pageCheckResponce(4)
                        await pageCheckResponce(5)
                        await delay(1000)
                    }
                    loadColabData(position+1)
                })()
            }
        })
    } else {
        mLoadSuccess = true
    }
}

async function pageCheckResponce(position) {
    let data = pages[position]
    if(data && data['page']) {
        await data['page'].bringToFront()
        await delay(1000)

        if(data['down'] != null && data['down'] == true) {
            data['down'] = false
            await data['page'].keyboard.press('ArrowUp')
        } else if(data['down'] != null && data['down'] == false) {
            data['down'] = true
            await data['page'].keyboard.press('ArrowDown')
        }
        await delay(1000)
    }
    return true
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
