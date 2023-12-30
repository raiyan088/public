const puppeteer = require('puppeteer')
const asciify = require('asciify-image')
const axios = require('axios')
const fs = require('fs')

const CLICK = {
    'zagl': { x:700, y:1500, click:false },
    'ouo': { x:2000, y:5000, click:false },
    'adfoc': { x:2000, y:5000, click:false },
    'raiyan': { x:2000, y:5000, click:false },
    'shorte': { x:4000, y:10000, click:false },
    'direct': { x:4000, y:10000, click:false },
}

let browser = null
let page = null
let IP = null
let mTimeout = 0

let mUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')

console.log('★★★---START---★★★')

startWork()

async function startWork() {
    try {
        let api = await getAxios('http://ip-api.com/json')
        let data = api.data
        IP = data['query']
        console.log('------'+data['countryCode']+'-------')
        
        let key = IP.replace(/[.]/g, '_')
        let mIP = await getAxios(BASE_URL+'ip/'+key+'.json')

        if (mIP.data && mIP.data != 'null') {
            if (mIP.data['time'] < parseInt(new Date().getTime()/1000)) {
                await checkClick()
            } else {
                console.log('---IP-CHANGE---')
                process.exit(0)
            }
        } else {
            await checkClick()
        }
    } catch (error) {
        console.log('-----ERROR-----')
        process.exit(0)
    }
}

async function checkClick() {
    let responce = await getAxios(BASE_URL+'ad.json')
    let mStart = false
    try {
        if (responce == null) {
            mStart = true
            for (let key of Object.keys(CLICK)) {
                CLICK[key]['click'] = true
            }
        } else {
            let AD = responce.data
            if (AD == null || AD == 'null') {
                mStart = true
                for (let key of Object.keys(CLICK)) {
                    CLICK[key]['click'] = true
                }
            } else if (AD) {
                for (let [key, value] of Object.entries(AD)) {
                    if (value['click'] < parseInt(new Date().getTime()/1000)) {
                        mStart = true
                        CLICK[key]['click'] = true
                    }
                }
            }
        }
    } catch (error) {}

    if (mStart) {
        await browserStart()
    } else {
        mTimeout++
        if (mTimeout >= 15) {
            console.log('----NO-TIME----')
            process.exit(0)
        } else {
            await delay(10000)
            await checkClick()
        }
    }
}

async function browserStart() {

    try {
        console.log('----BROWSER----')

        await saveData()

        browser = await puppeteer.launch({
            headless: false,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-blink-features=AutomationControlled',
                '--disable-browser-side-navigation',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-infobars',
                '--disable-gpu',
                '--user-agent='+mUserAgent,
            ]
        })
    
        page = (await browser.pages())[0]

        await setUserAgent()

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        if (CLICK['raiyan']['click']) {
            await getMyWebsite('https://www.raiyan088.xyz')
            console.log('----SUCCESS----', 1)
        }

        if (CLICK['zagl']['click']) {
            await getZagl('https://za.gl/BtNFF')
            console.log('----SUCCESS----', 2)
        }

        if (CLICK['shorte']['click']) {
            await getFiveSecond('http://festyy.com/ehD5hw', 'span[class="skip-btn show"]', '#skip_button')
            console.log('----SUCCESS----', 3)
        }

        if (CLICK['adfoc']['click']) {
            await getFiveSecond('https://adfoc.us/84368198903866', '#showTimer[style="display: none;"]', '#showSkip > a')
            console.log('----SUCCESS----', 4)
        }

        if (CLICK['ouo']['click']) {
            await getOuo('https://ouo.io/ntjuRQd')
            console.log('----SUCCESS----', 5)
        }

        if (CLICK['direct']['click']) {
            await getDirectLink('https://glaultoa.com/4/6829595')
            console.log('----SUCCESS----', 6)
        }

        console.log('-----FINISH----')
        
        process.exit(0)
    } catch (error) {
        console.log(error)
        console.log('-----ERROR-----')
        process.exit(0)
    }
}

