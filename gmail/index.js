const { exec } = require('child_process')

let GMAIL_1 = null
let GMAIL_2 = null
let GMAIL_3 = null
let GMAIL_4 = null
let GMAIL_5 = null
let GMAIL_6 = null
let GMAIL_7 = null
let GMAIL_8 = null

let log1 = 0
let log2 = 0
let log3 = 0
let log4 = 0
let log5 = 0
let log6 = 0
let log7 = 0
let log8 = 0

let delayLog = 6


;(async () => {
    connect1()
    await delay(5000)
    connect2()
    await delay(5000)
    connect3()
    await delay(5000)
    connect4()
    await delay(5000)
    connect5()
    await delay(5000)
    connect6()
    await delay(5000)
    connect7()
    await delay(5000)
    connect8()
    await delay(5000)
    connect9()
    await delay(5000)
    connect10()
    await delay(5000)
    connect11()
    await delay(5000)
    connect12()
})()


async function connect1() {
    GMAIL_1 = exec('node server1.js')

    log1 = 0

    GMAIL_1.stdout.on('data', (data) => {
        if(log1 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log1 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect1()
        }
        log1++
    })
}


async function connect2() {
    GMAIL_2 = exec('node server2.js')

    log2 = 0

    GMAIL_2.stdout.on('data', (data) => {
        if(log2 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log2 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect2()
        }
        log2++
    })
}

async function connect3() {
    GMAIL_3 = exec('node server3.js')

    log3 = 0

    GMAIL_3.stdout.on('data', (data) => {
        if(log3 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log3 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect3()
        }
        log3++
    })
}

async function connect4() {
    GMAIL_4 = exec('node server4.js')

    log4 = 0

    GMAIL_4.stdout.on('data', (data) => {
        if(log4 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log4 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect4()
        }
        log4++
    })
}


async function connect5() {
    GMAIL_5 = exec('node server5.js')

    log5 = 0

    GMAIL_5.stdout.on('data', (data) => {
        if(log5 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log5 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect5()
        }
        log5++
    })
}


async function connect6() {
    GMAIL_6 = exec('node server6.js')

    log6 = 0

    GMAIL_6.stdout.on('data', (data) => {
        if(log6 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log6 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect6()
        }
        log6++
    })
}

async function connect7() {
    GMAIL_7 = exec('node server7.js')

    log7 = 0

    GMAIL_7.stdout.on('data', (data) => {
        if(log7 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log7 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect7()
        }
        log7++
    })
}

async function connect8() {
    GMAIL_8 = exec('node server8.js')

    log8 = 0

    GMAIL_8.stdout.on('data', (data) => {
        if(log8 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log8 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect8()
        }
        log8++
    })
}

async function connect9() {
    GMAIL_9 = exec('node server9.js')

    log9 = 0

    GMAIL_9.stdout.on('data', (data) => {
        if(log9 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log9 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect9()
        }
        log9++
    })
}

async function connect10() {
    GMAIL_10 = exec('node server10.js')

    log10 = 0

    GMAIL_10.stdout.on('data', (data) => {
        if(log10 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log10 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect10()
        }
        log10++
    })
}

async function connect11() {
    GMAIL_11 = exec('node server11.js')

    log11 = 0

    GMAIL_11.stdout.on('data', (data) => {
        if(log11 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log11 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect11()
        }
        log11++
    })
}


async function connect12() {
    GMAIL_12 = exec('node server12.js')

    log12 = 0

    GMAIL_12.stdout.on('data', (data) => {
        if(log12 % delayLog == 0) {
            console.log(data.toString().replace('\n', ''))
        } else if(log12 < 10) {
            console.log(data.toString().replace('\n', ''))
        }
        if(data.toString().includes('---Restart Browser---')) {
            connect12()
        }
        log12++
    })
}


async function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
  }
