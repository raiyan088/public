const puppeteer = require('puppeteer')
const axios = require('axios')


let browser = null
let page = null
let mData = null
let UPDATE = null

let USER = getUserName()
let FINISH = new Date().getTime()+21000000


let BASE_URL = decode('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dpdGh1Yi8=')
let STORAGE = decode('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vLw==')


startServer()


async function startServer() {
    console.log('---START---')

    await getUpdateData()
    await startBrowser()

    console.log('---LOAD---')

    while (true) {
        await checkStatus()
        await delay(60000)
    }
}


async function startBrowser() {
    try {
        browser = await puppeteer.launch({
            headless: false,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage'
            ]
        })
    
        page = (await browser.pages())[0]

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
    } catch (error) {}
}

async function getUpdateData() {
    try {
        let response = await getAxios(BASE_URL+'server/'+USER+'.json')

        let data = response.data

        if (data['update']) {
            UPDATE = data['update']

            response = await getAxios(BASE_URL+'server/'+UPDATE+'.json')

            mData = response.data
        }
    } catch (error) {}
}

async function checkStatus() {
    try {
        await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
            headers: {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+100)
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        })

        if (UPDATE == null) {
            await getUpdateData()
        }

        if (UPDATE) {
            let mActive = true

            try {
                let response = await axios.get(STORAGE+encodeURIComponent('server/'+UPDATE+'.json'))

                let contentType = response.data['contentType']
                let time = parseInt(contentType.replace('active/', ''))*1000
                if (time > new Date().getTime()) {
                    mActive = false
                }
            } catch (error) {}

            if (mActive && mData['action']) {
                await activeAction()
            }
        }
        if (FINISH > 0 && FINISH < new Date().getTime()) {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                headers: {
                    'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+10)
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            })

            console.log('Completed')
            process.exit(0)
        }
    } catch (error) {}
}

async function activeAction() {
    await page.setCookie(...[
        {
            name: 'user_session',
            value: mData['cookies'],
            domain: 'github.com',
            path: '/',
            expires: 1739569499.022126,
            size: mData['cookies'].length,
            httpOnly: true,
            secure: true,
            session: false,
            sameSite: 'Lax',
            sameParty: false,
            sourceScheme: 'Secure',
            sourcePort: 443
        },
        {
            name: '__Host-user_session_same_site',
            value: mData['cookies'],
            domain: 'github.com',
            path: '/',
            expires: 1712663324.958042,
            size: mData['cookies'].length,
            httpOnly: true,
            secure: true,
            session: false,
            sameSite: 'Strict',
            sameParty: false,
            sourceScheme: 'Secure',
            sourcePort: 443
        }
    ])
    
    await page.goto('https://github.com/'+UPDATE+'/'+UPDATE+'/actions/runs/'+mData['action'], { waitUntil: 'load', timeout: 0 })

    await delay(1000)

    for (let i = 0; i < 5; i++) {
        let start = await page.evaluate(() => {
            let root = document.querySelector('#rerun-dialog-mobile-all')
            if (root) {
                let child = root.querySelector('button[data-disable-with="Re-running..."]')
                if (child) {
                    child.click()
                    return true
                }
            }
            return false
        })

        if (start) {
            await postAxios(STORAGE+encodeURIComponent('server/'+UPDATE+'.json'), '', {
                headers: {
                    'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+100)
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            })

            break
        }

        await delay(3000)
    }

    await delay(3000)

    await page.goto('about:blank')
}

async function getAxios(url, options) {
    let loop = 0
    let responce = null
    
    while(true) {
    
        try {
            responce = await axios.get(url, options==null?{}:options)
            break
        } catch (error) {
            loop++

            if (loop >= 3) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}

async function postAxios(url, body, data) {
    let loop = 0
    let responce = null

    while(true) {
        try {
            responce = await axios.post(url, body, data)
            break
        } catch (error) {
            loop++

            if (loop >= 3) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}

async function patchAxios(url, body, data) {
    let loop = 0
    let responce = null

    while(true) {
        try {
            responce = await axios.patch(url, body, data)
            break
        } catch (error) {
            loop++

            if (loop >= 3) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}

function getUserName() {
    try {
        let directory = __dirname.split('\\')
        if (directory.length > 2) {
            let index = directory.length - 2
            let name = directory[index]
            if (name) {
                return name
            }
        }
    } catch (error) {}
    return null
}

function encode(data) {
    return Buffer.from(data).toString('base64')
}

function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
