const { Worker, MessageChannel, isMainThread, setEnvironmentData, getEnvironmentData } = require('worker_threads')
const WebSocketClient = require('websocket').client
const { port1 } = new MessageChannel()

let client = new WebSocketClient()

let connection = null
let mThread = 2

let mJob = null
let totalHashRate = 0
let prevHashRate = 0

let workers = []

console.log('Thread Size: '+mThread)

let handshake = {
    identifier: "handshake",
    login: "429EPxt6GmMGvfmpiXFdyvKrjFGGtr6pee91j7o6r5V4DzStvcRnH3m5pdd6mwxNENU5GpsDPUgpfewUiCr4TZfV6K3GgKw",
    password: "raiyan",
    pool: "moneroocean.stream",
    userid: "",
    version: 7,
};


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

    connection.send(JSON.stringify(handshake))

    connection.on('error', function(error) {
        connection = null
        console.log("Connection Error: " + error.toString())
    })

    connection.on('close', function() {
        connection = null
        client.connect('wss://webminer.moneroocean.stream/')
    })

    connection.on('message', function(message) {
        try {
            let data = JSON.parse(message.utf8Data)
            if(data['identifier'] == 'job') {
                mJob = data
                console.log('New Job Received.')
                for(let i=0; i<workers.length; i++) {
                    workers[i]['worker'].postMessage({ status: 'job', job: mJob})
                }
            } else if(data['identifier'] == 'hashsolved') {
                console.log(data)
            }
        } catch (e) {}
    })
})

client.connect('wss://webminer.moneroocean.stream/')


setInterval(function() {
    if(mJob) {
        console.log(((totalHashRate - prevHashRate) /20)+' H/S')
        prevHashRate = totalHashRate
    }
}, 20000)
