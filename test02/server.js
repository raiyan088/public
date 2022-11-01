const puppeteer = require('puppeteer')
const request = require('request')
const fs = require('fs')

;(async () => {
    let browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    let page = await browser.newPage()

    console.log('Page Load Start')

    await page.goto('https://google.com/')

    console.log('Page Load Success')
})()