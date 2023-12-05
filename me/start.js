var ks = require('node-key-sender')


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
    ks.startBatch().batchTypeText('node -v').sendBatch()
    await delay(500)
    ks.sendKey('enter')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
