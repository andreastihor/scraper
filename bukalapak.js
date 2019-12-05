const {launchBrowser,get, cheerio } = require('./package')
// TODO: scrap the 1 without next button
async function scrapHeader(page, browser) {
  console.log("Getting Shop Header Info...");

  const error = await page.evaluate(() => {
    return document.querySelector('.u-txt--bold.u-txt--xlarge').textContent
  })
  if (error) {
    throw new Error(error)
  }

  return await page.evaluate(() => {
    const obj = {
      name : document.querySelector('.u-txt--fair.u-txt--bold').textContent,
    }

    const tr = document.querySelectorAll('.c-table tbody tr')
    if(tr.length === 0) return
    const uppertd = tr[0].querySelectorAll('td')
    obj[uppertd[0].textContent] = uppertd[1].textContent.trim()
    obj[uppertd[4].textContent] = uppertd[5].textContent.trim()
    const lowertd = tr[1].querySelectorAll('td')
    obj[lowertd[0].textContent] = lowertd[1].textContent.trim()
    obj[lowertd[2].textContent.substr(0,19)] = lowertd[3].textContent.trim()
    return obj
  })
}

async function getTotalItem(page) {
  console.log("Getting Shop Total Item...");
  const nextButton = await page.$$('.c-pagination__btn')
  if (nextButton.length === 0 ) {
    return 0
  }
  await nextButton[3].click()
  await page.waitForSelector('.o-layout__item.item-product.u-width-1of4.u-mrgn-v--2')
  return await page.evaluate(() => {
    const page = parseInt(document.querySelector('.is-current').textContent.trim())-1
    const lastItem = document.querySelectorAll('.o-layout__item.item-product.u-width-1of4.u-mrgn-v--2').length
    if (page!=1) {
      return 16*page+lastItem
    }
  })
}

async function getAllLinks(page,totalItem) {
  console.log("Getting All Links...");
  const links = []
  for(let i = 0; i<Math.ceil(totalItem*0.3); i=i+16) {
    await page.waitForSelector('.c-panel__body.u-pad--3 .c-card__head.revamp-c-card--head a')
    await page.waitFor(5000)
    const link = await page.evaluate(() => {
      const links = []
      const $links = document.querySelectorAll('.c-panel__body.u-pad--3 .c-card__head.revamp-c-card--head a')
      for (let i = 0; i < $links.length; i++) {
        links.push($links[i].href)
      }
      document.querySelectorAll('.c-pagination__btn')[2].click()
      return links
    })
    links.push(...link)
  }
  return links
}

async function getRating(url) {
  const response = (await get(url)).body
  const $ = cheerio.load(response)
  const rate = $('.c-rating__fg').attr('style')
  return {
    name : $('.c-product-detail__name').text(),
    review : $('.c-product-rating__count').children().first().text(),
    rate : rate.substr(7,rate.length-7),
  }
}

async function start(username) {
  const{page, browser} = await launchBrowser()
  try {
      await page.goto(`https://www.bukalapak.com/u/${username}?keywords=&sort=bestselling`)
      await page.waitFor(5000)
      const obj = await scrapHeader(page, browser)
      const totalItem = await getTotalItem(page)
      await page.goto(`https://www.bukalapak.com/u/${username}?keywords=&sort=bestselling`)
      const urls = await getAllLinks(page,totalItem)
      const items = []
      console.log("Getting Shop Rating");
      for(let i = 0, n = items.length; i<n; i++) {
        items.push(await getRating(urls[i]))
      }
      return items
  }
  catch(e) {
    throw new Error(e)
  }
  finally {
    await browser.close()
  }
}

start("xxxxaaaxxx")
