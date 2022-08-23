const fs = require('fs')

fs.copyFile('redirect.js', 'node_modules/request/lib/redirect.js', (err) => {
    if(!err) {
        fs.copyFile('NavigatorWatcher.js', 'node_modules/puppeteer/lib/NavigatorWatcher.js', (err) => {
            if(!err) {
                console.log('success')
            }
        })
    }
})