const { exec } = require('node:child_process')


startServer()

async function startServer() {
    console.log('Node: ---START-SERVER---')

    console.log('Node: Emulator Starting...')

    cmdExecute('Emulator.exe')

    await waitForTaskRuning('nemu-downloader.exe', 30)
    console.log('Node: Open MuMu Emulator Installer')
    
    await cmdExecute('python install.py')
    
    console.log('Node: MuMu Emulator Installing')

    process.exit(0)
}

async function waitForTaskRuning(taskName, timeout) {
    for (let i = 0; i < timeout; i++) {
        try {
            let result = await cmdExecute('tasklist')
            if (result.toLowerCase().indexOf(taskName.toLowerCase()) > -1) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }
}

async function cmdExecute(cmd) {
    return new Promise((resolve) => {
        try {
            exec(cmd, function (err, stdout, stderr) {
                try {
                    if (err) {
                        resolve(null)
                    } else {
                        resolve(stdout.trim())
                    }
                } catch (error) {
                    resolve(null)
                }
            })
        } catch (error) {
            resolve(null)
        }
    })
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