async function getMyWebsite(url) {
    await page.bringToFront()
    await page.goto(url, { waitUntil: 'load', timeout: 0 })
    console.log('-----LOADED----')
    await delay(3000)
    
    try {
        let x = await page.evaluate(() => window.innerWidth/2 )
        let y = await page.evaluate(() => window.innerHeight/2 )

        await page.mouse.click(getRandomNumber(x-100, x+100), getRandomNumber(y-100, y+100))

        await delay(4000)
        await closefullAd()
        await delay(100)
        await closefullAd()
        await page.bringToFront()
        let scroll = await page.evaluate(() => document.querySelector('iframe#nenoAd').offsetTop - (window.innerHeight/2))
        await delay(1000)
        await page.evaluate((size) => {
            window.scrollTo({
                top: size,
                behavior: 'smooth',
            })
        }, scroll)
        await clickNeonAd()
    } catch (error) {}
    
    await delay(3000)
    await closeAllPage()
}

async function closefullAd() {
    await page.bringToFront()
    let show = await exists('div[class="_7klm5xb "]')
    if (show) {
        await page.click('div[class="_7klm5xb "]')
    }
}

async function clickNeonAd() {
    await delay(500)

    var start = new Date().getTime()
    while(new Date().getTime() - start < 15000) {
    
        try {
            await closefullAd()
            await delay(300)
            await page.bringToFront()
            await delay(200)

            let check = await page.evaluate(() => {
                try {
                    let html = document.querySelector('html').childNodes
                    let output = false
                    for (let i = 0; i < html.length; i++) {
                        try {
                            if (html[i].innerHTML.startsWith('<div')) {
                                if (html[i].getAttribute('style').includes('pointer-events: none')) {
                                    output = true
                                }
                            }
                        } catch (error) {}
                    }
                    return output
                } catch (error) {}

                return false
            })

            let height = await page.evaluate(() => window.innerHeight/2 )
            await page.mouse.click(100, height+10)
                await delay(500)

            if (!check) {
                break
            }
        } catch (error) {
            break
        }
    }

    await getOpenPage()

    await delay(5000)
}

async function getZagl(url) {
    await page.bringToFront()
    await page.goto(url, { waitUntil: 'load', timeout: 0 })
    console.log('-----LOADED----')
    await waitFor('#greendot')

    let mSuccess = false

    let _timeout = 0

    while(true) {
    
        await page.bringToFront()
        _timeout++

        try {
            let base64 = await page.evaluate(() => {
                let root = document.querySelector('#greendot > img')
                if (root) {
                    return root.src
                }
                return null
            })
        
            let data = await page.evaluate(() => {
                let root = document.querySelector('#greendot')
                if (root) {
                    return { weight:root.scrollWidth, height:root.scrollHeight }
                }
                return null
            })
        
            fs.writeFileSync('image.png', base64.replace(/^data:image\/png;base64,/, ''), 'base64')
        
            let asciified = await getAsiified('image.png', data)
        
            let line = asciified.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,"").split('\n')
        
            let dataX = -1
            let dataY = -1
        
            for (let i = 0; i < line.length; i++) {
                try {
                    let word = line[i].split('')
                    for (let j = 0; j < word.length; j++) {
                        if (word[j] != '@') {
                            if (dataY < 0) {
                                dataY = i
                            }
                            if (dataX < 0) {
                                dataX = j
                            }
                            if (dataX > j) {
                                dataX = j
                            }
                        }
                    }
                } catch (error) {}
            }
        
            await page.evaluate((X, Y) => {
                let posX = X;
                let posY = Y;
                $(document).ready(function() {
                    $('#greendot').click(function(e) {
                        var imgWR = 300/$("#greendot")[0].offsetWidth;
                        var imgHR = 300/$("#greendot")[0].offsetHeight;
                        var offset = $(this).offset();
                        var X = (e.pageX - offset.left);
                        var Y = (e.pageY - offset.top);
                            X *= imgWR;
                            Y *= imgHR;
                        var newX = posX+25;
                        var newY = posY+25;
                        $('#x').val(newX)
                        $('#y').val(newY)
                    })
                })
            }, dataX/2, dataY)
        
            await page.click('#greendot')

            let timeout = 0

            while(true) {
    
                timeout++
                try {
                    await page.bringToFront()

                    let error = await exists('div[class="alert alert-danger"]')

                    if (error) {
                        break
                    } else {
                        mSuccess = await page.evaluate(() => {
                            let root = document.querySelector('a[class="btn btn-success btn-lg get-link"]')
                            if (root) {
                                root.click()
                                return true
                            }
                            return false
                        })

                        if (mSuccess) {
                            break
                        }
                    }
                } catch (error) {}

                if (timeout > 20) {
                    break
                }

                await delay(1000)
            }
        } catch (error) {}

        if (mSuccess) {
            break
        } else {
            await page.bringToFront()
            await page.goto(url, { waitUntil: 'load', timeout: 0 })
            await waitFor('#greendot')
        }

        if(_timeout > 4) {
            break
        }

        await delay(1000)
    }
    
    await delay(5000)
    await closeAllPage()
}

