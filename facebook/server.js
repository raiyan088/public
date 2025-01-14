const { exec } = require('node:child_process')
const { remote } = require('webdriverio')
const axios = require('axios')
const fs = require('fs')


const TARGET_CREATE = 1
const TARGET_BLOCK = 3


let mId = null
let FB_ID = null
let mError = false
let mCookies = null
let mDriver = null
let ADB = 'adb.exe '
let mAddress = null
let mMailKey = null
let mTimestamp = 0
let CREATED = false
let CONFIG = null

let ENGINE = 'C:\\Program Files\\Netease\\MuMuPlayerGlobal-12.0\\'

let BASE_URL = decode('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==')
let STORAGE = decode('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vL3Bob3RvJTJG')

let wdOpts = {
    hostname: '0.0.0.0',
    port: 4723,
    logLevel: 'silent',
    capabilities: {
        'platformName': 'Android',
        'appium:platformVersion': '12',
        'appium:deviceName': '127.0.0.1:7555',
        'appium:automationName': 'UIAutomator2',
        'appium:ensureWebviewsHavePages': 'true'
    },
}

startServer()

async function startServer() {
    console.log('Node: ---START-SERVER---')

    console.log('Node: Emulator Starting...')

    await startAppiumServer()
    
    CONFIG = await getConfigData()

    mId = await waitForStartEmulator(true, '127.0.0.1', 7555)

    if (mId) {
        console.log('Node: Device ID: '+mId)

        let connected = await waitForDeviceOnline(mId)

        if (connected) {
            console.log('Node: Connected Device: '+connected)

            for (let i = 0; i < 5; i++) {
                mDriver = null

                try {
                    mDriver = await remote(wdOpts)
                    console.log('Node: Appium Device Connected')
                    break
                } catch (error) {
                    console.log('Node: Appium Device Connincting Failed')
                }

                await delay(3000)
            }

            if (mDriver) {
                CREATED = false

                await rootPermission(mDriver, mId)

                let mBlock = 0
                let mCreate = 0

                for (let x = 0; x < 30; x++) {
                    if (await creatFbAccount(mDriver, mId)) {
                        console.log('Node: [ ----CREATE-COMPLETED---- ]')
                        mCreate++

                        if (mCreate >= TARGET_CREATE) {
                            break
                        }
                    } else {
                        console.log('Node: [ ----CREATE-FAILED---- ]')
                        mBlock++

                        if (mBlock >= TARGET_BLOCK) {
                            break
                        }

                        if (CREATED && await isAppInstalled(mId, 'com.facebook.katana')) {
                            await adbShell(mId, 'pm uninstall com.facebook.katana')
                            await delay(1000)
                        } else {
                            x--
                        }
                    }

                    let mRestart = false

                    try {
                        if (!await mDriver.isConnected()) {
                            mRestart = true
                        }
                    } catch (error) {
                        mRestart = true
                    }

                    if (mRestart) {
                        for (let i = 0; i < 3; i++) {
                            mDriver = null
            
                            try {
                                mDriver = await remote(wdOpts)
                                console.log('Node: Appium Device Re-Connected')
                                break
                            } catch (error) {
                                console.log('Node: Appium Device Re-Connincting Failed')
                            }
            
                            await delay(3000)
                        }
                    }

                    if (mDriver) {
                        continue
                    }

                    break
                }
            }

            console.log('Node: [ ----COMPLETED-PROCESS---- ]')
        }
    }

    process.exit(0)
}

