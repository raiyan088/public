const { exec } = require('node:child_process')
const FormData = require('form-data')
const express = require('express')
const axios = require('axios')
const os = require('node:os')
const fs = require('fs')


let ADB = null
let mId = null
let mDocker = false

let app = express()

app.use(express.json())

app.listen(process.env.PORT || 9099, ()=>{
    console.log('Listening on port 9099')
})

app.get('/adb', async (req, res) => {
    try {
        if (req.query) {
            let cmd = req.query.cmd
            if (cmd) {
                if(cmd == 'installFacebook') {
                    await adbShell(mId, 'rm -f /sdcard/Cookies')
                    await adbShell(mId, 'rm -f /sdcard/fb_id.xml')
                    await adbShell(mId, 'pm clear com.facebook.lite')
                    await adbShell(mId, 'pm clear com.facebook.katana')
                    await adbShell(mId, 'pm grant com.facebook.lite android.permission.READ_CONTACTS')
                    await adbShell(mId, 'pm grant com.facebook.katana android.permission.READ_CONTACTS')
                    await adbShell(mId, 'am start com.facebook.katana/com.facebook.katana.LoginActivity')
                } else if(cmd == 'installFbLite') {
                    await adbShell(mId, 'pm clear com.facebook.lite')
                    await adbShell(mId, 'pm clear com.facebook.katana')
                    await adbShell(mId, 'pm grant com.facebook.lite android.permission.READ_CONTACTS')
                    await adbShell(mId, 'pm grant com.facebook.katana android.permission.READ_CONTACTS')
                    await adbShell(mId, 'am start com.facebook.lite/com.facebook.lite.MainActivity')
                } else if(cmd == 'launchFacebook') {
                    await adbShell(mId, 'am force-stop com.facebook.katana')
                    await adbShell(mId, 'am start com.facebook.katana/com.facebook.katana.LoginActivity')
                } else if(cmd == 'launchFbLite') {
                    await adbShell(mId, 'am force-stop com.facebook.lite')
                    await adbShell(mId, 'am start com.facebook.lite/com.facebook.lite.MainActivity')
                } else if(cmd == 'cookiesSetting') {
                    if (mDocker) {
                        await cmdExecute('docker exec -i emulator am start -n com.facebook.katana/com.facebook.katana.immersiveactivity.ImmersiveActivity --es mobile_page "https://m.facebook.com/privacy/policies/cookies/"')
                    } else {
                        await adbShell(mId, '"su -c am start -n com.facebook.katana/com.facebook.katana.immersiveactivity.ImmersiveActivity --es mobile_page \"https://m.facebook.com/privacy/policies/cookies/\""')
                    }
                } else if(cmd == 'getFbId') {
                    if (mDocker) {
                        await cmdExecute('docker exec -i emulator cp /data/data/com.facebook.katana/shared_prefs/acra_criticaldata_store.xml /sdcard/fb_id.xml')
                    } else {
                        await adbShell(mId, '"su -c cp /data/data/com.facebook.katana/shared_prefs/acra_criticaldata_store.xml /sdcard/fb_id.xml"')
                    }
                } else if(cmd == 'getCookies') {
                    if (mDocker) {
                        let embedded = await adbShell('docker exec -i emulator ls -l /data/data/com.facebook.katana/app_webview_embedded/Default/Cookies')
                        if (embedded) {
                            await cmdExecute('docker exec -i emulator cp /data/data/com.facebook.katana/app_webview_embedded/Default/Cookies /sdcard/Cookies')
                        } else {
                            await cmdExecute('docker exec -i emulator cp /data/data/com.facebook.katana/app_webview/Default/Cookies /sdcard/Cookies')
                        }
                    } else {
                        let embedded = await adbShell('"su -c ls -l /data/data/com.facebook.katana/app_webview_embedded/Default/Cookies"')
                        if (embedded) {
                            await adbShell(mId, '"su -c cp /data/data/com.facebook.katana/app_webview_embedded/Default/Cookies /sdcard/Cookies"')
                        } else {
                            await adbShell(mId, '"su -c cp /data/data/com.facebook.katana/app_webview/Default/Cookies /sdcard/Cookies"')
                        }
                    }
                } else if(cmd = 'clearActivity') {
                    await adbShell(mId, 'am force-stop com.facebook.lite')
                    await adbShell(mId, 'am force-stop com.facebook.katana')
                }
            }
        }
    } catch (error) {}
    
    res.end('success')
})

startServer()

