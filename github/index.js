const { exec } = require('child_process')

let process = null

connect()

async function connect() {
    process = exec('node create.js')

    process.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log.trim())
        }
        if(data.toString().includes('---EXIT---')) {
            connect()
        }
    })
}
