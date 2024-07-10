const { exec } = require('child_process')
let axios

let load02 = true
let load03 = true

let process01 = null
let process02 = null
let process03 = null

let RUNTIME = 0
let FINISH = new Date().getTime()+21000000


let STORAGE = Buffer.from('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vLw==', 'base64').toString('ascii')

const USER = getUserName()
// const USER = 'raiyan088'

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
            require('puppeteer-extra')
            require('puppeteer-extra-plugin-stealth')
            axios = require('axios')
            break
        } catch (ex) {
            console.log('Install Node Package')

            await installModule('puppeteer@19.10.0')
            console.log('Install Puppeteer')
            await installModule('puppeteer-core@19.10.0')
            console.log('Install Puppeteer-Core')
            await installModule('puppeteer-extra')
            console.log('Install Puppeteer-Extra')
            await installModule('puppeteer-extra-plugin-stealth')
            console.log('Install Axios')
            await installModule('axios')
            
            console.log('Install Completed')
        }
    }

    await fileDownload('https://raw.githubusercontent.com/raiyan088/public/main/CodeMail/tab.js', 'tab.js')

    await tab01()
}

async function tab01() {
    console.log('Start Tab: 01')
    
    process01 = exec('node tab.js '+USER+' 1')

    process01.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes('----EXIT----')) {
            tab01()
        }
        if (load02) {
            if (data.toString().includes('----LOAD----')) {
                load02 = false
                tab02()
            }
        }
    })
}

async function tab02() {

}


async function checkStatus() {
    try {
        if (FINISH > 0 && FINISH < new Date().getTime()) {
            await axios.post(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+10)
            })
    
            console.log('---COMPLETED---')
            process.exit(0)
        } else {
            let hour = parseInt(RUNTIME/60)
            let minute = parseInt(RUNTIME%60)

            console.log('Runing: 0'+hour+':'+(minute > 10 ? minute : '0'+minute))
            
            RUNTIME++
            await axios.post(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+100)
            })
        }
    } catch (error) {}
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

async function fileDownload(url, name) {
    return new Promise((resolve) => {
        try {
            exec('wget -O '+name+' '+url, function (err, stdout, stderr) {
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
