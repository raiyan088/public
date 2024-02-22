const { parentPort, workerData } = require('node:worker_threads')
const axios = require('axios')

let mData = workerData
let mJob = mData['job']

let mError = 0
let mSuccess = false
let mTimeout = 25000
let mUrl = mData['url']

if (mUrl.endsWith('vercel.app')) {
    mTimeout = 9000
}

startWorker()

async function startWorker() {
    try {
        let response = await axios.post(mUrl+'/job', { data:encrypt(JSON.stringify(mJob)), timeout:mTimeout }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    
        try {
            let data = response.data
            if (Object.keys(data).length > 0) {
                mError = 0
                mSuccess = true
                if (data['status'] == 'SOLVED') {
                    let json = JSON.parse(decrypt(data['msg']))
                    let hash = json['hash'][0]
                    let nonce = json['nonce'][0]
                    
                    if (hash && nonce) {
                        let solve = {
                            identifier: 'solved',
                            job_id: json['id'],
                            nonce: nonce,
                            result: hash
                        }

                        parentPort.postMessage({ status:'SOLVED', job:solve })
                    }
                }
            }
        } catch (error) {}
    } catch (error) {
        let vercel = true
        try {
            let data = error.cause.toString()
            if(data.includes('getaddrinfo') && data.includes('ENOTFOUND')) {
                mError++
                vercel = false
                await delay(3000)
            }
        } catch (error) {}

        try {
            if (vercel) {
                let data = error.response.data
                if (data.error.message == 'Payment required') {
                    mError += 10
                    await delay(3000)
                }
            }
        } catch (error) {}
    }

    if (mSuccess == false && mError > 3) {
        parentPort.postMessage({ status:'CLOSE', id:mData['id'] })
    } else {
        await startWorker()
    }
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