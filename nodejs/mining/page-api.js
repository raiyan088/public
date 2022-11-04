let browser = null

let url = ''
let colab1 = ''
let colab2 = ''
let colab3 = ''
let colab4 = ''
let colab5 = ''


module.exports = class {

    constructor (browser) {
        this.browser = browser

        this.url = this.decode('aHR0cHM6Ly9jb2xhYi5yZXNlYXJjaC5nb29nbGUuY29tL2RyaXZlLw==')
        this.colab1 = this.decode('MWFFVTFvS2VreFg0X055cUNDeDhoV1VTT3lZb0VkS0pp')
        this.colab2 = this.decode('MXFpLTViRktqRFhub2gzM0FWR1FnS0lkQlRwWXhKSDdz')
        this.colab3 = this.decode('MVB2dFdzaFg5WFBvaWYtQlpLZlNOMUtRQ0RoZTloQjhS')
        this.colab4 = this.decode('MXN1YXZVWnRxWnV0VWIwQVhXR0Zxd0tmeEUzSXNTUjhQ')
        this.colab5 = this.decode('MVpvbzhGWjhDeVRualVHZlZEa0VwSVJsRlpmakdUNnRD')

    }

    async newPage(callback, cookies, id) {
        let map = {}
        let page = null
        let colab = this.getUrl(id)
        if(id == 1) {
            page = (await this.browser.pages())[0]
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

    decode(str) {
        return Buffer.from(str, 'base64').toString('ascii')
    }
}