async function startServer() {
    console.log('Node: ---START-SERVER---')

    ADB = await getAdbPlatfrom()

    fs.writeFileSync('url.txt', 'http://'+getIPAddress()+':9099/adb')

    mDocker = await isUseDocker()

    console.log('Node: Docker: '+mDocker)

    mId = await waitForStartEmulator('127.0.0.1', 5555)

    if (mId) {
        console.log('Node: Device ID: '+mId)

        let connected = await waitForDeviceOnline(mId)

        if (connected) {
            console.log('Node: Connected Device: '+connected)

            await delay(3000)

            let toolsInstall = 0

            try {
                for (let i = 0; i < 10; i++) {
                    let install = await adbAppInstall(mId, 'FbCreator.apk')
                    if (install) {
                        toolsInstall++
                        console.log('Node: Fb-Creator Install Success')
                        break
                    } else {
                        console.log('Node: Fb-Creator Install Failed')
                    }
                    await delay(5000)
                }
            } catch (error) {
                console.log('Node: Fb-Creator Install Failed')
            }

            try {
                for (let i = 0; i < 10; i++) {
                    let install = await adbAppInstall(mId, 'Facebook.apk')
                    if (install) {
                        toolsInstall++
                        console.log('Node: Facebook Install Success')
                        break
                    } else {
                        console.log('Node: Facebook Install Failed')
                    }
                    await delay(5000)
                }
            } catch (error) {
                console.log('Node: Facebook Install Failed')
            }

            try {
                for (let i = 0; i < 10; i++) {
                    let install = await adbAppInstall(mId, 'Lite.apk')
                    if (install) {
                        toolsInstall++
                        console.log('Node: Fb-Lite Install Success')
                        break
                    } else {
                        console.log('Node: Fb-Lite Install Failed')
                    }
                    await delay(5000)
                }
            } catch (error) {
                console.log('Node: Fb-Creator Install Failed')
            }


            if (toolsInstall >= 3) {
                await adbPush(mId, 'url.txt', '/sdcard/url.txt')
                await accountPermissionDisable()
                await startFbCreator(mId)
                await captureImg(mId)

                try {
                    let prevTime = ''
                    let imgCap = 0
                    let timeout = 0
                    let accountCreate = 0
        
                    while (true) {
                        try {
                            let result = await adbShell(mId, 'cat /sdcard/status.txt')
                            
                            if (result) {
                                let split = result.split('\n')
    
                                if (split.length >= 3) {
                                    let time = split[0].trim()
                                    let srtTime = null
                                    let permission = false
        
                                    try {
                                        let status = split[1].trim().split(' ')
                                        accountCreate = parseInt(status[1].trim())
    
                                        if (status[0].trim() == 'true' || status[0].trim() == true) {
                                            permission = true
                                        }
                                    } catch (error) {}
        
                                    try {
                                        srtTime = parseInt(time)
                                    } catch (error) {}
        
                                    if (time != prevTime) {
                                        console.log('Node: [ Account: '+accountCreate+' --- Time: '+getTimeString(srtTime)+' --- '+split[2].trim()+' ]')
                                        timeout = 0
                                        prevTime = time
                                    } else {
                                        timeout++
                                    }
    
                                    if (!permission) {
                                        console.log('Node: [ Accessibility Permission Problem ]')
                                        try {
                                            for (let i = 0; i < 10; i++) {
                                                let install = await adbAppInstall(mId, 'FbCreator.apk')
                                                if (install) {
                                                    console.log('Node: [ Fb-Creator Install Success ]')
                                                    break
                                                } else {
                                                    console.log('Node: [ Fb-Creator Install Failed ]')
                                                }
                                                await delay(5000)
                                            }
                                        } catch (error) {
                                            console.log('Node: [ Fb-Creator Install Failed ]')
                                        }
    
                                        await delay(3000)
                                        await startFbCreator(mId)
                                    }
                                }
                            }
                        } catch (error) {
                            console.log('Error: '+error)
                        }
    
                        if (accountCreate > 3) {
                            console.log('Node: 3 Account Create Completed')
                            await delay(1000)
                            break
                        } else if (timeout > 120) {
                            console.log('Node: Emulator did not Response')
                            await delay(1000)
                            break
                        }
    
                        await delay(1000)

                        if (imgCap == 10) {
                            imgCap = 0
                            await captureImg(mId)
                        } else {
                            imgCap++
                        }
                    }
                } catch (error) {}
            } else {
                console.log('Node: All Tools Cannot Installed')
                await delay(10000)   
            }
        } else {
            console.log("Node: Device Can't Connected")
            await delay(10000)
        }
    } else {
        console.log('Node: Device ID: Null')
        await delay(10000)
    }

    console.log('Node: ---COMPLETED---')

    process.exit(0)
}