async function creatFbAccount(mDriver, mId) {
    console.log('Node: [ ----STARTING---- ]')

    CREATED = false

    if (!await isAppInstalled(mId, 'com.facebook.katana')) {
        let success = await waitForFacebookInstall(mId, 'Facebook')
        console.log('Node: [ Facebook Install '+(success?'Success ]':'Failed ]'))
    }

    await adbShell(mId, 'pm clear com.facebook.katana')
    await adbShell(mId, 'appops set --uid com.facebook.katana MANAGE_EXTERNAL_STORAGE allow')
    await adbShell(mId, 'pm grant com.facebook.katana android.permission.READ_EXTERNAL_STORAGE')
    await adbShell(mId, 'pm grant com.facebook.katana android.permission.WRITE_EXTERNAL_STORAGE')
    await adbShell(mId, 'pm grant com.facebook.katana android.permission.READ_CONTACTS')
    await adbShell(mId, 'am start -n com.facebook.katana/com.facebook.katana.LoginActivity')

    await delay(10000)
    console.log('Node: [ Open Facebook --- Time: '+getTime()+' ]')

    try {
        mError = await waitForDisplay(mDriver, '//android.view.ViewGroup[@content-desc="Log in"]', 30)
        if (mError)  return false
        console.log('Node: [ Loaded Log-in Page --- Time: '+getTime()+' ]')
        await delay(2000)
        mError = await waitForClick(mDriver, '//android.view.ViewGroup[@content-desc="Log in"]', 30)
        if (mError)  return false
        mError = await waitForDisplay(mDriver, '//android.view.ViewGroup[@content-desc="Create new Facebook account"]', 15)
        if (mError)  return false
        await delay(2000)
        mError = await waitForClick(mDriver, '//android.view.ViewGroup[@content-desc="Create new Facebook account"]', 15)
        if (mError)  return false
        console.log('Node: [ Create new Facebook account --- Time: '+getTime()+' ]')
        mError = await waitForClick(mDriver, '//android.widget.Button[@text="Next"]', 15)
        if (mError)  return false
        console.log('Node: [ Next --- Time: '+getTime()+' ]')

        let mFbName = await getFbName(CONFIG)
        let mName = mFbName.split(' ')

        let mUser = getRandomUser()
        let mPassword = getRandomPass(mName[0])
        
        let mEmail = mUser+'@'+CONFIG['domain']
        if (CONFIG['website'] == 'internal') {
            mEmail = await getRandomDomail(mUser)
            CONFIG['domain'] = mEmail.split('@')[1]
        }

        mError = await setInputData(mDriver, '//android.widget.AutoCompleteTextView[@text="First Name"]', mName[0], 15)
        if (mError)  return false
        console.log('Node: [ First name: '+mName[0]+' --- Time: '+getTime()+' ]')
        mError = await setInputData(mDriver, '//android.widget.AutoCompleteTextView[@text="Last Name"]', mName[1], 15)
        if (mError)  return false
        console.log('Node: [ Last name: '+mName[1]+' --- Time: '+getTime()+' ]')
        mError = await waitForClick(mDriver, '//android.widget.Button[@text="Next"]', 15)
        if (mError)  return false
        console.log('Node: [ Next --- Time: '+getTime()+' ]')
        mError = await waitForDisplay(mDriver, '//android.widget.DatePicker', 15)
        console.log('Node: [ Time & Date Picker --- Time: '+getTime()+' ]')
        mError = await setDteTime(mDriver)
        if (mError)  return false
        console.log('Node: [ Select Date of Birth --- Time: '+getTime()+' ]')
        mError = await waitForClick(mDriver, '//android.widget.Button[@text="Next"]', 15)
        if (mError)  return false
        console.log('Node: [ Next --- Time: '+getTime()+' ]')
        mError = await waitForClick(mDriver, '//android.widget.RadioButton[@text="'+(CONFIG['female'] ? 'Female' : 'Male' )+'"]', 15)
        if (mError)  return false
        console.log('Node: [ Select Gender: '+(CONFIG['female'] ? 'Female' : 'Male' )+' --- Time: '+getTime()+' ]')
        mError = await waitForClick(mDriver, '//android.widget.Button[@text="Next"]', 15)
        if (mError)  return false
        console.log('Node: [ Next --- Time: '+getTime()+' ]')
        mError = await waitForClick(mDriver, '//android.widget.Button[@text="Sign up with email address"]', 15)
        if (mError)  return false
        console.log('Node: [ Set New Email --- Time: '+getTime()+' ]')
        mError = await setInputData(mDriver, '//android.widget.AutoCompleteTextView[@text="Email address"]', mEmail, 15)
        if (mError)  return false
        console.log('Node: [ Email: '+mEmail+' --- Time: '+getTime()+' ]')
        if (mError)  return false
        mError = await waitForClick(mDriver, '//android.widget.Button[@text="Next"]', 15)
        if (mError)  return false
        console.log('Node: [ Next --- Time: '+getTime()+' ]')
        mError = await setInputData(mDriver, '//android.widget.EditText[@text="Password"]', mPassword, 15)
        if (mError)  return false
        console.log('Node: [ Password: '+mPassword+' --- Time: '+getTime()+' ]')
        mError = await waitForClick(mDriver, '//android.widget.Button[@text="Next"]', 15)
        if (mError)  return false
        console.log('Node: [ Next --- Time: '+getTime()+' ]')
        mError = await waitForClick(mDriver, '//android.widget.Button[@text="Sign up"]', 15)
        if (mError)  return false
        console.log('Node: [ Sign up --- Time: '+getTime()+' ]')

        let mStatus = await waitForCreateCompleted(mDriver)

        CREATED = true

        if (mStatus == 100 || mStatus == 500) return false

        console.log('Node: [ Status: '+mStatus+' --- Time: '+getTime()+' ]')

        if (mStatus != 200) {
            mStatus = await waitForFacebookLogin(mDriver, mEmail, mPassword)
            if (!mStatus) return false
        }

        let OTP = null
        FB_ID = null
        mCookies = null
        mAddress = null
        mMailKey = null
        mTimestamp = 0
        
        for (let i = 0; i < 2; i++) {
            OTP = await waitForFbOtp(mUser, CONFIG['domain'], CONFIG['website'], 5+i)
            
            if (OTP) {
                if (OTP == 'ERROR') {
                    OTP = null
                    continue
                } else {
                    break
                }
            }
            
            mError = await waitForClick(mDriver, '//android.widget.Button[@content-desc="I didn’t get the code"]', 15)
            if (mError)  break
            mError = await waitForClick(mDriver, '//android.view.ViewGroup[@content-desc="Resend confirmation code"]', 15)
            if (mError)  break
        }

        console.log('Node: [ OTP: '+OTP+' --- Time: '+getTime()+' ]')

        if (OTP) {
            mError = await setInputData(mDriver, '//android.widget.EditText', OTP, 15)
            if (mError)  return false
            mError = await waitForClick(mDriver, '//android.widget.Button[@content-desc="Next"]', 15)
            if (mError)  return false
            console.log('Node: [ Next --- Time: '+getTime()+' ]')
            mStatus = await waitForVerificationCompleted(mDriver, mId)
            if(!mStatus) return false

            await readFbAuthData(mId)

            await adbShell(mId, 'pm uninstall com.facebook.katana')
            
            console.log('Node: [ FB ID: '+FB_ID+' --- Time: '+getTime()+' ]')

            if (FB_ID) {
                if (await fbIdValied(FB_ID)) {
                    try {
                        await axios.patch(BASE_URL+'facebook/account/'+FB_ID+'.json', JSON.stringify({ email:mEmail, pass:mPassword, cookies: mCookies, create:new Date().getTime() }), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        })
                    } catch (error) {}

                    return true
                } else {
                    console.log('Node: [ Block Account --- Time: '+getTime()+' ]')
                }
            } else {
                try {
                    await axios.patch(BASE_URL+'facebook/pending/'+mUser+'.json', JSON.stringify({ email:mEmail, pass:mPassword, create:new Date().getTime() }), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                } catch (error) {}
            }
        }
    } catch (e) {}

    return false
}


