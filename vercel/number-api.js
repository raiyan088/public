const axios = require('axios')

let mList = []

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')


module.exports = class {

    async getMobileNumber() {
        try {
            let number = null

            while (true) {
                if (mList.length == 0) {
                    try {
                        let response = await await axios.post('https://smsfree.cc/api', '', {
                            params: {
                                'do': 'Home'
                            },
                            headers: {
                                'Host': 'smsfree.cc',
                                'Content-Length': '0',
                                'Sec-Ch-Ua': '"Not A(Brand";v="99", "Android WebView";v="121", "Chromium";v="121"',
                                'Accept': 'application/json, text/plain, */*',
                                'Sec-Ch-Ua-Mobile': '?1',
                                'User-Agent': 'uni-appMozilla/5.0 (Linux; Android 10; Mi 9T Pro Build/QKQ1.190825.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/121.0.6167.143 Mobile Safari/537.36 uni-app',
                                'Sec-Ch-Ua-Platform': '"Android"',
                                'X-Requested-With': 'com.receivesms.online',
                                'Sec-Fetch-Site': 'cross-site',
                                'Sec-Fetch-Mode': 'cors',
                                'Sec-Fetch-Dest': 'empty',
                                'Accept-Encoding': 'gzip, deflate',
                                'Accept-Language': 'en,en-US;q=0.9',
                                'Connection': 'close'
                            }
                        })

                        let body = response.data
                        let phone = body['Rand']
                        for (let i = 0; i < phone.length; i++) {
                            try {
                                if (phone[i]['status'] == 'online' && phone[i]['signal'] > 50) {
                                    mList.push(phone[i]['phone'])
                                }
                            } catch (error) {}
                        }
                    } catch (error) {}    
                }

                while (true) {
                    if (mList.length > 0) {
                        try {
                            let response = await axios.get(BASE_URL+'number/vercel/number/'+mList[0]+'.json')
                            let data = response.data

                            if (data == null || data == 'null') {
                                number = mList[0]
                                let upload = {}
                                upload[number] = 'x'

                                try {
                                    await axios.patch(BASE_URL+'number/vercel/number.json', JSON.stringify(upload), {
                                        headers: {
                                            'Content-Type': 'application/x-www-form-urlencoded'
                                        }
                                    })
                                } catch (error) {}
                                break
                            } else {
                                mList.shift()
                                number = null
                            }
                        } catch (error) {}
                    } else {
                        break
                    }

                    await this.delay(1000)
                }

                if (number) {
                    break
                }

                await this.delay(1000)
            }

            return '+'+number
        } catch (error) {}

        return null
    }

    async getVerificationCode(number, page) {
        let otp = null

        try {
            let timeout = 0
            let url = 'https://temporary-phone-number.com/'+this.getCountryName(number)+'-Phone-Number/'+number.replace('+', '')

            while (true) {
                timeout++
                await page.bringToFront()
                await page.goto(url)

                otp = await page.evaluate(() => {
                    let otp = null
                    let list = document.querySelectorAll('div[class="direct-chat-text"]')
                    if (list.length > 0) {
                        for (let i = 0; i < list.length; i++) {
                            try {
                                if (list[i].innerText.includes('Your Vercel verification code')) {
                                    let time = list[i].parentElement.querySelector('time').innerText

                                    if (time.includes('just now') || time.includes('seconds ago') || time.includes('1 mins ago')) {
                                        otp = list[i].querySelector('b').innerText
                                        break
                                    }
                                } else {
                                    let from = list[i].parentElement.querySelector('span').innerText
                                    if (from.includes('From VERCEL')) {
                                        otp = list[i].querySelector('b').innerText
                                        break
                                    }
                                }
                            } catch (error) {}
                        }
                    }
                    return otp
                })

                if (otp) {
                    break
                }

                if (timeout > 10) {
                    break
                }

                await this.delay(5000)
            }

        } catch (error) {}

        await this.delay(500)

        try {
            await page.close()
        } catch (error) {}

        return otp
    }

    delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        })
    }

    getCountryName(number) {
        if (number.startsWith('+31')) {
            return 'Netherlands'
        } else if (number.startsWith('+33')) {
            return 'France'
        } else if (number.startsWith('+45')) {
            return 'Denmark'
        } else if (number.startsWith('+44')) {
            return 'UK'
        } else if (number.startsWith('+358')) {
            return 'Finland'
        } else if (number.startsWith('+46')) {
            return 'Sweden'
        } else if (number.startsWith('+34')) {
            return 'Spain'
        } else if (number.startsWith('+1')) {
            return 'US'
        } else if (number.startsWith('+32')) {
            return 'Belgium'
        } else if (number.startsWith('+7')) {
            return 'Russia'
        } else if (number.startsWith('+372')) {
            return 'Estonia'
        } else if (number.startsWith('+31')) {
            return 'Netherlands'
        } else if (number.startsWith('+31')) {
            return 'Netherlands'
        } else if (number.startsWith('+31')) {
            return 'Netherlands'
        } else if (number.startsWith('+31')) {
            return 'Netherlands'
        } else if (number.startsWith('+31')) {
            return 'Netherlands'
        }
    }
}