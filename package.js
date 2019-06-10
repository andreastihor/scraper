const request = require('request')
const Promise = require('bluebird')
const get = Promise.promisify(request.get)
const post = Promise.promisify(request.post)
const cheerio = require('cheerio')


module.exports = {
  get,
  post,
  cheerio
}
