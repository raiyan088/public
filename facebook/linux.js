const { exec } = require('node:child_process')
const express = require('express')
const os = require('node:os')
const fs = require('fs')


let ADB = null
let mId = null
let mDocker = false

let USER = getUserName()
let FINISH = new Date().getTime()+21000000

let STORAGE = decode('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vLw==')


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
                if(cmd == 'install') {
                    await adbShell(mId, 'rm -f /sdcard/logged_in')
                    await adbShell(mId, 'rm -f /sdcard/fb_store.xml')
                    await adbShell(mId, 'rm -f /sdcard/authentication')
                    await adbShell(mId, 'pm clear com.facebook.katana')
                    await adbShell(mId, 'pm grant com.facebook.katana android.permission.READ_CONTACTS')
                    await adbShell(mId, 'am start com.facebook.katana/com.facebook.katana.LoginActivity')
                } else if(cmd == 'getFbId') {
                    if (mDocker) {
                        await cmdExecute('docker exec -i emulator cp /data/data/com.facebook.katana/shared_prefs/acra_criticaldata_store.xml /sdcard/fb_store.xml')
                    } else {
                        await adbShell(mId, '"su -c cp /data/data/com.facebook.katana/shared_prefs/acra_criticaldata_store.xml /sdcard/fb_store.xml"')
                    }
                } else if(cmd == 'getAuth') {
                    if (mDocker) {
                        await cmdExecute('docker exec -i emulator cp /data/data/com.facebook.katana/app_light_prefs/com.facebook.katana/authentication /sdcard/authentication')
                    } else {
                        await adbShell(mId, '"su -c cp /data/data/com.facebook.katana/app_light_prefs/com.facebook.katana/authentication /sdcard/authentication"')
                    }
                } else if(cmd.startsWith('getLog_')) {
                    let id = cmd.replace('getLog_', '')
                    if (mDocker) {
                        await cmdExecute('docker exec -i emulator cp /data/data/com.facebook.katana/app_light_prefs/com.facebook.katana/logged_in_'+id+' /sdcard/logged_in')
                    } else {
                        await adbShell(mId, '"su -c cp /data/data/com.facebook.katana/app_light_prefs/com.facebook.katana/logged_in_'+id+' /sdcard/logged_in"')
                    }
                }
            }
        }
    } catch (error) {}
    
    res.end('success')
})


if (USER) {
    console.log('USER: '+USER)

    startServer()
} else {
    console.log('---NULL---')
    process.exit(0)
}


setInterval(async () => {
    await checkStatus()
}, 120000)


