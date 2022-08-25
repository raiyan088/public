
require('events').EventEmitter.prototype._maxListeners = 100

const admin = require('./database')
const request = require('request')
const crypto = require('crypto')
const fs = require('fs')

let SERVER = 'server'
let COUNTRY = null
let CODE = null


let database = new admin()

let mSize = 0
let mName = 0
let mMultiPoll = 0
let mList = {}

fs.readFile('./id.txt', {encoding: 'utf-8'}, function(err,data){
    if(!err) {
        try {
            SERVER = 'server'+data
            database.connect((error) => {
                if(!error) {
                    request({
                        url: 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/code/server/'+SERVER+'.json',
                        json:true
                    }, function(error, response, body){
                        if(!(error || body == null)) {
                            CODE = body['code']
                            COUNTRY = body['name']
                            request({
                                url: 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/code/gmail/found/'+COUNTRY+'/0000000000.json',
                                json:true
                            }, function(error, response, data){
                                if(!(error || data == null)) {
                                    console.log('start server')

                                    mSize = data['size']
                                    
                                    if(mSize == 0) {
                                        mName = parseInt(new Date().getTime()/1000)
                                        database.set('/code/gmail/found/'+COUNTRY+'/0000000000/name', mName)
                                    } else {
                                        mName = data['name']
                                        if(mName == null) {
                                            mSize = 0
                                            mName = parseInt(new Date().getTime()/1000)
                                            database.set('/code/gmail/found/'+COUNTRY+'/0000000000/name', mName)
                                        }
                                    }
                            
                                    let length = parseInt(body['length'])
                                    let index = length == 8 ? 2 : length == 9 || length == 10 ? 3 : length == 11 ? 4 : 5
                                    mMultiPoll = Math.pow(10, length - index)
                                    
                                    for(let key of Object.keys(body)) {
                                        if(key.startsWith('start')) {
                                            let runing = 'runing'+key.replace('start', '')
                                            let start = body[key]
                                            let number = body[runing]
                                            if(number == null) {
                                                number = start * mMultiPoll
                                            }
                                            if(number != 0) {
                                                checkNumber(number, runing, start, 0)
                                            }
                                        }
                                    }
                                }
                            })
                        }
                    })
                }
            })
        } catch (e) {}
    }
})


function checkNumber(number, name, start, runing) {
    runing++
    if(runing >= 100) {
        console.log('Check: '+number)
        database.set('/code/server/'+SERVER+'/'+name, number)
        runing = 0
    }
    if(parseInt(start)+1 <= parseInt(number/mMultiPoll)) {
        database.set('/code/server/'+SERVER+'/'+name, 0)
    } else {
        request({
            url: 'https://accounts.google.com/_/lookup/accountlookup?hl=en&_reqid=999999',
            method: 'POST',
            body: getNumberTempData(CODE+number),
            headers: {
                'content-type' : 'application/x-www-form-urlencoded;charset=UTF-8',
                'google-accounts-xsrf' : 1
            }
        }, function(error, responce, body) {
            try {
                let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
                if(data[0][1] == 16) {
                    console.log('Found: '+data[0][4])
                    mSize++
                    mList[mSize] = number
                    if(Object.keys(mList).length >= 100) {
                        database.update('/code/gmail/found/'+COUNTRY+'/'+mName, mList)
                        if(mSize >= 10000) {
                            mSize = 0
                            mName = parseInt(new Date().getTime()/1000)
                            database.set('/code/gmail/found/'+COUNTRY+'/0000000000/name', mName)
                        }
                        mList = {}
                        database.set('/code/gmail/found/'+COUNTRY+'/0000000000/size', mSize)
                    }
                }
            } catch (e) {}
            checkNumber(number+1, name, start, runing)
        })
    }
}

function getNumberTempData(number) {
    let freq = [number,"AEThLlzLnodznP_eS7-mfzAihkXlpSKvoxliHZlPZE7W1-NMXK50YUORqG5WNyxwLONQwZwBsK1p-PH7BHW4s-NEZhzTMrxrdQHlqhB6bpzNema_MyohPW-JaUv-EO7_qbvIYnlKdIu0JkSGy2tJbRiElFWhzHXi1UJK1nt4D8UbHnOux-lF7PC0_RlISAgrI1oOSktxWO1I",[],null,null,null,null,2,false,true,[null,null,[2,1,null,1,"https://accounts.google.com/ServiceLogin?service=accountsettings&hl=en-US&continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&csig=AF-SEnY7bxxtADWhtFc_%3A1556625798&flowName=GlifWebSignIn&flowEntry=ServiceLogin",null,[],4,[],"GlifWebSignIn",null,[],false],1,[null,null,[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[],null,null,null,null,[]],null,null,null,true,null,null,null,null,null,null,null,null,[]],number,null,null,null,true,true,[]]
    return 'f.req='+encodeURIComponent(JSON.stringify(freq))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",getIdentifier()]))
}

function getIdentifier() {
    let data = ''
    let loop = Math.floor(Math.random() * 15)+15
    for(let i=0; i<loop; i++) {
        data = data+crypto.randomBytes(20).toString('hex')
    }
    return data
}
