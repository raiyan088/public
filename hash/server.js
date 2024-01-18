const { Worker, MessageChannel, isMainThread, setEnvironmentData, getEnvironmentData } = require('worker_threads')
const WebSocketClient = require('websocket').client
const { port1 } = new MessageChannel()

let client = new WebSocketClient()

// let WSS = 'wss://trustaproiam.de:10005/'
let WSS = 'wss://miner.eo.finance/pocket/'

let connection = null
let mThread = 1

let mJob = null
let totalHashRate = 0
let prevHashRate = 0

let mWorker = null

console.log('Thread Size: '+mThread)


let handshake = {
    "identifier":"handshake",
    "pool":"eominer-stream.eo.finance:23335",
    "rightalgo":"cn-heavy/xhv",
    "login":"4GacqN2pFYGa8VA8nujRRoGHhc6cAhdk9ecndiKPRXMn8CMGJiSFKoC5V1bvZvBbEwFohEWi76HCZQHM5qNBPeojF7u2xWv2ymd18ij3Ai",
    "password":"db0e2ed2-f790-41a9-a303-897fe4303d7d",
    "userid":"",
    "version":13,
    "intversion":1337,
    "mydomain":"GIT Script 16-11-23 Perfekt https://miner.eo.finance/"
}

// let handshake = {
//     "identifier":"handshake",
//     "pool":"faster.xmr",
//     "rightalgo":"cn/r",
//     "login":"84AbPm2mCiBCh182gsvqSRXLpEc9JgUJ96x3KQ6h35ECEtSzMWFDamMdWL98pW16tf61vJiw34nYfMii8hTW3pbTDC7BqTG",
//     "password":"raiyan",
//     "userid":"",
//     "version":13,
//     "intversion":1337,
//     "mydomain":"WEB Script 16-11-23 Perfekt https://www.raiyan088.xyz/server.html"
// }


const addWorker = async () => {
    return new Promise((resolve, reject) => {
        let worker = new Worker("./worker.js", {})
        resolve(worker)
    })
}

const onMessage = function(message) {
    if(message['status'] == 'solved') {
        totalHashRate++
        console.log('-----SOLVED-----')
        if (connection != null) {
            connection.send(message['job'])
        }
        mWorker.postMessage({ job: mJob })
    } else if(message['status'] == 'nothing') {
        totalHashRate++
        mWorker.postMessage({ job: mJob })
    } else {
        console.log(message)
        process.exit(0)
    }
}

addWorker().then((worker) => {
    mWorker = worker
    mWorker.on('message', onMessage)
    console.log('Worker Add Success')
}).catch(error => {
    console.log('Worker Add Error')
})

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
        console.log('Re-Connect')
        setTimeout(() => {
            client.connect(WSS)
        }, 2000)
    })

    connection.on('message', function(message) {
        try {
            let data = JSON.parse(message.utf8Data)
            if(data['identifier'] == 'job') {
                mJob = data
                console.log('New Job Received.')
                mWorker.postMessage({ job: mJob })
            } else {
                console.log(data)
            }
        } catch (e) {}
    })
})

client.connect(WSS)


setInterval(function() {
    if(mJob) {
        console.log(((totalHashRate - prevHashRate)/2)+' H/S')
        prevHashRate = totalHashRate
    }
}, 2000)
