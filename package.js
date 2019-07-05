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
const puppeteer = require('puppeteer')
async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: [
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=site-per-process',
      '--ignore-certificate-errors',
      '--incognito',
    ]
  },);
  const pages = await browser.pages();
  const page = pages[0];
  await page.setViewport({
    width: 1400,
    height: 1000,
  });
  page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36');
  return {
    page,
    browser,
  };
}
module.exports = {
  get,
  post,
  cheerio,
  fs,
  request,
  launchBrowser,
}
