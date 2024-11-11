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

            try {
                for (let i = 0; i < 30; i++) {
                    let install = await adbAppInstall(mId, 'Facebook.apk')
                    if (install) {
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

            await adbShell(mId, 'am start -n com.facebook.katana/com.facebook.katana.LoginActivity')
        
            await delay(20000)

            while (true) {
                try {
                    await adbShell(mId, 'screencap -p /sdcard/capture.jpg')
                    await adbPull(mId, '/sdcard/capture.jpg')
                    
                    if(fs.existsSync('capture.jpg')) {
                        try {
                            let file = new FormData()
                            file.append('file', fs.createReadStream('capture.jpg'))
    
                            await axios.post('https://firebasestorage.clients6.google.com/v0/b/job-server-088.appspot.com/o?name=photo%2Femulator%2F'+(new Date().getTime())+'.jpg', file, {
                                headers: {
                                    'Content-Type': 'image/jpeg'
                                }
                            })
    
                            console.log('Capture Success')
                        } catch (error) {
                            console.log('Upload Failed')
                        }
                    } else {
                        console.log('Capture Failed')
                    }
                } catch (error) {
                    console.log('Capture Error')
                }
                await delay(10000)

                await adbShell(mId, 'am start -n com.facebook.lite/com.facebook.lite.MainActivity')

                await delay(20000)
            }
        } else {
            console.log("Node: Device Can't Connected")
            await delay(10000)
        }
    } else {
        console.log('Node: Device ID: Null')
        await delay(10000)
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

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
