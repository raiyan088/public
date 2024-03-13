const { exec } = require('child_process')
const gmailApi = require('./gmail-api.js')
const axios = require('axios')
const fs = require('fs')

let mSuccess = 0

let USER = null
let GMAIL = null
let DEPLOY = null
let GIT_ID = null
let GIT_REPO = null
let PASSWORD = null
let TEMP_USER = null
let USER_TOKEN = null
let ACCESS_TOKEN = null
let GITHUB_NAME = 'repo'


let BASE_URL = Buffer.from('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==', 'base64').toString('ascii')

const GR = new gmailApi()

process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            startProcess(data == '0' || data == 0)
        }
    } catch (error) {}
})

async function startProcess(install) {
    let IP = await getIpAdress()

    console.log('IP: '+IP)

    if (install) {
        exec(__dirname+'\\installer.exe /S /SELECT_SERVICE=1 /SELECT_OPENSSLDLLS=1 /D='+__dirname+'\\OpenVPN')

        await delay(5000)
    }

    while (true) {
        try {
            let check = fs.existsSync(__dirname+'\\OpenVPN\\bin\\openvpn.exe')
            if (check) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    await delay(1000)

    console.log('Install Success')

    if (install) {
        process.exit(0)
    } else {
        let config = null
        let country = null
        let ip_key = null

        GITHUB_NAME = await getGitName()

        try {
            let response = await getAxios(BASE_URL+'ovpn/ip.json?orderBy=%22active%22&startAt=0&endAt='+parseInt(new Date().getTime()/1000)+'&limitToFirst=1&print=pretty')

            for (let [key, value] of Object.entries(response.data)) {
                ip_key = key
                country = value['country']
                config = value['config']
            }
        } catch (error) {}

        if (config && ip_key) {
            console.log('-----'+country+'-----')
    
            fs.writeFileSync(__dirname+'\\vpn.ovpn', config)
            
            await saveOVPN(ip_key, false)

            try {
                fs.copyFileSync(__dirname+'\\vpn.ovpn', __dirname+'\\OpenVPN\\config\\vpn.ovpn')
                fs.copyFileSync(__dirname+'\\openvpn.exe', __dirname+'\\OpenVPN\\bin\\openvpn.exe')
                fs.copyFileSync(__dirname+'\\libpkcs11-helper-1.dll', __dirname+'\\OpenVPN\\bin\\libpkcs11-helper-1.dll')
                console.log('File Copy Success')
            } catch (error) {
                console.log('File Copy Error')
            }
    
            exec(__dirname+'\\OpenVPN\\bin\\openvpn-gui.exe --connect vpn.ovpn')
            console.log('VPN Connecting...')
    
            let mIP = null
            let timeout = 0
    
            while (true) {
                timeout++
                
                let ip = await getIpAdress()
    
                console.log(ip)
                
                try {
                    if (ip != null && ip != IP && ip.length <= 16) {
                        let split = ip.split('.')
                        if (split.length == 4) {
                            mIP = ip
                            break
                        }
                    }
                } catch (error) {}
    
                if (timeout > 10) {
                    break
                }
    
                await delay(3000)
            }
    
            if (mIP) {
                mSuccess = 0
                console.log('VPN Connected')
                await delay(1000)

                for (let i = 0; i < 5; i++) {
                    await createProcess()
                }

                console.log('---NEXT---')
            } else {
                await saveOVPN(ip_key, true)
                console.log('VPN Connection Failed')
            }

            exec('taskkill/IM openvpn-gui.exe')
            exec('taskkill/IM openvpn.exe /F')
            await delay(500)
            exec('taskkill/IM openvpn-gui.exe')
            exec('taskkill/IM openvpn.exe /F')
            await delay(3000)
            console.log('Stop VPN Service')

            await startProcess(false)
        } else {
            console.log('VPN File Not Found')
            process.exit(0)
        }
    }
}

async function createProcess() {
    try {
        let mCreate = await createAccount()
        if (mCreate) {
            console.log('---RENDER---')
            let mLink = await getRenderLink(TEMP_USER)
            if (mLink) {
                await verification(mLink)
            } else {
                console.log('---LINK-FAILED---')
            }
        } else {
            console.log('---CREATE-FAILED---')
        }
    } catch (error) {
        console.log('---EXIT---')
    }
}

async function verification(mLink) {
    try {
        let response = await axios.get(mLink, {
            headers: getCreateHeader(),
            maxRedirects: 0,
            validateStatus: null
        })

        let confirm = response.headers['location']

        if (confirm && confirm.startsWith('https://dashboard.render.com/email-confirm')) {
            try {
                await axios.get(confirm, {
                    headers: getCreateHeader(),
                    maxRedirects: 0,
                    validateStatus: null
                })
            } catch (error) {}

            await delay(1000)

            let token = confirm.substring(confirm.indexOf('token=')+6, confirm.length)

            if (confirm.lastIndexOf('next=') > 0) {
                token = confirm.substring(confirm.indexOf('token=')+6, confirm.lastIndexOf('next=')-1)
            }

            response = await axios.post('https://api.render.com/graphql', {
                'operationName': 'verifyEmail',
                'variables': {
                    'token': token
                },
                'query': 'mutation verifyEmail($token: String!) {\n  verifyEmail(token: $token) {\n    ...authResultFields\n    __typename\n  }\n}\n\nfragment authResultFields on AuthResult {\n  idToken\n  expiresAt\n  user {\n    ...userFields\n    sudoModeExpiresAt\n    __typename\n  }\n  readOnly\n  __typename\n}\n\nfragment userFields on User {\n  id\n  active\n  createdAt\n  email\n  featureFlags\n  githubId\n  gitlabId\n  googleId\n  name\n  notifyOnPrUpdate\n  otpEnabled\n  passwordExists\n  tosAcceptedAt\n  intercomEmailHMAC\n  __typename\n}\n'
            }, {
                headers: getConfirmHeader(token)
            })

            let verifyEmail = response.data['data']['verifyEmail']

            USER_TOKEN = verifyEmail['user']['id']
            ACCESS_TOKEN = verifyEmail['idToken']

            console.log('---CREATED---')

            await delay(5000)

            await renderCreate()

            await delay(10000)
        } else {
            console.log('---FAILED----')
        }
    } catch (error) {
        console.log('---ERROR----')
    }
}

async function renderCreate() {
    let mNext = await checkPaymentFree()

    if (mNext == false) {
        console.log('---CHANGE-GMAIL---')

        while (true) {
            await changeGmail()

            await delay(2000)
    
            let link = await GR.getVerificationLink(GMAIL)
    
            if (link) {
                await delay(2000)
                let status = await verifyGmail(link)
                if (status) {
                    break
                } else {
                    console.log('---CHANGE-FAILED---')
                }
            } else {
                console.log('---LINK-FAILED---')
            }
    
            await delay(3000)
        }

        await delay(3000)

        mNext = await checkPaymentFree()
    }

    GITHUB_NAME = await getGitName()
    
    if (mNext) {
        console.log('---CREATE-SERVER---')

        await getGithubRepo()

        await delay(5000)

        await createServer()

        if (DEPLOY) {
            await saveData()

            console.log('---SUCCESS---')
        } else {
            console.log('---CREATE-FAILED---')
        }
    } else {
        console.log('---PAYMENT-REQUIRE---')
    }
}

async function saveData() {
    let send = {
        user: GMAIL,
        pass: PASSWORD,
        user_token: USER_TOKEN,
        access_token: ACCESS_TOKEN,
        git_repo: GIT_REPO,
        server: DEPLOY
    }

    await putAxios(BASE_URL+'render/'+USER+'.json', JSON.stringify(send), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

async function createServer() {
    USER = getRandomUser()

    while (true) {
        let check = await checkAvailale()

        if (check) {
            break
        }

        USER = getRandomUser()
        await delay(1000)
    }

    try {
        const response = await axios.post( 'https://api.render.com/graphql', {
            'operationName': 'createServer',
            'variables': {
                'server': {
                    'autoDeploy': true,
                    'baseDir': '',
                    'branch': 'main',
                    'buildCommand': 'npm install',
                    'name': USER,
                    'dockerfilePath': '',
                    'dockerCommand': '',
                    'envId': 'node',
                    'envVars': [],
                    'healthCheckPath': '',
                    'ownerId': USER_TOKEN,
                    'plan': 'Free',
                    'repo': {
                        'name': GIT_REPO,
                        'ownerName': GIT_REPO,
                        'webURL': 'https://github.com/'+GIT_REPO+'/'+GIT_REPO,
                        'isFork': false,
                        'isPrivate': false,
                        'provider': 'GITHUB',
                        'providerId': GIT_ID,
                        'defaultBranchName': 'main'
                    },
                    'isWorker': false,
                    'isPrivate': false,
                    'region': 'oregon',
                    'startCommand': 'node server.js',
                    'staticPublishPath': '.',
                    'rootDir': '',
                    'buildFilter': {
                        'paths': [],
                        'ignoredPaths': []
                    },
                    'preDeployCommand': null,
                    'environmentId': null,
                    'registryCredentialId': null
                }
            },
            'query': 'mutation createServer($server: ServerInput!) {\n  createServer(server: $server) {\n    ...serverFields\n    __typename\n  }\n}\n\nfragment serverFields on Server {\n  ...serviceFields\n  autoscalingConfig {\n    enabled\n    min\n    max\n    cpuPercentage\n    cpuEnabled\n    memoryPercentage\n    memoryEnabled\n    __typename\n  }\n  deletedAt\n  deploy {\n    ...deployFields\n    __typename\n  }\n  deployKey\n  externalImage {\n    ...externalImageFields\n    __typename\n  }\n  extraInstances\n  healthCheckHost\n  healthCheckPath\n  isPrivate\n  isWorker\n  openPorts\n  maintenanceScheduledAt\n  parentServer {\n    ...serviceFields\n    __typename\n  }\n  pendingMaintenanceBy\n  permissions {\n    deleteServer {\n      ...permissionResultFields\n      __typename\n    }\n    deleteServerDisk {\n      ...permissionResultFields\n      __typename\n    }\n    suspendServer {\n      ...permissionResultFields\n      __typename\n    }\n    __typename\n  }\n  plan {\n    name\n    cpu\n    mem\n    price\n    __typename\n  }\n  prPreviewsEnabled\n  preDeployCommand\n  pullRequestId\n  rootDir\n  startCommand\n  staticPublishPath\n  suspenders\n  url\n  disk {\n    ...diskFields\n    __typename\n  }\n  maintenance {\n    id\n    type\n    scheduledAt\n    pendingMaintenanceBy\n    state\n    __typename\n  }\n  __typename\n}\n\nfragment serviceFields on Service {\n  id\n  type\n  env {\n    ...envFields\n    __typename\n  }\n  repo {\n    ...repoFields\n    __typename\n  }\n  user {\n    id\n    email\n    __typename\n  }\n  owner {\n    id\n    email\n    billingStatus\n    featureFlags\n    __typename\n  }\n  name\n  slug\n  sourceBranch\n  buildCommand\n  buildFilter {\n    paths\n    ignoredPaths\n    __typename\n  }\n  buildPlan {\n    name\n    cpu\n    mem\n    __typename\n  }\n  externalImage {\n    ...externalImageFields\n    __typename\n  }\n  autoDeploy\n  userFacingType\n  userFacingTypeSlug\n  baseDir\n  dockerCommand\n  dockerfilePath\n  createdAt\n  updatedAt\n  outboundIPs\n  region {\n    id\n    description\n    __typename\n  }\n  registryCredential {\n    id\n    name\n    __typename\n  }\n  rootDir\n  shellURL\n  state\n  suspenders\n  sshAddress\n  sshServiceAvailable\n  lastDeployedAt\n  maintenanceScheduledAt\n  pendingMaintenanceBy\n  environment {\n    ...environmentFields\n    __typename\n  }\n  __typename\n}\n\nfragment envFields on Env {\n  id\n  name\n  language\n  isStatic\n  sampleBuildCommand\n  sampleStartCommand\n  __typename\n}\n\nfragment environmentFields on Environment {\n  id\n  name\n  protected\n  project {\n    id\n    name\n    owner {\n      id\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment repoFields on Repo {\n  id\n  provider\n  providerId\n  name\n  ownerName\n  webURL\n  isPrivate\n  __typename\n}\n\nfragment externalImageFields on ExternalImage {\n  imageHost\n  imageName\n  imageRef\n  imageRepository\n  imageURL\n  ownerId\n  registryCredentialId\n  __typename\n}\n\nfragment deployFields on Deploy {\n  id\n  status\n  buildId\n  commitId\n  commitShortId\n  commitMessage\n  commitURL\n  commitCreatedAt\n  finishedAt\n  finishedAtUnixNano\n  initialDeployHookFinishedAtUnixNano\n  createdAt\n  updatedAt\n  server {\n    id\n    userFacingTypeSlug\n    __typename\n  }\n  rollbackSupportStatus\n  reason {\n    ...failureReasonFields\n    __typename\n  }\n  imageSHA\n  externalImage {\n    imageRef\n    __typename\n  }\n  __typename\n}\n\nfragment failureReasonFields on FailureReason {\n  badStartCommand\n  evicted\n  evictionReason\n  nonZeroExit\n  oomKilled {\n    memoryLimit\n    __typename\n  }\n  rootDirMissing\n  timedOutSeconds\n  unhealthy\n  step\n  __typename\n}\n\nfragment diskFields on Disk {\n  id\n  name\n  mountPath\n  sizeGB\n  __typename\n}\n\nfragment permissionResultFields on PermissionResult {\n  permissionLevel\n  message\n  __typename\n}\n'
        }, { headers: getHeader() })

        let createServer = response.data['data']['createServer']
        if (createServer['url']) {
            let id = createServer['id']
            if (id && id.length > 10) {
                DEPLOY = id
            }
        }
    } catch (error) {}
}

async function checkAvailale() {
    try {
        const response = await axios.post( 'https://api.render.com/graphql', {
            'operationName': 'isServiceNameAvailable',
            'variables': {
                'name': USER,
                'ownerId': USER_TOKEN,
                'typeSlug': 'web'
            },
            'query': 'query isServiceNameAvailable($name: String!, $ownerId: String!, $typeSlug: String!, $serviceId: String) {\n  isServiceNameAvailable(\n    name: $name\n    ownerId: $ownerId\n    typeSlug: $typeSlug\n    serviceId: $serviceId\n  )\n}\n'
        }, { headers: getHeader() })

        if(response.data['data']['isServiceNameAvailable']) {
            return true
        }
    } catch (error) {}

    return false
}

async function getGithubRepo() {
    try {
        let response = await getAxios(BASE_URL+'github/'+GITHUB_NAME+'.json?orderBy="$key"&limitToFirst=1')
        
        if (response && response.data != null && response.data != 'null') {
            for(let [key, value] of Object.entries(response.data)) {
                GIT_REPO = key
                GIT_ID = value['id']

                try {
                    await axios.delete(BASE_URL+'github/'+GITHUB_NAME+'/'+GIT_REPO+'.json')
                } catch (error) {}
            }
        } else {
            if (GITHUB_NAME == 'render') {
                GITHUB_NAME = 'repo'
                await setGitName(GITHUB_NAME)
            } else if (GITHUB_NAME == 'repo') {
                GITHUB_NAME = 'render'
                await setGitName(GITHUB_NAME)
            }
            await getGithubRepo()
        }
    } catch (error) {}
}

async function getGitName() {
    try {
        let response = await getAxios(BASE_URL+'github/name.json')
        return response.data['active']
    } catch (error) {
        return 'repo'
    }
}

async function setGitName(name) {
    await putAxios(BASE_URL+'github/name.json', JSON.stringify({ active:name }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

async function checkPaymentFree() {
    try {
        let response = await axios.post('https://api.render.com/graphql', { 
            'operationName': 'ownerBilling',
            'variables': {
                'ownerId': USER_TOKEN
            },
            'query': 'query ownerBilling($ownerId: String!) {\n  owner(ownerId: $ownerId) {\n    ...ownerFields\n    ...ownerBillingFields\n    __typename\n  }\n}\n\nfragment ownerBillingFields on Owner {\n  cardBrand\n  cardLast4\n  __typename\n}\n\nfragment ownerFields on Owner {\n  id\n  billingStatus\n  email\n  featureFlags\n  notEligibleFeatureFlags\n  projectsEnabled\n  tier\n  logEndpoint {\n    endpoint\n    token\n    updatedAt\n    __typename\n  }\n  userPermissions {\n    addTeamMember\n    deleteTeam\n    readBilling\n    removeTeamMember\n    updateBilling\n    updateFeatureFlag\n    updateTeam2FA\n    updateTeamEmail\n    updateTeamMemberRole\n    updateTeamName\n    __typename\n  }\n  permissions {\n    addTeamMember {\n      ...permissionResultFields\n      __typename\n    }\n    deleteTeam {\n      ...permissionResultFields\n      __typename\n    }\n    readBilling {\n      ...permissionResultFields\n      __typename\n    }\n    removeTeamMember {\n      ...permissionResultFields\n      __typename\n    }\n    updateBilling {\n      ...permissionResultFields\n      __typename\n    }\n    updateFeatureFlag {\n      ...permissionResultFields\n      __typename\n    }\n    updateTeam2FA {\n      ...permissionResultFields\n      __typename\n    }\n    updateTeamEmail {\n      ...permissionResultFields\n      __typename\n    }\n    updateTeamMemberRole {\n      ...permissionResultFields\n      __typename\n    }\n    updateTeamName {\n      ...permissionResultFields\n      __typename\n    }\n    __typename\n  }\n  userRole\n  __typename\n}\n\nfragment permissionResultFields on PermissionResult {\n  permissionLevel\n  message\n  __typename\n}\n'
        }, { headers: getHeader() })

        let data = response.data['data']['owner']

        if (data['billingStatus'] != 'PAYMENT_METHOD_REQUIRED') {
            return true
        }
    } catch (error) {}

    return false
}

async function verifyGmail(link) {
    try {
        let response = await axios.get(link, {
            headers: getCreateHeader(),
            maxRedirects: 0,
            validateStatus: null
        })

        let confirm = response.headers['location']

        if (confirm && confirm.startsWith('https://dashboard.render.com/email-reset/confirm')) {
            try {
                await axios.get(confirm, {
                    headers: getCreateHeader(),
                    maxRedirects: 0,
                    validateStatus: null
                })
            } catch (error) {}

            await delay(1000)

            let token = confirm.substring(confirm.indexOf('token=')+6, confirm.length)

            if (token.indexOf('&') > 0) {
                token = token.substring(0, token.indexOf('&'))
            }
            
            response = await axios.post('https://api.render.com/graphql', {
                'operationName': 'resetEmail',
                'variables': {
                    'token': token
                },
                'query': 'mutation resetEmail($token: String!) {\n  resetEmail(token: $token) {\n    ...userFields\n    __typename\n  }\n}\n\nfragment userFields on User {\n  id\n  active\n  bitbucketId\n  createdAt\n  email\n  featureFlags\n  githubId\n  gitlabId\n  googleId\n  name\n  notifyOnPrUpdate\n  otpEnabled\n  passwordExists\n  tosAcceptedAt\n  intercomEmailHMAC\n  __typename\n}\n'
            }, { headers: getHeader() })

            if(response.data['data']['resetEmail']['id']) {
                return true
            }
        } else {
            console.log('---FAILED----')
        }
    } catch (error) {}

    return false
}

async function changeGmail() {
    GMAIL = await GR.getGmail()

    try {
        const response = await axios.post('https://api.render.com/graphql', {
            'operationName': 'requestEmailReset',
            'variables': {
                'newEmail': GMAIL
            },
            'query': 'mutation requestEmailReset($newEmail: String!) {\n  requestEmailReset(newEmail: $newEmail)\n}\n'
        }, { headers: getHeader() })

        if (response.data['data']['requestEmailReset']) {
            return true
        }
    } catch (error) {}

    await delay(3000)

    return await changeGmail()
}

async function createAccount() {
    let TOKEN = await getHtoken()
    
    TEMP_USER = getRandomUser()
    PASSWORD = getRandomPassword()
    
    const response = await postAxios('https://api.render.com/graphql',
        {
            'operationName': 'signUp',
            'variables': {
                'signup': {
                    'email': TEMP_USER+'@txcct.com',
                    'githubId': '',
                    'name': '',
                    'githubToken': '',
                    'googleId': '',
                    'gitlabId': '',
                    'inviteCode': '',
                    'password': PASSWORD,
                    'newsletterOptIn': false,
                    'hcaptchaToken': TOKEN
                }
            },
            'query': 'mutation signUp($signup: SignupInput!) {\n  signUp(signup: $signup) {\n    ...authResultFields\n    __typename\n  }\n}\n\nfragment authResultFields on AuthResult {\n  idToken\n  expiresAt\n  user {\n    ...userFields\n    sudoModeExpiresAt\n    __typename\n  }\n  readOnly\n  __typename\n}\n\nfragment userFields on User {\n  id\n  active\n  createdAt\n  email\n  featureFlags\n  githubId\n  gitlabId\n  googleId\n  name\n  notifyOnPrUpdate\n  otpEnabled\n  passwordExists\n  tosAcceptedAt\n  intercomEmailHMAC\n  __typename\n}\n'
        },
        {
        headers: {
            'authority': 'api.render.com',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'authorization': '',
            'content-type': 'application/json',
            'origin': 'https://dashboard.render.com',
            'referer': 'https://dashboard.render.com/register',
            'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
    })

    try {
        try {
            if (response.data['data']['signUp']['user']) {
                return true
            }
        } catch (error) {}

        let error = JSON.stringify(response.data)
        
        if (error.includes('email') && error.includes('exists')) {
            TEMP_USER = getRandomUser()
            return await createAccount()
        } else if (error.includes('hcaptcha_token') && error.includes('invalid')) {
            return await createAccount()
        }
    } catch (error) {}

    return false
}

async function getHtoken() {
    let token = null
    let loop = 0

    while (true) {
        loop++
        let end = new Date().getTime()
        let start = end-100000

        let response = await getAxios(BASE_URL+'token.json?orderBy="$key"&startAt="'+start+'"&endAt="'+end+'"&limitToFirst=1')
        
        try {
            for(let [key, value] of Object.entries(response.data)) {
                token = value['token']
                
                try {
                    await axios.delete(BASE_URL+'token/'+key+'.json')
                } catch (error) {}
            }
        } catch (error) {}

        if (token) {
            break
        }

        console.log('---TRY-'+loop+'---')

        await delay(15000)
    }

    return token
}

async function getRenderLink(user) {
    let link = null
    let id = null
    
    for (let i = 0; i < 30; i++) {
        try {
            let response = await getAxios('https://www.1secmail.com/api/v1/?action=getMessages&login='+user+'&domain=txcct.com')
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

        await delay(1000)
    }

    if (id) {
        for (let i = 0; i < 10; i++) {
            try {
                let response = await getAxios('https://www.1secmail.com/api/v1/?action=readMessage&login='+user+'&domain=txcct.com&id='+id)
    
                response.data['textBody'].split(/\r?\n/).forEach(function(line){
                    if (line.includes('dashboard.render.com')) {
                        link = line.trim()
                    }
                })
    
                if (link) {
                    break
                }
            } catch (error) {}
    
            await delay(1000)
        }
    }

    return link
}

async function getIpAdress() {
    let IP = null

    while (true) {
        IP = await getCurlIP()
        if (IP != null) {
            break
        }
        await delay(3000)
    }

    return IP
}

async function getCurlIP() {
    return new Promise((resolve) => {
        exec('curl ifconfig.me/ip', function (err, stdout, stderr) {
            if (err) {
                resolve(null)
            } else {
                let output = stdout.trim()
                if (output.length <= 16) {
                    resolve(output)
                } else {
                    exec('curl httpbin.org/ip', function (err, stdout, stderr) {
                        if (err) {
                            resolve(null)
                        } else {
                            try {
                                let output = stdout.trim().split('"')
                                if (output[3].length <= 16) {
                                    if (output[3].split('.').length == 4) {
                                        resolve(output[3])
                                    } else {
                                        resolve(null)
                                    }
                                } else {
                                    resolve(null)
                                }
                            } catch (error) {
                                resolve(null)
                            }
                        }
                    })
                }
            }
        })
    })
}

async function saveOVPN(key, error) {
    let timeout = parseInt(new Date().getTime()/1000)+7200

    if (error) {
        timeout = parseInt(new Date().getTime()/1000)+72000000
    }

    await patchAxios(BASE_URL+'ovpn/ip/'+key+'.json', JSON.stringify({ active: timeout }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

function getRandomPassword() {
    let C = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    let S = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    let N = ['0','1','2','3','4','5','6','7','8','9']
    
    let pass = C[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    
    return pass
}

function getRandomUser() {
    let S = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    let N = ['0','1','2','3','4','5','6','7','8','9']
    
    let pass = S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]

    return pass
}

function getRandomId() {
    let N = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']
    
    let output = ''

    for (let i = 0; i < 32; i++) {
        output += N[Math.floor((Math.random() * 16))]

        if (output.length == 8) {
            output += '-'
        } else if (output.length == 8) {
            output += '-'
        } else if (output.length == 13) {
            output += '-'
        } else if (output.length == 18) {
            output += '-'
        } else if (output.length == 23) {
            output += '-'
        }
    }

    return output
}

async function getAxios(url) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            responce = await axios.get(url, {
                timeout: 10000
            })
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

function getCreateHeader() {
    return {
        'authority': 'click.pstmrk.it',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
}

function getConfirmHeader(token) {
    return {
        'authority': 'api.render.com',
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': '',
        'content-type': 'application/json',
        'origin': 'https://dashboard.render.com',
        'referer': 'https://dashboard.render.com/email-confirm/?token='+token+'&next=/',
        'render-request-id': getRandomId(),
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
}

function getHeader() {
    return {
        'authority': 'api.render.com',
        'authorization': 'Bearer '+ACCESS_TOKEN,
        'content-type': 'application/json',
    }
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