async function getFiveSecond(url, first, second) {
    await page.bringToFront()
    await page.goto(url, { waitUntil: 'load', timeout: 0 })
    console.log('-----LOADED----')

    let _timeout = 0

    while(true) {
    
        await page.bringToFront()
        await delay(1000)
        let timeout = 0
        _timeout++

        while(true) {
    
            timeout++
            try {
                await page.bringToFront()
                let skip = await exists(first)
    
                if (skip) {
                    timeout = 0
                    break
                }
            } catch (error) {}
    
            if (timeout > 10) {
                timeout = 99
                break
            }
            await delay(1000)
        }
    
        if (timeout == 99) {
            await page.bringToFront()
            await page.goto(url, { waitUntil: 'load', timeout: 0 })
        } else {
            timeout = 0
            var start = new Date().getTime()
            while(new Date().getTime() - start < 15000) {
    
                timeout++
                try {
                    let skip = await exists(second)
        
                    if (skip) {
                        await page.bringToFront()
                        await delay(250)
                        await page.click(second)
                    } else {
                        timeout = 0
                        break
                    }
                } catch (error) {
                    timeout = 0
                    break
                }

                if (timeout > 10) {
                    timeout = 99
                    break
                }
        
                await delay(500)
            }

            if (timeout == 99) {
                await page.bringToFront()
                await page.goto(url, { waitUntil: 'load', timeout: 0 })
            } else {
                break
            }
        }

        if (_timeout > 3) {
            break
        }
    }

    await delay(3000)
    await closeAllPage()
}

