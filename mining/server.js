const puppeteer = require('puppeteer')
const express = require('express')

const app = express()

app.listen(process.env.PORT || 3030, ()=>{
    console.log('Listening on port 3000 ...')
    startMining()
})

async function startMining() {
    ;(async () => {
        let browser = await puppeteer.launch({
            headless: true,
            args: [ '--no-sandbox', '--disable-setuid-sandbox', '--proxy-server=45.140.13.119:9132' ]
        })
    
        let page = await browser.newPage()

        await page.authenticate({'username' : 'nfcwqjes', 'password' : 'bel2d7rmrjr9'})

        await page.goto('https://firebase-server-088.herokuapp.com/mining')
    })()
}


app.get('/', async function(req, res) {
    res.end('Success')
})
