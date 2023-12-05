var ks = require('node-key-sender')


ks.sendCombination(['windows', 'r'])
setTimeout(() => {
    ks.startBatch().batchTypeText('cmd').sendBatch()
}, 1000)
setTimeout(() => {
    ks.sendKey('enter')
}, 1500)

setTimeout(() => {
    ks.startBatch().batchTypeText('node -v').sendBatch()
    setTimeout(() => {
        ks.sendKey('enter')
    }, 500)
}, 3500)
