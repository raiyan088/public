let colab = 'https://colab.research.google.com/drive/'
let mPageLoad = 0

module.exports = class {

    connect(browser, id, url, cookies, checkStart, callback) {
        ;(async () => {

            mPageLoad = 0

            let list = await browser.pages()
            let page = null
            if(list.length == id) {
                page = list[0]
            } else {
                page = await browser.newPage()
            }

            callback('page', page)

            await page.setCookie(...cookies)

            page.on('request', async request => {
                const url = request.url()
                if (url == 'https://colab.research.google.com/_/bscframe') {
                    if (mPageLoad == 0) {
                        await this.delay(2000)
                        mPageLoad = 2
                        console.log('Status: Webside load Success... ID: ' + id)
                        if(checkStart) {
                            await this.waitForConnect(page)
                            await this.delay(1000)
                            await page.click('#runtime-menu-button')
                            for (var i = 0; i < 9; i++) {
                                await page.keyboard.press('ArrowDown')
                            }
                            await this.delay(420)
                            await page.keyboard.down('Control')
                            await page.keyboard.press('Enter')
                            await page.keyboard.up('Control')
                            await this.waitForSelector(page, 'div[class="content-area"]', 10)
                            await page.keyboard.press('Enter')
                            await this.delay(2000)
                        }
                        await page.keyboard.down('Control')
                        await page.keyboard.press('Enter')
                        await page.keyboard.up('Control')
                        await this.waitForSelector(page, 'div[class="content-area"]', 10)
                        await this.delay(1000)
                        await page.keyboard.press('Tab')
                        await page.keyboard.press('Enter')
                        await this.waitForConnect(page)
                        console.log('Status: Connected. ID: ' + id)
                        mPageLoad = 1
                        await this.delay(1000)
                        callback('completed', parseInt(new Date().getTime() / 1000))
                    }
                } else if (url.startsWith('https://www.google.com/recaptcha/api2/bframe')) {
                    await page.evaluate(() => { let recapture = document.querySelector('colab-recaptcha-dialog'); if (recapture) { recapture.shadowRoot.querySelector('mwc-button').click() } })
                } else if (url.startsWith('https://colab.research.google.com/tun/m/m-')) {
                    if (mPageLoad != 1) {
                        checkStart = true
                    }
                }
            })

            page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

            if(id > 5) {
                await page.goto(colab+url+'?authuser=1', { waitUntil: 'domcontentloaded', timeout: 0 })
            } else {
                await page.goto(colab+url+'?authuser=0', { waitUntil: 'domcontentloaded', timeout: 0 })
            }
        })()
    }

    async waitForSelector(page, command, loop) {
        for (let i = 0; i < loop; i++) {
            await this.delay(500)
            const value = await page.evaluate((command) => { return document.querySelector(command) }, command)
            if (value) i = loop
        }
    }
    
    async waitForConnect(page) {
        for (let i = 0; i < 60; i++) {
            await this.delay(1000)
            const value = await page.evaluate(() => {
                let colab = document.querySelector('colab-connect-button')
                if (colab) {
                    let display = colab.shadowRoot.querySelector('#connect-button-resource-display')
                    if (display) {
                        let ram = display.querySelector('.ram')
                        if (ram) {
                            let output = ram.shadowRoot.querySelector('.label').innerText
                            if (output) {
                                return 'RAM'
                            }
                        }
                    } else {
                        let connect = colab.shadowRoot.querySelector('#connect')
                        if (connect) {
                            let output = connect.innerText
                            if (output == 'Busy') {
                                return 'Busy'
                            }
                        }
                    }
                }
                return null
            })
            if (value) i = 60
        }
    }

    async delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time)
        })
    }
}
