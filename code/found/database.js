const WebSocketClient = require('websocket').client
const request = require('request')

let mConnnection = null
let isConected = 0
let mConnect = false

module.exports = class {

    connect(callback) {

        const client = new WebSocketClient()

        mConnect = true

        client.on('connectFailed', function(error) {
            isConected = 2
            if(mConnect) {
                mConnect = false
                callback(error)
            }
        })
        
        client.on('connect', function(connection) {

            isConected = 1
            mConnnection = connection

            connection.on('error', function(error) {
                isConected = 2
            })
        
            connection.on('close', function() {
                isConected = 2
            })
        
            connection.on('message', function(message) {
                if(message.type === 'utf8') {
                    console.log("Received: '" + message.utf8Data + "'")
                }
            })
        
            if(mConnect) {
                mConnect = false
                callback(null)
            }
        })
        
        isConected = 0
        request({
            url: 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/server/database.json',
            json:true
        }, function(error, response, body){
            if(!error) {
                client.connect('ws://'+body+'.herokuapp.com/')
            } else {
                isConected = 2
            }
        })

        setInterval(function() {
            if(isConected == 2) {
                isConected = 0
                request({
                    url: 'https://raiyan-088-default-rtdb.firebaseio.com/raiyan/server/database.json',
                    json:true
                }, function(error, response, body){
                    if(!error) {
                        client.connect('ws://'+body+'.herokuapp.com/')
                    } else {
                        isConected = 2
                    }
                })
            }
        }, 10000)
    }

    set(path, data) {
        try{
            if(isConected == 1 && mConnnection != null) {
                mConnnection.sendUTF(path+'★★★'+'1'+'★★★'+JSON.stringify({ data : data }))
            }
        } catch (e) {}
    }

    update(path, data) {
        try{
            if(isConected == 1 && mConnnection != null) {
                mConnnection.sendUTF(path+'★★★'+'2'+'★★★'+JSON.stringify(data))
            }
        } catch (e) {}
    }

    isConected() {
        return isConected
    }
}
