const asciify = require('asciify-image')
const puppeteer = require('puppeteer')
const fs = require('fs')


let URL = {}

let browser = null
let page = null

const viewport = [
    { width: 600, height: 1024 },
    { width: 360, height: 640 },
    { width: 360, height: 740 },
    { width: 320, height: 658 },
    { width: 712, height: 1138 },
    { width: 768, height: 1024 },
    { width: 810, height: 1080 },
    { width: 1024, height: 1366 },
    { width: 834, height: 1194 },
    { width: 320, height: 480 },
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 414, height: 736 },
    { width: 375, height: 812 },
    { width: 414, height: 896 },
    { width: 414, height: 828 },
    { width: 390, height: 844 },
    { width: 428, height: 926 },
    { width: 240, height: 320 },
    { width: 800, height: 1280 },
    { width: 384, height: 640 },
    { width: 640, height: 360 },
    { width: 412, height: 732 },
    { width: 600, height: 960 },
    { width: 320, height: 533 },
    { width: 480, height: 854 },
    { width: 411, height: 731 },
    { width: 411, height: 823 },
    { width: 393, height: 786 },
    { width: 353, height: 745 },
    { width: 393, height: 851 }
]

console.log('★★★---START---★★★')

startBrowser()

async function startBrowser() {
    try {
        let size = viewport[getRandom(0, viewport.length)]

        URL = JSON.parse(fs.readFileSync('url.json'))

        browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
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
                '--user-agent='+URL['user-agent']
            ],
            defaultViewport: {
                width: size['width'],
                height: size['height'],
                deviceScaleFactor: 2,
                isMobile: true,
                hasTouch: true,
                isLandscape: false
            }
        })
    
        page = (await browser.pages())[0]

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        // await getMyWebsite(URL['me'])
        console.log('----SUCCESS----', 1)

        await getFiveSecond(URL['adfoc'], '#showTimer[style="display: none;"]', '#showSkip > a', false)
        console.log('----SUCCESS----', 2)

        await getFiveSecond(URL['shorte'], 'span[class="skip-btn show"]', '#skip_button', true)
        console.log('----SUCCESS----', 3)

        await getOuo(URL['ouo'])
        console.log('----SUCCESS----', 4)

        await getZagl(URL['zagl'])
        console.log('----SUCCESS----', 5)

        await getDirectLink(URL['direct'])
        console.log('----SUCCESS----', 6)

        console.log('----FINISH----')
        process.exit(0)
    } catch (error) {
        console.log('----ERROR----')
        process.exit(0)
    }
}


async function getMyWebsite(url) {
    try {
        await page.bringToFront()
        await page.goto(url, { waitUntil: 'load', timeout: 0 })
        console.log('-----LOADED----')
        await delay(3000)
        
        try {
            let x = await page.evaluate(() => window.innerWidth/2 )
            let y = await page.evaluate(() => window.innerHeight/2 )

            await page.mouse.click(getRandom(x-100, x+100), getRandom(y-100, y+100))

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
        } catch (error) {}
        
        await delay(3000)
        await closeAllPage()
    } catch (error) {}
}

async function closefullAd() {
    await page.bringToFront()
    let show = await exists('div[class="_7klm5xb "]')
    if (show) {
        await page.click('div[class="_7klm5xb "]')
    }
}

async function getZagl(url) {
    try {
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

                await page.evaluate(() => {
                    let root = document.querySelectorAll('html > iframe')
                    if (root && root.length > 0) {
                        for (let i = 0; i < root.length; i++) {
                            try {
                                root[i].style.display = "none"
                            } catch (error) {}
                        }
                    }
                    
                    root = document.querySelectorAll('body > iframe')
                    if (root && root.length > 0) {
                        for (let i = 0; i < root.length; i++) {
                            try {
                                root[i].style.display = "none"
                            } catch (error) {}
                        }
                    }

                    root = document.querySelectorAll('body > div')
                    if (root && root.length > 0) {
                        for (let i = 0; i < root.length; i++) {
                            try {
                                let id = root[i].getAttribute('class')
                                if (id) {
                                    if (id != 'container') {
                                        root[i].style.display = "none"
                                    }
                                } else {
                                    root[i].style.display = "none"
                                }
                            } catch (error) {}
                        }
                    }
                })
            
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
                        $('#x').val(newX);
                        $('#y').val(newY);
                        });
                    });
                }, dataX/2, dataY)
            
                await page.click('#greendot')

                let timeout = 0

                while(true) {
        
                    timeout++
                    try {
                        await page.bringToFront()

                        await page.evaluate(() => {
                            let root = document.querySelectorAll('html > iframe')
                            if (root && root.length > 0) {
                                for (let i = 0; i < root.length; i++) {
                                    try {
                                        root[i].style.display = "none"
                                    } catch (error) {}
                                }
                            }
                            
                            root = document.querySelectorAll('body > iframe')
                            if (root && root.length > 0) {
                                for (let i = 0; i < root.length; i++) {
                                    try {
                                        root[i].style.display = "none"
                                    } catch (error) {}
                                }
                            }
            
                            root = document.querySelectorAll('body > div')
                            if (root && root.length > 0) {
                                for (let i = 0; i < root.length; i++) {
                                    try {
                                        let id = root[i].getAttribute('class')
                                        if (id) {
                                            if (id != 'container') {
                                                root[i].style.display = "none"
                                            }
                                        } else {
                                            root[i].style.display = "none"
                                        }
                                    } catch (error) {}
                                }
                            }
                        })

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
    } catch (error) {}
}

