const {get, fs, cheerio} = require('./package')

async function getLinksPerLocation(location, page) {
  const response = (await get(`https://www.olx.co.id/properti/rumah/${location}?page=${page}`)).body
  const $ = cheerio.load(response)
  const links = []
  $('.marginright5.link').each( (idx, elm) => {
    links.push($(elm).attr('href'))
  })
  return links
}

async function getTotalPage(location) {
  const response = (await get(`https://www.olx.co.id/properti/rumah/${location}/`)).body
  const $ = cheerio.load(response)
  let $totalPage = $('.item.inline-block')
  $totalPage = $($totalPage)[$totalPage.length-1];
  return $($totalPage).text().trim()

}

function scrapDetail(response) {
  const $ = cheerio.load(response)
  const detail = $('.spesifikasi').children().each((idx, elm) => {
    return $(elm).text().trim()
  })
  return {
    title : $('.brkword.lheight28').text().trim(),
    price : $('.pricelabel').text().trim().replace(/\t/g,' ').replace(/\n/g,' '),
    detail : $(detail).text().replace(/\t/g,' ').replace(/\n/g,' '),
    description : $('.pding10.lheight20.large').text().trim().replace(/\n/g,' ')
  }
}

async function getDetailPerLocation(location, totalPage) {
  const obj = []
  //loop per page
  const links = []
  for(let i =1, n= 3; i<n; i++)
  {
    links.push(... await getLinksPerLocation(location, i))
  }
  //loop per link
  for(let i = 0, n = links.length; i<n; i++) {
    const response = (await get(links[i])).body
    obj.push(scrapDetail(response))
  }
  return obj
}

async function main() {
  const location = [
    'jakarta-utara',

  ]
  const result = {}
  for(let i =0 ,n = location.length; i<n; i++) {
    const totalPage = await getTotalPage(location[i])
    const obj = await getDetailPerLocation(location[i], totalPage)
    result[location[i]] = obj
  }

  fs.writeFileSync('test.json',JSON.stringify(result))

}

main()
