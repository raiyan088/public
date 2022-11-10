const { parentPort } = require('worker_threads')
const { performance } = require('perf_hooks')
const Module = require('./worker_cn')

var cn = Module.cwrap("hash_cn", "string", ["string", "number", "number", "number"]);

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

let mID = 0
let job = null

parentPort.on('message', (message) => {
    try {
        if(message['status'] == 'user') {
            mID = message['id']
        } else {
            if(message['status'] == 'job') {
                job = message['job']
                setTimeout(solved, 0)
            }
        }
    } catch (e) {}
})

let solved = function startSolved() {
    let start = performance.now()
    let hash = null
    let target = hex2int(job.target)
    let inonce = getRandomInt(0, 4294967295)
    let hexnonce = int2hex(inonce)
    let blob = job.blob.substring(0, 78) + hexnonce + job.blob.substring(86, job.blob.length)
    try {
        if (job.algo === "cn") hash = cn(blob, 0, job.variant, job.height)
        else if (job.algo === "cn-lite") hash = cn(blob, 1, job.variant, job.height)
        else if (job.algo === "cn-pico") hash = cn(blob, 2, job.variant, job.height)
        else if (job.algo === "cn-half") hash = cn(blob, 3, job.variant, job.height)
        else parentPort.postMessage({ status: 'error', id: mID })

        if (hash) {
            if(hex2int(hash.substring(56, 64)) < target) {
                var msg = {
                    identifier: "solved",
                    job_id: job.job_id,
                    nonce: hexnonce,
                    result: hash
                }
                parentPort.postMessage({ status: 'solved', id: mID, job: JSON.stringify(msg) })
            } else {
                var sleep = Math.round(50 / 60 * performance.now() - start)
                setTimeout(function() {
                    parentPort.postMessage({ status: 'nothing', id: mID })
                }, sleep)
            }
        }
    } catch (err) {
        var sleep = Math.round(50 / 60 * performance.now() - start)
        setTimeout(function() {
            parentPort.postMessage({ status: 'nothing', id: mID })
        }, sleep)
    }
}