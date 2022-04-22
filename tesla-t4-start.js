const poll = require('promise-poller').default
const admin = require("firebase-admin")
const puppeteer = require("puppeteer")
const request = require('request')
const express = require("express")
const axios = require('axios')
const https = require('https')
const path = require("path")
const fs = require('fs')

require('dotenv').config()

let AUTH = process.env.AUTH
let KEY = process.env.KEY