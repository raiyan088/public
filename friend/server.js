const puppeteer = require('puppeteer')
const axios = require('axios')

let mRuning = {}

let USER = getUserName()
let FINISH = new Date().getTime()+21000000

let mCookies = [
    {
        name: 'fr',
        value: '',
        domain: '.facebook.com',
        path: '/',
        expires: 1795081228,
        size: 82,
        httpOnly: true,
        secure: true,
        session: false,
        sameSite: 'None',
        sameParty: false,
        sourceScheme: 'Secure',
        sourcePort: 443
    },    
    {
      name: 'c_user',
      value: '',
      domain: '.facebook.com',
      path: '/',
      expires: 1791753442,
      size: 20,
      httpOnly: false,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'm_page_voice',
      value: '',
      domain: '.facebook.com',
      path: '/',
      expires: 1791753442,
      size: 26,
      httpOnly: true,
      secure: true,
      session: false,
      sameSite: 'Lax',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'xs',
      value: '',
      domain: '.facebook.com',
      path: '/',
      expires: 1791753442,
      size: 47,
      httpOnly: true,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'datr',
      value: '',
      domain: '.facebook.com',
      path: '/',
      expires: 1791753442,
      size: 28,
      httpOnly: true,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'sb',
      value: '',
      domain: '.facebook.com',
      path: '/',
      expires: 1791753442,
      size: 26,
      httpOnly: true,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    }
]

let mUserAgent = 'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 CrKey/1.54.248666'

let BASE_URL = decode('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==')
let STORAGE = decode('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vLw==')

if (USER) {
    console.log('USER: '+USER)

    startServer()
} else {
    console.log('---NULL---')
    process.exit(0)
}

setInterval(async () => {
    await checkStatus()
}, 120000)

async function startServer() {
    console.log('---SERVER---')

    await checkStatus()

    let data = null
    let keys = null

    for (let i = 0; i < 10; i++) {
        mRuning[(i+1)] = false
    }
    
    try {
        let response = await axios.get(BASE_URL+'facebook/server/'+USER+'.json')

        data = response.data

        if (data) {
            keys = Object.keys(data)
        }
    } catch (error) {}

    if (data && keys) {
        for (let i = 0; i < keys.length; i++) {
            try {
                mRuning[(i+1)] = false
                let value = data[keys[i]]
                if (value['active'] == true) {
                    await startBrowser(i+1, keys[i], value)
                    console.log('---LOADED:'+(i+1)+'---') 
                }
            } catch (error) {}
        }
    }

    console.log('---SUCCESS---')

    while (true) {
        await delay(600000)

        try {
            let response = await axios.get(BASE_URL+'facebook/server/'+USER+'.json')
    
            data = response.data
    
            if (data) {
                keys = Object.keys(data)
            }
        } catch (error) {}

        let runing = 0
    
        if (data && keys) {
            for (let i = 0; i < keys.length; i++) {
                try {
                    if (mRuning[(i+1)] == true) {
                        runing++
                    } else {
                        let value = data[keys[i]]
                        if (value['active'] == true) {
                            await startBrowser(i+1, keys[i], value)   
                        } 
                    }
                } catch (error) {}
            }
        }

        console.log('---RUNING:'+runing+'---')
    }
}


async function startBrowser(mId, mKey, mData) {
    let cookies = mData['cookies']
    let user = null

    if (cookies) {
        try {
            let split = cookies.split(';')
            let map = {}
            for (let i = 0; i < split.length; i++) {
                let single = split[i].trim().split('=')
                if (single.length == 2) {
                    if (single[0] == 'c_user') {
                        user = single[1]
                    }
                    map[single[0]] = single[1]
                }
            }

            if (user) {
                for (let i = 0; i < mCookies.length; i++) {
                    if(mCookies[i]['name'] == 'c_user') {
                        mCookies[i]['value'] = map['c_user']
                    } else if(mCookies[i]['name'] == 'datr') {
                        mCookies[i]['value'] = map['datr']
                    } else if(mCookies[i]['name'] == 'xs') {
                        mCookies[i]['value'] = map['xs']
                    } else if(mCookies[i]['name'] == 'm_page_voice') {
                        mCookies[i]['value'] = map['c_user']
                    } else if(mCookies[i]['name'] == 'fr' && map['fr']) {
                        mCookies[i]['value'] = map['fr']
                    }
                }
            }
        } catch (error) {}
    }

    try {
        let browser = await puppeteer.launch({
            headless: false,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-notifications',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage',
                '--user-agent='+mUserAgent
            ]
        })
    
        let page = (await browser.pages())[0]

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        await mobilePhone(page)

        if (user) await page.setCookie(...mCookies)

        mRuning[mId] = true

        await loadFacebookPage(browser, page, mId, mKey, mData)

        await startAcceptRequest(browser, page, mId, mKey, mData)
    } catch (error) {
        console.log(error)
    }
}

