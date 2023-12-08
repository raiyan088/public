const { exec } = require('child_process')

let LENGTH = 8

let SIZE = 0

let load02 = true
let load03 = true
let load04 = true
let load05 = true
let load06 = true
let load07 = true
let load08 = true

let process01 = null
let process02 = null
let process03 = null
let process04 = null
let process05 = null
let process06 = null
let process07 = null
let process08 = null


process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            let size = parseInt(data)
        
            SIZE = (size-1)*LENGTH

            console.log('$$$--START--$$$')

            connect01()
        }
    } catch (error) {
        console.log('Index Error:', error)
    }
})

async function connect01() {
    process01 = exec('node child.js '+(SIZE+1))

    process01.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes('##---EXIT----')) {
            connect01()
        }
        if (load02) {
            if (data.toString().includes('##---LOAD----')) {
                load02 = false
                connect02()
            }
        }
    })
}

async function connect02() {
    process02 = exec('node child.js '+(SIZE+2))

    process02.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes('##---EXIT----')) {
            connect02()
        }
        if (load03) {
            if (data.toString().includes('##---LOAD----')) {
                load03 = false
                connect03()
            }
        }
    })
}

async function connect03() {
    process03 = exec('node child.js '+(SIZE+3))

    process03.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes('##---EXIT----')) {
            connect03()
        }
        if (load04) {
            if (data.toString().includes('##---LOAD----')) {
                load04 = false
                connect04()
            }
        }
    })
}

async function connect04() {
    process04 = exec('node child.js '+(SIZE+4))

    process04.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes('##---EXIT----')) {
            connect04()
        }
        if (load05) {
            if (data.toString().includes('##---LOAD----')) {
                load05 = false
                connect05()
            }
        }
    })
}

async function connect05() {
    process05 = exec('node child.js '+(SIZE+5))

    process05.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes('##---EXIT----')) {
            connect05()
        }
        if (load06) {
            if (data.toString().includes('##---LOAD----')) {
                load06 = false
                connect06()
            }
        }
    })
}

async function connect06() {
    process06 = exec('node child.js '+(SIZE+6))

    process06.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes('##---EXIT----')) {
            connect06()
        }
        if (load07) {
            if (data.toString().includes('##---LOAD----')) {
                load07 = false
                connect07()
            }
        }
    })
}

async function connect07() {
    process07 = exec('node child.js '+(SIZE+7))

    process07.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes('##---EXIT----')) {
            connect07()
        }
        if (load08) {
            if (data.toString().includes('##---LOAD----')) {
                load08 = false
                connect08()
            }
        }
    })
}

async function connect08() {
    process08 = exec('node child.js '+(SIZE+8))

    process08.stdout.on('data', (data) => {
        let log = data.toString().trimStart().trimEnd()
        if (log.length > 0) {
            console.log(log)
        }
        if(data.toString().includes('##---EXIT----')) {
            connect08()
        }
    })
}