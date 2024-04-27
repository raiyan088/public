const axios = require('axios')

const PROXY = true
let mCookes = null
let mProxy = null
let mToken = null
let mTimesTamp = 0
let mTempCookies = {}

const CLIENT_ID = '1088513366507-a9uvbpfut61ol1cd2nh9qqrdabblne6i.apps.googleusercontent.com'
const CLIENT_SECRET = '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'

if (PROXY) {
    mProxy = {
        host: '38.154.227.167',
        port: 5868,
        auth: {
            username: 'spjybgcy',
            password: 'beatqienekqp'  
        },
        protocol: 'http'
    }
}

let BASE_URL = Buffer.from('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')


module.exports = class {

    async getAccessToken(refresh_token) {
        try {
            const response = await axios.post('https://oauth2.googleapis.com/token',
                new URLSearchParams({
                  'client_id': CLIENT_ID,
                  'client_secret': CLIENT_SECRET,
                  'refresh_token': refresh_token,
                  'grant_type': 'refresh_token'
                })
            )

            return response.data.access_token
        } catch (error) {}

        return null
    }

    async getTotalMail(token) {
        try {
            let responce = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
                headers: {
                    'Authorization': 'Bearer '+token,
                    'Content-Type': 'application/json; charset=UTF-8'
                }
            })

            return responce.data.messagesTotal
        } catch (error) {}

        return 0
    }

    async getGithubLink(token, prev) {
        let link = null
        
        for (let i = 0; i < 30; i++) {
            let total = await this.getTotalMail(token)

            if (prev < total) {
                try {
                    let responce = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1', {
                        headers: {
                            'Authorization': 'Bearer '+token,
                            'Content-Type': 'application/json; charset=UTF-8'
                        }
                    })

                    let id = responce.data.messages[0].id

                    if (id) {
                        responce = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages/'+id, {
                            headers: {
                                'Authorization': 'Bearer '+token,
                                'Content-Type': 'application/json; charset=UTF-8'
                            }
                        })

                        let base64 = responce.data.payload.parts[0].body.data
                        if (base64) {
                            let text = Buffer.from(base64, 'base64').toString('ascii')
                            
                            text.split(/\r?\n/).forEach(function(line){
                                if (line.includes('https://github.com/users/') && line.includes('confirm_verification')) {
                                    link = line.trim()
                                    if (link.includes('?')) {
                                        link = link.substring(0, link.indexOf('?'))
                                    }
                                }
                            })
                        }
                    }
                } catch (error) {}

                break
            }

            await this.delay(1000)
        }
        
        return link
    }

    async getGmail() {
        try {
            let response = await axios.post('https://smailpro.com/app/key', { 'domain': 'gmail.com', 'username': 'random', 'server': 'server-1', 'type': 'alias' }, {
                headers: this.getHeader()
            })

            let token = response.data.items

            response = await axios.get('https://api.sonjj.com/email/gm/get', {
                params: {
                    'key': token,
                    'rapidapi-key': 'f871a22852mshc3ccc49e34af1e8p126682jsn734696f1f081',
                    'domain': 'gmail.com',
                    'username': 'random',
                    'server': 'server-1',
                    'type': 'alias'
                },
                headers: this.getHeader()
            })

            let data = response.data.items

            mTimesTamp = data.timestamp

            return data.email.replace('@gmail.com', '')
        } catch (error) {}

        return null
    }

    async getVerificationLink(gmail) {
        let verification = null
        
        for (let i = 0; i < 30; i++) {
            try {
                let response = await axios.post('https://smailpro.com/app/key', { 'email': gmail+'@gmail.com', 'timestamp': mTimesTamp }, {
                    headers: this.getHeader()
                })
    
                let token = response.data.items
    
                response = await axios.get('https://api.sonjj.com/email/gm/check', {
                    params: {
                        'key': token,
                        'rapidapi-key': 'f871a22852mshc3ccc49e34af1e8p126682jsn734696f1f081',
                        'email': gmail+'@gmail.com',
                        'timestamp': mTimesTamp
                    },
                    headers: this.getHeader()
                })
    
                let list = response.data.items
                let id = null

                for (let i = 0; i < list.length; i++) {
                    try {
                        if (list[i]['textFrom'].includes('GitHub') && list[i]['textSubject'].includes('Please verify your email address')) {
                            if (new Date().getTime()-(new Date(list[i]['textDate']).getTime()-3600000) < 1200000) {
                                if (id == null) {
                                    id = list[i]['mid']
                                    break
                                }
                            }
                        }
                    } catch (error) {}
                }

                if (id) {
                    response = await axios.post('https://smailpro.com/app/key', { 'email': gmail+'@gmail.com', 'message_id': id }, {
                        headers: this.getHeader()
                    })
        
                    token = response.data.items

                    response = await axios.get('https://api.sonjj.com/email/gm/read', {
                        params: {
                            'key': token,
                            'rapidapi-key': 'f871a22852mshc3ccc49e34af1e8p126682jsn734696f1f081',
                            'email': gmail+'@gmail.com',
                            'message_id': id
                        },
                        headers: this.getHeader()
                    })

                    let body = response.data.items.body

                    body.split(/\r?\n/).forEach(function(line){
                        if (line.includes('https://github.com/users/') && line.includes('confirm_verification')) {
                            try {
                                let temp = line.trim()
                                temp = temp.substring(temp.lastIndexOf('https'), temp.length)
                                verification = temp.substring(0, temp.indexOf('</'))
                            } catch (error) {}
                        }
                    })
                }
            } catch (error) {}

            if (verification) {
                break
            }

            await this.delay(3000)
        }

        return verification
    }

    async getGmailToken() {
        let gmail = null
        
        mTempCookies = {}

        try {
            let response = await axios.get('https://www.emailtemp.xyz/en', {
                headers: {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'accept-language': 'en-US,en;q=0.9',
                    'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
                },
                maxRedirects: 0,
                validateStatus: null
            })

            let data = response.data
            
            data = data.substring(data.indexOf('csrf-token'), data.indexOf('csrf-token')+200)
            data = data.substring(data.indexOf('content'), data.length)
            data = data.substring(data.indexOf('"')+1, data.length)
            
            mToken = data.substring(0,data.indexOf('"'))

            await this.setCookies(response)

            while (true) {
                try {
                    response = await axios.post('https://www.emailtemp.xyz/messages',
                        new URLSearchParams({
                            '_token': mToken,
                            'captcha': ''
                        }),
                        {
                            headers: {
                                'accept': '*/*',
                                'accept-language': 'en-US,en;q=0.9',
                                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                'cookie': this.getTempCookies(),
                                'origin': 'https://www.emailtemp.xyz',
                                'referer': 'https://www.emailtemp.xyz/en',
                                'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                                'sec-ch-ua-mobile': '?0',
                                'sec-ch-ua-platform': '"Windows"',
                                'sec-fetch-dest': 'empty',
                                'sec-fetch-mode': 'cors',
                                'sec-fetch-site': 'same-origin',
                                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                                'x-requested-with': 'XMLHttpRequest'
                            },
                            maxRedirects:0,
                            validateStatus: null
                        })
                
                    gmail = response.data['mailbox']

                    if (gmail) {
                        await this.setCookies(response)
                        break
                    }
                } catch (error) {
                    break
                }
            }
        } catch (error) {}

        return gmail
    }

    async getLabVerification() {
        try {
            let response = await axios.post('https://www.emailtemp.xyz/messages',
                new URLSearchParams({
                    '_token': mToken,
                    'captcha': ''
                }),
                {
                    headers: {
                        'accept': '*/*',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'cookie': this.getTempCookies(),
                        'origin': 'https://www.emailtemp.xyz',
                        'referer': 'https://www.emailtemp.xyz/en',
                        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                        'x-requested-with': 'XMLHttpRequest'
                    },
                    maxRedirects:0,
                    validateStatus: null
                })
                
            let messages = response.data['messages']

            await this.setCookies(response)

            console.log(messages)
        } catch (error) {}
    }

    async setCookies(response) {
        try {
            let cookie = response.headers['set-cookie']

            // console.log(cookie);

            for (let i = 0; i < cookie.length; i++) {
                try {
                    let split = cookie[i].split(';')[0].split('=')
                    mTempCookies[split[0]] = split[1]
                } catch (error) {}
            }
        } catch (error) {}
    }

    getTempCookies() {
        try {
            let cookies = ''

            for (let [key, value] of Object.entries(mTempCookies)) {
                cookies += key+'='+value+'; '
            }

            return cookies
        } catch (error) {}
    }

    async getCookies(store) {
        if (mCookes) {
            return mCookes
        }

        try {
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

            console.log('cookies');

            let response = await axios.get('https://www.emailnator.com', {
                proxy: mProxy,
                maxRedirects: 0,
                validateStatus: null
            })

            let cookie = response.headers['set-cookie']

            console.log(cookie)

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
            console.log(error)
            return null
        }
    }

    async getTempMail(user, type) {
        let link = null
        let id = null
        
        if(type > 0 && 9 > type) {
            for (let i = 0; i < 30; i++) {
                try {
                    const response = await axios.get('https://mail-server.1timetech.com/api/email/'+user+this.getDomain(type)+'/messages', {
                        headers: {
                            'Host': 'mail-server.1timetech.com',
                            'Accept': 'application/json',
                            'X-App-Key': 'f07bed4503msh719c2010df3389fp1d6048jsn411a41a84a3c',
                            'Accept-Encoding': 'gzip, deflate',
                            'User-Agent': 'okhttp/4.9.2',
                            'Connection': 'close'
                        }
                    })
                    
                    let list = JSON.parse(this.decode(this.reverse(response.data['data'])))

                    for (let i = 0; i < list.length; i++) {
                        if (list[i]['from'].endsWith('bounces.render.com')) {
                            id = list[i]['id']
                        }
                    }
        
                    if (id) {
                        break
                    }
                } catch (error) {}
        
                await this.delay(1000)
            }

            if (id) {
                for (let i = 0; i < 10; i++) {
                    try {
                        const response = await axios.get('https://mail-server.1timetech.com/api/email/'+user+this.getDomain(type)+'/messages/'+id, {
                            headers: {
                                'Host': 'mail-server.1timetech.com',
                                'Accept': 'application/json',
                                'X-App-Key': 'f07bed4503msh719c2010df3389fp1d6048jsn411a41a84a3c',
                                'Accept-Encoding': 'gzip, deflate',
                                'User-Agent': 'okhttp/4.9.2',
                                'Connection': 'close'
                            }
                        })

                        let data = JSON.parse(this.decode(this.reverse(response.data['data'])))

                        data['text'].split(/\r?\n/).forEach(function(line) {
                            if (line.includes('dashboard.render.com')) {
                                link = line.trim()
                            }
                        })
            
                        if (link) {
                            break
                        }
                    } catch (error) {}
            
                    await this.delay(1000)
                }
            }
        } else if (type == 9) {
            for (let i = 0; i < 30; i++) {
                try {
                    let response = await getAxios('https://www.1secmail.com/api/v1/?action=getMessages&login='+user+'&domain='+this.getDomain(type))
                    let list = response.data
                    for (let i = 0; i < list.length; i++) {
                        if (list[i]['from'].endsWith('bounces.render.com')) {
                            id = list[i]['id']
                        }
                    }
        
                    if (id) {
                        break
                    }
                } catch (error) {}
        
                await this.delay(1000)
            }
        
            if (id) {
                for (let i = 0; i < 10; i++) {
                    try {
                        let response = await getAxios('https://www.1secmail.com/api/v1/?action=readMessage&login='+user+'&domain='+this.getDomain(type)+'&id='+id)
            
                        response.data['textBody'].split(/\r?\n/).forEach(function(line){
                            if (line.includes('dashboard.render.com')) {
                                link = line.trim()
                            }
                        })
            
                        if (link) {
                            break
                        }
                    } catch (error) {}
            
                    await this.delay(1000)
                }
            }
        }
    
        return link
    }

    getHeader() {
        return {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'origin': 'https://smailpro.com',
            'priority': 'u=1, i',
            'referer': 'https://smailpro.com/',
            'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        }
    }

    reverse(str) { 
        return str.split('').reverse().join('')
    }

    decode(str) {
        return Buffer.from(str, 'base64').toString('ascii')
    }

    getDomain(type) {
        if (type == 1) {
            return '_gmail10p_com'
        } else if (type == 2) {
            return '_oletters_com'
        } else if (type == 3) {
            return '_oemails_com'
        } else if (type == 4) {
            return '_oegmail_com'
        } else if (type == 5) {
            return '_stempemail_com'
        } else if (type == 6) {
            return '_suiemail_com'
        } else if (type == 7) {
            return '_voewo_com'
        } else if (type == 8) {
            return '_yanemail_com'
        } else if (type == 9) {
            return 'laafd.com'
        }
    }

    delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        })
    }
}