async function waitForFacebookLogin(mDriver, mEmail, mPassword) {
    try {
        mError = await waitForClick(mDriver, '//android.view.ViewGroup[@content-desc="Log in"]', 15)
        if (mError)  return false
        console.log('Node: [ Loaded Log-in Page --- Time: '+getTime()+' ]')
        mError = await setInputData(mDriver, '//android.widget.AutoCompleteTextView[@content-desc="Username"]', mEmail, 15)
        if (mError)  return false
        console.log('Node: [ Email: '+mEmail+' --- Time: '+getTime()+' ]')
        mError = await setInputData(mDriver, '//android.widget.EditText[@text="Password"]', mPassword, 15)
        if (mError)  return false
        console.log('Node: [ Password: '+mPassword+' --- Time: '+getTime()+' ]')
        mError = await waitForClick(mDriver, '//android.view.ViewGroup[@content-desc="Log in"]', 15)
        if (mError)  return false
        console.log('Node: [ Log In --- Time: '+getTime()+' ]')
        
        for (let i = 0; i < 30; i++) {
            try {
                let incorrect = await mDriver.$('//android.widget.TextView[@text="Incorrect password"]')
                if (await incorrect.isDisplayed()) {
                    console.log('Node: [ Incorrect password --- Time: '+getTime()+' ]')
                    return false
                }

                let getCode = await mDriver.$('//android.widget.Button[@text="GET CODE"]')
                if (await getCode.isDisplayed()) {
                    console.log('Node: [ Incorrect password --- Time: '+getTime()+' ]')
                    return false
                }
    
                let confirmation = await mDriver.$('//android.view.View[@content-desc="Confirmation code"]')
                if (await confirmation.isDisplayed()) {
                    console.log('Node: [ Confirmation code --- Time: '+getTime()+' ]')
                    return true
                }
            } catch (error) {}
    
            await delay(1000)
        }
    } catch (error) {}

    return false
}

async function rootPermission(mDriver, mId) {
    let mReuslt = false
    try {
        exec(ADB+'-s '+mId+' shell "su -c ls"', function (err, stdout, stderr) {
            mReuslt = true
        })
    } catch (error) {}
    
    for (let i = 0; i < 10; i++) {
        try {
            if (mReuslt) {
                break
            } else {
                let permission = await mDriver.$('//android.widget.TextView[@resource-id="com.nemu.superuser:id/request"]')
                if (await permission.isDisplayed()) {
                    let forever = await mDriver.$('//android.widget.RadioButton[@resource-id="com.nemu.superuser:id/remember_forever"]')
                    if (await forever.isDisplayed()) {
                        await forever.click()

                        let allow = await mDriver.$('//android.widget.Button[@resource-id="com.nemu.superuser:id/allow"]')
                        if (await allow.isDisplayed()) {
                            await allow.click()
                            break
                        }
                    }
                }
            }
        } catch (error) {}

        await delay(1000)
    }
}

async function readFbAuthData(mId) {
    try {
        let authResult = await adbShell(mId, `"su -c 'cat /data/data/com.facebook.katana/app_light_prefs/com.facebook.katana/authentication'"`)
        if (authResult) {
            let mFbAuth = await getFbAuthData(authResult)
            if (mFbAuth && mFbAuth['id']) {
                mCookies = mFbAuth['cookies']
                FB_ID = mFbAuth['id']
            }
        }
    } catch (error) {}
}


async function facebookReInstall(mId) {
    await adbShell(mId, 'pm uninstall com.facebook.katana')

    await delay(1000)

    if (!await isAppInstalled(mId, 'com.facebook.katana')) {
        await waitForFacebookInstall(mId, 'Facebook')
    }
}

async function waitForFacebookInstall(mId, mName) {
    try {
        for (let i = 0; i < 10; i++) {
            let install = await adbAppInstall(mId, mName+'.apk')
            if (install) {
                return true
            }
            await delay(5000)
        }
    } catch (error) {}

    return false
}

