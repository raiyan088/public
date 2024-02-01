const { exec } = require('child_process')
const axios = require('axios')


let START = new Date().getTime()
let FINISH = START + 19800000
let SERVER = null
let UPDATE = null
let CMD_RUN = true
let UPDATE_URL = null

const USER = getUserName()

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')

console.log('★★★---START---★★★')

if (USER) {
    console.log('USER: '+USER)
} else {
    console.log('---NULL---')
    process.exit(0)
}

startServer()

setInterval(async () => {
    await startServer()
}, 60000)

setInterval(async () => {
    await activeServer()
}, 300000)

async function startServer() {
    try {
        await checkUpdate()
    } catch (error) {}

    if (CMD_RUN && SERVER != null) {
        CMD_RUN = false
        console.log('---CMD-RUN---')
        exec('start cmd.exe /K node colab.js '+SERVER)
    }
}

async function activeServer() {
    try {
        if (UPDATE_URL != null) {
            await getAxios(UPDATE_URL)
        }
    } catch (error) {}
}

process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            checkData(data == '1' || data == 1)
        }
    } catch (error) {}
})

async function checkUpdate() {
    let mActive = false

    try {
        let response = await getAxios(BASE_URL+'github/realtime/'+USER+'/update.json')

        let data = response.data

        if (data != null && data != 'null') {
            if (SERVER == null) {
                SERVER = data['server']
            }
            if (UPDATE == null) {
                UPDATE = data['update']
            }
            if (UPDATE_URL == null && data['url'] != null) {
                UPDATE_URL = data['url']
            }
            if (data['active'] == null) {
                mActive = true
            } else if (parseInt(new Date().getTime()/1000) > data['active']) {
                mActive = true
            }
        } else {
            console.log('---NULL---')
            process.exit(0)
        }
    } catch (error) {
        console.log('---ERROR---')
        process.exit(0)
    }

    if (UPDATE) {
        await patchAxios(BASE_URL+'github/realtime/'+UPDATE+'/update.json', JSON.stringify({ active: parseInt(new Date().getTime()/1000)+180 }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        try {
            await axios.delete(BASE_URL+'github/realtime/'+UPDATE+'/update/restart.json')
        } catch (error) {}
    }

    if (mActive) {
        let response = await getAxios(BASE_URL+'github/realtime/'+UPDATE+'.json')

        let data = response.data

        if (data != null || data != 'null') {
            await activeAction(UPDATE, data['action'], data['cookies'])
        } else {
            console.log('---NULL---')
            process.exit(0)
        }
    }

    if (new Date().getTime() > FINISH) {
        let response = await getAxios(BASE_URL+'github/realtime/'+USER+'/update/restart.json')
        let data = response.data

        if (data == null || data == 'null') {
            await patchAxios(BASE_URL+'github/realtime/'+UPDATE+'/update.json', JSON.stringify({ active: parseInt(new Date().getTime()/1000)+10, restart:true }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })

            await delay(1000)
            console.log('---COMPLETED---')
            process.exit(0)
        }
    }
}

async function activeAction(user, action, cookies) {
    let token = await getToken(user, user, action, cookies)

    if (token) {
        let response = await postAxios('https://github.com/'+user+'/'+user+'/actions/runs/'+action+'/rerequest_check_suite',
            new URLSearchParams({
                '_method': 'put',
                'authenticity_token': token
            }),
        {
            headers: getGrapHeader(cookies),
            maxRedirects: 0,
            validateStatus: null,
        })

        try {
            if (response.data.length > 0) {
                console.log('Action Block: '+user)
            } else {
                console.log('Active Success: '+user)
            }

            await patchAxios(BASE_URL+'github/realtime/'+USER+'/update.json', JSON.stringify({ active:parseInt(new Date().getTime()/1000)+180 }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
        } catch (error) {
            console.log('Action Error: '+user)
        }
    } else {
        console.log('Action Already Active: '+user)
    }
}

async function getToken(user, repo, action, cookies) {

    let response = await getAxios('https://github.com/'+user+'/'+repo+'/actions/runs/'+action, { 
        headers: getFrameHeader(cookies),
        maxRedirects: 0,
        validateStatus: null
    })

    try {
        let body = response.data
        if (body.includes('Failure') || body.includes('Cancelled') || body.includes('Success')) {
            if (body.includes('rerequest_check_suite')) {
                body = body.substring(body.indexOf('rerequest_check_suite'), body.length)
                let name = 'name="authenticity_token"'
                if (body.includes(name)) {
                    let index = body.indexOf(name)+name.length
                    let token = body.substring(index, index+200).split('"')[1]
                    if (token && token.length > 10) {
                        return token
                    }
                }
            }
        }
    } catch (error) {}

    return null
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


function getRandom(min, max) {
    return Math.floor((Math.random() * (max-min)) + min)
}

function getFrameHeader(cookies) {
    return {
        'authority': 'github.com',
        'accept': 'text/html, application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
        'cookie': cookies,
        'sec-ch-ua': '"Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'turbo-frame': 'repo-content-turbo-frame',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    }
}

function getGrapHeader(cookies) {
    return {
        'authority': 'github.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'cookie': cookies,
        'origin': 'https://github.com',
        'sec-ch-ua': '"Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    }
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

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
