const COLAB_API = require('./colab-api')
const puppeteer = require('puppeteer')
const request = require('request')

const raiyan = 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/'

let colab1 = '1vKu6N9ZfG0H9t8oe1sAkMgoB387cSr1p'
let colab2 = '1m_GiOpqYSOges7z6ELapMRT5bz6ULPsM'
let colab3 = '1QJGvYumh900DjBbdPCr9rz8RDT_dfd0g'
let colab4 = '1WywZDhY2I4vUKu4zUiM5rtPc4mwe3fgQ'
let colab5 = '1E9ULDh8InEbsc6hTksEKrhg2iJV7GuVp'


let DATA = null
let mGmail = null
let mLoadSuccess = false
let cookies = []

let browser = null
let pages = {}

let temp = [
    {
      name: 'NID',
      value: '511=eQ7kVrY9v-XpBWqs8xyqCruy7jS1pMWY4Bpq47timd1Ah-IMg7zrOgBw3GxwNIC9b9hBpXOBGu23uL5qKynw_a2C7vzgZILc-GNqsBCzkHJLq0HFQaX-d1Ud-Hfxo0wsMRj4vn4vPzW_Maos8WBgm17B_FlF9RX9xqbIhbqDUi6pCpE',
      domain: '.google.com',
      path: '/',
      expires: 1662303164.34413,
      size: 182,
      httpOnly: true,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'SSID',
      value: 'Autct2L0r20F_E6rv',
      domain: '.google.com',
      path: '/',
      expires: 1709563852.134954,
      size: 21,
      httpOnly: true,
      secure: true,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: '__Secure-3PAPISID',
      value: 'FkDnGWT1SLbfDb7l/A8zdZDRKEZ3EsFtWt',
      domain: '.google.com',
      path: '/',
      expires: 1709563852.135092,
      size: 51,
      httpOnly: false,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'HSID',
      value: 'A-5om8WvV-CMvaWK6',
      domain: '.google.com',
      path: '/',
      expires: 1709563852.134906,
      size: 21,
      httpOnly: true,
      secure: false,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: '__Secure-3PSID',
      value: 'HwiYwkC5Kw4LVGokoHrh-nqOUL_1aP26mHX8kZ_24J_92mzxXHDSjpVbqOJadn2hetVBlA.',
      domain: '.google.com',
      path: '/',
      expires: 1709563852.134771,
      size: 85,
      httpOnly: true,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: '__Secure-1PAPISID',
      value: 'FkDnGWT1SLbfDb7l/A8zdZDRKEZ3EsFtWt',
      domain: '.google.com',
      path: '/',
      expires: 1709563852.135056,
      size: 51,
      httpOnly: false,
      secure: true,
      session: false,
      sameParty: true,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'SID',
      value: 'HwiYwkC5Kw4LVGokoHrh-nqOUL_1aP26mHX8kZ_24J_92mzxzTvoxsoC0v8zLhLVUy-WjQ.',
      domain: '.google.com',
      path: '/',
      expires: 1709563852.13458,
      size: 74,
      httpOnly: false,
      secure: false,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: '__Secure-1PSID',
      value: 'HwiYwkC5Kw4LVGokoHrh-nqOUL_1aP26mHX8kZ_24J_92mzxAKIR7nmMcfjAnnUAUXEHvA.',
      domain: '.google.com',
      path: '/',
      expires: 1709563852.134658,
      size: 85,
      httpOnly: true,
      secure: true,
      session: false,
      sameParty: true,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: '__Secure-3PSIDCC',
      value: 'AJi4QfFo2WAunp7tUkC_uFPijtQGRQwR5bEGDA4uulBpxWN4MnSNWrKwFSIiLEloMC2RsUVO',
      domain: '.google.com',
      path: '/',
      expires: 1678027964.344321,
      size: 88,
      httpOnly: true,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'SAPISID',
      value: 'FkDnGWT1SLbfDb7l/A8zdZDRKEZ3EsFtWt',
      domain: '.google.com',
      path: '/',
      expires: 1709563852.135019,
      size: 41,
      httpOnly: false,
      secure: true,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'APISID',
      value: 'Oy9TBQh1kPVCO4Dx/AzlW5Uh7GaHtq9q5z',
      domain: '.google.com',
      path: '/',
      expires: 1709563852.134986,
      size: 40,
      httpOnly: false,
      secure: false,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'SIDCC',
      value: 'AJi4QfFSLNwuz-wtj-aeQonMUAo2eOrtrPYmO1Zu1dC38x6ZP2QPoUovOzeYS0gkRYfJRnuI',
      domain: '.google.com',
      path: '/',
      expires: 1678027964.344271,
      size: 77,
      httpOnly: false,
      secure: false,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: '_gid',
      value: 'GA1.4.1851426654.1646491773',
      domain: '.colab.research.google.com',
      path: '/',
      expires: 1646578255,
      size: 31,
      httpOnly: false,
      secure: false,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: '_ga',
      value: 'GA1.4.499267320.1646491773',
      domain: '.colab.research.google.com',
      path: '/',
      expires: 1709563855,
      size: 29,
      httpOnly: false,
      secure: false,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    }
  ]


console.log('Service Starting...')

process.argv.slice(2).forEach(function (val, index) {
    if(index == 0) {
        try {
            mGmail = getChild(parseInt(val))
            request({
                url: raiyan+'gmail/mining/'+mGmail+'.json',
                json:true
            }, function(error, response, body){
                if(!error) {
                    DATA = body
                    startBackgroundService()
                }
            })
        } catch (e) {}
    }
})


async function startBackgroundService() {
    ;(async () => {
        
        console.log(getTime() + 'Service Start...')
        console.log('Status: Start process...' + ' ID: ' + mGmail)
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
            headless: true,
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