async function waitForVerificationCompleted(driver, mId) {
    for (let i = 0; i < 15; i++) {
        try {
            let addPic = await driver.$('//android.widget.Button[@content-desc="Add picture"]')
            if (await addPic.isDisplayed()) {
                return true
            }

            let notNow = await driver.$('//android.view.View[@content-desc="Not now"]')
            if (await notNow.isDisplayed()) {
                return true
            }

            let block = await driver.$('//android.view.ViewGroup[@content-desc="Appeal"]')
            if (await block.isDisplayed()) {
                console.log('Node: [ Account Suspended --- Time: '+getTime()+' ]')
                return false
            }

            let profile = await driver.$('//android.view.ViewGroup[@content-desc="Go to profile"]')
            if (await profile.isDisplayed()) {
                return true
            }

            let mResult = await adbShell(mId, '"dumpsys activity activities | grep ResumedActivity"')
            if (!mResult.includes('com.facebook.katana')) {
                return true
            }
        } catch (error) {}

        await delay(1000)
    }

    return true
}

async function waitForCreateCompleted(driver) {
    try {
        for (let i = 0; i < 60; i++) {
            try {
                let wrongView = await driver.$('//android.widget.ScrollView')
                if (await wrongView.isDisplayed()) {
                    let wrongOK = await driver.$('//android.widget.Button[@text="OK"]')
                    if (await wrongOK.isDisplayed()) {
                        return 400
                    }
                }

                let confirmation = await driver.$('//android.widget.Button[@content-desc="Confirmation codes"]')
                if (await confirmation.isDisplayed()) {
                    console.log('Node: [ Confirmation code --- Time: '+getTime()+' ]')
                    return 200
                }

                let didNotGet = await driver.$('//android.widget.Button[@content-desc="I didn’t get the code"]')
                if (await didNotGet.isDisplayed()) {
                    console.log('Node: [ I didn’t get the code --- Time: '+getTime()+' ]')
                    return 200
                }

                let loginFailed = await driver.$('//android.widget.TextView[@text="Login Failed"]')
                if (await loginFailed.isDisplayed()) {
                    let close = await driver.$('//android.widget.Button[@text="CLOSE"]')
                    if (await close.isDisplayed()) {
                        await close.click()
                        return 201
                    }
                }

                let block = await driver.$('//androidx.recyclerview.widget.RecyclerView/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup[3]')
                if (await block.isDisplayed()) {
                    let blockOk = await driver.$('//android.view.ViewGroup[@content-desc="Continue"]')
                    if (await blockOk.isDisplayed()) {
                        console.log('Node: [ Block Account --- Time: '+getTime()+' ]')
                        return 500
                    }
                }
            } catch (error) {}
            await delay(1000)
        }
    } catch (error) {}

    return 100
}

async function setDteTime(driver) {
    try {
        let mPos = await getBoundls(await driver.$('-android uiautomator:new UiSelector().className("android.widget.NumberPicker").instance(0)').getAttribute('bounds'))
        let dPos = await getBoundls(await driver.$('-android uiautomator:new UiSelector().className("android.widget.NumberPicker").instance(1)').getAttribute('bounds'))
        let yPos = await getBoundls(await driver.$('-android uiautomator:new UiSelector().className("android.widget.NumberPicker").instance(2)').getAttribute('bounds'))
        
        let midleX = (mPos.sX+mPos.eX)/2

        let size = Math.floor((Math.random() * 3))

        for (let i = 0; i < size; i++) {
            await driver.performActions([{
                'type': 'pointer',
                'id': 'finger',
                'parameters': { 'pointerType': 'touch' },
                'actions': [{
                    'type': 'pointerMove',
                    'duration': 0,
                    'x': midleX,
                    'y': mPos.sY+10
                }, { 'type': 'pointerDown', 'button': 0 }, {
                    'type': 'pointerMove',
                    'duration': 100,
                    'origin': 'viewport',
                    'x': midleX,
                    'y': mPos.eY-10
                }, { 'type': 'pointerUp', 'button': 0 }]
            }])
            await delay(100)
        }

        await delay(500)

        midleX = (dPos.sX+dPos.eX)/2

        size = Math.floor((Math.random() * 3))

        for (let i = 0; i < size; i++) {
            await driver.performActions([{
                'type': 'pointer',
                'id': 'finger',
                'parameters': { 'pointerType': 'touch' },
                'actions': [{
                    'type': 'pointerMove',
                    'duration': 0,
                    'x': midleX,
                    'y': dPos.sY+10
                }, { 'type': 'pointerDown', 'button': 0 }, {
                    'type': 'pointerMove',
                    'duration': 100,
                    'origin': 'viewport',
                    'x': midleX,
                    'y': dPos.eY-10
                }, { 'type': 'pointerUp', 'button': 0 }]
            }])
            await delay(100)
        }

        await delay(500)

        midleX = (yPos.sX+yPos.eX)/2

        size = Math.floor((Math.random() * 3))+9
        let tYear = Math.floor((Math.random() * 5))

        for (let i = 0; i < size; i++) {
            await driver.performActions([{
                'type': 'pointer',
                'id': 'finger',
                'parameters': { 'pointerType': 'touch' },
                'actions': [{
                    'type': 'pointerMove',
                    'duration': 0,
                    'x': midleX,
                    'y': yPos.sY+10
                }, { 'type': 'pointerDown', 'button': 0 }, {
                    'type': 'pointerMove',
                    'duration': 100,
                    'origin': 'viewport',
                    'x': midleX,
                    'y': yPos.eY-10
                }, { 'type': 'pointerUp', 'button': 0 }]
            }])

            try {
                if (i > 6) {
                    let text = await driver.$('//android.widget.LinearLayout[@resource-id="android:id/pickers"]/android.widget.NumberPicker[3]/android.widget.EditText').getText()
                    if (size == i && parseInt(text) > 2000) {
                        size++
                    } else if (parseInt(text) < 2000-tYear) {
                        break
                    }
                } else {
                    await delay(100)
                }
            } catch (error) {
                await delay(100)
            }
        }
    } catch (e) {}
}

