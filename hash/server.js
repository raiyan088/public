const { Worker } = require('worker_threads')

let mJob = null
let totalHashRate = 0
let prevHashRate = 0

let workers = []

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
        console.log('-----SOLVED-----')
        workers[message['id']]['worker'].postMessage({ status: 'job', job: mJob})
    } else if(message['status'] == 'nothing') {
        totalHashRate++
        workers[message['id']]['worker'].postMessage({ status: 'job', job: mJob})
    }
}

addWorker().catch(error => {})

setTimeout(() => {
    mJob = {"identifier":"job","job_id":"41171af093af4e899a6e727c1833113d","algo":"cn-half","variant":2,"height":2154814,"blob":"0808b085a49606875c0aaa63484e82f4d95e9233e71cd0df8835633bac5326f947463171e5697100000000392c0d7dd9eb76b7d98f2e5abb311436f54a99de9be1642ab32886dee439d168010000000000000000000000000000000000000000000000000000000000000000","target":"285c8f02"}

    console.log('New Job Received.')
    for(let i=0; i<workers.length; i++) {
        workers[i]['worker'].postMessage({ status: 'job', job: mJob})
    }
}, 500)


setInterval(function() {
    if(mJob) {
        console.log(((totalHashRate - prevHashRate)/2)+' H/S')
        prevHashRate = totalHashRate
    }
}, 2000)
