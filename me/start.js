const { exec } = require('child_process')
const crypto = require('crypto')
const axios = require('axios')
const fs = require('fs')


const PACKAGE = 'com.rr.hadis'
const VERSION = '1.0'
const SDK = '0.1.86'

const BANNER = 6814760
const INTERSTITAL = 6816361

let mAdData = {}
let mUserAgent = {}


let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')

console.log('★★★---START---★★★')


process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            if (data == '1' || data == 1) {
                startProcess(false, true)
            } else {
                startProcess(true, true)
            }
        }
    } catch (error) {}
})

async function startProcess(install, firstTime) {
    let IP = await getIpAdress()

    console.log('IP: '+IP)

    if (firstTime) {
        exec(__dirname+'\\installer.exe /S /SELECT_SERVICE=1 /SELECT_OPENSSLDLLS=1 /D='+__dirname+'\\OpenVPN')

        await delay(5000)
    }

    while (true) {
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

    if (install) {
        process.exit(0)
    } else {
        let config = null
        let country = null
        let id = null

        try {
            let response = await getAxios(BASE_URL+'ovpn.json?orderBy=%22active%22&startAt=0&endAt='+parseInt(new Date().getTime()/1000)+'&limitToFirst=1&print=pretty')

            for (let [key, value] of Object.entries(response.data)) {
                id = key
                country = value['country']
                config = value['config']
            }
        } catch (error) {}
        
        if (config && id) {
            console.log('-----'+country+'-----')
    
            fs.writeFileSync(__dirname+'\\vpn.ovpn', config)
            
            await saveOVPN(id)

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
                await delay(1000)
                console.log('Stop VPN Service')
                process.exit(0)
            }
        } else {
            console.log('VPN File Not Found')
            process.exit(0)
        }
    }
}

async function startEarn(IP) {
    IP = await getIpAdress()

    console.log('IP: '+IP)

    try {
        let key = IP.replace(/[.]/g, '_')
        let response = await getAxios(BASE_URL+'ip/'+key+'.json')
        let mIP = response.data

        if (mIP && mIP != 'null') {
            if (mIP['time'] == null || mIP['time'] < parseInt(new Date().getTime()/1000)) {
                await checkData(mIP['ad'], mIP['user'], key)
            } else {
                console.log('---IP-CHANGE---')
                process.exit(0)
            }
        } else {
            await checkData(null, null, key)
        }
    } catch (error) {
        console.log(error)
        console.log('-----ERROR-----')
        process.exit(0)
    }
}

