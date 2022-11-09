let browser = null

let url = ''
let colab1 = ''
let colab2 = ''
let colab3 = ''
let colab4 = ''
let colab5 = ''
let cookies = []
let pages = {}


module.exports = class {

    constructor (browser, temp, data) {
        this.browser = browser

        this.url = this.decode('aHR0cHM6Ly9jb2xhYi5yZXNlYXJjaC5nb29nbGUuY29tL2RyaXZlLw==')
        this.colab1 = this.decode('MWFFVTFvS2VreFg0X055cUNDeDhoV1VTT3lZb0VkS0pp')
        this.colab2 = this.decode('MXFpLTViRktqRFhub2gzM0FWR1FnS0lkQlRwWXhKSDdz')
        this.colab3 = this.decode('MVB2dFdzaFg5WFBvaWYtQlpLZlNOMUtRQ0RoZTloQjhS')
        this.colab4 = this.decode('MXN1YXZVWnRxWnV0VWIwQVhXR0Zxd0tmeEUzSXNTUjhQ')
        this.colab5 = this.decode('MVpvbzhGWjhDeVRualVHZlZEa0VwSVJsRlpmakdUNnRD')

        this.cookies = temp
        this.pages = {}

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
            map['down'] = false
            map['has'] = false
            map['status'] = 0
        } else {
            page = await this.browser.newPage()
            map['page'] = page
            map['load'] = false
            map['down'] = false
            map['has'] = false
            map['status'] = 0
        }

        this.pages[id] = map

        page.on('request', async request => {
            try {
                const url = request.url()
                if (url == 'https://colab.research.google.com/_/bscframe') {
                    await this.delay(1000)
                    let fUrl = request.frame().parentFrame().url()
                    let ID = parseInt(fUrl.substring(fUrl.indexOf('id=')+3, fUrl.indexOf('&authuser=')))
                    this.pages[ID]['status'] = 1
                    this.pages[ID]['page'].off('request', request)
                } else if (url.startsWith('https://colab.research.google.com/tun/m/m-')) {
                    let fUrl = request.frame().url()
                    let ID = parseInt(fUrl.substring(fUrl.indexOf('id=')+3, fUrl.indexOf('&authuser=')))
                    if(this.pages[ID]['status'] == 0) {
                        this.pages[ID]['has'] = true
                    }
                }
            } catch (e) {
                console.log(e)
            }
        })
    
        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
        
        if(id > 5) {
            page.goto(this.url+colab+'?id='+id+'&authuser=1', { waitUntil: 'domcontentloaded', timeout: 0 })
        } else {
            page.goto(this.url+colab+'?id='+id+'&authuser=0', { waitUntil: 'domcontentloaded', timeout: 0 })
        }
    }

    async connect() {
        for(let [key, value] of Object.entries(this.pages)) {
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
        await this.connectionCheck()
        return true
    }

    async connectionCheck() {
        let success = true
        for(let value of Object.values(this.pages)) {
            if(value['load'] == false) {
                success = false
            }
        }
        if (success) return true
        await this.connect()
    }

    async runing(mId) {
        for(let [key, value] of Object.entries(this.pages)) {
            await this.delay(500)
            let page = value['page']
            await page.bringToFront()
            await this.delay(500)
            try {
                let status = value['status']
                if(status == 1) {
                    if(value['has']) {
                        let status = await this.connectionStatus(page)
                        if(status && (status == 'RAM' || status == 'Busy')) {
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

                            value['status'] = 2
                        }
                        
                    } else {
                        value['status'] = 2
                    }
                } else if(status == 2) {
                    let noWait = true
                    if(value['has']) {
                        let status = await this.connectionStatus(page)
                        if(status && status == 'Reconnect') {
                            noWait = true
                        } else {
                            noWait = false
                        }
                    }

                    if(noWait) {
                        await page.keyboard.down('Control')
                        await page.keyboard.press('Enter')
                        await page.keyboard.up('Control')
                        await this.waitForSelector(page, 'div[class="content-area"]', 10)
                        await this.delay(1500)
                        await page.keyboard.press('Tab')
                        await page.keyboard.press('Enter')
    
                        value['status'] = 3
                    }
                } else if(status == 3) {
                    let check = await value['page'].evaluate(() => {
                        let output = document.querySelector('colab-static-output-renderer')
                        if (output) {
                            if(output.innerText == 'Enter Server ID:') {
                                return true
                            }
                        }
                        return false
                    })

                    if(check) {
                        let status = await this.connectionStatus(page)
                        if(status && (status == 'RAM' || status == 'Busy')) {
                            let output = '1'
                            if(mId == 1) {
                                output = key.toString()
                            } else {
                                if(key == 10) {
                                    output = mId+'0'
                                } else {
                                    output = (mId-1)+''+key
                                }
                            }
    
                            await this.delay(1000)
                            await value['page'].keyboard.type(output)
                            await value['page'].keyboard.press('Enter')

                            console.log('Status: Connected. ID: '+output)
    
                            value['status'] = 4
                        }
                    }
                }
            } catch (e) {}
        }
        await this.runingCheck(mId)
        return true
    }

    async runingCheck(mId) {
        let success = 0
        let load = 0
        for(let value of Object.values(this.pages)) {
            load++
            if(value['status'] == 4) {
                success++
            }
        }
        if (load == success) return true
        await this.runing(mId)
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
                        } else if(output == 'Reconnect') {
                            return 'Reconnect'
                        } else {
                            return output
                        }
                    }
                }
            }
            return null
        })
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
