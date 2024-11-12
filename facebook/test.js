const { exec } = require('node:child_process')
const FormData = require('form-data')
const axios = require('axios')
const fs = require('fs')


let ADB = null

startServer()

async function startServer() {
    console.log('Node: ---START-SERVER---')

    ADB = await getAdbPlatfrom()

    let mId = await waitForStartEmulator('127.0.0.1', 5555)

    if (mId) {
        console.log('Node: Device ID: '+mId)

        let connected = await waitForDeviceOnline(mId)

        if (connected) {
            console.log('Node: Connected Device: '+connected)

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
                await delay(3000)
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
                        } catch (error) {}
    
                        if (accountCreate > 5) {
                            console.log('Node: 5 Account Create Completed')
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
            console.log('Node: Device Not-Connect')
            await delay(10000)
        }
    } else {
        console.log('Node: Device ID: Null')
        await delay(10000)
    }

    process.exit(0)
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

async function getAdbPlatfrom() {
    if (fs.existsSync('adb.exe')) {
        return 'adb.exe '
    } else {
        return './adb '
    }
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