async function checkData(adData, userAgent, ip) {
    let type = 0

    if (adData == null || userAgent == null) {
        let id = getRandom(1, 28675)
        let response = await getAxios(BASE_URL+'user-agent.json?orderBy="i"&equalTo='+id+'&print=pretty')

        for (let value of Object.values(response.data)) {
            mUserAgent = value
        }

        let hex = crypto.randomBytes(16).toString('hex')

        let gaid = hex.substring(0,8)+'-'
        gaid += hex.substring(8,12)+'-'
        gaid += hex.substring(12,16)+'-'
        gaid += hex.substring(16,20)+'-'
        gaid += hex.substring(20,32)

        let create = new Date().getTime()
        let user = crypto.randomBytes(16).toString('hex')

        mAdData['gaid'] = gaid
        mAdData['time'] = create
        mAdData['user'] = user
        mAdData['load'] = 1

        let postData = {
            'user': user,
            'gaid': gaid,
            'package_name': PACKAGE,
            'app_version': VERSION,
            'sdk_version': SDK
        }

        await postAxios('https://inappi.co/api/inapp/android/c', postData, {
            headers: {
                'Host': 'inappi.co',
                'Accept-Language': 'en-US',
                'User-Agent': getUserAgent(mUserAgent),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Connection': 'Keep-Alive',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Length': ''+JSON.stringify(postData).length
            }
        })

        postData = {
            'metric_type': 'app_install',
            'created_date_timestamp': create,
            'uuid': user,
            'package_name': PACKAGE,
            'data': {},
            'gaid': gaid,
            'user': user,
            'app_version': VERSION,
            'sdk_version': SDK
        },

        await postAxios('https://adappi.co/inapp/metrics', postData, {
            headers: {
                'Host': 'adappi.co',
                'Accept-Language': 'en-US',
                'User-Agent': getUserAgent(mUserAgent),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Connection': 'Keep-Alive',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Length': ''+JSON.stringify(postData).length
            }
        })

        let abis = [
            'armeabi-v7a',
            'armeabi'
        ]

        if (parseInt(mUserAgent['a']) >= 10) {
            abis.push('arm64-v8a')
        }

        postData = {
            'metric_type': 'general',
            'created_date_timestamp': create,
            'data': {
                'usage_stats': {
                    'foreground_time': 5,
                    'periodic_worker_run_count': 1
                },
                'client_info': {
                    'app_version': VERSION,
                    'android_api': getApiLevel(parseFloat(mUserAgent['a'])),
                    'app_target_sdk': 33,
                    'notix_sdk_version': SDK,
                    'model': mUserAgent['m'],
                    'manufacturer': mUserAgent['n'],
                    'supported_abis': abis
                },
                'notifications': {
                    'can_post': true
                }
            },
            'uuid': user,
            'package_name': PACKAGE,
            'gaid': gaid,
            'user': user,
            'app_version': VERSION,
            'sdk_version': SDK
        }

        await postAxios('https://adappi.co/inapp/metrics', postData, {
            headers: {
                'Host': 'adappi.co',
                'Accept-Language': 'en-US',
                'User-Agent': getUserAgent(mUserAgent),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Connection': 'Keep-Alive',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Length': ''+JSON.stringify(postData).length
            }
        })

        await patchAxios(BASE_URL+'ip/'+ip+'.json', JSON.stringify({ user:mUserAgent, ad:mAdData }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        await delay(10000)
    } else {
        mAdData = adData
        mUserAgent = userAgent

        type = 1
    }

    console.log('------LOAD-----', type)

    await loadAd(ip)
}

async function loadAd(ip) {
    let b_impression = null
    let i_impression = null
    let b_target = null
    let i_target = null
    let i_close = true
    let b_profit = 0
    let i_profit = 0
    let bp_profit = {}
    let ip_profit = {}

    let finish = getRandom(8, 12)*60

    let b_time = parseInt(finish/getRandom(1, 2))
    let i_time = parseInt(finish/getRandom(2, 3))
    let TIME = {
        bst: 0,
        bste: 30,
        ist: 0,
        iste: 0, 
        istf: 0,
        istfe: 0,
        bstc: 0,
        istc: 0,
        bstce: getRandom(20, b_time-20),
        istce: getRandom(20, i_time-20),
    }
    
    for (let x = 0; x < finish; x++) {
        try {
            let load = mAdData['load']
            
            if (b_impression == null) {
                let postData = {
                    'zone_id': BANNER,
                    'vars': {},
                    'width': 320,
                    'height': 50,
                    'user': mAdData['user'],
                    'pt': 3,
                    'cdt': mAdData['create'],
                    'notix_sdk_version': SDK,
                    'cnt': {
                      'pnt': 0,
                      'pnd': 0,
                      'lnt': 0,
                      'lnd': 0,
                      'rnt': 0,
                      'rnd': 0,
                      'rst': load,
                      'rsd': load,
                      'int': 0,
                      'ind': 0,
                      'ist': load-1,
                      'isd': load-1
                    },
                    'gaid': mAdData['gaid'],
                    'package_name': PACKAGE,
                    'app_version': VERSION,
                    'sdk_version': SDK
                }
                
                let response = await postAxios('https://inappi.me/inapp/bwant', postData, {
                    headers: {
                        'Host': 'inappi.me',
                        'Accept-Language': 'en-US',
                        'User-Agent': getUserAgent(mUserAgent),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Connection': 'Keep-Alive',
                        'Accept-Encoding': 'gzip, deflate',
                        'Content-Length': ''+JSON.stringify(postData).length
                    }
                })
    
                try {
                    TIME['bst'] = 0
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

                    bp_profit[b_profit] = b_target
                } catch (error) {}
            }

            if (i_impression == null) {
                let postData = {
                    'zone_id': INTERSTITAL,
                    'vars': {},
                    'user': mAdData['user'],
                    'pt': 3,
                    'cdt': mAdData['create'],
                    'notix_sdk_version': SDK,
                    'cnt': {
                      'pnt': 0,
                      'pnd': 0,
                      'lnt': 0,
                      'lnd': 0,
                      'rnt': 0,
                      'rnd': 0,
                      'rst': load,
                      'rsd': load,
                      'int': 0,
                      'ind': 0,
                      'ist': load-1,
                      'isd': load-1
                    },
                    'gaid': mAdData['gaid'],
                    'package_name': PACKAGE,
                    'app_version': VERSION,
                    'sdk_version': SDK
                }
                
                let response = await postAxios('https://inappi.me/interstitial/ewant', postData, {
                    headers: {
                        'Host': 'inappi.me',
                        'Accept-Language': 'en-US',
                        'User-Agent': getUserAgent(mUserAgent),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Connection': 'Keep-Alive',
                        'Accept-Encoding': 'gzip, deflate',
                        'Content-Length': ''+JSON.stringify(postData).length
                    }
                })

                try {
                    i_close = true
                    TIME['ist'] = 0
                    TIME['iste'] = getRandom(90, 150)
                    TIME['istfe'] = TIME['iste']+getRandom(8, 12)

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

                    ip_profit[i_profit] = i_target
                } catch (error) {}
            }

            if (b_impression && TIME['bst'] >= TIME['bste']) {
                let data = b_impression
                data['cnt'] = {
                    'pnt': 0,
                    'pnd': 0,
                    'lnt': 0,
                    'lnd': 0,
                    'rnt': 0,
                    'rnd': 0,
                    'rst': load,
                    'rsd': load,
                    'int': 0,
                    'ind': 0,
                    'ist': load-1,
                    'isd': load-1
                }

                data['gaid'] = mAdData['gaid'],
                data['package_name'] = PACKAGE,
                data['user'] = mAdData['user'],
                data['app_version'] = VERSION,
                data['sdk_version'] = SDK

                let status = await postAxios('https://adappi.co/inapp/event', data, {
                    headers: {
                        'Host': 'adappi.co',
                        'Accept-Language': 'en-US',
                        'User-Agent': getUserAgent(mUserAgent),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Connection': 'Keep-Alive',
                        'Accept-Encoding': 'gzip, deflate',
                        'Content-Length': ''+JSON.stringify(data).length
                    }
                })

                load++
                mAdData['load'] = load

                await patchAxios(BASE_URL+'ip/'+ip+'/ad.json', JSON.stringify({ load:load }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })

                try {
                    console.log('Banner:', status.data['status'], load, b_profit)
                } catch (error) {
                    console.log('Banner:', false, load, b_profit)
                }

                b_impression = null
            }

            if (i_close && i_impression && TIME['ist'] >= TIME['iste']) {
                i_close = false

                let data = i_impression
                data['cnt'] = {
                    'pnt': 0,
                    'pnd': 0,
                    'lnt': 0,
                    'lnd': 0,
                    'rnt': 0,
                    'rnd': 0,
                    'rst': load,
                    'rsd': load,
                    'int': 0,
                    'ind': 0,
                    'ist': load-1,
                    'isd': load-1
                }

                data['gaid'] = mAdData['gaid'],
                data['package_name'] = PACKAGE,
                data['user'] = mAdData['user'],
                data['app_version'] = VERSION,
                data['sdk_version'] = SDK

                let status = await postAxios('https://adappi.co/inapp/event', data, {
                    headers: {
                        'Host': 'adappi.co',
                        'Accept-Language': 'en-US',
                        'User-Agent': getUserAgent(mUserAgent),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Connection': 'Keep-Alive',
                        'Accept-Encoding': 'gzip, deflate',
                        'Content-Length': ''+JSON.stringify(data).length
                    }
                })

                load++
                mAdData['load'] = load

                await patchAxios(BASE_URL+'ip/'+ip+'/ad.json', JSON.stringify({ load:load }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })

                try {
                    status = status.data['status']
                    console.log('Interstitial:', status, load, i_profit)
                } catch (error) {
                    console.log('Interstitial:', false, load, i_profit)
                }
            }

            if (i_close == false && i_impression && TIME['istf'] >= TIME['istfe']) {
                let data = i_impression
                data['cnt'] = {
                    'pnt': 0,
                    'pnd': 0,
                    'lnt': 0,
                    'lnd': 0,
                    'rnt': 0,
                    'rnd': 0,
                    'rst': load,
                    'rsd': load,
                    'int': 0,
                    'ind': 0,
                    'ist': load-1,
                    'isd': load-1
                }

                data['event'] = 'close'
                data['reason'] = 'x'
                data['ad_format'] = 3
                data['gaid'] = mAdData['gaid'],
                data['package_name'] = PACKAGE,
                data['user'] = mAdData['user'],
                data['app_version'] = VERSION,
                data['sdk_version'] = SDK

                await postAxios('https://adappi.co/inapp/close', data, {
                    headers: {
                        'Host': 'adappi.co',
                        'Accept-Language': 'en-US',
                        'User-Agent': getUserAgent(mUserAgent),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Connection': 'Keep-Alive',
                        'Accept-Encoding': 'gzip, deflate',
                        'Content-Length': ''+JSON.stringify(data).length
                    }
                })

                console.log('Interstitial:', 'Close', load, i_profit)

                i_close = true
                i_impression = null
            }

            if (TIME['bstc'] >= b_time) {
                TIME['bstc'] = 0
                TIME['bstce'] = getRandom(20, b_time-20)
            }

            if (TIME['bstc'] >= TIME['bstce']) {
                TIME['bstce'] = 999999

                let profit = null
                let prev = 0
                
                for(let key of Object.keys(bp_profit)) {
                    try {
                        if (parseFloat(key) > prev) {
                            profit = key
                            prev = parseFloat(key)
                        }
                    } catch (error) {}
                }

                if (profit) {
                    let target = bp_profit[profit]
                    delete bp_profit[profit]

                    if (parseFloat(profit) > 0.1) {
                        target = b_target
                    }

                    let responce = await getAxios(target, {
                        headers: {
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                            'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8,zh-CN;q=0.7,zh;q=0.6',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                            'Pragma': 'no-cache',
                            'Upgrade-Insecure-Requests': '1',
                            'User-Agent': getUserAgent(mUserAgent)
                        }
                    })
        
                    try {
                        console.log('Banner Click:', responce.data.length)
                    } catch (error) {
                        console.log('Banner Click:', null)
                    }
                } else {
                    console.log('Banner Target Link:', null)
                }
            }

            if (TIME['istc'] >= i_time) {
                TIME['istc'] = 0
                TIME['istce'] = getRandom(20, i_time-20)
            }

            if (TIME['istc'] >= TIME['istce']) {
                TIME['istce'] = 999999

                let profit = null
                let prev = 0
                
                for(let key of Object.keys(ip_profit)) {
                    try {
                        if (parseFloat(key) > prev) {
                            profit = key
                            prev = parseFloat(key)
                        }
                    } catch (error) {}
                }

                if (profit) {
                    let target = ip_profit[profit]
                    delete ip_profit[profit]

                    if (parseFloat(profit) > 0.1) {
                        target = i_target
                    }
                    
                    let responce = await getAxios(target, {
                        headers: {
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                            'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8,zh-CN;q=0.7,zh;q=0.6',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                            'Pragma': 'no-cache',
                            'Upgrade-Insecure-Requests': '1',
                            'User-Agent': getUserAgent(mUserAgent)
                        }
                    })
        
                    try {
                        console.log('Interstitial Click:', responce.data.length)
                    } catch (error) {
                        console.log('Interstitial Click:', null)
                    }
                } else {
                    console.log('Interstitial Target Link:', null)
                } 
            }
        } catch (error) {}

        if (TIME['bst'] == 0) {
            console.log('Profit:', { banner:b_profit, interstitial:i_profit})
        }

        TIME['bst'] = TIME['bst']+1
        TIME['ist'] = TIME['ist']+1
        TIME['istf'] = TIME['istf']+1
        TIME['bstc'] = TIME['bstc']+1
        TIME['istc'] = TIME['istc']+1
        await delay(1000)
    }

    console.log('Completed')
    exec('taskkill/IM openvpn-gui.exe')
    exec('taskkill/IM openvpn.exe /F')
    await delay(500)
    exec('taskkill/IM openvpn-gui.exe')
    exec('taskkill/IM openvpn.exe /F')
    await delay(5000)
    await startProcess(false, false)
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
                resolve(stdout.trim())
            }
        })
    })
}

async function saveOVPN(key) {
    await patchAxios(BASE_URL+'ovpn/'+key+'.json', JSON.stringify({ active: parseInt(new Date().getTime()/1000)+21600 }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
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

function getUserAgent(userAgent) {
    return 'Mozilla/5.0 (Linux; Android '+userAgent['a']+'; '+userAgent['b']+'; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/'+userAgent['v']+' Mobile Safari/537.36'
}

function getApiLevel(version) {
    if (version < 5.1) {
        return 21
    } else if (version < 6) {
        return 22
    } else if (version < 7) {
        return 23
    } else if (version < 7.1) {
        return 24
    } else if (version < 8) {
        return 25
    } else if (version < 8.1) {
        return 26
    } else if (version < 9) {
        return 27
    } else if (version < 10) {
        return 28
    } else if (version < 11) {
        return 29
    } else if (version < 12) {
        return 30
    } else if (version < 12.1) {
        return 31
    } else if (version < 13) {
        return 32
    } else if (version < 34) {
        return 33
    } 
}

function getCountryName(code) {
    for (var i = 0; i < countrys.length; i++) {
        if(countrys[i]['code'] == code) {
            return countrys[i]['name']
        }
    }

    return ''
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
