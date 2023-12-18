const puppeteer = require('puppeteer')


let browser = null
let page = null
let ID = null

let mUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

let mData = Buffer.from('W3sibmFtZSI6Il9nYV9GWlBLN0s2TlhMIiwidmFsdWUiOiJHUzEuMS4xNzAyOTE1MTI4LjEuMS4xNzAyOTE1OTMxLjM5LjAuMCIsImRvbWFpbiI6Ii5lby5maW5hbmNlIiwicGF0aCI6Ii8iLCJleHBpcmVzIjoxNzM3NDc1OTMxLjc2MTQ1OSwic2l6ZSI6NTIsImh0dHBPbmx5IjpmYWxzZSwic2VjdXJlIjpmYWxzZSwic2Vzc2lvbiI6ZmFsc2UsInNhbWVQYXJ0eSI6ZmFsc2UsInNvdXJjZVNjaGVtZSI6IlNlY3VyZSIsInNvdXJjZVBvcnQiOjQ0M30seyJuYW1lIjoiX2dhIiwidmFsdWUiOiJHQTEuMS45MzYwOTYwNzguMTcwMjkxNTEyOCIsImRvbWFpbiI6Ii5lby5maW5hbmNlIiwicGF0aCI6Ii8iLCJleHBpcmVzIjoxNzM3NDc1OTMxLjczMjkxNywic2l6ZSI6MjksImh0dHBPbmx5IjpmYWxzZSwic2VjdXJlIjpmYWxzZSwic2Vzc2lvbiI6ZmFsc2UsInNhbWVQYXJ0eSI6ZmFsc2UsInNvdXJjZVNjaGVtZSI6IlNlY3VyZSIsInNvdXJjZVBvcnQiOjQ0M30seyJuYW1lIjoiX19ncGkiLCJ2YWx1ZSI6IlVJRD0wMDAwMGNiNGI1MjY1YWZmOlQ9MTcwMjkxNTEyODpSVD0xNzAyOTE1OTExOlM9QUxOSV9NWUNVVkFuVjRfeFd5TEdGYmw3clBOQ3QwN2N2USIsImRvbWFpbiI6Ii5lby5maW5hbmNlIiwicGF0aCI6Ii8iLCJleHBpcmVzIjoxNzM2NjExMTI4LCJzaXplIjo4OSwiaHR0cE9ubHkiOmZhbHNlLCJzZWN1cmUiOmZhbHNlLCJzZXNzaW9uIjpmYWxzZSwic2FtZVBhcnR5IjpmYWxzZSwic291cmNlU2NoZW1lIjoiU2VjdXJlIiwic291cmNlUG9ydCI6NDQzfSx7Im5hbWUiOiJGQ05FQyIsInZhbHVlIjoiJTVCJTVCJTIyQUtzUm9sX0RGM0t6R2RjRXE0QkNIWVpDLVZfckt5dFhpX2hsazVmOXFrZzRBZFJkcmx6cVFxQXRjN1VMT09BSFNCSFlHSHY5Ni1EVE1Xa2E5Z1JhQmx3aVl5Zk9oNEpXNEQ3T2xqalF1VllvcEE1R0FPVDZSR2ZLdmpfM0p5OGt4RWQ0dmNzZF9Zd1B1cWUtMkRxd0o2dDM5Y2Exek55MldBJTNEJTNEJTIyJTVEJTVEIiwiZG9tYWluIjoiLmVvLmZpbmFuY2UiLCJwYXRoIjoiLyIsImV4cGlyZXMiOjE3MzQ0NTE5MzMsInNpemUiOjE5MSwiaHR0cE9ubHkiOmZhbHNlLCJzZWN1cmUiOmZhbHNlLCJzZXNzaW9uIjpmYWxzZSwic2FtZVBhcnR5IjpmYWxzZSwic291cmNlU2NoZW1lIjoiU2VjdXJlIiwic291cmNlUG9ydCI6NDQzfSx7Im5hbWUiOiJfZ2lkIiwidmFsdWUiOiJHQTEuMi4xMjAwNzY4MTAyLjE3MDI5MTUxMjgiLCJkb21haW4iOiIuZW8uZmluYW5jZSIsInBhdGgiOiIvIiwiZXhwaXJlcyI6MTcwMzAwMjMzMCwic2l6ZSI6MzEsImh0dHBPbmx5IjpmYWxzZSwic2VjdXJlIjpmYWxzZSwic2Vzc2lvbiI6ZmFsc2UsInNhbWVQYXJ0eSI6ZmFsc2UsInNvdXJjZVNjaGVtZSI6IlNlY3VyZSIsInNvdXJjZVBvcnQiOjQ0M30seyJuYW1lIjoiX2djbF9hdSIsInZhbHVlIjoiMS4xLjgzMDA4OTg0LjE3MDI5MTUxMjkiLCJkb21haW4iOiIuZW8uZmluYW5jZSIsInBhdGgiOiIvIiwiZXhwaXJlcyI6MTcxMDY5MTEyOSwic2l6ZSI6MzAsImh0dHBPbmx5IjpmYWxzZSwic2VjdXJlIjpmYWxzZSwic2Vzc2lvbiI6ZmFsc2UsInNhbWVQYXJ0eSI6ZmFsc2UsInNvdXJjZVNjaGVtZSI6IlNlY3VyZSIsInNvdXJjZVBvcnQiOjQ0M30seyJuYW1lIjoidG9rZW4iLCJ2YWx1ZSI6ImFiNWU0YjM5ODQ1M2Q2NWQ4ZWQ0ZGJiNDAwZTdhZDVlYWU4MDIyYzk3OTFiYzFmMGQ4MTNiNmFjYTM2ZmQ4NTI2YjZjY2IyZjVmZjEzY2M2ZmUxMTFmYzRkZTUyMDk5Zjg5MjU3YzE3YTg0MGMzNDhiMWQ3NmUxYTljY2FiZjdiIiwiZG9tYWluIjoiLmVvLmZpbmFuY2UiLCJwYXRoIjoiLyIsImV4cGlyZXMiOjE3Mzc0NzUxNzkuMDIxMTQ5LCJzaXplIjoxMzMsImh0dHBPbmx5IjpmYWxzZSwic2VjdXJlIjpmYWxzZSwic2Vzc2lvbiI6ZmFsc2UsInNhbWVQYXJ0eSI6ZmFsc2UsInNvdXJjZVNjaGVtZSI6IlNlY3VyZSIsInNvdXJjZVBvcnQiOjQ0M30seyJuYW1lIjoiX19nYWRzIiwidmFsdWUiOiJJRD0zMDM5YWY1MzViYzMzYTE3OlQ9MTcwMjkxNTEyODpSVD0xNzAyOTE1OTExOlM9QUxOSV9NWkVHT0owQjhfYjNHblFNVGlKaTJXNmg2VlA1QSIsImRvbWFpbiI6Ii5lby5maW5hbmNlIiwicGF0aCI6Ii8iLCJleHBpcmVzIjoxNzM2NjExMTI4LCJzaXplIjo4OSwiaHR0cE9ubHkiOmZhbHNlLCJzZWN1cmUiOmZhbHNlLCJzZXNzaW9uIjpmYWxzZSwic2FtZVBhcnR5IjpmYWxzZSwic291cmNlU2NoZW1lIjoiU2VjdXJlIiwic291cmNlUG9ydCI6NDQzfSx7Im5hbWUiOiJfZ2FfRjhEUlNTRTJTMCIsInZhbHVlIjoiR1MxLjIuMTcwMjkxNTEyOS4xLjEuMTcwMjkxNTkzMC4wLjAuMCIsImRvbWFpbiI6Ii5lby5maW5hbmNlIiwicGF0aCI6Ii8iLCJleHBpcmVzIjoxNzM3NDc1OTMwLjI3OTYzOCwic2l6ZSI6NTEsImh0dHBPbmx5IjpmYWxzZSwic2VjdXJlIjpmYWxzZSwic2Vzc2lvbiI6ZmFsc2UsInNhbWVQYXJ0eSI6ZmFsc2UsInNvdXJjZVNjaGVtZSI6IlNlY3VyZSIsInNvdXJjZVBvcnQiOjQ0M30seyJuYW1lIjoidXNlcklkIiwidmFsdWUiOiI0MTU4MjUyNTgiLCJkb21haW4iOiIuZW8uZmluYW5jZSIsInBhdGgiOiIvIiwiZXhwaXJlcyI6MTczNzQ3NTE3OS4wMjE1NDEsInNpemUiOjE1LCJodHRwT25seSI6ZmFsc2UsInNlY3VyZSI6ZmFsc2UsInNlc3Npb24iOmZhbHNlLCJzYW1lUGFydHkiOmZhbHNlLCJzb3VyY2VTY2hlbWUiOiJTZWN1cmUiLCJzb3VyY2VQb3J0Ijo0NDN9XQ==', 'base64').toString('ascii')