async function waitForClick(driver, xPath, timeout) {
    try {
        for (let i = 0; i < timeout; i++) {
            try {
                let target = await driver.$(xPath)
                if (await target.isDisplayed()) {
                    await target.click()
                    return false
                }
            } catch (error) {}

            await delay(1000)
        }
    } catch (error) {}

    return true
}

async function waitForDisplay(driver, xPath, timeout) {
    try {
        for (let i = 0; i < timeout; i++) {
            try {
                let target = await driver.$(xPath)
                if (await target.isDisplayed()) {
                    return false
                }
            } catch (error) {}

            await delay(1000)
        }
    } catch (error) {}

    return true
}

async function setInputData(driver, xPath, text, timeout) {
    try {
        for (let i = 0; i < timeout; i++) {
            try {
                let target = await driver.$(xPath)
                if (await target.isDisplayed()) {
                    await target.setValue(text)
                    return false
                }
            } catch (error) {}

            await delay(1000)
        }
    } catch (error) {}

    return true
}

async function getBoundls(data) {
    let result = {
        sX: 0,
        sY: 0,
        eX: 0, 
        eY: 0,
    }

    try {
        let split = data.substring(1, data.length-1).split('][')
        let start = split[0].trim().split(',')
        let end = split[1].trim().split(',')
        result.sX = parseInt(start[0])
        result.eX = parseInt(end[0])
        result.sY = parseInt(start[1])
        result.eY = parseInt(end[1])
    } catch (error) {}

    return result 
}

async function getRandomDomail(user) {
    for (let i = 0; i < 5; i++) {
        try {
            let response = await axios.post('https://api.internal.temp-mail.io/api/v3/email/new', { 'domain': '', 'name': user, 'token': '' }, {
                  headers: {
                    'Host': 'api.internal.temp-mail.io',
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Accept-Encoding': 'gzip, deflate',
                    'User-Agent': 'okhttp/4.5.0'
                }
            })
            
            let email = response.data['email']
            
            if (email) {
                return email
            }
        } catch (error) {}

        await delay(1000)
    }
}

