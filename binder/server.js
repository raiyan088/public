const { Worker, MessageChannel, isMainThread, setEnvironmentData, getEnvironmentData } = require('worker_threads')
const WebSocketClient = require('websocket').client
const { port1 } = new MessageChannel()

let client = new WebSocketClient()

let WSS = 'wss://proxy-server-088.onrender.com/'

let connection = null
let mThread = 2

let mJob = null
let totalHashRate = 0
let prevHashRate = 0

let workers = []

console.log('Thread Size: '+mThread)


const addWorker = async () => {
    return new Promise((resolve, reject) => {
        const worker = new Worker("./worker.js", {})
        worker.on('message', onMessage)
        worker.postMessage({ status:'user', id: workers.length })
        workers.push({ worker: worker, active: false })
    })
}

const onMessage = function(message) {
    if(message['status'] == 'solved') {
        totalHashRate++
        workers[message['id']]['active'] = false
        console.log(JSON.parse(message['job']))
        if(connection != null) {
            connection.send(message['job'])
            workers[message['id']]['worker'].postMessage({ status: 'job', job: mJob})
        }
    } else if(message['status'] == 'nothing') {
        totalHashRate++
        workers[message['id']]['worker'].postMessage({ status: 'job', job: mJob})
    }
}

for (let i=0; i<mThread; i++) {
    addWorker().catch(error => {})
}

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString())
})


client.on('connect', function(conn) {

    connection = conn

    console.log('WebSocket Client Connected')

    connection.send(JSON.stringify({ identifier:'mining_start' }))

    connection.on('error', function(error) {
        connection = null
        console.log("Connection Error: " + error.toString())
    })

    connection.on('close', function() {
        connection = null
        console.log('Re-Connect')
        client.connect(WSS)
    })

    connection.on('message', function(message) {
        try {
            let data = JSON.parse(message.utf8Data)
            if(data['identifier'] == 'job') {
                mJob = data
                console.log(data)
                for(let i=0; i<workers.length; i++) {
                    workers[i]['worker'].postMessage({ status: 'job', job: mJob})
                }
            } else if(data['identifier'] == 'hashsolved') {
                console.log(data)
            }
        } catch (e) {}
    })
})

client.connect(WSS)


setInterval(function() {
    if(mJob) {
        console.log(((totalHashRate - prevHashRate) /2)+' H/S')
        prevHashRate = totalHashRate
    }
}, 2000)