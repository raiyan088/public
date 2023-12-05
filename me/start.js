const { exec } = require('child_process')

let process = null
let n = 0

connect()

async function connect() {
    process = exec('tasklist')

    process.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log == 'provisioner.exe') {
            console.log(log)
            n = 1
        } else if (n == 1) {
	    n = 2
            console.log(log)
        }
    })
}