async function waitForFbOtp(user, domain, type, target) {   
    if (type == 'smailpro') {
        try {
            for (let i = 0; i < 3; i++) {
                if (mAddress == null || mMailKey == null) {
                    try {
                        let response = await axios.get('https://smailpro.com/app/create?username='+user+'&type=alias&domain='+domain+'&server=1', {
                            headers: getHeader(),
                            timeout: 5000
                        })
                        
                        let data = response.data
                        
                        mAddress = data.address
                        mTimestamp = data.timestamp
                        mMailKey = data.key

                        break
                    } catch (error) {}

                    await delay(2000)
                } else {
                    break
                }
            }
            
            if (mAddress == null || mMailKey == null) {
                return 'ERROR'
            }

            let error = 0

            for (let j = 0; j < target; j++) {
                try {
                    response = await axios.post('https://smailpro.com/app/inbox', [{'address': mAddress, 'timestamp': mTimestamp, 'key': mMailKey }], {
                        headers: getHeader(),
                        timeout: 5000
                    })
        
                    data = response.data
        
                    mAddress = data[0].address
                    mTimestamp = data[0].timestamp
                    mMailKey = data[0].key
                    let payload = data[0].payload

                    response = await axios.get('https://app.sonjj.com/v1/temp_email/inbox?payload='+payload, {
                        headers: getHeader(),
                        timeout: 5000
                    })
                    
                    let list = response.data['messages']

                    for (let i = 0; i < list.length; i++) {
                        try {
                            if (list[i]['textFrom'] == 'registration@facebookmail.com') {
                                let otp = list[i]['textSubject'].split(' ')[0].trim()
                                if (otp.length == 5) {
                                    return otp
                                }
                            }
                        } catch (e) {}
                    }
                } catch (e) {
                    if (error < 3) {
                        j--
                        error++
                    }
                }
                
                await delay(1000)
            }
        } catch (error) {}
    } else if (type == 'internal') {
        try {
            for (let i = 0; i < target; i++) {
                try {
                    let response = await axios.get('https://api.internal.temp-mail.io/api/v3/email/'+user+'@'+domain+'/messages', {
                        headers: {
                          'Host': 'api.internal.temp-mail.io',
                          'Accept-Encoding': 'gzip, deflate',
                          'User-Agent': 'okhttp/4.5.0'
                        }
                    })

                    let list = response.data

                    for (let i = 0; i < list.length; i++) {
                        try {
                            if (list[i]['from'].includes('registration@facebookmail.com')) {
                                let otp = list[i]['subject'].split(' ')[0].trim()
                                if (otp.length == 5) {
                                    return otp
                                }
                            }
                        } catch (e) {}
                    }
                } catch (error) {}

                await delay(1000)
            }
        } catch (error) {}
    } else if (type == 'temp-acid') {
        try {
            for (let i = 0; i < 3; i++) {
                if (mAddress == null) {
                    try {
                        let response = await axios.get('https://tempmail.ac.id/', {
                            headers: {
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                                'Accept-Language': 'en-US,en;q=0.9',
                                'Connection': 'keep-alive',
                                'Sec-Fetch-Dest': 'document',
                                'Sec-Fetch-Mode': 'navigate',
                                'Sec-Fetch-Site': 'none',
                                'Sec-Fetch-User': '?1',
                                'Upgrade-Insecure-Requests': '1',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                                'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                                'sec-ch-ua-mobile': '?0',
                                'sec-ch-ua-platform': '"Windows"'
                            },
                            maxRedirects:0,
                            validateStatus:null
                        })
                        
                        let data = response.data

                        let temp = data.substring(data.indexOf('window.livewire_token'), data.length)
                        temp = temp.substring(temp.indexOf("'")+1, temp.length)
                        let token = temp.substring(0, temp.indexOf("'"))

                        temp = data.substring(data.indexOf('deleteEmail'), data.length)
                        temp = temp.substring(temp.indexOf('wire:initial-data'), temp.length)
                        temp = temp.substring(temp.indexOf('"')+1, temp.length)
                        temp = temp.substring(0, temp.indexOf('"'))
                        
                        let json = JSON.parse(temp.replace(/&quot;/g,'"'))
                        
                        json['updates'] = [{'type':'fireEvent','payload':{'id':getRandomId(4),'event':'syncEmail','params':[user+'@'+domain]}}, {'type':'fireEvent','payload':{'id':getRandomId(4),'event':'fetchMessages','params':[]}}]
                        
                        mAddress = json

                        mMailKey = {
                            token: token,
                            cookies: tempCookies(response.headers['set-cookie'])
                        }
                        
                        break
                    } catch (error) {}

                    await delay(2000)
                } else {
                    break
                }
            }
            
            if (mAddress == null || mMailKey == null) {
                return 'ERROR'
            }

            for (let i = 0; i < target; i++) {
                try {
                    let response = await axios.post('https://tempmail.ac.id/livewire/message/frontend.app', mAddress, {
                        headers: {
                            'Accept': 'text/html, application/xhtml+xml',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Connection': 'keep-alive',
                            'Content-Type': 'application/json',
                            'Cookie': mMailKey['cookies'],
                            'Origin': 'https://tempmail.ac.id',
                            'Referer': 'https://tempmail.ac.id/',
                            'Sec-Fetch-Dest': 'empty',
                            'Sec-Fetch-Mode': 'cors',
                            'Sec-Fetch-Site': 'same-origin',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                            'X-CSRF-TOKEN': mMailKey['token'],
                            'X-Livewire': 'true',
                            'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                            'sec-ch-ua-mobile': '?0',
                            'sec-ch-ua-platform': '"Windows"'
                        },
                        maxRedirects:0,
                        validateStatus:null
                    })

                    let list = response.data['serverMemo']['data']['messages']
                    
                    for (let i = 0; i < list.length; i++) {
                        try {
                            if (list[i]['sender_email'] == 'registration@facebookmail.com') {
                                let otp = list[i]['subject'].split(' ')[0].trim()
                                if (otp.length == 5) {
                                    return otp
                                }
                            }
                        } catch (e) {}
                    }
                } catch (error) {}

                await delay(1000)
            }
        } catch (error) {}
    }

    return null
}

