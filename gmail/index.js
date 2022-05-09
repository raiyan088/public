const { exec } = require('child_process')

let GMAIL_1 = null
let GMAIL_2 = null
let GMAIL_3 = null
let GMAIL_4 = null
let GMAIL_5 = null
let GMAIL_6 = null
let GMAIL_7 = null
let GMAIL_8 = null
let GMAIL_9 = null
let GMAIL_10 = null
let GMAIL_11 = null
let GMAIL_12 = null

let log1 = 0
let log2 = 0
let log3 = 0
let log4 = 0
let log5 = 0
let log6 = 0
let log7 = 0
let log8 = 0
let log9 = 0
let log10 = 0
let log11 = 0
let log12 = 0

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
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect1()
        } else {
            if(log1 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log1 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log1++
    })
}


async function connect2() {
    GMAIL_2 = exec('node server2.js')

    log2 = 0

    GMAIL_2.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect2()
        } else {
            if(log2 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log2 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log2++
    })
}

async function connect3() {
    GMAIL_3 = exec('node server3.js')

    log3 = 0

    GMAIL_3.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect3()
        } else {
            if(log3 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log3 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log3++
    })
}

async function connect4() {
    GMAIL_4 = exec('node server4.js')

    log4 = 0

    GMAIL_4.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect4()
        } else {
            if(log4 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log4 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log4++
    })
}


async function connect5() {
    GMAIL_5 = exec('node server5.js')

    log5 = 0

    GMAIL_5.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect5()
        } else {
            if(log5 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log5 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log5++
    })
}


async function connect6() {
    GMAIL_6 = exec('node server6.js')

    log6 = 0

    GMAIL_6.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect6()
        } else {
            if(log6 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log6 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log6++
    })
}

async function connect7() {
    GMAIL_7 = exec('node server7.js')

    log7 = 0

    GMAIL_7.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect7()
        } else {
            if(log7 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log7 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log7++
    })
}

async function connect8() {
    GMAIL_8 = exec('node server8.js')

    log8 = 0

    GMAIL_8.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect8()
        } else {
            if(log8 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log8 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log8++
    })
}

async function connect9() {
    GMAIL_9 = exec('node server9.js')

    log9 = 0

    GMAIL_9.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect9()
        } else {
            if(log9 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log9 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log9++
    })
}

async function connect10() {
    GMAIL_10 = exec('node server10.js')

    log10 = 0

    GMAIL_10.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect10()
        } else {
            if(log10 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log10 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log10++
    })
}

async function connect11() {
    GMAIL_11 = exec('node server11.js')

    log11 = 0

    GMAIL_11.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect11()
        } else {
            if(log11 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log11 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log11++
    })
}


async function connect12() {
    GMAIL_12 = exec('node server12.js')

    log12 = 0

    GMAIL_12.stdout.on('data', (data) => {
        if(data.toString().includes('---Restart Browser---')) {
            console.log(data.toString().replace('\n', ''))
            connect12()
        } else {
            if(log12 % delayLog == 0) {
                console.log(data.toString().replace('\n', ''))
            } else if(log12 < 5) {
                console.log(data.toString().replace('\n', ''))
            }
        }
        log12++
    })
}


async function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
  }
