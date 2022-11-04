let browser = null

let url = ''
let colab1 = ''
let colab2 = ''
let colab3 = ''
let colab4 = ''
let colab5 = ''
let cookies = []


module.exports = class {

    constructor (browser, temp, data) {
        this.browser = browser

        this.url = this.decode('aHR0cHM6Ly9jb2xhYi5yZXNlYXJjaC5nb29nbGUuY29tL2RyaXZlLw==')
        this.colab1 = this.decode('MXZLdTZOOVpmRzBIOXQ4b2Uxc0FrTWdvQjM4N2NTcjFw')
        this.colab2 = this.decode('MW1fR2lPcHFZU09nZXM3ejZFTGFwTVJUNWJ6NlVMUHNN')
        this.colab3 = this.decode('MVFKR3ZZdW1oOTAwRGpCYmRQQ3I5cno4UkRUX2RmZDBn')
        this.colab4 = this.decode('MVd5d1pEaFkySTR2VUt1NHpVaU01cnRQYzRtd2UzZmdR')
        this.colab5 = this.decode('MUU5VUxEaDhJbkVic2M2aFRrc0VLcmhnMmlKVjdHdVZw')

        this.cookies = temp

        this.cookies.forEach(function (value) {
            if (value.name == 'SSID') {
                value.value = data['SSID']
            } else if (value.name == 'SAPISID') {
                value.value = data['SAPISID']
            } else if (value.name == 'SID') {
                value.value = data['SID']
            } else if (value.name == '__Secure-1PSID') {
                value.value = data['1PSID']
            } else if (value.name == 'HSID') {
                value.value = data['HSID']
            }
        })
    }

    async newPage(id) {
        let map = {}
        let page = null
        let colab = this.getUrl(id)
        if(id == 1) {
            page = (await this.browser.pages())[0]
            await page.setCookie(...this.cookies)
            map['page'] = page
            map['load'] = false
            map['status'] = 0
        } else {
            page = await this.browser.newPage()
            map['page'] = page
            map['load'] = false
            map['status'] = 0
        }
        
        if(id > 5) {
            page.goto(this.url+colab+'?authuser=1', { waitUntil: 'domcontentloaded', timeout: 0 })
        } else {
            page.goto(this.url+colab+'?authuser=0', { waitUntil: 'domcontentloaded', timeout: 0 })
        }
        return map
    }

    async connect(pages) {
        for(let [key, value] of Object.entries(pages)) {
            await this.delay(500)
            if(value['load'] == false) {
                try {
                    let output = await value['page'].evaluate(() => { if(document && document.querySelector('colab-connect-button')) return true })
                    if(output) {
                        console.log('Status: Webside load Success... ID: '+key)
                        value['load'] = true
                    }
                } catch (e) {}
            }
        }
        await this.connectionCheck(pages)
        return true
    }

    async connectionCheck(pages) {
        let success = true
        for(let value of Object.values(pages)) {
            if(value['load'] == false) {
                success = false
            }
        }
        if (success) return true
        await this.connect(pages)
    }

    async runing(pages) {
        for(let [key, value] of Object.entries(pages)) {
            await this.delay(500)
            let page = value['page']
            await page.bringToFront()
            await this.delay(500)
            if(value['status'] == 0) {
                try {
                    let status = await this.connectionStatus(page)

                    if(status && (status == 'Connect' || status == 'RAM' || status == 'Busy')) {
                        if(status == 'Busy' || status == 'RAM') {
                            await page.click('#runtime-menu-button')
                            for (var j = 0; j < 9; j++) {
                                await page.keyboard.press('ArrowDown')
                            }
                            await this.delay(420)
                            await page.keyboard.down('Control')
                            await page.keyboard.press('Enter')
                            await page.keyboard.up('Control')
                            await this.waitForSelector(page, 'div[class="content-area"]', 10)
                            await page.keyboard.press('Enter')
                            await this.delay(1000)
                        }
                        await page.keyboard.down('Control')
                        await page.keyboard.press('Enter')
                        await page.keyboard.up('Control')
                        await this.waitForSelector(page, 'div[class="content-area"]', 10)
                        await this.delay(1500)
                        await page.keyboard.press('Tab')
                        await page.keyboard.press('Enter')
                        console.log('Status: Connected. ID: '+key)

                        value['status'] = 1
                    }
                } catch (e) {
                    console.log(e)
                }
            }
        }
        await this.runingCheck(pages)
        return true
    }

    async runingCheck(pages) {
        let success = true
        for(let value of Object.values(pages)) {
            if(value['status'] == 0) {
                success = false
            }
        }
        if (success) return true
        await this.runing(pages)
    }

    async connectionStatus(page) {
        return await page.evaluate(() => {
            let colab = document.querySelector('colab-connect-button')
            if(colab) {
                let display = colab.shadowRoot.querySelector('#connect-button-resource-display')
                if (display) {
                    let ram = display.querySelector('.ram')
                    if (ram) {
                        let output = ram.shadowRoot.querySelector('.label').innerText
                        if(output) {
                            return 'RAM'
                        }
                    }
                } else {
                    let connect = colab.shadowRoot.querySelector('#connect')
                    if (connect) {
                        let output = connect.innerText
                        if(output == 'Busy') {
                            return 'Busy'
                        } else if(output == 'Connect') {
                            return 'Connect'
                        }
                    }
                }
            }
            return null
        })
    }

    getUrl(i) {
        let colab = null
        if(i == 1 || i == 6) {
            colab = this.colab1
        } else if(i == 2 || i == 7) {
            colab = this.colab2
        } else if(i == 3 || i == 8) {
            colab = this.colab3
        } else if(i == 4 || i == 9) {
            colab = this.colab4
        } else if(i == 5 || i == 10) {
            colab = this.colab5
        }
        return colab
    }

    async waitForSelector(page, command, loop) {
        for (let i = 0; i < loop; i++) {
            await this.delay(500)
            const value = await page.evaluate((command) => { return document.querySelector(command) }, command)
            if (value) i = loop
        }
    }

    async delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time)
        })
    }

    decode(str) {
        return Buffer.from(str, 'base64').toString('ascii')
    }
}
