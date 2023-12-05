var ks = require('node-key-sender')


ks.sendCombination(['windows', 'r'])
ks.startBatch().batchTypeText('cmd').sendBatch()
setTimeout(() => {
    ks.sendKey('enter')
}, 500)

setTimeout(() => {
    ks.startBatch().batchTypeText('node -v').sendBatch()
    setTimeout(() => {
        ks.sendKey('enter')
    }, 500)
}, 2500)
