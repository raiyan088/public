

        while(true) {
            try {
                let active = false
                for(let i=1; i<=mSize; i++) {
                    await delay(500)
                    if(pages[i]['load'] == false) {
                        let output = await pages[i]['page'].evaluate(() => {
                            if(document && document.querySelector('colab-connect-button')) {
                            } else {
                                return false
                            }
                        })
                        if(output == false) {
                            active = true
                        } else {
                            console.log('Status: Webside load Success... ID: '+i)
                            pages[i]['load'] = true
                        }
                    }
                }
                
                if(active) {
                    await delay(1000)
                } else {
                    break
                }
            } catch (err) {}
        }

        console.log(getTime() + 'Website Load Success '+mGmail)
        await delay(5000)

        while(true) {
            try {
                let active = false
                for(let i=1; i<=mSize; i++) {
                    let page = pages[i]['page']
                    await page.bringToFront()
                    await delay(1000)
                    if(pages[i]['status'] == 0) {
                        const value = await page.evaluate(() => {
                            let colab = document.querySelector('colab-connect-button')
                            if(colab) {
                                let display = colab.shadowRoot.querySelector('#connect-button-resource-display')
                                if (display) {
                                    let ram = display.querySelector('.ram')
                                    if (ram) {
                                        let output = ram.shadowRoot.querySelector('.label').innerText
                                        if(output) {
                                            return 'RAM'
                                        }
                                    }
                                } else {
                                    let connect = colab.shadowRoot.querySelector('#connect')
                                    if (connect) {
                                        let output = connect.innerText
                                        if(output == 'Busy') {
                                            return 'Busy'
                                        } else if(output == 'Connect') {
                                            return 'Connect'
                                        }
                                    }
                                }
                            }
                            return null
                        })
            
                        if(value && (value == 'Connect' || value == 'RAM' || value == 'Busy')) {
                            if(value == 'Busy' || value == 'RAM') {
                                await page.click('#runtime-menu-button')
                                for (var j = 0; j < 9; j++) {
                                    await page.keyboard.press('ArrowDown')
                                }
                                await delay(420)
                                await page.keyboard.down('Control')
                                await page.keyboard.press('Enter')
                                await page.keyboard.up('Control')
                                await waitForSelector(page, 'div[class="content-area"]', 10)
                                await page.keyboard.press('Enter')
                                await delay(1000)
                            }
                            await page.keyboard.down('Control')
                            await page.keyboard.press('Enter')
                            await page.keyboard.up('Control')
                            await waitForSelector(page, 'div[class="content-area"]', 10)
                            await page.keyboard.press('Tab')
                            await page.keyboard.press('Enter')
                            await delay(2000)
                            console.log('Status: Connected. ID: '+i)
                            pages[i]['down'] = false
                            pages[i]['status'] = 1
                        }
                        active = true
                    }
                }
                


let position = 0
let loop = 0

setInterval(async function () {djd

    loop++

    if(loop % 6 == 0) {
        console.log('Runing: '+(loop/6)+'m'+' Status: '+'Running process.....' + ' ID: ' + mGmail)
    }
    
    if(position >= 10) {
        position = 1
    } else {
        position ++
    }

    let data = pages[position]
    
    if(mLoadSuccess && data && data['page']) {
        await data['page'].bringToFront()
        await delay(500)

        if(data['down'] != null && data['down'] == true) {
            data['down'] = false
            await data['page'].keyboard.press('ArrowUp')
        } else if(data['down'] != null && data['down'] == false) {
            data['down'] = true
            await data['page'].keyboard.press('ArrowDown')
        }
    }

}, 10000)


async function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    })
}

async function waitForSelector(page, command, loop) {
    for (let i = 0; i < loop; i++) {
        await delay(500)
        const value = await page.evaluate((command) => { return document.querySelector(command) }, command)
        if (value) i = loop
    }
    await delay(1000)
}

function getTime() {
    var currentdate = new Date();
    return "Last Sync: @ " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds() + ' @ --- '
}

function getChild(size) {
    let zero = ''
    let loop = size.toString().length
    for (let i = 0; i < 3 - loop; i++) {
        zero += '0'
    }
    return 'gmail-' + zero + size
}
