const axios = require('axios')
const fs = require('fs')

let NUMBER = 0
let SIZE = 20
let MAX = 50000
let CLEAR = false

console.log('Start Process')

process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            SIZE = parseInt(data)
        } else if (index == 1) {
            NUMBER = parseInt(data)
        } else if (index == 2) {
            CLEAR = data == 'true' || data == true
        }
    } catch (error) {}
})

startServer()

async function startServer() {

    let mData = JSON.parse(fs.readFileSync('config.json'))

    let mNumber = ''

    NUMBER = mData.number
    SIZE = mData.size
    MAX = mData.max

    if (NUMBER == 0) {
        console.log('Input Number')
        process.exit(0)
    }

    let mSize = 0
    
    while (true) {
        try {
            let data = await checkNumber(NUMBER, SIZE)
            NUMBER += SIZE
            mSize += data.length
            for (let i = 0; i < data.length; i++) {
                try {
                    mNumber += '+'+data[i]+'\n'
                } catch (error) {}
            }
            fs.writeFileSync('number.txt', mNumber)
            console.log('Size:', MAX, mSize, NUMBER)

            if (MAX < mSize) {
                break
            }
        } catch (error) {}
    }

    process.exit(0)
}


async function checkNumber(number, loop) {
    return new Promise(function (resolve) {
        let mLoop = 0
        let list = []

        for (let i = 0; i < loop; i++) {
            axios.post('https://accounts.google.com/_/lookup/accountlookup?number='+(number+i), getNumberTempData('+'+(number+i)), {
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

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