async function getFiveSecond(url, first, second, hide) {
    try {
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
                while(true) {
        
                    timeout++
                    try {
                        let skip = await exists(second)
                        await page.bringToFront()
                        
                        if (skip) {
                            await delay(150)
                            if (hide) {
                                await page.evaluate(() => {
                                    let root = document.querySelectorAll('html > iframe')
                                    if (root && root.length > 0) {
                                        for (let i = 0; i < root.length; i++) {
                                            try {
                                                root[i].style.display = "none"
                                            } catch (error) {}
                                        }
                                    }
                                    
                                    root = document.querySelectorAll('body > iframe')
                                    if (root && root.length > 0) {
                                        for (let i = 0; i < root.length; i++) {
                                            try {
                                                root[i].style.display = "none"
                                            } catch (error) {}
                                        }
                                    }

                                    root = document.querySelectorAll('body > div')
                                    if (root && root.length > 0) {
                                        for (let i = 0; i < root.length; i++) {
                                            try {
                                                let id = root[i].getAttribute('id')
                                                if (id) {
                                                    if (id != 'skip-top-bar') {
                                                        root[i].style.display = "none"
                                                    }
                                                } else {
                                                    root[i].style.display = "none"
                                                }
                                            } catch (error) {}
                                        }
                                    }
                                })
                            }
                            await delay(100)
                            await page.click(second)
                        } else {
                            timeout = 0
                            break
                        }
                    } catch (error) {
                        timeout = 0
                        break
                    }

                    if (timeout > 15) {
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
    } catch (error) {}
}

async function getOuo(url) {
    try {
        await page.bringToFront()
        await page.evaluate((url) => window.open(url), url)
            
        await delay(1000)

        let _page = await getOpenPage()
        await solveCloudFlare(_page)

        console.log('-----LOADED----')

        var start = new Date().getTime()
        while(new Date().getTime() - start < 10000) {
            try {
                await _page.bringToFront()

                let button = await _page.evaluate(() => {
                    let root = document.querySelector('button#btn-main')
                    if (root) {
                        root = document.querySelector('button#btn-main[class="btn btn-main disabled"]')
                        if (root) {
                            return false
                        }
                        return true
                    }
                    return false
                })

                if (button) {
                    await delay(3000)
                    await _page.bringToFront()
                    await _page.evaluate(() => {
                        let root = document.querySelectorAll('html > iframe')
                        if (root && root.length > 0) {
                            for (let i = 0; i < root.length; i++) {
                                try {
                                    root[i].style.display = "none"
                                } catch (error) {}
                            }
                        }
                        
                        root = document.querySelectorAll('body > iframe')
                        if (root && root.length > 0) {
                            for (let i = 0; i < root.length; i++) {
                                try {
                                    root[i].style.display = "none"
                                } catch (error) {}
                            }
                        }

                        root = document.querySelectorAll('body > div')
                        if (root && root.length > 0) {
                            for (let i = 0; i < root.length; i++) {
                                try {
                                    root[i].style.display = "none"
                                } catch (error) {}
                            }
                        }
                    })
                    await delay(250)
                    await _page.click('button#btn-main')
                    await delay(2000)
                    break
                }
            } catch (error) {}

            await delay(1000)
        }
        
        start = new Date().getTime()
        while(new Date().getTime() - start < 10000) {
        
            try {
                await _page.bringToFront()

                let button = await _page.evaluate(() => {
                    let root = document.querySelector('input[id="x-token"]')
                    if (root) {
                        root = document.querySelector('button#btn-main')
                        if (root) {
                            root = document.querySelector('button#btn-main[class="btn btn-main disabled"]')
                            if (root) {
                                return false
                            }
                            return true
                        }
                    }
                    return false
                })

                if (button) {
                    await _page.bringToFront()
                    await delay(250)
                    await _page.evaluate(() => {
                        let root = document.querySelectorAll('html > iframe')
                        if (root && root.length > 0) {
                            for (let i = 0; i < root.length; i++) {
                                try {
                                    root[i].style.display = "none"
                                } catch (error) {}
                            }
                        }
                        
                        root = document.querySelectorAll('body > iframe')
                        if (root && root.length > 0) {
                            for (let i = 0; i < root.length; i++) {
                                try {
                                    root[i].style.display = "none"
                                } catch (error) {}
                            }
                        }

                        root = document.querySelectorAll('body > div')
                        if (root && root.length > 0) {
                            for (let i = 0; i < root.length; i++) {
                                try {
                                    root[i].style.display = "none"
                                } catch (error) {}
                            }
                        }
                    })
                    await delay(250)
                    await _page.click('button#btn-main')
                    await delay(1000)
                    break
                }
            } catch (error) {}
        }

        await delay(3000)
        await closeAllPage()
    } catch (error) {}
}

async function getDirectLink(url) {
    try {
        await page.bringToFront()
        await page.goto(url, { waitUntil: 'load', timeout: 0 })
        console.log('-----LOADED----')
        await delay(2000)
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
    } catch (error) {}
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
    try {
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
    } catch (error) {}
}

async function closeAllPage() {
    try {
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
    } catch (error) {}
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


function getRandom(min, max) {
    return Math.floor((Math.random() * (max-min)) + min)
}


function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
