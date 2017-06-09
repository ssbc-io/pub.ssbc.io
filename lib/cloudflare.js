var CloudFlareAPI = require('cloudflare4')
var config = require('../config.json')
var client = new CloudFlareAPI({
  email: config.cloudflare.email,
  key: config.cloudflare.key
})

module.exports = client
