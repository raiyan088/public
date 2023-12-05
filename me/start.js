var ks = require('node-key-sender')


ks.sendCombination(['windows', 'r'])
ks.batchTypeText('cmd')
setTimeout(() => {
    ks.sendKey('enter')
}, 500)

setTimeout(() => {
    ks.startBatch().batchTypeText('node -v').sendBatch()
    setTimeout(() => {
        ks.sendKey('enter')
    }, 500)
}, 2500)