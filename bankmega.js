const Promise = require('bluebird')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer');
const request = require('request').defaults({
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                  'Chrome/63.0.3239.84 ' +
                  'Safari/537.36',
  },
})
const get = Promise.promisify(request.get)
const fs = require('fs')



async function launchBrowser() {
  const puppeteer_options = {
    launch: {
      headless: true,
      slowMo: 50,
      args: [
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=site-per-process',
        '--ignore-certificate-errors',
        '--incognito',
      ]
    },
    viewport: {
      width: 1400,
      height: 1000,
    }
  };
  const browser = await puppeteer.launch(puppeteer_options.launch);
  const pages = await browser.pages();
  const page = pages[0];
  await page.setViewport(puppeteer_options.viewport);
  page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36');
  return {browser, page}
}

async function getTotalPages(page) {
  console.log("Getting total page");
  return await page.evaluate(() => {
    const nodes = document.querySelectorAll('.tablepaging td a')
    if(nodes.length === 0) return 0
    if(nodes.length === 3) return 1

    const last = nodes.length-1
    const title = nodes[last].title
    const length = title.length - title.indexOf("of ") - 3
    return title.substr(title.indexOf("of ")+3, length)

  })
}

function beautify(text) {
  return text.replace(/\n/g,'').replace(/\t/g,'')
}

async function clickCategory(page, linkOrder) {
  const $category = await page.$$('#subcatpromo div img')
  const category = $category[linkOrder]
  await category.click()
}


async function getLinksPerCategory(page, linkOrder) {
  console.log("Get Links Per Category ... ");
  await page.waitFor('#subcatpromo')
  await clickCategory(page, linkOrder)
  await page.waitFor(3000)
  const totalLinks = []
  const totalNames = []
  const totalPages = await getTotalPages(page)
  for(let i =0; i<totalPages;i++){
    let {names, links} = await getLinksPerPages(page)
    totalNames.push(...names)
    totalLinks.push(...links)
    let nodes = await page.$$('.page_promo_lain')
    let last = nodes[nodes.length-1]
    await last.click()
    await page.waitFor(5000)
  }
  return {totalNames, totalLinks}
}

async function getLinksPerPages(page) {
  console.log("Get Links Per Pages ... ");
  await page.waitFor('#promolain')
  return await page.evaluate(() => {
    const links = []
    const names = []
    const nodes = document.querySelectorAll('#promolain a')
    for(let i =0 , n = nodes.length; i <n; i++) {
      names.push(nodes[i].querySelector('img').title)
      links.push(nodes[i].href)
    }
    return {names, links}
  })

}

async function scrapNormal (name, link, $) {
  // OPTIMIZE: can be optimize for scrapping the detail information using regex or other method depends on further requirement
  const imageUrl =  `https://www.bankmega.com${$('.keteranganinside img').attr('src')}`
  const area = beautify($('.area').text())
  const periode = beautify($('.periode').text())

  return {
    name,
    imageUrl,
    area,
    periode,
  }
}

async function scrapImage(name, $) {
  const images = $('#Table_01 img')
  let imagesLink = []
  for(let i = 0, n= images.length;i<n;i++) {
    imagesLink.push(`https://www.bankmega.com/${$(images[i]).attr('src')}`)
  }
  return {name, imagesLink}

}


async function getDetailsPerLinks(names, links) {
  console.log("Get Details Per Links");
  const result = []
  for(let i =0, n = links.length; i<n;i++) {
    let name = names[i]
    let link = links[i]
    //i do this to skip 3 links that is differ, 2 is the link that goes to pergi.com without any image provided,
    // another 1 is a link with rto. i can handle that with catch promise but that would be unnecesary since its the web that is unfunctional now
    if(link.indexOf("bankmega") === -1) continue
    const response = await get(link);
    const $ = cheerio.load(response.body)
    const $area = $('.area')
    if ($area.length!= 0) {
      result.push(await scrapNormal(name, link, $))
    }
    else {
      result.push(await scrapImage(name,$))
    }
  }

  return result
}


(async () => {
  const {browser, page} = await launchBrowser()
  await page.goto('https://www.bankmega.com/promolainnya.php')
  await page.waitFor('#subcatpromo')
  const category = ["Travel & Entertainment", "Lifestyle & Wellness", "FnB", "Gadget & Electronics","Daily Needs & Home Applicances", "ETC"]
  const result = {}
  // get all links per category
  const linksPerCategory = {}
  for(let i =0, n = category.length; i<n; i++) {

    const {totalNames, totalLinks} = await getLinksPerCategory(page, i)
    result[category[i]] = await getDetailsPerLinks(totalNames ,totalLinks)
  }
  await page.close()
  await browser.close()
  fs.writeFileSync('solution.json',JSON.stringify(result))


})()
