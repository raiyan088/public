const axios = require('axios')

const PROXY = false
let mCookes = null

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')


module.exports = class {

    async getGmail () {
        let cookies = await this.getCookies(true)

        if (cookies) {
            try {
                let gmail = null

                while (true) {
                    try {
                        if (cookies) {
                            let response = await axios.post('https://www.emailnator.com/generate-email', { 'email': [ 'plusGmail' ]}, {
                                headers: {
                                    'cookie': 'XSRF-TOKEN='+encodeURIComponent(cookies['token'])+'; gmailnator_session='+encodeURIComponent(cookies['session']),
                                    'x-requested-with': 'XMLHttpRequest',
                                    'x-xsrf-token': cookies['token']
                                },
                                maxRedirects: 0,
                                validateStatus: null
                            })

                            let data = response.data
                            try {
                                if (data['email'].length > 0) {
                                    gmail = data['email'][0]
                                    break
                                }
                            } catch (error) {
                                mCookes = null
                                cookies = await this.getCookies(false)
                            }
                        } else {
                            mCookes = null
                            await this.delay(2000)
                            cookies = await this.getCookies(false)
                        }
                    } catch (error) {}

                    if (gmail) {
                        break
                    }

                    await this.delay(3000)
                }

                return gmail
            } catch (error) {}
        }

        return null
    }

    async getVerificationLink(gmail) {
        let verification = null
        let cookies = await this.getCookies(true)

        if (cookies) {
            for (let i = 0; i < 15; i++) {
                let link = await this.waitForVerification(gmail, cookies['token'], 'XSRF-TOKEN='+encodeURIComponent(cookies['token'])+'; gmailnator_session='+encodeURIComponent(cookies['session']))
                
                if (link && link.length > 10) {
                    verification = link
                    break
                } else if (link && link == 'error') {
                    cookies = await this.getCookies(false)
                }

                await this.delay(2000)
            }
        }

        return verification
    }

    async waitForVerification(gmail, token, cookies) {

        let link = null
        let id = null

        try {
            let response = await axios.post('https://www.emailnator.com/message-list', { 'email': gmail }, {
                headers: {
                    'cookie': cookies,
                    'x-requested-with': 'XMLHttpRequest',
                    'x-xsrf-token': token
                },
                maxRedirects: 0,
                validateStatus: null,
            })
    
            try {
                let list = response.data['messageData']
    
                for (let i = 0; i < list.length; i++) {
                    let time = list[i]['time']
                    if (time == 'Just Now' || time == 'one minute ago' || time == '2 minutes ago' || time == '3 minutes ago') {
                        if (list[i]['from'].includes('no-reply@render.com')) {
                            id = list[i]['messageID']
                        }
                    }
                }
            } catch (error) {
                return 'error'
            }
    
            if (id) {
                response = await axios.post( 'https://www.emailnator.com/message-list', { 'email': gmail, 'messageID': id }, {
                    headers: {
                        'cookie': cookies,
                        'x-requested-with': 'XMLHttpRequest',
                        'x-xsrf-token': token
                    },
                    maxRedirects: 0,
                    validateStatus: null,
                })
    
                response.data.split(/\r?\n/).forEach(function(line){
                    if (line.includes('dashboard.render.com')) {
                        link = line.trim()
                    }
                })
            }
        } catch (error) {
            return 'error'
        }
    
        return link
    }

    async getCookies(store) {
        if (mCookes) {
            return mCookes
        }

        try {
            let proxy = null

            if (store) {
                let response = await axios.get(BASE_URL+'emailnator/token.json')

                try {
                    let data = response.data
                    if (data != null && data != 'null') {
                        mCookes = data
                        return mCookes
                    }
                } catch (error) {}
            }
            
            if (PROXY) {
                proxy = {
                    host: 'proxy-server.scraperapi.com',
                    port: 8001,
                    auth: {
                        username: 'scraperapi',
                        password: '5fa835872e693154a443ffcc7037d360'  
                    },
                    protocol: 'http'
                }
            }

            let response = await axios.get('https://www.emailnator.com', {
                proxy: proxy,
                maxRedirects: 0,
                validateStatus: null
            })

            let cookie = response.headers['set-cookie']

            let TOKEN = null
            let SESSION = null

            for (let i = 0; i < cookie.length; i++) {
                let line = cookie[i].split(';')
                if (line[0].startsWith('XSRF-TOKEN')) {
                    TOKEN = decodeURIComponent(line[0].substring(11, line[0].length))
                } else if (line[0].startsWith('gmailnator_session')) {
                    SESSION = decodeURIComponent(line[0].substring(19, line[0].length))
                }
            }

            mCookes = { session:SESSION, token:TOKEN }

            await axios.put(BASE_URL+'emailnator/token.json', JSON.stringify(mCookes), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })

            return mCookes
        } catch (error) {
            return null
        }
    }

    delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        })
    }
}