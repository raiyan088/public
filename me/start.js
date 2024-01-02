const { exec } = require('child_process')
const https = require('https')
const fs = require('fs')


process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            if (data == '1' || data == 1) {
                startProcess(false)
            } else {
                startProcess(true)
            }
        }
    } catch (error) {}
})

async function startProcess(cmd) {
    if (cmd) {
        exec('start cmd.exe /K node start.js 1')
        await delay(5000)
        console.log('Run Completed')
        process.exit(0)
    } else {
        let IP = await getRequest('https://ifconfig.me/ip')

        while (true) {
            if (IP == null) {
                await delay(3000)
                IP = await getRequest('https://ifconfig.me/ip')
            } else {
                break
            }
        }
    
        console.log('IP: '+IP)

        exec('installer.exe /S /SELECT_SERVICE=1 /SELECT_OPENSSLDLLS=1 /D='+__dirname+'\\OpenVPN')

        while (true) {
            try {
                let check = fs.existsSync('OpenVPN/bin/openvpn.exe')
                if (check) {
                    break
                }
            } catch (error) {}
    
            await delay(1000)
        }
    
        await delay(1000)
    
        console.log('Install Success')
    
        try {
            fs.copyFileSync('vpn.ovpn', 'OpenVPN/config/vpn.ovpn')
            fs.copyFileSync('openvpn.exe', 'OpenVPN/bin/openvpn.exe')
            fs.copyFileSync('libpkcs11-helper-1.dll', 'OpenVPN/bin/libpkcs11-helper-1.dll')
            console.log('File Copy Success')
        } catch (error) {
            console.log('File Copy Error')
        }
    
        exec(__dirname+'\\OpenVPN\\bin\\openvpn-gui.exe --connect vpn.ovpn')
        console.log('VPN Connecting...')

        let mConnect = false
        let timeout = 0

        while (true) {
            timeout++
            
            let ip = await getRequest('https://ifconfig.me/ip')
            console.log(ip)
                
            if (ip != null && ip != IP) {
                mConnect = true
                break
            }

            if (timeout > 10) {
                break
            }

            await delay(3000)
        }

        if (mConnect) {
            console.log('VPN Connected')
        } else {
            console.log('VPN Connection Failed')
            // exec('taskkill/IM openvpn-gui.exe')
            // exec('taskkill/IM openvpn.exe /F')
            // await delay(500)
            // exec('taskkill/IM openvpn-gui.exe')
            // exec('taskkill/IM openvpn.exe /F')
            // console.log('Stop')
        }

        while (true) {
            await delay(60000)
        }
    }
}


async function getRequest(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            res.setEncoding('utf8')
            let body = ''
            res.on('data', chunk => body += chunk)
            res.on('end', () => resolve(body))
        }).on('error', () => resolve(null))
    })
}

async function postRequest(url, postData, options) {
    return new Promise((resolve) => {
        https.request(url, options, (res) => {
            res.setEncoding('utf8')
            let body = ''
            res.on('data', chunk => body += chunk)
            res.on('end', () => resolve(body))
        }).on('error', () => resolve(null)).write(postData)
    })
}


function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
