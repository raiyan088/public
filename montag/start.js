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

const START = new Date().getTime()
let FINISH = START + 20400000
let QUOTA = false

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
        await checkUpTime()
        
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
                await delay(5000)
                console.log('Stop VPN Service')
                await checkFinish()
                await startProcess(false, false)
            }
        } else {
            console.log('VPN File Not Found')
            await delay(5000)
            await checkFinish()
            await startProcess(false, false)
        }
    }
}

async function startEarn(IP) {
    IP = await getIpAdress()

    console.log('IP: '+IP)

    await checkFinish()

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

    await checkFinish()

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

        await checkFinish()
        await delay(1000)
    }

    console.log('Completed')
    exec('taskkill/IM openvpn-gui.exe')
    exec('taskkill/IM openvpn.exe /F')
    await delay(500)
    exec('taskkill/IM openvpn-gui.exe')
    exec('taskkill/IM openvpn.exe /F')
    await delay(5000)
    await checkFinish()
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
                        FINISH = START+hasAction*60*1000
                    }

                    await patchAxios(BASE_URL+'github/action/'+name+'.json', JSON.stringify({ quota:quotaTime }), {
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
                        }
                    }
                } catch (error) {}

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
