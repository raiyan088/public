const bodyParser = require('body-parser')
const Module = require('./module')
const express = require('express')

let mJobSolve = 0

let mJobTime = new Date().getTime()+3000

const app = express()

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.listen(process.env.PORT || 3000, ()=>{
    console.log('Listening on port 3000')
})

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

app.get('/', async (req, res) => {
    res.end('SOLVED: '+mJobSolve)
})

app.post('/job', async function (req, res) {
    try {
        let now = new Date().getTime()
        if (mJobTime > now) {
            await delay(mJobTime - now)
        }

        if(req.body) {
            let data = await solveJob(decrypt(req.body.data), parseInt(req.body.timeout))
            res.end(JSON.stringify(data))
        } else {
            res.end(JSON.stringify({ status:'BAD', msg:'Error' }))
        }
    } catch (error) {
        res.end(JSON.stringify({ status:'BAD', msg:'Error' }))
    }
})


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

async function solveJob(job, timeout) {
    try {
        let mTimeout = new Date().getTime()+timeout
        let devide = parseInt(timeout/1000)
        let mJob = JSON.parse(job)
        let target = hex2int(mJob.target)
        let mSolve = false
        let mNonce = []
        let mHash = []
        let hashSolved = 0

        while (mTimeout > new Date().getTime()) {
            var hexnonce = int2hex(getRandomInt(0, 0xFFFFFFFF))
            var blob = mJob.blob.substring(0, 78) + hexnonce + mJob.blob.substring(86, mJob.blob.length)
            if (mJob.algo == 'ghostrider') {
                blob = mJob.blob.substring(0, 152) + hexnonce
            }

            try {
                let hash = Module.hash(blob, mJob.algo, mJob.targets, mJob.variant, mJob.height, mJob.seed_hash)
                if (hash) {
                    hashSolved++
                    mSolve = true

                    if (hex2int(hash.substring(56, 64)) < target) {
                        mNonce.push(hexnonce)
                        mHash.push(hash)
                        mJobSolve++
                        break
                    }
                }
            } catch (error) {}
        }

        if (mSolve) {
            if (mHash.length > 0) {
                return { status:'SOLVED', hash:parseInt(hashSolved/devide), msg:encrypt(JSON.stringify({ id:mJob.job_id, nonce:mNonce, hash:mHash })) }
            } else {
                return { status:'OK', hash:parseInt(hashSolved/devide), msg:'No Solved' }
            }
        } else {
            return { status:'HASH', hash:parseInt(hashSolved/devide), msg:'No Hash' }
        }
    } catch (error) {
        return { status:'BAD', msg:'Error' }
    }
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
