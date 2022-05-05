const admin = require("firebase-admin")
const path = require('path')

const SIZE = '2'


const GmailClient = require('./gmail-api')
const ID = require('./ID')

const serviceAccount = require(path.resolve("raiyan-088-firebase-adminsdk-9ku78-11fcc11d0c.json"))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://raiyan-088-default-rtdb.firebaseio.com"
})
  
const database = admin.database().ref('raiyan').child('number')

new GmailClient(database, new ID().getServer(), new ID().getSirial(), SIZE).start()