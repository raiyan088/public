const { exec } = require('child_process')
const ks = require('node-key-sender')


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
    ks.sendCombination(['windows', 'r'])
    await delay(500)
    ks.startBatch().batchTypeText('cmd').sendBatch()
    await delay(500)
    ks.sendKey('enter')
    await delay(2000)
    ks.startBatch().batchTypeText('cd Desktop/raiyan').sendBatch()
    await delay(1000)
    ks.sendKey('enter')
    await delay(500)
    ks.startBatch().batchTypeText('node create').sendBatch()
    await delay(500)
    ks.sendKey('enter')
    console.log('Run Completed')
    await delay(3000)
    try {
        await killProcess()
    } catch (error) {}
    console.log('Kill Process')
    await delay(60000)
    console.log('Success')
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