async function startServer() {
    console.log('Node: ---START-SERVER---')

    ADB = await getAdbPlatfrom()

    fs.writeFileSync('url.txt', 'http://'+getIPAddress()+':9099/adb')

    mDocker = await isUseDocker()

    console.log('Node: Docker: '+mDocker)

    await checkStatus()
    
    console.log('Node: Emulator Starting...')

    mId = await waitForStartEmulator(null, false, '127.0.0.1', 5555)

    if (mId) {
        console.log('Node: Device ID: '+mId)

        let connected = await waitForDeviceOnline(mId)

        if (connected) {
            console.log('Node: Connected Device: '+connected)

            await delay(3000)

            let toolsInstall = 0

            try {
                for (let i = 0; i < 15; i++) {
                    let urlPush = await adbPush(mId, 'url.txt', '/sdcard/url.txt')
                    if (urlPush) {
                        toolsInstall++
                        console.log('Node: Url Push Success')
                        break
                    } else {
                        console.log('Node: Url Push Failed')
                    }
                    await delay(5000)
                }
            } catch (error) {
                console.log('Node: Url Push Failed')
            }

            try {
                for (let i = 0; i < 15; i++) {
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
                for (let i = 0; i < 15; i++) {
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


            if (toolsInstall >= 3) {
                await startFbCreator(mId)

                try {
                    let prevTime = ''
                    let timeout = 0
                    let completed = false
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
                                        accountCreate = parseInt(status[2].trim())

                                        if (status[0].trim() == 'true' || status[0].trim() == true) {
                                            permission = true
                                        }

                                        if (status[1].trim() == 'true' || status[1].trim() == true) {
                                            completed = true
                                        }
                                    } catch (error) {}
        
                                    try {
                                        srtTime = parseInt(time)
                                    } catch (error) {}
        
                                    if (time != prevTime) {
                                        console.log('Node: [ Account: '+(accountCreate+1)+' --- Time: '+getTimeString(srtTime)+' --- '+split[2].trim()+' ]')
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

                                        await delay(2000)
                                        await startFbCreator(mId)
                                    }
                                }
                            }
                        } catch (error) {}

                        if (completed) {
                            console.log('Node: Account Create Completed')
                            await delay(1000)
                            break
                        } else if (timeout > 90) {
                            console.log('Node: Emulator did not Response')
                            await delay(1000)
                            break
                        }

                        await delay(1000)
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

    try {
        await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
            'Content-Type':'active/'+parseInt(new Date().getTime()/1000)
        })
    } catch (error) {}

    console.log('Node: ---COMPLETED---')
    process.exit(0)
}

async function startFbCreator(mId) {
    try {
        await adbShell(mId, 'rm -f /sdcard/status.txt')
        await adbShell(mId, 'appops set --uid com.rr.fb.creator MANAGE_EXTERNAL_STORAGE allow')
        await adbShell(mId, 'pm grant com.rr.fb.creator android.permission.WRITE_EXTERNAL_STORAGE')
        await adbShell(mId, 'settings put secure enabled_accessibility_services com.rr.fb.creator/com.rr.fb.creator.Accessibility')
        await delay(3000)
        await adbShell(mId, 'am start -n com.rr.fb.creator/com.rr.fb.creator.Emulator --es autoStart "ok"')
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

async function waitForStartEmulator(name, restart, host, port) {
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

async function waitForInstallEmulator(name) {
    cmdExecute('Emulator.exe --defaultImageName '+name+' --imageToLaunch '+name)

    await waitForTaskRuning('BlueStacksInstaller.exe')
    console.log('Node: Open BlueStacks Installer')
    
    await cmdExecute('python install.py')
    
    console.log('Node: BlueStacks Installing')

    await waitForDeskTopShorcut()

    console.log('Node: BlueStacks Install Success')

    await delay(1000)
    await cmdExecute('taskkill /IM "BlueStacksInstaller.exe" /T /F')
    await delay(2000)
}


async function waitForDeskTopShorcut() {
    for (let i = 0; i < 120; i++) {
        if (await isInstallEmulator()) {
            return true
        }
        await delay(2000)
    }

    return false
}

async function isInstallEmulator() {
    try {
        let list = fs.readdirSync('C:\\Users\\Public\\Desktop')
        let isInstall = false

        for (let i = 0; i < list.length; i++) {
            if (list[i] == 'BlueStacks 5.lnk') {
                isInstall = true
                break
            }
        }
        
        if (isInstall) {
            return true
        }
    } catch (error) {}

    return false
}

async function randomAdId(bluestacks) {
    let temp = bluestacks.replace('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', randomHex(4)+'-'+randomHex(2)+'-'+randomHex(2)+'-'+randomHex(2)+'-'+randomHex(6))
    return temp.replace('xxxxxxxxxxxxxxxx', randomHex(8))
}

async function waitForTaskRuning(taskName) {
    for (let i = 0; i < 120; i++) {
        try {
            let result = await cmdExecute('tasklist')
            if (result.toLowerCase().indexOf(taskName.toLowerCase()) > -1) {
                break
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

async function checkStatus() {
    if (FINISH > 0 && FINISH < new Date().getTime()) {
        try {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+parseInt(new Date().getTime()/1000)
            })
        } catch (error) {}

        console.log('---COMPLETED---')
        process.exit(0)
    } else {
        try {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+200)
            })
        } catch (error) {}
    }
}

async function postAxios(url, body, data) {
    return new Promise((resolve) => {
        try {
            fetch(url, {
                method: 'POST',
                headers: data,
                body: body
            }).then((response) => {
                resolve('ok')
            }).catch((error) => {
                resolve('ok')
            })
        } catch (error) {
            resolve('ok')
        }
    })
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


function randomHex(size) {
    let C = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']
    
    let result = ''

    for (let i = 0; i < size*2; i++) {
        result += C[Math.floor((Math.random() * C.length))]
    }

    return result
}

function getUserName() {
    try {
        let directory = __dirname.split('\\')
        if (directory.length > 1) {
            let name = directory[directory.length-1]
            if (name) {
                return name
            }
        }
    } catch (error) {}

    try {
        let directory = __dirname.split('/')
        if (directory.length > 1) {
            let name = directory[directory.length-1]
            if (name) {
                return name
            }
        }
    } catch (error) {}

    return null
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

function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
