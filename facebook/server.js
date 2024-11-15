const { exec } = require('node:child_process')
const fs = require('fs')

let ENGINE = 'C:\\ProgramData\\BlueStacks_nxt\\'
let NAME = 'Rvc64'

let ADB = null
let USER = getUserName()
let FINISH = new Date().getTime()+21000000

startServer()


setInterval(async () => {
    await checkStatus()
}, 120000)

async function startServer() {
    console.log('Node: ---START-SERVER---')

    ADB = await getAdbPlatfrom()

    if (fs.existsSync('localserver')) {
        ENGINE = 'P:\\Program Files\\BlueStacks_nxt\\'
        NAME = 'Rvc64_1'
    }

    await checkStatus()

    if (!await isInstallEmulator()) {
        await waitForInstallEmulator()
    }
    
    console.log('Node: Emulator Starting...')
    
    await startEmulator(NAME)
}

async function startEmulator(name) {
    let mId = await waitForStartEmulator(name, false, '127.0.0.1', 5555)

    console.log('Node: Device ID: '+mId)
    
    let connected = await waitForDeviceOnline(mId)

    if (connected) {
        console.log('Node: Connected Device: '+connected)

        let toolsInstall = 0

        try {
            for (let i = 0; i < 15; i++) {
                let install = await adbAppInstall(mId, 'CarlosPlus.apk')
                if (install) {
                    toolsInstall++
                    console.log('Node: Fb-Creator 32-bit Install Success')
                    break
                } else {
                    console.log('Node: Fb-Creator 32-bit Install Failed')
                }
                await delay(5000)
            }
        } catch (error) {
            console.log('Node: Fb-Creator 32-bit Install Failed')
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
            console.log('Node: Fb-Lite Install Failed')
        }

        try {
            for (let i = 0; i < 10; i++) {
                let install = await adbAppInstall(mId, 'FbVirtual.apk')
                if (install) {
                    toolsInstall++
                    console.log('Node: Fb-Virtual Install Success')
                    break
                } else {
                    console.log('Node: Fb-Virtual Install Failed')
                }
                await delay(5000)
            }
        } catch (error) {
            console.log('Node: Fb-Virtual Install Failed')
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
            console.log('Node: Fb-Lite Install Failed')
        }

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

        if (toolsInstall >=  5) {
            await delay(2000)
            await startFbCreator(mId)
    
            try {
                let prevTime = ''
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

                                    await delay(2000)
                                    await startFbCreator(mId)
                                }
                            }
                        }
                    } catch (error) {}

                    if (accountCreate >= 5) {
                        console.log('Node: 5 Account Create Completed')
                        await delay(1000)
                        break
                    } else if (timeout > 120) {
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
        console.log('Node: Device Not-Connect')
        await delay(10000)
    }

    process.exit(0)
    console.log('Node: Emulator Start Again')
    
    await startEmulator(name)
}

async function startFbCreator(mId) {
    try {
        await adbShell(mId, 'rm -f /sdcard/status.txt')
        await adbShell(mId, 'appops set --uid com.rr.fb.creator MANAGE_EXTERNAL_STORAGE allow')
        await adbShell(mId, 'pm grant com.rr.fb.creator android.permission.WRITE_EXTERNAL_STORAGE')
        await adbShell(mId, 'settings put secure enabled_accessibility_services com.rr.fb.creator/com.rr.fb.creator.Accessibility')
        await delay(3000)
        await adbShell(mId, 'am start -n com.rr.fb.creator/com.rr.fb.creator.MainActivity --es autoStart "ok"')
    } catch (error) {}
}

async function waitForInstallEmulator() {
    cmdExecute('Emulator.exe --defaultImageName Rvc64 --imageToLaunch Rvc64')

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

async function waitForStartEmulator(name, restart, host, port) {
    if (restart) {
        await cmdExecute('taskkill /IM "HD-Player.exe" /T /F')
        await delay(1000)
    
        try {
            let dixFile = '"'+ENGINE+'Engine\\'+name+'\\Data.vhdx"'
            let bluestacks = fs.readFileSync('config.conf', 'utf-8')
            let replaceAdId = await randomAdId(bluestacks)
            fs.writeFileSync('bluestacks.conf', replaceAdId)
            await cmdExecute('attrib -r "'+ENGINE+'bluestacks.conf"')
            await cmdExecute('copy bluestacks.conf  "'+ENGINE+'bluestacks.conf"')
            await cmdExecute('attrib +r "'+ENGINE+'bluestacks.conf"')
            await cmdExecute('rm -f '+dixFile)
            await cmdExecute('copy Data.vhdx '+dixFile)
        } catch (error) {}
    
        await delay(2000)
        cmdExecute('"C:\\Program Files\\BlueStacks_nxt\\HD-Player.exe" --instance '+name+' --cmd launchApp --package "com.rr.fb.tools"')        
    }
    
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

async function adbIsInstalled(d_id, pkg) {
    try {
        let result = await cmdExecute(ADB+'-s '+d_id+' shell pm path '+pkg)
        if (result && result.startsWith('package:')) {
            return true
        }
    } catch (error) {}

    return false
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

async function adbFilePush(d_id, file, target) {
    try {
        let result = await cmdExecute(ADB+'-s '+d_id+' push '+file+' '+target)

        if (result && result.includes('file pushed')) {
            return true
        }
    } catch (error) {}

    return false
}

async function adbShell(d_id, cmd) {
    try {
        return await cmdExecute(ADB+'-s '+d_id+' shell '+cmd)
    } catch (error) {}

    return null
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

async function checkStatus() {
    if (FINISH > 0 && FINISH < new Date().getTime()) {
        try {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+15)
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

async function getAdbPlatfrom() {
    if (fs.existsSync('adb.exe')) {
        return 'adb.exe '
    } else {
        return './adb '
    }
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

function randomHex(size) {
    let C = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']
    
    let result = ''

    for (let i = 0; i < size*2; i++) {
        result += C[Math.floor((Math.random() * C.length))]
    }

    return result
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
