const { WebSocket } = require('ws')
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
        let result = data.toString().trim()
        if (mClient) {
            mClient.send(encrypt(result))
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
})


connectServer()

function connectServer() {
    const wss = new WebSocket('wss://raiyan-rx-8080.onrender.com/')
    
    wss.on('error', () => {
        mClient = null
        mJob = null
        setInterval(connectServer, 2000)
    })
  
    wss.on('close', () => {
        mClient = null
        mJob = null
        setInterval(connectServer, 2000)
    })
  
    wss.on('open', () => {
        mClient = wss
        mJob = null
    })
  
    wss.on('message', (data) => {
        try {
            let result = decrypt(data.toString())
            if (mJob == null) {
                mJob = result
            }
            console.log('Job Receive...')
            if (mUser) {
                mUser.write(result+'\r\n')
            }
        } catch (error) {}
    })
}

function encrypt(text) {
    return Buffer.from(text).toString('base64')
}

function decrypt(text) {
    return Buffer.from(text, 'base64').toString('ascii')
}
