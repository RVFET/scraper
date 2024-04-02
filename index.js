import contentTypes from './content-types.js'
import Scraper from './scraper.js'
import { generateJSONResponse, generateErrorJSONResponse } from './json-response.js'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const searchParams = new URL(request.url).searchParams

  let url = searchParams.get('url')
  if (url && !url.match(/^[a-zA-Z]+:\/\//)) url = 'http://' + url

  const selector = searchParams.get('selector')
  const attr = searchParams.get('attr')
  const spaced = searchParams.get('spaced')
  const raw = searchParams.get('raw')
  const pretty = searchParams.get('pretty')
  const regex = searchParams.get('regex')

  if (!url) {
    return handleSiteRequest(request)
  }

  return handleAPIRequest({ url, selector, attr, spaced, raw, pretty, regex })
}

async function handleSiteRequest(request) {
  const url = new URL(request.url)

  if (url.pathname === '/' || url.pathname === '') {
    return new Response("Undefined path", {
      headers: { 'content-type': contentTypes.html }
    })
  }

  return new Response('Not found', { status: 404 })
}

async function handleAPIRequest({ url, selector, attr, spaced, raw, pretty, regex }) {
  let scraper, result;

  try {
    scraper = await new Scraper().fetch(url);
  } catch (error) {
    return generateErrorJSONResponse(error, pretty);
  }

  try {
    if (regex) {
      __data = await scraper.getRawHTML();
      result = __data.match(new RegExp(regex, 'g'));
      console.log(result);
    } else if (!selector || raw) {
      result = await scraper.getRawHTML();
    } else if (!attr) {
      result = await scraper.querySelector(selector).getText({ spaced });
    } else {
      result = await scraper.querySelector(selector).getAllMatchingElementsAttribute(attr);
    }
  } catch (error) {
    return generateErrorJSONResponse(error, pretty);
  }

  return generateJSONResponse({ result }, pretty);
}