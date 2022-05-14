const { exec } = require('child_process')
const fs = require('fs')

let TeslaT4 = null

;(async () => {
    await start()
})()

async function start() {
    if(TeslaT4 != null) {
        TeslaT4.kill()
    }
    TeslaT4 = exec('node tesla-t4.js')

    TeslaT4.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            start()
        }
        console.log(data.toString().replace('\n', ''))
    })
}