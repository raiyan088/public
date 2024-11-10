const FormData = require('form-data')
const axios = require('axios')
const adb = require('adbkit')
const fs = require('fs')


const client = adb.createClient()


startServer()

async function startServer() {
    let list = await client.listDevices()

    console.log(list)

    process.exit(0)
    
    let mId = await waitForStartEmulator('127.0.0.1', 5555)

    if (mId) {
        console.log('Device: '+mId)
    
        let connected = await waitForDeviceOnline(mId)
    
        if (connected) {
            console.log('Device Online: '+mId)
    
            while (true) {
                try {
                    let name = await captureScreen(await client.screencap(mId))
                    if (name) {
                        try {
                            let file = new FormData()
                            file.append('file', fs.createReadStream(name))
    
                            await axios.post('https://firebasestorage.clients6.google.com/v0/b/job-server-088.appspot.com/o?name=photo%2Femulator%2F'+(new Date().getTime())+'.jpg', file, {
                                headers: {
                                    'Content-Type': 'image/jpeg'
                                }
                            })
    
                            console.log('Capture Success')
                        } catch (error) {
                            console.log('Upload Failed')
                        }
                    } else {
                        console.log('Capture Null')
                    }
                } catch (error) {
                    console.log('Capture Error')
                }
                await delay(30000)
            }
        } else {
            console.log('Device Offline: '+mId)
            await delay(10000000)
        }   
    } else {
        console.log('Device: Null')
        await delay(10000000)
    }
}

async function captureScreen(result) {
    return new Promise(function(resolve) {
        result.on('end', function() {
            resolve('capture.jpg')
        })
        result.on('error', function() {
            resolve(null)
        })
        result.pipe(fs.createWriteStream('capture.jpg'))
    })
}

async function waitForStartEmulator(host, port) {
    for (let i = 0; i < 60; i++) {
        try {
            let connect = await client.connect(host, port)
            if(connect) {
                return connect
            }
        } catch (error) {}

        await delay(1000)
    }
}

async function waitForDeviceOnline(d_id) {
    for (let i = 0; i < 60; i++) {
        try {
            let list = await client.listDevices()

            for (let i = 0; i < list.length; i++) {
                try {
                    if (list[i]['id'] == d_id && list[i]['type'] == 'device') {
                        return true
                    }
                } catch (error) {}
            }
        } catch (error) {}

        await delay(1000)
    }

    return false
}


function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
