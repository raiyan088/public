const { exec } = require('child_process')

const SYMBLE = '#'
const LENGTH = 3

let SIZE = 0

let load02 = true
let load03 = true

let process01 = null
let process02 = null
let process03 = null


process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            let size = parseInt(data)
        
            SIZE = (size-1)*LENGTH

            console.log('★★★---START---★★★')

            connect01()
        }
    } catch (error) {
        console.log('Index Error:', error)
    }
})

async function connect01() {
    process01 = exec('node server.js '+(SIZE+1))

    process01.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes(SYMBLE+SYMBLE+'---EXIT----')) {
            connect01()
        }
        if (load02) {
            if (data.toString().includes(SYMBLE+SYMBLE+'---LOAD----')) {
                load02 = false
                connect02()
            }
        }
    })
}

async function connect02() {
    process02 = exec('node server.js '+(SIZE+2))

    process02.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes(SYMBLE+SYMBLE+'---EXIT----')) {
            connect02()
        }
        if (load03) {
            if (data.toString().includes(SYMBLE+SYMBLE+'---LOAD----')) {
                load03 = false
                connect03()
            }
        }
    })
}

async function connect03() {
    process03 = exec('node server.js '+(SIZE+3))

    process03.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes(SYMBLE+SYMBLE+'---EXIT----')) {
            connect03()
        }
    })
}