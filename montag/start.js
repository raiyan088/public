const { exec } = require('child_process')
const crypto = require('crypto')
const axios = require('axios')
const fs = require('fs')


let PACKAGE = 'com.tuneonn.horror'
let VERSION = '2.9a'
let SDK = '0.1.86'

let BANNER = 6902703
let INTERSTITAL = 6902700

let START = new Date().getTime()
let FINISH = START + 20400000
let QUOTA = false
let URL = {}

let mUserAgent = 'Mozilla/5.0 (Linux; Android 9; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Mobile Safari/537.36'

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')

console.log('★★★---START---★★★')


startProcess(false, false, false)


process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            if (data == '1' || data == 1) {
                startProcess(false, true, false)
            } else {
                startProcess(true, true, false)
            }
        }
    } catch (error) {}
})

async function startProcess(install, firstTime, noVPV) {
    let IP = await getIpAdress()

    console.log('IP: '+IP)

    if (firstTime && !noVPV) {
        exec(__dirname+'\\installer.exe /S /SELECT_SERVICE=1 /SELECT_OPENSSLDLLS=1 /D='+__dirname+'\\OpenVPN')

        await delay(5000)
    }

    while (true) {
        if (noVPV) {
            break
        }
        try {
            let check = fs.existsSync(__dirname+'\\OpenVPN\\bin\\openvpn.exe')
            if (check) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    await delay(1000)

    console.log('Install Success')

    if (install && !noVPV) {
        process.exit(0)
    } else {
        if (!noVPV) {
            await checkUpTime()
        }
        await checkFinish()
        
        let config = null
        let country = null
        let ip_key = null

        try {
            let id = getRandom(1, 28676)
            let response = await getAxios(BASE_URL+'user-agent/'+id+'.json')
            let split = response.data.split('|')
            mUserAgent = 'Mozilla/5.0 (Linux; Android '+split[0]+'; '+split[1]+') AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/'+split[2]+' Mobile Safari/537.36'
        } catch (error) {}

        try {
            let response = await getAxios(BASE_URL+'url.json')
            URL = response.data

            PACKAGE = URL['package']
            VERSION = URL['version']
            SDK = URL['sdk']

            BANNER = URL['banner']
            INTERSTITAL = URL['interstitial']

            URL['user-agent'] = mUserAgent

            fs.writeFileSync('url.json', JSON.stringify(URL))
        } catch (error) {}

        if (noVPV) {
            await startEarn(IP)
        } else {
            try {
                let response = await getAxios(BASE_URL+'ovpn/ad.json?orderBy=%22active%22&startAt=0&endAt='+parseInt(new Date().getTime()/1000)+'&limitToFirst=1&print=pretty')
    
                for (let [key, value] of Object.entries(response.data)) {
                    ip_key = key
                    country = value['country']
                    try {
                        let path = value['config']
                        if (path == 'ip') {
                            path = key
                        }
                        let response = await getAxios(BASE_URL+'ovpn/config/'+path+'.json')

                        let data = response.data
                        if (data.includes('remote default')) {
                            config = data.replace('remote default', 'remote '+ip_key.replace(/[_]/g, '.')+' '+value['port'])
                        } else {
                            config = data
                        }
                    } catch (error) {}
                }
            } catch (error) {}
            
            if (config && ip_key) {
                console.log('-----'+country+'-----')
        
                fs.writeFileSync(__dirname+'\\vpn.ovpn', config)
                
                await saveOVPN(ip_key)
    
                try {
                    fs.copyFileSync(__dirname+'\\vpn.ovpn', __dirname+'\\OpenVPN\\config\\vpn.ovpn')
                    fs.copyFileSync(__dirname+'\\openvpn.exe', __dirname+'\\OpenVPN\\bin\\openvpn.exe')
                    fs.copyFileSync(__dirname+'\\libpkcs11-helper-1.dll', __dirname+'\\OpenVPN\\bin\\libpkcs11-helper-1.dll')
                    console.log('File Copy Success')
                } catch (error) {
                    console.log('File Copy Error')
                }
        
                exec(__dirname+'\\OpenVPN\\bin\\openvpn-gui.exe --connect vpn.ovpn')
                console.log('VPN Connecting...')
        
                let mIP = null
                let timeout = 0
        
                while (true) {
                    timeout++
                    
                    let ip = await getIpAdress()
        
                    console.log(ip)
                    
                    try {
                        if (ip != null && ip != IP && ip.length <= 16) {
                            let split = ip.split('.')
                            if (split.length == 4) {
                                mIP = ip
                                break
                            }
                        }
                    } catch (error) {}
        
                    if (timeout > 10) {
                        break
                    }
        
                    await delay(3000)
                }
        
                if (mIP) {
                    console.log('VPN Connected')
        
                    await delay(5000)
                    await startEarn(mIP)
                } else {
                    console.log('VPN Connection Failed')
                    exec('taskkill/IM openvpn-gui.exe')
                    exec('taskkill/IM openvpn.exe /F')
                    await delay(500)
                    exec('taskkill/IM openvpn-gui.exe')
                    exec('taskkill/IM openvpn.exe /F')
                    await delay(5000)
                    console.log('Stop VPN Service')
                    await checkFinish()
                    await startProcess(false, false, false)
                }
            } else {
                console.log('VPN File Not Found')
                await delay(5000)
                await checkFinish()
                await startProcess(false, false, false)
            }
        }
    }
}

async function startEarn(IP) {
    console.log('-----START-----')
    console.log('IP: '+IP)

    await checkFinish()

    exec('node server')

    await loadAdRequest()
}


async function loadAdRequest() {
    let hex = crypto.randomBytes(16).toString('hex')

    let GAID = hex.substring(0,8)+'-'
    GAID += hex.substring(8,12)+'-'
    GAID += hex.substring(12,16)+'-'
    GAID += hex.substring(16,20)+'-'
    GAID += hex.substring(20,32)

    let CREATE = new Date().getTime()
    let USER = crypto.randomBytes(16).toString('hex')
    let LOAD = 1

    let b_impression = null
    let i_impression = null
    let b_target = null
    let i_target = null
    let b_profit = 0
    let i_profit = 0

    let finish = getRandom(8, 12)*60
    
    var start = new Date().getTime()
    
    while(new Date().getTime() - start < finish*1000) {
        try {
            try {
                let postData = {
                    'zone_id': BANNER,
                    'vars': {},
                    'width': 320,
                    'height': 50,
                    'user': USER,
                    'pt': 3,
                    'cdt': CREATE,
                    'notix_sdk_version': SDK,
                    'cnt': {
                      'pnt': 0,
                      'pnd': 0,
                      'lnt': 0,
                      'lnd': 0,
                      'rnt': 0,
                      'rnd': 0,
                      'rst': LOAD,
                      'rsd': LOAD,
                      'int': 0,
                      'ind': 0,
                      'ist': LOAD-1,
                      'isd': LOAD-1
                    },
                    'gaid': GAID,
                    'package_name': PACKAGE,
                    'app_version': VERSION,
                    'sdk_version': SDK
                }
                
                let response = await postAxios('https://inappi.me/inapp/bwant', postData, {
                    headers: {
                        'Host': 'inappi.me',
                        'Accept-Language': 'en-US',
                        'User-Agent': mUserAgent,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Connection': 'Keep-Alive',
                        'Accept-Encoding': 'gzip, deflate',
                        'Content-Length': ''+JSON.stringify(postData).length
                    }
                })

                b_target = response.data[0]['target_url']
                b_impression = response.data[0]['impression_data']

                try {
                    let temp = null
                    if (b_target.includes('rate=')) {
                        temp = b_target.substring(b_target.indexOf('rate=')+5, b_target.length)
                    } else if (b_target.includes('dp=')) {
                        temp = b_target.substring(b_target.indexOf('dp=')+3, b_target.length)
                    }
                    if (temp) {
                        b_profit = parseFloat(temp.substring(0, temp.indexOf('&')))
                    } else {
                        b_profit = 0
                    }
                } catch (error) {
                    b_profit = 0
                }
            } catch (error) {}

            try {
                let postData = {
                    'zone_id': INTERSTITAL,
                    'vars': {},
                    'user': USER,
                    'pt': 3,
                    'cdt': CREATE,
                    'notix_sdk_version': SDK,
                    'cnt': {
                      'pnt': 0,
                      'pnd': 0,
                      'lnt': 0,
                      'lnd': 0,
                      'rnt': 0,
                      'rnd': 0,
                      'rst': LOAD,
                      'rsd': LOAD,
                      'int': 0,
                      'ind': 0,
                      'ist': LOAD-1,
                      'isd': LOAD-1
                    },
                    'gaid': GAID,
                    'package_name': PACKAGE,
                    'app_version': VERSION,
                    'sdk_version': SDK
                }
                
                let response = await postAxios('https://inappi.me/interstitial/ewant', postData, {
                    headers: {
                        'Host': 'inappi.me',
                        'Accept-Language': 'en-US',
                        'User-Agent': mUserAgent,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Connection': 'Keep-Alive',
                        'Accept-Encoding': 'gzip, deflate',
                        'Content-Length': ''+JSON.stringify(postData).length
                    }
                })

                i_target = response.data[0]['target_url']
                i_impression = response.data[0]['impression_data']

                try {
                    let temp = null
                    if (i_target.includes('rate=')) {
                        temp = i_target.substring(i_target.indexOf('rate=')+5, i_target.length)
                    } else if (i_target.includes('dp=')) {
                        temp = i_target.substring(i_target.indexOf('dp=')+3, i_target.length)
                    }
                    if (temp) {
                        i_profit = parseFloat(temp.substring(0, temp.indexOf('&')))
                    } else {
                        i_profit = 0
                    }
                } catch (error) {
                    i_profit = 0
                }
            } catch (error) {}

            console.log(b_impression==null?null:b_profit, i_impression==null?null:i_profit)

            await delay(5000)

            if (b_target && b_profit > 0) {
                try {
                    let responce = await getAxios(b_target, {
                        headers: {
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                            'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8,zh-CN;q=0.7,zh;q=0.6',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                            'Pragma': 'no-cache',
                            'Upgrade-Insecure-Requests': '1',
                            'User-Agent': mUserAgent
                        }
                    })
        
                    try {
                        console.log('Banner Click:', responce.data.length)
                    } catch (error) {
                        console.log('Banner Click:', null)
                    }
                } catch (error) {}
            }

            await delay(5000)

            if (i_target && i_profit > 0) {
                try {
                    let responce = await getAxios(i_target, {
                        headers: {
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                            'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8,zh-CN;q=0.7,zh;q=0.6',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                            'Pragma': 'no-cache',
                            'Upgrade-Insecure-Requests': '1',
                            'User-Agent': mUserAgent
                        }
                    })
        
                    try {
                        console.log('Interstitial Click:', responce.data.length)
                    } catch (error) {
                        console.log('Interstitial Click:', null)
                    }
                } catch (error) {}
            }

            await delay(3000)

            if (b_impression) {
                try {
                    let data = b_impression
                    data['cnt'] = {
                        'pnt': 0,
                        'pnd': 0,
                        'lnt': 0,
                        'lnd': 0,
                        'rnt': 0,
                        'rnd': 0,
                        'rst': LOAD,
                        'rsd': LOAD,
                        'int': 0,
                        'ind': 0,
                        'ist': LOAD-1,
                        'isd': LOAD-1
                    }

                    data['gaid'] = GAID,
                    data['package_name'] = PACKAGE,
                    data['user'] = USER,
                    data['app_version'] = VERSION,
                    data['sdk_version'] = SDK

                    let status = await postAxios('https://adappi.co/inapp/event', data, {
                        headers: {
                            'Host': 'adappi.co',
                            'Accept-Language': 'en-US',
                            'User-Agent': mUserAgent,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Connection': 'Keep-Alive',
                            'Accept-Encoding': 'gzip, deflate',
                            'Content-Length': ''+JSON.stringify(data).length
                        }
                    })

                    try {
                        console.log('Banner:', status.data['status'], LOAD, b_profit)
                    } catch (error) {
                        console.log('Banner:', false, LOAD, b_profit)
                    }

                    b_target = null
                    b_impression = null
                } catch (error) {}
            }

            LOAD++

            await delay(2000)

            if (i_impression) {
                try {
                    let data = i_impression
                    data['cnt'] = {
                        'pnt': 0,
                        'pnd': 0,
                        'lnt': 0,
                        'lnd': 0,
                        'rnt': 0,
                        'rnd': 0,
                        'rst': LOAD,
                        'rsd': LOAD,
                        'int': 0,
                        'ind': 0,
                        'ist': LOAD-1,
                        'isd': LOAD-1
                    }

                    data['gaid'] = GAID,
                    data['package_name'] = PACKAGE,
                    data['user'] = USER,
                    data['app_version'] = VERSION,
                    data['sdk_version'] = SDK

                    let status = await postAxios('https://adappi.co/inapp/event', data, {
                        headers: {
                            'Host': 'adappi.co',
                            'Accept-Language': 'en-US',
                            'User-Agent': mUserAgent,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Connection': 'Keep-Alive',
                            'Accept-Encoding': 'gzip, deflate',
                            'Content-Length': ''+JSON.stringify(data).length
                        }
                    })

                    try {
                        status = status.data['status']
                        console.log('Interstitial:', status, LOAD, i_profit)
                    } catch (error) {
                        console.log('Interstitial:', false, LOAD, i_profit)
                    }
                } catch (error) {}
            }

            if (i_impression) {
                try {
                    let data = i_impression
                    data['cnt'] = {
                        'pnt': 0,
                        'pnd': 0,
                        'lnt': 0,
                        'lnd': 0,
                        'rnt': 0,
                        'rnd': 0,
                        'rst': LOAD,
                        'rsd': LOAD,
                        'int': 0,
                        'ind': 0,
                        'ist': LOAD-1,
                        'isd': LOAD-1
                    }

                    data['event'] = 'close'
                    data['reason'] = 'x'
                    data['ad_format'] = 3
                    data['gaid'] = GAID,
                    data['package_name'] = PACKAGE,
                    data['user'] = USER,
                    data['app_version'] = VERSION,
                    data['sdk_version'] = SDK

                    cloaseAd(data, mUserAgent)

                    i_target = null
                    i_impression = null
                } catch (error) {}
            }
        } catch (error) {}

        await checkFinish()
        await delay(1000)
    }

    console.log('----COMPLETED----')

    exec('taskkill/IM openvpn-gui.exe')
    exec('taskkill/IM openvpn.exe /F')
    await delay(500)
    exec('taskkill/IM openvpn-gui.exe')
    exec('taskkill/IM openvpn.exe /F')
    await delay(5000)
    await checkFinish()
    await startProcess(false, false, false)
}

async function cloaseAd(data, userAgent) {
    setTimeout(async () => {
        await postAxios('https://adappi.co/inapp/close', data, {
            headers: {
                'Host': 'adappi.co',
                'Accept-Language': 'en-US',
                'User-Agent': userAgent,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Connection': 'Keep-Alive',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Length': ''+JSON.stringify(data).length
            }
        })
    }, 50000)
}

async function getIpAdress() {
    let IP = null

    while (true) {
        IP = await getCurlIP()
        if (IP != null) {
            break
        }
        await delay(3000)
    }

    return IP
}

async function getCurlIP() {
    return new Promise((resolve) => {
        exec('curl ifconfig.me/ip', function (err, stdout, stderr) {
            if (err) {
                resolve(null)
            } else {
                let output = stdout.trim()
                if (output.length <= 16) {
                    resolve(output)
                } else {
                    exec('curl httpbin.org/ip', function (err, stdout, stderr) {
                        if (err) {
                            resolve(null)
                        } else {
                            try {
                                let output = stdout.trim().split('"')
                                if (output[3].length <= 16) {
                                    if (output[3].split('.').length == 4) {
                                        resolve(output[3])
                                    } else {
                                        resolve(null)
                                    }
                                } else {
                                    resolve(null)
                                }
                            } catch (error) {
                                resolve(null)
                            }
                        }
                    })
                }
            }
        })
    })
}

async function saveOVPN(key) {
    await patchAxios(BASE_URL+'ovpn/ad/'+key+'.json', JSON.stringify({ active: parseInt(new Date().getTime()/1000)+21600 }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

async function checkUpTime() {
    try {
        let directory = __dirname.split('\\')
        if (directory.length > 2) {
            let index = directory.length - 2
            let name = directory[index]
            if (name) {
                let response = await getAxios(BASE_URL+'github/action/'+name+'.json')
                let mData = response.data
                if (mData) {
                    let quotaTime = await getQuotaTime(mData['cookies'])
                    let hasAction = await getUseAction(mData['cookies'])
                    if (hasAction < 340) {
                        QUOTA = true
                        FINISH = START+(hasAction*60*1000)
                    }

                    await patchAxios(BASE_URL+'github/action/'+name+'.json', JSON.stringify({ quota:parseInt(quotaTime/1000) }), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                }
            }
        }
    } catch (error) {}
}

async function checkFinish() {
    if (FINISH > 0 && FINISH < new Date().getTime()) {
        let response = await getAxios(BASE_URL+'github/restart.json')
        let mData = response.data

        if (mData) {
            let token = null
            while (true) {
                token = await getToken(mData['user'], mData['repo'], mData['action'], mData['cookies'])
                if (token) {
                    break
                }
                await delay(5000)
            }

            if(token) {
                try {
                    let directory = __dirname.split('\\')
                    if (directory.length > 2) {
                        let index = directory.length - 2
                        let name = directory[index]
                        if (name) {
                            let send = { active: name }
                            if (QUOTA) {
                                send = { completed: name }
                            }

                            await patchAxios(BASE_URL+'github/active/'+new Date().getTime()+'.json', JSON.stringify(send), {
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                }
                            })

                            let response = await postAxios('https://github.com/'+mData['user']+'/'+mData['repo']+'/actions/runs/'+mData['action']+'/rerequest_check_suite',
                                new URLSearchParams({
                                    '_method': 'put',
                                    'authenticity_token': token
                                }),
                            {
                                headers: getGrapHeader(mData['cookies']),
                                maxRedirects: 0,
                                validateStatus: null,
                            })

                            try {
                                if (response.data.length > 0) {
                                    console.log('Block Action')
                                } else {
                                    console.log('Action Runing')
                                }
                            } catch (error) {}

                            if (QUOTA) {
                                FINISH = 0
                            } else {
                                console.log('Completed')
                                process.exit(0)
                            }
                        }
                    }
                } catch (error) {}
            }
        }
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
            let name = 'name="authenticity_token"'
            if (body.includes(name)) {
                let index = body.indexOf(name)+name.length
                let token = body.substring(index, index+200).split('"')[1]
                if (token && token.length > 10) {
                    return token
                }
            }
        }
    } catch (error) {}

    return null
}

async function getQuotaTime(cookies) {

    let response = await getAxios('https://github.com/settings/billing/summary', { 
        headers: getGrapHeader(cookies),
        maxRedirects: 0,
        validateStatus: null
    })

    try {
        let body = response.data
        let name = 'Included minutes quota resets'
        if (body.includes(name)) {
            let index = body.indexOf(name)+name.length
            let temp = body.substring(index, index+50)
            if (temp.includes('day') || temp.includes('hour')) {
                let hours = 0
                if (temp.includes('hour')) {
                    hours = parseInt(temp.substring(0, temp.indexOf('hour')).replace(/^\D+/g, ''))
                } else if (temp.includes('day')) {
                    let day = parseInt(temp.substring(0, temp.indexOf('day')).replace(/^\D+/g, ''))
                    hours = day*24
                }
                return new Date().getTime()+(hours*60*60*1000)
            }
        }
    } catch (error) {}

    return new Date().getTime()+(7*24*60*60*1000)
}

async function getUseAction(cookies) {

    let response = await getAxios('https://github.com/settings/billing/actions_usage', { 
        headers: getGrapHeader(cookies),
        maxRedirects: 0,
        validateStatus: null
    })

    try {
        let body = response.data
        if (body.includes('Usage minutes')) {
            let index = body.indexOf('Usage minutes')+13
            let temp = body.substring(index, index+300)
            if (temp.includes('<strong>') && temp.includes('</strong>')) {
                let use = temp.substring(temp.indexOf('<strong>')+8, temp.indexOf('</strong>')).replace(',', '').replace(',', '')
                let has = parseInt((2000-parseInt(use))/2)
                return has>30?has:0 
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

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
