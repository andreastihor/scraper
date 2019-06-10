let request = require('request')
const Promise = require('bluebird')
const cheerio = require('cheerio')
request = request.defaults({
  followAllRedirects: true,
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                  'Chrome/63.0.3239.84 ' +
                  'Safari/537.36',
  }
})
const fs = require('fs')
const get = Promise.promisify(request.get)
const post = Promise.promisify(request.post)
module.exports = {
  get,
  post,
  cheerio,
  fs,
  
}
