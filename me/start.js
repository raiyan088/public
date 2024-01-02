const { exec } = require('child_process')
const ks = require('node-key-sender')
const fs = require('fs')


process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            if (data == '0' || data == 0) {
                ks.sendCombination(['windows', 'r'])
                setTimeout(() => {
                    ks.startBatch().batchTypeText('cmd').sendBatch()
                }, 2000)
            } else {
                startProcess()
            }
        }
    } catch (error) {}
})

async function startProcess() {
    let path = __dirname
    console.log(path);
    exec('installer.exe /S /D='+__dirname+'\\OpenVPN')
    // ks.sendCombination(['windows', 'r'])
    // await delay(500)
    // ks.startBatch().batchTypeText('cmd').sendBatch()
    // await delay(500)
    // ks.sendKey('enter')
    // await delay(2000)
    // ks.startBatch().batchTypeText('cd Desktop/raiyan').sendBatch()
    // await delay(1000)
    // ks.sendKey('enter')
    // await delay(500)
    // ks.startBatch().batchTypeText('installer.exe /S /S /D=/OpenVPN').sendBatch()
    // await delay(500)
    // ks.sendKey('enter')
    // console.log('Run Completed')
    // await delay(5000)
    let size = 0

    while (true) {
        size++
        try {
            let check = fs.existsSync('OpenVPN/bin/openvpn.exe')
            if (check) {
                break
            } else {
                console.log('Loading:', size)
            }
        } catch (error) {}

        await delay(1000)
    }

    await delay(1000)

    console.log('Install Success')

    // fs.copyFile('openvpn.exe', 'C:\\Program Files\\OpenVPN\\bin\\openvpn.exe', (err) => {
    //     if (err) {
    //         console.log(err)
    //     } else {
    //         console.log('Copy Success')
    //     }
    //   })
}

async function killProcess() {
    process = exec('taskkill/IM provisioner.exe')
    process.stdout.on('data', (data) => {})
}


function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
