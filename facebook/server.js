const { exec } = require('node:child_process')

startServer()

async function startServer() {
    console.log('Node: Server Start')

    await waitForInstallEmulator()
    
    console.log('Node: Emulator Install Success')
    
    // await startEmulator()
}

async function startEmulator() {
    let mId = await waitForStartEmulator()

    console.log('Node: Device ID: '+mId)
    
    let connected = await waitForDeviceOnline(mId)

    if (connected) {
        console.log('Node: Device Connected')

        try {
            if (!await client.isInstalled(mId, 'com.facebook.katana')) {
                let install = await client.install(mId, 'Facebook.apk')
                if (install) {
                    console.log('Node: Facbook Install Success')
                } else {
                    console.log('Node: Facbook Install Failed')
                }
            } else {
                console.log('Node: Facbook Already Installed')
            }
        } catch (error) {}

        try {
            if (!await client.isInstalled(mId, 'com.facebook.lite')) {
                let install = await client.install(mId, 'Lite.apk')
                if (install) {
                    console.log('Node: Fb-Lite Install Success')
                } else {
                    console.log('Node: Fb-Lite Install Failed')
                }
            } else {
                console.log('Node: Fb-Lite Already Installed')
            }
        } catch (error) {}

        try {
            if (!await client.isInstalled(mId, 'com.carlos.multiapp')) {
                let install = await client.install(mId, 'Fb_Creator.apk')
                if (install) {
                    console.log('Node: Fb-Creator Install Success')
                } else {
                    console.log('Node: Fb-Creator Install Failed')
                }
            } else {
                console.log('Node: Fb-Creator Already Installed')
            }
        } catch (error) {}

        try {
            if (!await client.isInstalled(mId, 'com.carlos.multiapp.ext')) {
                let install = await client.install(mId, 'CarlosPlus.apk')
                if (install) {
                    console.log('Node: Fb-Creator 32-bit Install Success')
                } else {
                    console.log('Node: Fb-Creator 32-bit Install Failed')
                }
            } else {
                console.log('Node: Fb-Creator 32-bit Already Installed')
            }
        } catch (error) {}

        try {
            await client.shell(mId, 'appops set --uid com.carlos.multiapp MANAGE_EXTERNAL_STORAGE allow')
            await client.shell(mId, 'pm grant com.carlos.multiapp android.permission.WRITE_EXTERNAL_STORAGE')
            await client.shell(mId, 'settings put secure enabled_accessibility_services com.carlos.multiapp/com.rr.fb.creator.Accessibility')
            await client.shell(mId, 'am start -n com.carlos.multiapp/com.rr.fb.creator.MainActivity')
        } catch (error) {}

        try {
            while (true) {
                try {
                    let result = await readShellResult(await client.shell(mId, 'cat /sdcard/status.txt'))
                    console.log(result.split('\n'))
                } catch (error) {}

                await delay(1000)
            }
        } catch (error) {}
    } else {
        console.log('Node: Device Not-Connect')
    }
}

async function waitForInstallEmulator() {
    cmdExecute('Emulator.exe --defaultImageName Rvc64 --imageToLaunch Rvc64')

    await waitForTaskRuning('BlueStacksInstaller.exe')
    console.log('Node: Open BlueStacks Installer')
    
    await cmdExecute('python install.py')
    
    console.log('Node: BlueStacks Installing')
}

async function waitForStartEmulator() {
    cmdExecute('"C:\\Program Files\\BlueStacks_nxt\\HD-Player.exe" --instance Rvc64')
    
    for (let i = 0; i < 60; i++) {
        try {
            return await client.connect('127.0.0.1', 5555)
        } catch (error) {}

        await delay(1000)
    }
}

async function waitForDeviceOnline(d_id) {
    for (let i = 0; i < 60; i++) {
        try {
            let list = await client.listDevices()
            let deviceOnline = false

            for (let j = 0; j < list.length; j++) {
                if (list[j].id == d_id && list[j]['type'] == 'device') {
                    deviceOnline = true
                    break
                }
            }

            if (deviceOnline) {
                return true
            }
        } catch (error) {}

        await delay(1000)
    }

    return false
}

async function readShellResult(transfer) {
    return new Promise(function(resolve) {
        transfer.on('end', () => {
            fs.readFile('result.txt', 'utf8', (err, data) => {
                if (err) {
                    resolve(null)
                } else {
                    resolve(data)
                }
            })
        })
        transfer.on('error', () => {
            resolve(null)
        })
        transfer.pipe(fs.createWriteStream('result.txt'))
    })
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

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