let cookies = JSON.parse(mData)


process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            if (data.toString().length == 1) {
                ID = '?worker=00'+data
            } else if (data.toString().length == 2) {
                ID = '?worker=0'+data
            } else {
                ID = '?worker='+data
            }

            browserStart()
        }
    } catch (error) {
        ID = ''
        browserStart()
    }
})

async function browserStart() {

    try {
        console.log('-----START-----')

        browser = await puppeteer.launch({
            headless: false,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage',
                '--user-agent='+mUserAgent
            ]
        })
    
        page = (await browser.pages())[0]

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

        let time = new Date().getTime()

        page.on('console', async (msg) => {
            try {
                const txt = msg.text()
                if (txt.startsWith('STATUS:')) {
                    let now = new Date().getTime()
                    if (time < now) {
                        time = now+5000
                        console.log(JSON.parse(txt.substring(8,txt.length)))
                    }
                }
            } catch (error) {}
        })

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        //await getFiveSecond('http://festyy.com/ehD5hw', 'span[class="skip-btn show"]', '#skip_button')

        console.log('----SUCCESS----', 1)

        //await getFiveSecond('https://adfoc.us/84368198903866', '#showTimer[style="display: none;"]', '#showSkip > a')
 
        console.log('----SUCCESS----', 2)

        await page.setCookie(...cookies)
        
        await page.bringToFront()

        //await page.goto('https://server-088.vercel.app/'+ID, { waitUntil: 'load', timeout: 0 })
        await page.goto('https://miner.eo.finance/', { waitUntil: 'load', timeout: 0 })

        console.log('-----FINISH----')

        while (true) {
            try {
                let hashrate = await page.evaluate(() => document.querySelector('#hashrate').innerText)
                console.log('Hashrate: '+hashrate)
            } catch (error) {}

            await delay(5000)
        }
    } catch (error) {
        console.log(error)
        console.log('-----ERROR-----')
        process.exit(0)
    }
}


async function getFiveSecond(url, first, second) {
    await page.bringToFront()
    await page.goto(url, { waitUntil: 'load', timeout: 0 })
    console.log('-----LOADED----')

    let _timeout = 0

    while (true) {
        await page.bringToFront()
        await delay(1000)
        let timeout = 0
        _timeout++

        while (true) {
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
            while (true) {
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

    await delay(1000)
    await closeAllPage()
}

async function closeAllPage() {
    let pages =  await browser.pages()

    await pages[0].goto('about:blank')

    for (let i = 1; i < pages.length; i++) {
        try {
            await pages[i].goto('about:blank')
            await delay(500)
            await pages[i].close()
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

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
