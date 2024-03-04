const { parentPort, workerData } = require('node:worker_threads')
const axios = require('axios')

let mData = workerData
let mJob = mData['job']

let mError = []
let mSuccess = []
let mUrl = mData['list']

for (let i = 0; i < mUrl.length; i++) {
    mError[i] = 0
    mSuccess[i] = false

    let timeout = 25000

    if (mUrl[i].endsWith('vercel_app') || mUrl[i].endsWith('vercel.app')) {
        timeout = 9000
    }

    startWorker(i, 'https://'+mUrl[i].replace(/__/g, '-').replace(/_/g, '.'), timeout)
}

async function startWorker(id, url, timeout) {
    try {
        let response = await axios.post(url+'/job', { data:encrypt(JSON.stringify(mJob)), timeout:timeout }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    
        try {
            let data = response.data
            if (Object.keys(data).length > 0) {
                mError[id] = 0
                mSuccess[id] = true
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
                mError[id] = mError[id]+1
                vercel = false
                await delay(3000)
            }
        } catch (error) {}

        try {
            if (vercel) {
                let data = error.response.data
                try {
                    if (data.error.message == 'Payment required') {
                        mError[id] = mError[id]+10
                        vercel = false
                        await delay(3000)
                    }
                } catch (error) {}

                if (vercel) {
                    if (data.includes('Not Found')) {
                        mError[id] = mError[id]+10
                        await delay(3000)
                    }
                }
            }
        } catch (error) {}
    }

    if (mSuccess[id] == false && mError[id] > 3) {
        if (mUrl.length > 1) {
            if (mUrl[id]) {
                parentPort.postMessage({ status:'CLOSE', id:null, key:mUrl[id] })
                mUrl.shift()
            }
        } else if (mUrl.length == 1) {
            if (mUrl[id]) {
                parentPort.postMessage({ status:'CLOSE', id:mData['id'], key:mUrl[id] })
                mUrl.shift()
            }
        }
    } else {
        await startWorker(id, url, timeout)
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