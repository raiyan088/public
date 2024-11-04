const { exec } = require('node:child_process')
const fs = require('fs')

let ENGINE = 'C:\\ProgramData\\BlueStacks_nxt\\'
let NAME = 'Rvc64'

let USER = getUserName()
let FINISH = new Date().getTime()+21000000


startServer()

setInterval(async () => {
    await checkStatus()
}, 120000)

async function startServer() {
    console.log('Node: Server Start')

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
    let mId = await waitForStartEmulator(name)

    console.log('Node: Device ID: '+mId)
    
    let connected = await waitForDeviceOnline(mId)

    if (connected) {
        console.log('Node: Device Connected')

        let toolsInstall = 0

        try {
            for (let i = 0; i < 10; i++) {
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
                let install = await adbFilePush(mId, 'Facebook.apk', '/sdcard/facebook.apk')
                if (install) {
                    toolsInstall++
                    console.log('Node: Facbook Push Success')
                    break
                } else {
                    console.log('Node: Facbook Push Failed')
                }
                await delay(5000)
            }
        } catch (error) {
            console.log('Node: Facbook Push Failed')
        }

        try {
            for (let i = 0; i < 10; i++) {
                let install = await adbFilePush(mId, 'Lite.apk', '/sdcard/lite.apk')
                if (install) {
                    toolsInstall++
                    console.log('Node: Fb-Lite Push Success')
                    break
                } else {
                    console.log('Node: Fb-Lite Push Failed')
                }
                await delay(5000)
            }
        } catch (error) {
            console.log('Node: Fb-Lite Push Failed')
        }

        try {
            for (let i = 0; i < 10; i++) {
                let install = await adbAppInstall(mId, 'Fb_Creator.apk')
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

        if (toolsInstall >=  4) {
            try {
                await adbShell(mId, 'appops set --uid com.carlos.multiapp MANAGE_EXTERNAL_STORAGE allow')
                await adbShell(mId, 'pm grant com.carlos.multiapp android.permission.WRITE_EXTERNAL_STORAGE')
                await adbShell(mId, 'settings put secure enabled_accessibility_services com.carlos.multiapp/com.rr.fb.creator.Accessibility')
                await adbShell(mId, 'am start -n com.carlos.multiapp/com.rr.fb.creator.MainActivity')
                await adbShell(mId, 'rm -f /sdcard/status.txt')
            } catch (error) {}
    
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
    
                                try {
                                    accountCreate = parseInt(split[1].trim())
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
                            }
                        }
                    } catch (error) {}

                    if (accountCreate > 10) {
                        console.log('Node: 10 Account Create Completed')
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
            await delay(60000)
        }
    } else {
        console.log('Node: Device Not-Connect')
        await delay(60000)
    }

    console.log('Node: Emulator Start Again')
    
    await startEmulator(name)
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

async function waitForStartEmulator(name) {
    await cmdExecute('taskkill /IM "HD-Player.exe" /T /F')
    await delay(1000)

    try {
        let dixFile = '"'+ENGINE+'Engine\\'+name+'\\Data.vhdx"'
        let orgDixFile = '"'+ENGINE+'Engine\\'+name+'\\Data_orig.vhdx"'
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
    cmdExecute('"C:\\Program Files\\BlueStacks_nxt\\HD-Player.exe" --instance '+name+' --cmd launchApp --package "com.carlos.multiapp.ext"')
    
    for (let i = 0; i < 60; i++) {
        try {
            let result = await cmdExecute('adb.exe connect 127.0.0.1:5555')
            if (result.indexOf('already connected') > -1) {
                return '127.0.0.1:5555'
            }
        } catch (error) {}

        await delay(1000)
    }
}

async function waitForDeviceOnline(d_id) {
    for (let i = 0; i < 60; i++) {
        try {
            let result = await cmdExecute('adb.exe devices')
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
                return true
            }
        } catch (error) {}

        await delay(1000)
    }

    return false
}

async function adbIsInstalled(d_id, pkg) {
    try {
        let result = await cmdExecute('adb.exe -s '+d_id+' shell pm path '+pkg)
        if (result && result.startsWith('package:')) {
            return true
        }
    } catch (error) {}

    return false
}

async function adbAppInstall(d_id, file) {
    try {
        let result = await cmdExecute('adb.exe -s '+d_id+' install '+file)
        if (result && result.includes('Install') && result.includes('Success')) {
            return true
        }
    } catch (error) {}

    return false
}

async function adbFilePush(d_id, file, target) {
    try {
        let result = await cmdExecute('adb.exe -s '+d_id+' push '+file+' '+target)

        if (result && result.includes('file pushed')) {
            return true
        }
    } catch (error) {}

    return false
}

async function adbShell(d_id, cmd) {
    try {
        return await cmdExecute('adb.exe -s '+d_id+' shell '+cmd)
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