async function waitForDeviceOnline(mId) {
    for (let i = 0; i < 60; i++) {
        try {
            let result = await cmdExecute(ADB+'devices')
            
            let deviceOnline = false
            result.split('\n').forEach(function(line) {
                try {
                    if (!line.startsWith('List of devices attached')) {
                        let split = line.split('\t')
                        if (split.length >= 2) {
                            if (split[0].trim() == mId && split[1].trim() == 'device') {
                                deviceOnline = true
                            }
                        }
                    }
                } catch (error) {}
            })

            if (deviceOnline) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }

    for (let i = 0; i < 60; i++) {
        try {
            let result = await adbShell(mId, 'getprop ro.product.cpu.abi')
            if (result) {
                return result
            }
        } catch (error) {}

        await delay(1000)
    }

    return null
}

async function waitForStartEmulator(restart, host, port) {
    if (restart) {
        let isInstall = await isInstallEmulator()
        if (!isInstall) {
            await waitForInstallEmulator()
        }

        await cmdExecute('taskkill /IM "Emulator.exe" /T /F')
        await cmdExecute('taskkill /IM "MuMuPlayer.exe" /T /F')
        await cmdExecute('taskkill /IM "MuMuVMMHeadless.exe" /T /F')
        await cmdExecute('taskkill /IM "MuMuVMMSVC.exe" /T /F')
        await delay(1000)
    
        try {
            let config = fs.readFileSync('config.json', 'utf-8')
            fs.writeFileSync('customer_config.json', await replaceConfig(config))
            if (!isInstall) await cmdExecute('rmdir /q /s -Recurse -Force -Confirm:$false "'+ENGINE+'vms\\MuMuPlayerGlobal-12.0-0"')
            await cmdExecute('mkdir "'+ENGINE+'vms\\MuMuPlayerGlobal-12.0-0\\configs"')
            await cmdExecute('mkdir "'+ENGINE+'shell\\products\\PrivacyInfo.bin"')
            await cmdExecute('copy customer_config.json "'+ENGINE+'vms\\MuMuPlayerGlobal-12.0-0\\configs\\customer_config.json"')
            if (!isInstall) {
                await cmdExecute('copy "'+ENGINE+'vms\\MuMuPlayerGlobal-12.0-base\\ota.vdi" "'+ENGINE+'vms\\MuMuPlayerGlobal-12.0-0\\ota.vdi"')
                await cmdExecute('copy "'+ENGINE+'vms\\MuMuPlayerGlobal-12.0-base\\data.vdi" "'+ENGINE+'vms\\MuMuPlayerGlobal-12.0-0\\data.vdi"')
            }
        } catch (error) {}
    
        await delay(1000)
        cmdExecute('"'+ENGINE+'shell\\MuMuPlayer.exe"')
        
        console.log('Node: Emulator Runing...')
    }

    for (let i = 0; i < 60; i++) {
        try {
            let result = await cmdExecute(ADB+'connect '+host+':'+port)
            if (result && (result.indexOf('connected to '+host+':'+port) > -1)) {
                return host+':'+port
            }
        } catch (error) {}

        await delay(1000)
    }
}

async function waitForInstallEmulator() {
    console.log('Node: Emulator Installing')
    cmdExecute('Emulator.exe')

    await waitForTaskRuning('Emulator.exe', 30)
    console.log('Node: Open MuMu Emulator Installer')
    
    await cmdExecute('python install.py"')
    
    console.log('Node: MuMu Emulator Installing')

    await waitForDeskTopShorcut()

    console.log('Node: MuMu Emulator Install Success')

    await delay(5000)
}


async function waitForDeskTopShorcut() {
    for (let i = 0; i < 120; i++) {
        if (await isInstallEmulator()) {
            return true
        }
        await delay(2000)
    }

    return false
}

async function isInstallEmulator() {
    try {
        return fs.existsSync(ENGINE+'uninstall.exe')
    } catch (error) {}

    return false
}

async function replaceConfig(configJson) {
    let device = 'XiaoMi★Note 9 Pro★M2007J17C'
    for (let i = 0; i < 3; i++) {
        try {
            let response = await axios.get(BASE_URL+'device/'+getRandomInt(0, CONFIG['device'])+'.json')
            let data = response.data

            if (data) {
                device = data
                break
            }
        } catch (error) {}

        await delay(3000)
    }

    let details = device.split('★')

    configJson = configJson.replace('VVVVVVVVVV', details[0]).replace('XXXXXXXXXX', details[0]+' '+details[1])

    configJson = configJson.replace('YYYYYYYYYY', details[2]).replace('ZZZZZZZZZZ', details[1])

    return configJson.replace('WWWWWWWWWW', '860'+getRandomNumber(12))
}

async function waitForTaskRuning(taskName, timeout) {
    for (let i = 0; i < timeout; i++) {
        try {
            let result = await cmdExecute('tasklist')
            if (result.toLowerCase().indexOf(taskName.toLowerCase()) > -1) {
                break
            }
        } catch (error) {}

        await delay(1000)
    }
}

async function startAppiumServer() {
    let isActive = false

    try {
        await axios.get('http://localhost:4723', {validateStatus:null})
        isActive = true
    } catch (error) {}

    if (!isActive) {
        console.log('Node: Appium Server Starting...')
        cmdExecute('start cmd.exe /K appium')
    }
}


async function cmdExecute(cmd) {
    return new Promise((resolve) => {
        try {
            exec(cmd, function (err, stdout, stderr) {
                try {
                    if (err) {
                        resolve(null)
                    } else {
                        resolve(stdout.trim())
                    }
                } catch (error) {
                    resolve(null)
                }
            })
        } catch (error) {
            resolve(null)
        }
    })
}

async function adbShell(mId, cmd) {
    try {
        return await cmdExecute(ADB+'-s '+mId+' shell '+cmd)
    } catch (error) {}

    return null
}

async function adbAppInstall(mId, file) {
    try {
        let result = await cmdExecute(ADB+'-s '+mId+' install '+file)
        if (result && result.includes('Install') && result.includes('Success')) {
            return true
        }
    } catch (error) {}

    return false
}

async function isAppInstalled(mId, pkg) {
    try {
        let result = await cmdExecute(ADB+'-s '+mId+' shell pm path '+pkg)
        if (result && result.startsWith('package:')) {
            return true
        }
    } catch (error) {}

    return false
}

async function fbIdValied(id) {
    try {
        let response = await axios.get('https://graph.facebook.com/'+id+'/picture?type=normal', {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'priority': 'u=0, i',
                'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
            },
            maxRedirects: 0,
            validateStatus: null
        })

        let location = response.headers['location']

        if (location && !location.endsWith('.fbcdn.net/rsrc.php/v1/yh/r/C5yt7Cqf3zU.jpg')) {
            return true
        }
    } catch (error) {}

    return false
}