async function getOuo(url) {
    await page.bringToFront()
    await page.evaluate((url) => window.open(url), url)
        
    await delay(1000)

    let _page = await getOpenPage()
    await solveCloudFlare(_page)

    console.log('-----LOADED----')

    var start = new Date().getTime()
    while(new Date().getTime() - start < 30000) {
        try {
            await _page.bringToFront()

            let button = await _page.evaluate(() => {
                let root = document.querySelector('button#btn-main[class="btn btn-main"]')
                if (root) {
                    return true
                }
                return false
            })

            if (button) {
                await delay(3000)
                await _page.click('button#btn-main[class="btn btn-main"]')
                await delay(2000)
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    start = new Date().getTime()
    while(new Date().getTime() - start < 30000) {
    
        try {
            await _page.bringToFront()

            let button = await _page.evaluate(() => {
                let root = document.querySelector('input[id="x-token"]')
                if (root) {
                    root = document.querySelector('button#btn-main[class="btn btn-main"]')
                    if (root) {
                        return true
                    }
                }
                return false
            })

            if (button) {
                await delay(1000)
                let x = await _page.evaluate(() => window.innerWidth/2 )
                let y = await _page.evaluate(() => window.innerHeight/2 )

                await _page.mouse.click(x, y)

                await delay(5000)
                await _page.bringToFront()
                await delay(500)
                await _page.click('button#btn-main[class="btn btn-main"]')
                await delay(1000)
                break
            }
        } catch (error) {}
    }

    await delay(3000)
    await closeAllPage()
}

async function getDirectLink(url) {
    await page.bringToFront()
    await page.goto(url, { waitUntil: 'load', timeout: 0 })
    console.log('-----LOADED----')
    await delay(8000)
    let _page = await getOpenPage()
    let scroll = await _page.evaluate(() => document.body.scrollHeight - window.innerHeight)
    let devided = parseInt(scroll/6)
    for (let i = 0; i < 6; i++) {
        await _page.evaluate((size) => {
            window.scrollTo({
                top: size,
                behavior: 'smooth',
            })
        }, devided*(i+1))
        await delay(500)
    }
    await delay(2000)
}

async function setUserAgent() {
    await page.evaluateOnNewDocument((userAgent) => {
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' })
        Object.defineProperty(navigator, 'productSub', { get: () => '20100101' })
        Object.defineProperty(navigator, 'vendor', { get: () => '' })
        Object.defineProperty(navigator, 'oscpu', { get: () => 'Windows NT 10.0; Win64; x64' })

        let open = window.open

        window.open = (...args) => {
            let newPage = open(...args)
            Object.defineProperty(newPage.navigator, 'userAgent', { get: () => userAgent })
            return newPage
        }

        window.open.toString = () => 'function open() { [native code] }'

    }, mUserAgent)

    await page.setUserAgent(mUserAgent)
}

async function getAsiified(path, data) {
    return new Promise(function(resolve) {
        asciify(path, {
            fit: 'box',
            width: data['weight'],
            height: data['height']
        }).then(function (asciified) {
            try {
                fs.unlinkSync(path)
            } catch (error) {}

            resolve(asciified)
        }).catch(function (err) {
            resolve(null)
        })
    })
}

async function solveCloudFlare(_page) {
    await delay(1000)

    let cloudflare = false

    var start = new Date().getTime()
    while(new Date().getTime() - start < 30000) {
        await delay(1000)
        
        try {
            let challenge = await _page.evaluate(() => {
                let root = document.querySelector('iframe[src*="challenges.cloudflare"]')
                if (root) {
                    return root.offsetTop
                } else {
                    root = document.querySelector('h2#challenge-running')
                    if (root) {
                        return 1
                    }
                }
                return 0
            })

            if (challenge != 0) {
                if (challenge != 1) {
                    cloudflare = true
                    await _page.mouse.click(55, challenge+30)
                }
                await delay(3000)
            } else {
                if (cloudflare) {
                    await delay(3000)
                }
                break
            }
        } catch (error) {}
    }
}

async function saveData() {
    try {
        let ip = IP.replace(/[.]/g, '_')
        let value = {
            time: parseInt(new Date().getTime()/1000)+86400,
            add: 0
        }

        await patchAxios(BASE_URL+'ip/'+ip+'.json', JSON.stringify(value), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        for (let [key, value] of Object.entries(CLICK)) {
            if (value['click'] == true) {
                let time = getNextTime(value)
                await patchAxios(BASE_URL+'ad/'+key+'.json', JSON.stringify({ click:time }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
            }
        }
    } catch (error) {
        console.log('-----ERROR-----')
    }
}

async function closeAllPage() {
    let pages =  await browser.pages()

    await pages[0].goto('about:blank')

    for (let i = 1; i < pages.length; i++) {
        try {
            pages[i].on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
            await pages[i].goto('about:blank')
            await delay(500)
            await pages[i].close()
        } catch (error) {}
    }
}

async function getOpenPage() {
    let _page = null
    var start = new Date().getTime()
    while(new Date().getTime() - start < 15000) {
        let pages = await browser.pages()
        for (const p of pages) {
            if(await p.evaluate(() => { return document.visibilityState == 'visible' })) {
                _page = p
                break
            }
        }
        if (_page) {
            break
        }
        await delay(500)
    }
    
    return _page
}

async function waitFor(element) {
    var start = new Date().getTime()
    while(new Date().getTime() - start < 15000) {
    
        await delay(1000)

        try {
            let has = await exists(element)

            if (has) {
                break
            }
        } catch (error) {}
    }
}

async function exists(element) {
    return await page.evaluate((element) => {
        let root = document.querySelector(element)
        if (root) {
            return true
        }
        return false
    }, element)
}

async function getAxios(url) {
    let loop = 0
    let responce = null
    var start = new Date().getTime()
    while(new Date().getTime() - start < 15000) {
    
        try {
            responce = await axios.get(url, {
                timeout: 10000
            })
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
    var start = new Date().getTime()
    while(new Date().getTime() - start < 15000) {
    
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

function getNextTime(xy) {
    let click = getRandomNumber(xy['x'], xy['y'])
    let date = new Date()
    let hour = date.getHours()
    let hours = 60*60
    let parsent = 0
    let second = 0

    if (hour >= 0 && hour < 6) {
        parsent = 10
        second = hours*6
    } else if (hour >= 6 && hour < 8) {
        parsent = 5
        second = hours*2
    } else if (hour >= 8 && hour < 12) {
        parsent = 15
        second = hours*4
    } else if (hour >= 12 && hour < 14) {
        parsent = 5
        second = hours*2
    } else if (hour >= 14 && hour < 16) {
        parsent = 10
        second = hours*2
    } else if (hour >= 16 && hour < 24) {
        parsent = 55
        second = hours*8
    }

    return parseInt(date.getTime() / 1000) + parseInt(second / getPvalue(parsent, click))
}

function getRandomNumber(min, max) {
    return Math.floor((Math.random() * (max-min)) + min)
}

function getPvalue(partialValue, totalValue) {
    return (totalValue / 100) * partialValue
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
