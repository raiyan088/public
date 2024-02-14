const { exec } = require('child_process')

startServer()

async function startServer() {
    while (true) {
        let success = await nodeCMD()
        if (success) {
            break
        }
    }
}

function nodeCMD() {
    return new Promise(function(resolve) {
        let process = exec('node create.js')

        process.stdout.on('data', (data) => {
            let log = data.toString().trimStart().trimEnd()
            if (log.length > 0) {
                console.log(log.trim())
            }
            if(data.toString().includes('---EXIT---')) {
                resolve(false)
            } else if(data.toString().includes('---SUCCESS---')) {
                resolve(true)
            }
        })

        process.stderr.on('data', (data) => {
            resolve(false)
        })
    })
}