async function getConfigData() {
    for (let i = 0; i < 10; i++) {
        try {
            let response = await axios.get(BASE_URL+'facebook/config.json')
            let data = response.data
    
            if (data) {
                return data
            }
        } catch (error) {}

        await delay(3000)
    }

    return null
}

async function getFbName(config) {

    for (let i = 0; i < 3; i++) {
        try {
            let response = await axios.get(BASE_URL+'name/'+ config['type'] +'/'+getRandomInt(0, config['size'])+'.json')
            let data = response.data

            if (data) {
                return data.replace('"', '').replace('"', '')
            }
        } catch (error) {}

        await delay(3000)
    }

    return null
}

async function checkStatus() {
    if (FINISH > 0 && FINISH < new Date().getTime()) {
        try {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+parseInt(new Date().getTime()/1000)
            })
        } catch (error) {}

        console.log('---COMPLETED---')
        process.exit(0)
    } else {
        try {
            await postAxios(STORAGE+encodeURIComponent('server/'+USER+'.json'), '', {
                'Content-Type':'active/'+(parseInt(new Date().getTime()/1000)+200)
            })
        } catch (error) {}
    }
}

async function postAxios(url, body, data) {
    return new Promise((resolve) => {
        try {
            fetch(url, {
                method: 'POST',
                headers: data,
                body: body
            }).then((response) => {
                resolve('ok')
            }).catch((error) => {
                resolve('ok')
            })
        } catch (error) {
            resolve('ok')
        }
    })
}

async function getFbAuthData(authData) {
    try {
        let cookies = {}

        let json = JSON.parse(authData.substring(authData.indexOf('[{'), authData.lastIndexOf('}]')+2))
        
        for (let i = 0; i < json.length; i++) {
            try {
                cookies[json[i]['name']] = json[i]['value']
            } catch (error) {}
        }

        if (cookies['c_user'] && cookies['datr'] && cookies['xs']) {
            let cookie = 'datr='+cookies['datr']+'; sb='

            if (cookies['sb']) {
                cookie += cookies['sb']
            } else {
                cookie += cookies['datr'].substring(0, 5)+getRandomId(19)
            }

            cookie += '; m_pixel_ratio=3; wd=360x652; c_user='+cookies['c_user']+'; fr='

            if (cookies['fr']) {
                cookie += cookies['fr']
            } else {
                cookie += getRandomId(17)+'.'+getRandomId(27)+'.'+getRandomId(6)+'..AAA.0.0.'+getRandomId(6)+'.'+getRandomId(11)
            }

            cookie += '; xs='+ encodeURIComponent(cookies['xs'])+'; m_page_voice='+cookies['c_user']

            return { id:cookies['c_user'], cookies:cookie }
        }
    } catch (error) {}

    return {}
}

function getRandomNumber(size) {
    let N = ['0','1','2','3','4','5','6','7','8','9']
    
    let num = ''

    for (let i = 0; i < size; i++) {
        num += N[Math.floor((Math.random() * N.length))]
    }

    return num
}

function getRandomUser() {
    let L = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    let N = ['0','1','2','3','4','5','6','7','8','9']
    
    let user = ''

    for (let i = 0; i < 10; i++) {
        user += L[Math.floor((Math.random() * L.length))]
    }

    for (let i = 0; i < 5; i++) {
        user += N[Math.floor((Math.random() * N.length))]
    }

    return user
}

function getRandomId(size) {
    let C = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9']
    
    let user = ''

    for (let i = 0; i < size; i++) {
        user += C[Math.floor((Math.random() * C.length))]
    }

    return user
}

function getRandomPass(name) {
    let L = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    
    let pass = ''

    for (let i = 0; i < 10-name.length; i++) {
        pass += L[Math.floor((Math.random() * L.length))]
    }

    let date = new Date().getDate()

    return name + pass + (date > 9 ? date : '0'+date)
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomHex(size) {
    let C = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']
    
    let result = ''

    for (let i = 0; i < size*2; i++) {
        result += C[Math.floor((Math.random() * C.length))]
    }

    return result
}

function getUserName() {
    try {
        let directory = __dirname.split('\\')
        if (directory.length > 1) {
            let name = directory[directory.length-1]
            if (name) {
                return name
            }
        }
    } catch (error) {}

    try {
        let directory = __dirname.split('/')
        if (directory.length > 1) {
            let name = directory[directory.length-1]
            if (name) {
                return name
            }
        }
    } catch (error) {}

    return null
}

function getHeader() {
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

function tempCookies(list) {
    let cookies = ''

    for (let i = 0; i < list.length; i++) {
        cookies += list[i].split(';')[0]+'; '
    }

    return cookies
}


function getTime() {
    return new Date().toLocaleTimeString('en-us', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')
}

function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii')
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