async function loadFacebookPage(browser, page, mId, mKey, mData) {
    await page.goto('https://m.facebook.com/friends/?target_pivot_link=requests', { waitUntil: 'load', timeout: 0 })
    
    await delay(1000)

    let save_cookies = await checkLoginFacebook(browser, page, mId, mKey, mData, 'https://m.facebook.com/friends/?target_pivot_link=requests')
    
    if (save_cookies) {
        try {
            await axios.patch(BASE_URL+'facebook/server/'+USER+'/'+mKey+'.json', JSON.stringify({ cookies:save_cookies }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
        } catch (error) {}
    }

    if (await checkCookies(page)) {
        await page.goto('https://m.facebook.com/friends/?target_pivot_link=requests', { waitUntil: 'load', timeout: 0 })
        await delay(1000)
    }

    await waitForElement(page, 'div[class="m fixed-container top"]')
}

async function startAcceptRequest(browser, page, mId, mKey, mData) {
    setTimeout(async () => {
        try {
            let mPrev = -1

            while (true) {
                for (let i = 0; i < 180; i++) {
                    for (let j = 0; j < 10; j++) {
                        try {
                            let mConfirm = await page.$$('div[aria-label*="Confirm"]')
        
                            let fRequest = false
        
                            if (mConfirm.length != mPrev) {
                                fRequest = true
                                mPrev = mConfirm.length
                            } else {
                                let confirm = await page.evaluate(() => {
                                    let root = document.querySelectorAll('div[aria-label*="Confirm"]')
        
                                    if (root) {
                                        return root.length
                                    }
                                    return -1
                                })
        
                                if (confirm >= 0 && confirm != mPrev) {
                                    fRequest = true
                                    mPrev = confirm
                                }
                            }
        
                            if (fRequest) {
                                let mFbReq = await checkServerRequest(mKey)
        
                                if (Object.keys(mFbReq).length > 0) {
                                    let accept = false
        
                                    for (let i = 0; i < mConfirm.length; i++) {
                                        try {
                                            let reqId = await getFriendReqId(mConfirm[i])
                                            if (reqId) {
                                                let userId = mFbReq[reqId]
                                                if (userId) {
                                                    accept = true
                                                    console.log('Browser: '+mId+' --- Confirm: '+userId)
                                                    try {
                                                        await mConfirm[i].click()
                                                        await delay(500)
        
                                                        await axios.delete(BASE_URL+'facebook/request/'+mKey+'/'+reqId+'.json')
                                                    } catch (error) {}
                                                }
                                            }
                                        } catch (error) {}
                                    }
            
                                    if (accept) {
                                        mPrev = -1
                                    }
                                }
                            }
                        } catch (error) {}
        
                        await delay(3000)
                    }

                    try {
                        if (!await getCookies(page)) {
                            await loadFacebookPage(browser, page, mId, mKey, mData)
                        }
                    } catch (error) {}
                }

                try {
                    await loadFacebookPage(browser, page, mId, mKey, mData)
                } catch (error) {}
            }
        } catch (error) {}
    }, 0)
}

async function getFriendReqId(element) {
    try {
        return element.evaluate(element => {
            try {
                let temp = element.parentElement.querySelector('img').src
                if (temp.includes('?')) {
                    temp = temp.substring(0, temp.indexOf('?'))
                }

                let name = temp.substring(temp.lastIndexOf('/')+1, temp.length)

                if (name.includes('.')) {
                    name = name.substring(0, name.indexOf('.'))
                }
                
                return name
            } catch (error) {}
        })
    } catch (error) {}

    return null
}

async function checkLoginFacebook(browser, page, mId, mKey, mData, mUrl) {

    if (!await fbIdValied(mKey)) {
        console.log('Browser: '+mId+' --- Block Id: '+mKey)

        await closeBlowser(browser, page, mId, mKey)

        return null
    }

    if (await getCookies(page)) {
        return null
    }

    if (!await exists(page, '#m_login_email')) {
        await page.goto('https://m.facebook.com/login.php', { waitUntil: 'load', timeout: 0 })
        await delay(500)       
    }

    let email = mData['email']
    if(!email) {
        email = mData['number']
    }
    await waitForElement(page, '#m_login_email')
    await page.type('#m_login_email', email)
    await delay(500)
    await page.type('#m_login_password', mData['pass'])
    await delay(500)
    await page.click('div[aria-label="Log in"]')
    
    for (let i = 0; i < 30; i++) {
        await delay(1000)

        try {
            let cookies = await getCookies(page)
            
            if (cookies) {
                await page.goto(mUrl, { waitUntil: 'load', timeout: 0 })
                await delay(1000)
                return cookies
            }
        } catch (error) {}
    }

    console.log('Browser: '+mId+' --- Login Failed: '+mKey)
    
    await closeBlowser(browser, page, mId, mKey)

    return null
}

async function closeBlowser(browser, page, mId, mKey) {
    mRuning[mId] = false

    try {
        await axios.patch(BASE_URL+'facebook/server/'+mKey+'.json', JSON.stringify({ active : false }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    } catch (error) {}

    try {
        if (page != null) {
            await page.close()
            page = null
        }
    } catch (error) {}

    try {
        if (browser != null) {
            await browser.close()
            browser = null
        }
    } catch (error) {}
}

async function checkServerRequest(user) {
    try {
        let response = await axios.get(BASE_URL+'facebook/request/'+user+'.json')

        let data = response.data

        if (data) {
            return data
        }
    } catch (error) {}

    return {}
}

async function checkCookies(page) {
    let cookies = await page.cookies()

    let change = false

    for (let i = 0; i < cookies.length; i++) {
        try {
            if (cookies[i]['name'] == 'fr') {
                if (cookies[i]['name'].length < 5) {
                    change = true
                    cookies[i]['value'] = '0WDCPEqGLxXRMvDW2.AWWIk3ZOoLE7zaXvG1wle_MSf0k.Bm9bZg..AAA.0.0.Bm9bZr.AWVPSbWqI1k'
                }
            } else if (cookies[i]['name'] == 'sb') {
                if (cookies[i]['name'].length < 5) {
                    change = true
                    cookies[i]['value'] = 'YLb1Zmcg-A8noUqUApNcmr4W'
                }
            }
        } catch (error) {}
    }

    if (change) {
        await page.setCookie(...cookies)
    }

    return change
}

async function fbIdValied(id) {
    try {
        let response = await axios.get('https://graph.facebook.com/'+id+'/picture?type=normal', {
            maxRedirects: 0,
            validateStatus: null
        })

        let location = response.headers['location']

        if (location && location != 'https://static.xx.fbcdn.net/rsrc.php/v1/yh/r/C5yt7Cqf3zU.jpg') {
            return true
        }
    } catch (error) {}

    return false
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

async function waitForElement(page, element) {
    for (let i = 0; i < 30; i++) {
        try {
            if (await exists(page, element)) {
                await delay(500)
                return true
            }
            await delay(500)
        } catch (error) {}
    }

    return false
}

async function waitForElementRemove(page, element) {
    for (let i = 0; i < 30; i++) {
        try {
            if (await exists(page, element)) {
                await delay(500)
            } else {
                return true
            }
        } catch (error) {}
    }

    return false
}

async function getCookies(page) {
    let cookies = await page.cookies()

    let data = {}

    for (let i = 0; i < cookies.length; i++) {
        try {
            data[cookies[i]['name']] = cookies[i]['value']
        } catch (error) {}
    }

    if (data['c_user'] && data['datr'] && data['xs']) {
        let cookie = 'datr='+data['datr']+'; sb='

        if (data['sb']) {
            cookie += data['sb']
        } else {
            cookie += 'YLb1Zmcg-A8noUqUApNcmr4W'
        }

        cookie += '; m_pixel_ratio=2; ps_l=1; ps_n=1; wd=360x380; c_user='+data['c_user']+'; fr='

        if (data['fr']) {
            cookie += data['fr']
        } else {
            cookie += '0WDCPEqGLxXRMvDW2.AWWIk3ZOoLE7zaXvG1wle_MSf0k.Bm9bZg..AAA.0.0.Bm9bZr.AWVPSbWqI1k'
        }

        cookie += '; xs='+data['xs']+'; m_page_voice='+data['c_user']

        return cookie
    } else {
        return null
    }
}

async function mobilePhone(page) {
    await page.emulate({
        name: 'Android',
        userAgent: mUserAgent,
        viewport: {
            width: 360,
            height: 740,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            isLandscape: false
        }
    })
}

async function checkStatus() {
    if (FINISH > 0 && FINISH < new Date().getTime()) {
        try {
            await axios.post(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+15)
            })
        } catch (error) {}

        console.log('---COMPLETED---')
        process.exit(0)
    } else {
        try {
            await axios.post(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+200)
            })
        } catch (error) {}
    }
}


function getUserName() {
    try {
        let directory = __dirname.split('\\')
        if (directory.length > 1) {
            let name = directory[directory.length-1]
            if (name) {
                return name
            }
        }
    } catch (error) {}

    try {
        let directory = __dirname.split('/')
        if (directory.length > 1) {
            let name = directory[directory.length-1]
            if (name) {
                return name
            }
        }
    } catch (error) {}

    return null
}


function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
