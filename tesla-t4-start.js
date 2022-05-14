const poll = require('promise-poller').default
const admin = require('./database')
const puppeteer = require('puppeteer')
const request = require('request')
const axios = require('axios')
const https = require('https')
const fs = require('fs')

require('dotenv').config()

let AUTH = process.env.AUTH
let KEY = process.env.KEY