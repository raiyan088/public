const request = require('request')

updateServer()

function updateServer() {
    request({
        url: 'https://job-server-088-default-rtdb.firebaseio.com/raiyan088/test.json',
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify({ active:new Date().toString() })
    }, function (error, response, body) {
        console.log(new Date().toString())
        setTimeout(updateServer, 10000)
    })
}
