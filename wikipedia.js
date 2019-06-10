const {get, post, cheerio} = require('./package')

/*
Scraping wikipedia table that located on the right side
take everything except the image
*/

async function start(keyword = null) {
  const response = (await get(`https://en.wikipedia.org/wiki/${keyword}`)).body
  const $ = cheerio.load(response)
  const tbody = $('.vcard tbody').children()
  const obj = {}
  $(tbody).each((idx, elm) => {
    if (idx != 0) {
      obj[$(elm).children().first().text().trim()] = $(elm).children().last().text().trim()
    }
  })

console.log(obj);
  // do console.log here for checking
    // ex console.log(obj);
}

// Your wikipedia keysearch goes in keyword
start("keyword")
