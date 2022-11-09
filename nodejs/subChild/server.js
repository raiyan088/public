const puppeteer = require("puppeteer")
const COLAB = require('./page-api')
const request = require('request')
const fs = require('fs')

let pages = {}
let DATA = null
let mId = null
let mGmail = null
let mLoadSuccess = false

process.argv.slice(2).forEach(function (val, index) {
    if(index == 0) {
        try {
            mId = parseInt(val)
            mGmail = getChild(mId)
            console.log(getTime()+' Server Start. Id: '+mGmail)
            request({
                url: decode('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dtYWlsL3N1YkNoaWxkLw==')+mGmail+'.json',
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

        let temp = JSON.parse(fs.readFileSync('./cookies.json'))

        let mColab = new COLAB(browser, temp, DATA)

        for(let i=1; i<=mSize; i++) {
            await mColab.newPage(i)
        }

        console.log(getTime()+' Page Open Success')

        await delay(5000)

        await mColab.connect()

        console.log(getTime()+' Load Success')
        
        await delay(5000)

        await mColab.runing(mId)

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