async function startFbCreator(mId) {
    try {
        await adbShell(mId, 'rm -f /sdcard/status.txt')
        await adbShell(mId, 'appops set --uid com.rr.fb.creator MANAGE_EXTERNAL_STORAGE allow')
        await adbShell(mId, 'pm grant com.rr.fb.creator android.permission.WRITE_EXTERNAL_STORAGE')
        await adbShell(mId, 'pm grant com.facebook.lite android.permission.READ_CONTACTS')
        await adbShell(mId, 'pm grant com.facebook.katana android.permission.READ_CONTACTS')
        await adbShell(mId, 'settings put secure enabled_accessibility_services com.rr.fb.creator/com.rr.fb.creator.Accessibility')
        await delay(3000)
        await adbShell(mId, 'am start -n com.rr.fb.creator/com.rr.fb.creator.Emulator')
    } catch (error) {}
}

async function accountPermissionDisable() {
    if (mDocker) {
        await cmdExecute('docker exec -i emulator chmod 0 /data/system_ce/0/accounts_ce.db')
        await cmdExecute('docker exec -i emulator chmod 0 /data/system_ce/0/accounts_de.db')
    } else {
        await adbShell(mId, '"su -c chmod 0 /data/system_ce/0/accounts_ce.db"')
        await adbShell(mId, '"su -c chmod 0 /data/system_ce/0/accounts_de.db"')
    }
}

async function captureImg(mId) {
    try {
        await adbShell(mId, 'screencap -p /sdcard/capture.jpg')
        await adbPull(mId, '/sdcard/capture.jpg')
        
        if(fs.existsSync('capture.jpg')) {
            try {
                let file = new FormData()
                file.append('file', fs.createReadStream('capture.jpg'))

                await axios.post('https://firebasestorage.clients6.google.com/v0/b/job-server-088.appspot.com/o?name=photo%2Femulator%2Fcapture.jpg', file, {
                    headers: {
                        'Content-Type': 'image/jpeg'
                    }
                })
            } catch (error) {}
        } else {}
    } catch (error) {}
}

async function waitForDeviceOnline(d_id) {
    for (let i = 0; i < 60; i++) {
        try {
            let result = await cmdExecute(ADB+'devices')
            let deviceOnline = false
            result.split('\n').forEach(function(line) {
                try {
                    if (!line.startsWith('List of devices attached')) {
                        let split = line.split('\t')
                        if (split.length >= 2) {
                            if (split[0].trim() == d_id && split[1].trim() == 'device') {
                                deviceOnline = true
                            }
                        }
                    }
                } catch (error) {}
            })

            if (deviceOnline) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    for (let i = 0; i < 60; i++) {
        try {
            let result = await adbShell(d_id, 'getprop ro.product.cpu.abi')
            if (result) {
                return result
            }
        } catch (error) {}

        await delay(1000)
    }

    return null
}

async function waitForStartEmulator(host, port) {
    for (let i = 0; i < 60; i++) {
        try {
            let result = await cmdExecute(ADB+'connect '+host+':'+port)
            if (result && (result.indexOf('connected to '+host+':'+port) > -1)) {
                return host+':'+port
            }
        } catch (error) {}

        await delay(1000)
    }
}

async function cmdExecute(cmd) {
    return new Promise((resolve) => {
        try {
            exec(cmd, function (err, stdout, stderr) {
                try {
                    if (err) {
                        resolve(null)
                    } else {
                        resolve(stdout.trim())
                    }
                } catch (error) {
                    resolve(null)
                }
            })
        } catch (error) {
            resolve(null)
        }
    })
}

async function adbShell(d_id, cmd) {
    try {
        return await cmdExecute(ADB+'-s '+d_id+' shell '+cmd)
    } catch (error) {}

    return null
}

async function adbAppInstall(d_id, file) {
    try {
        let result = await cmdExecute(ADB+'-s '+d_id+' install '+file)
        if (result && result.includes('Install') && result.includes('Success')) {
            return true
        }
    } catch (error) {}

    return false
}

async function adbPull(d_id, path) {
    try {
        return await cmdExecute(ADB+'-s '+d_id+' pull '+path)
    } catch (error) {}

    return null
}

async function adbPush(d_id, file, target) {
    try {
        let result = await cmdExecute(ADB+'-s '+d_id+' push '+file+' '+target)
        if (result && result.includes('file pushed')) {
            return true
        }
    } catch (error) {}

    return false
}

async function isUseDocker() {
    try {
        let result = await cmdExecute('docker --version')
        if (result) {
            return true
        }
    } catch (error) {}

    return false
}

async function getAdbPlatfrom() {
    if (fs.existsSync('adb.exe')) {
        return 'adb.exe '
    } else {
        return './adb '
    }
}

function getIPAddress() {
    let interfaces = os.networkInterfaces()
    for (let devName in interfaces) {
        let iface = interfaces[devName]
    
        for (let i = 0; i < iface.length; i++) {
            let alias = iface[i]
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
                return alias.address
        }
    }
    return '0.0.0.0'
}

function getTimeString(time) {
    if (time) {
        return new Date(time).toLocaleTimeString('en-us', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')
    }
    return new Date().toLocaleTimeString('en-us', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
