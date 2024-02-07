const { parentPort, workerData } = require('node:worker_threads')
const axios = require('axios')

let mData = workerData
let mJob = mData['job']


startWorker()

async function startWorker() {
    try {
        let url = mData['url']
        let timeout = 9000
        // if (url.endsWith('vercel.app')) {
        //     timeout = 9000
        // }

        let response = await axios.post(url+'/job', { data:encrypt(JSON.stringify(mJob)), timeout:timeout }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    
        let data = response.data
        if (data['status'] == 'SOLVED') {
            sendSolve(JSON.parse(decrypt(data['msg'])))
        }
    } catch (error) {
        console.log('Error: '+mData['url'])
        await delay(5000)
    }

    await startWorker()
}

function sendSolve(data) {
    let length = data['hash'].length
    let dev = 28/length

    for (let i = 0; i < length; i++) {
        sendPanding({
            identifier: 'solved',
            job_id: data['id'],
            nonce: data['nonce'][i],
            result: data['hash'][i]
        }, (i+1)*dev*1000)
    }
}

function sendPanding(job, timeout) {
    setTimeout(() => {
        parentPort.postMessage(job)
    }, timeout)
}

function encrypt(text) {
    return Buffer.from(text).toString('base64')
}

function decrypt(text) {
    try {
        return Buffer.from(text, 'base64').toString('ascii')
    } catch (error) {
        return null
    }
}

parentPort.on('message', (job) => {
    mJob = job
})

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}