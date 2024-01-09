const axios = require('axios')


let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')


console.log(new Date().toString())

startProcess()


async function startProcess() {
    let mUsers = []
    let mRestart = []

    try {
        let response = await getAxios(BASE_URL+'github/active.json')
        
        if (response.data) {
            let map = {}
            let completed = {}

            for (let value of Object.values(response.data)) {
                if (value['completed']) {
                    completed[value['completed']] = 'x'
                } else if (value['active']) {
                    map[value['active']] = 'x'
                }
            }

            for (let key of Object.keys(map)) {
                mUsers.push(key)
            }

            for (let key of Object.keys(completed)) {
                mRestart.push(key)
            }
        }
    } catch (error) {}
    
    if (mUsers.length > 0 || mRestart.length > 0) {
        for (let i = 0; i < mUsers.length; i++) {
            try {
                let response = await getAxios(BASE_URL+'github/action/'+mUsers[i]+'.json')
            
                if (response) {
                    let mData = response.data
                    await activeAction(mUsers[i], mData['action'], mData['cookies'])
                }
            } catch (error) {}
        }

        for (let i = 0; i < mRestart.length; i++) {
            try {
                let response = await getAxios(BASE_URL+'github/action.json?orderBy=%22quota%22&endAt='+parseInt(new Date().getTime()/1000)+'&limitToFirst=1&print=pretty')
                if (response) {
                    let user = null
                    let action = null
                    let cookies = null

                    for (let [key, value] of Object.entries(response.data)) {
                        user = key
                        action = value['action']
                        cookies = value['cookies']
                    }

                    await patchAxios(BASE_URL+'github/action/'+user+'.json', JSON.stringify({ quota:parseInt(new Date().getTime()/1000)+86400 }), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })

                    await activeAction(user, action, cookies)
                }
            } catch (error) {}
        }

        try {
            //await axios.delete(BASE_URL+'github/active.json')
        } catch (error) {}

        console.log('Completed', mUsers.length, mRestart.length)
        process.exit(0)
    } else {
        console.log('User Not Found')
        process.exit(0)
    }
}

async function activeAction(user, action, cookies) {
    let token = null
    let timeout = 0

    while (true) {
        timeout++
        token = await getToken(user, action, cookies)
        if (token) {
            break
        }
        if (timeout > 15) {
            break
        }
        await delay(2000)
    }

    if (token) {
        let response = await postAxios('https://github.com/'+user+'/'+user+'/actions/runs/'+action+'/rerequest_check_suite',
            new URLSearchParams({
                '_method': 'put',
                'authenticity_token': token
            }),
        {
            headers: getGrapHeader(cookies),
            maxRedirects: 0,
            validateStatus: null,
        })

        try {
            if (response.data.length > 0) {
                console.log(i,'Action Block: '+user)
            } else {
                console.log(i,'Active Success: '+user)
            }
        } catch (error) {
            console.log(i,'Action Error: '+user)
        }
    } else {
        console.log('Action Already Active: '+user)
    }
}

async function getToken(user, action, cookies) {

    let response = await getAxios('https://github.com/'+user+'/'+user+'/actions/runs/'+action, { 
        headers: getFrameHeader(cookies),
        maxRedirects: 0,
        validateStatus: null
    })

    try {
        let body = response.data
        if (body.includes('Failure') || body.includes('Cancelled') || body.includes('Success')) {
            let name = 'name="authenticity_token"'
            if (body.includes(name)) {
                let index = body.indexOf(name)+name.length
                let token = body.substring(index, index+200).split('"')[1]
                if (token && token.length > 10) {
                    return token
                }
            }
        }
    } catch (error) {}

    return null
}

async function getAxios(url, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            let headers = {
                timeout: 10000
            }

            if (data) {
                headers = data
                headers.timeout = 10000
            }
            responce = await axios.get(url, headers)
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

async function postAxios(url, body, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            data.timeout = 10000
            responce = await axios.post(url, body, data)
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

async function putAxios(url, body, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            data.timeout = 10000
            responce = await axios.put(url, body, data)
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
    while (true) {
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

function getFrameHeader(cookies) {
    return {
        'authority': 'github.com',
        'accept': 'text/html, application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
        'cookie': cookies,
        'sec-ch-ua': '"Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'turbo-frame': 'repo-content-turbo-frame',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    }
}

function getGrapHeader(cookies) {
    return {
        'authority': 'github.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'cookie': cookies,
        'origin': 'https://github.com',
        'sec-ch-ua': '"Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    }
}


function delay(time) {
  return new Promise(function(resolve) {
      setTimeout(resolve, time)
  })
}
