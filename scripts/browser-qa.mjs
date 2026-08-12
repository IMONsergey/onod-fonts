const WEBDRIVER = process.env.WEBDRIVER_URL || 'http://127.0.0.1:9515';
const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/onod-fonts/';
const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function wd(method, path, body) {
  const response = await fetch(`${WEBDRIVER}${path}`, { method, headers: body === undefined ? undefined : { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.value?.error) throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(payload)}`);
  return payload.value;
}

async function createSession(width = 1440, height = 1100) {
  const value = await wd('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'chrome', 'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', `--window-size=${width},${height}`] } } } });
  return value.sessionId;
}
const path = (session, suffix) => `/session/${session}${suffix}`;
const navigate = (session, url) => wd('POST', path(session, '/url'), { url });
const currentUrl = session => wd('GET', path(session, '/url'));
const execute = (session, script, args = []) => wd('POST', path(session, '/execute/sync'), { script, args });
const resize = (session, width, height) => wd('POST', path(session, '/window/rect'), { width, height, x: 0, y: 0 });

async function waitFor(session, label, script, timeout = 10000) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeout) {
    try { last = await execute(session, script); if (last) return last; } catch (error) { last = error.message; }
    await sleep(120);
  }
  throw new Error(`Timed out waiting for ${label}. Last result: ${JSON.stringify(last)}`);
}

async function setInput(session, selector, value) {
  return execute(session, `
    const el = document.querySelector(arguments[0]);
    if (!el) return false;
    const prototype = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (!setter) return false;
    setter.call(el, arguments[1]);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  `, [selector, value]);
}

async function click(session, selector) {
  const element = await wd('POST', path(session, '/element'), { using: 'css selector', value: selector });
  await wd('POST', path(session, `/element/${element[ELEMENT_KEY]}/click`), {});
}
async function cdp(session, cmd, params = {}) {
  try { return await wd('POST', path(session, '/goog/cdp/execute'), { cmd, params }); }
  catch { return wd('POST', path(session, '/chromium/send_command'), { cmd, params }); }
}
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function semanticSmoke(session, pageLabel) {
  const issues = await execute(session, `
    const visible = e => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
    const named = e => e.getAttribute('aria-label')?.trim() || e.getAttribute('aria-labelledby')?.trim() || e.getAttribute('title')?.trim() || ('labels' in e && e.labels && [...e.labels].some(l => l.textContent?.trim()));
    const unnamedButtons = [...document.querySelectorAll('button')].filter(visible).filter(e => !named(e) && !e.textContent.trim());
    const unnamedControls = [...document.querySelectorAll('input,select,textarea')].filter(visible).filter(e => e.getAttribute('type') !== 'hidden').filter(e => !named(e));
    const imagesWithoutAlt = [...document.querySelectorAll('img')].filter(visible).filter(e => !e.hasAttribute('alt'));
    return { unnamedButtons: unnamedButtons.length, unnamedControls: unnamedControls.length, imagesWithoutAlt: imagesWithoutAlt.length,
      buttonSamples: unnamedButtons.slice(0,4).map(e => e.outerHTML.slice(0,240)), controlSamples: unnamedControls.slice(0,4).map(e => e.outerHTML.slice(0,240)) };
  `);
  assert(issues.unnamedButtons === 0, `${pageLabel}: unnamed buttons ${JSON.stringify(issues.buttonSamples)}`);
  assert(issues.unnamedControls === 0, `${pageLabel}: unnamed controls ${JSON.stringify(issues.controlSamples)}`);
  assert(issues.imagesWithoutAlt === 0, `${pageLabel}: images without alt`);
}

async function desktopFlow(session) {
  await navigate(session, BASE_URL);
  await waitFor(session, 'catalog cards', `return document.querySelectorAll('article[data-font-id]').length >= 1`);
  await semanticSmoke(session, 'Catalog');
  const footerLayout = await execute(session, `const r=document.querySelector('footer')?.getBoundingClientRect(); return r ? {left:r.left,width:r.width,viewport:innerWidth} : null;`);
  assert(footerLayout && footerLayout.left >= 280, `Catalog footer does not respect filter column: ${JSON.stringify(footerLayout)}`);
  assert(footerLayout.width <= footerLayout.viewport - 280 + 2, `Catalog footer is wider than content column: ${JSON.stringify(footerLayout)}`);

  assert(await setInput(session, 'input[type="search"]', 'Inter'), 'Could not set catalog search');
  await waitFor(session, 'catalog q URL state', `return new URL(location.href).searchParams.get('q') === 'Inter'`);
  const filteredUrl = await currentUrl(session);
  await navigate(session, filteredUrl);
  await waitFor(session, 'search restoration', `return document.querySelector('input[type="search"]')?.value === 'Inter' && document.querySelectorAll('article[data-font-id]').length >= 1`);
  await execute(session, `document.querySelector('article[data-font-id] button')?.click(); return true;`);
  await waitFor(session, 'details route', `return location.pathname !== '/onod-fonts/' && !!document.querySelector('main textarea')`);
  await semanticSmoke(session, 'Font details');
  await execute(session, `document.querySelector('main .sticky button')?.click(); return true;`);
  await waitFor(session, 'catalog context after details back', `return location.pathname === '/onod-fonts/' && new URL(location.href).searchParams.get('q') === 'Inter'`);

  await navigate(session, BASE_URL);
  await waitFor(session, 'catalog reset', `return document.querySelectorAll('article[data-font-id]').length >= 1`);
  const favoriteClicked = await execute(session, `const b=document.querySelector('article[data-font-id] button[data-action="favorite"]'); if(!b)return false;b.click();return true;`);
  assert(favoriteClicked, 'Could not toggle a favorite');
  await waitFor(session, 'favorites localStorage', `try{return JSON.parse(localStorage.getItem('font-catalog-favorites')||'[]').length>=1}catch{return false}`);
  await navigate(session, new URL('favorites', BASE_URL).toString());
  await waitFor(session, 'Favorites route', `return location.pathname.endsWith('/favorites') && document.querySelectorAll('article[data-font-id]').length >= 1`);
  await semanticSmoke(session, 'Favorites');

  const workbenchUrl = new URL('compare', BASE_URL);
  workbenchUrl.searchParams.set('fonts', 'gh-mona,gh-hubot');
  workbenchUrl.searchParams.set('heading', 'gh-mona');
  workbenchUrl.searchParams.set('body', 'gh-hubot');
  workbenchUrl.searchParams.set('base', '18');
  workbenchUrl.searchParams.set('ratio', '1.333');
  workbenchUrl.searchParams.set('content', 'Browser QA');
  await navigate(session, workbenchUrl.toString());
  await waitFor(session, 'portable Workbench hydration', `return !!document.querySelector('#workbench-heading')`);
  const workbench = await execute(session, `return {heading:document.querySelector('#workbench-heading')?.value,body:document.querySelector('#workbench-body')?.value,base:document.querySelector('#workbench-base')?.value,ratio:document.querySelector('#workbench-ratio')?.value,content:document.querySelector('textarea')?.value}`);
  assert(workbench.heading === 'gh-mona', `Workbench heading mismatch: ${workbench.heading}`);
  assert(workbench.body === 'gh-hubot', `Workbench body mismatch: ${workbench.body}`);
  assert(workbench.base === '18', `Workbench base mismatch: ${workbench.base}`);
  assert(workbench.ratio === '1.333', `Workbench ratio mismatch: ${workbench.ratio}`);
  assert(workbench.content === 'Browser QA', `Workbench content mismatch: ${workbench.content}`);
  await semanticSmoke(session, 'Workbench');

  await execute(session, `localStorage.setItem('font-catalog-compare','[]'); return true;`);
  await navigate(session, new URL('compare', BASE_URL).toString());
  await waitFor(session, 'empty Workbench selector', `return !!document.querySelector('input[aria-label="Add typeface"],input[aria-label="Добавить шрифт"]')`);
  const addSelector = await execute(session, `return document.querySelector('input[aria-label="Add typeface"]') ? 'input[aria-label="Add typeface"]' : 'input[aria-label="Добавить шрифт"]'`);
  assert(await setInput(session, addSelector, 'Mona'), 'Could not search inside Workbench');
  await waitFor(session, 'Workbench suggestions', `return [...document.querySelectorAll('aside button')].some(b=>b.textContent.includes('Mona'))`);
  await execute(session, `const b=[...document.querySelectorAll('aside button')].find(b=>b.textContent.includes('Mona')); if(!b)return false;b.click();return true;`);
  await waitFor(session, 'Workbench direct add', `return new URL(location.href).searchParams.get('fonts')`);

  await navigate(session, `${BASE_URL}?q=${encodeURIComponent('Cederville Cursive')}`);
  await waitFor(session, 'canonical correction result', `return document.querySelectorAll('article[data-font-id]').length >= 1`);
  assert(await execute(session, `return document.body.innerText.includes('Cedarville Cursive')`), 'Canonical Cedarville Cursive correction not surfaced');

  await navigate(session, `${BASE_URL}?q=${encodeURIComponent('Source Sans Pro')}`);
  await waitFor(session, 'historical result', `return document.querySelectorAll('article[data-font-id]').length >= 1`);
  await execute(session, `document.querySelector('article[data-font-id] button')?.click(); return true;`);
  await waitFor(session, 'historical details', `return document.title.startsWith('Source Sans Pro')`);
  await waitFor(session, 'historical registered face', `return document.fonts && [...document.fonts].some(face => face.family.replace(/^['\"]|['\"]$/g,'').toLowerCase()==='source sans pro' && face.status==='loaded')`, 14000);
  const historicalResources = await execute(session, `return performance.getEntriesByType('resource').map(entry=>entry.name)`);
  assert(historicalResources.some(url => /SourceSansPro-Regular\.ttf/i.test(url)), 'Exact historical Source Sans Pro artifact was not requested');
  assert(!historicalResources.some(url => /SourceSans3/i.test(url)), 'Source Sans 3 successor was silently requested');

  await navigate(session, new URL('about', BASE_URL).toString());
  await waitFor(session, 'About direct route', `return document.body.innerText.includes('ONOD')`);
  await semanticSmoke(session, 'About');
  await navigate(session, new URL('protocol', BASE_URL).toString());
  await waitFor(session, 'Protocol direct route', `return document.querySelector('section')`);
  await semanticSmoke(session, 'Protocol');
}

async function failureFlow(session) {
  await cdp(session, 'Network.enable');
  await cdp(session, 'Network.setBlockedURLs', { urls: ['*fonts.googleapis.com/*','*fonts.gstatic.com/*','*api.fontshare.com/*','*raw.githubusercontent.com/*'] });
  await navigate(session, BASE_URL);
  await waitFor(session, 'explicit fallback state', `return document.body.innerText.toUpperCase().includes('FALLBACK')`, 14000);
  await cdp(session, 'Network.setBlockedURLs', { urls: [] });
}

async function mobileFlow(session) {
  await resize(session, 390, 844);
  await navigate(session, BASE_URL);
  await waitFor(session, 'mobile menu trigger', `return !!document.querySelector('button[aria-label="Open navigation menu"]')`);
  await click(session, 'button[aria-label="Open navigation menu"]');
  await waitFor(session, 'mobile dialog', `return !!document.querySelector('[role="dialog"][aria-label="Navigation"]')`);
  await waitFor(session, 'focus in dialog', `const d=document.querySelector('[role="dialog"][aria-label="Navigation"]');return !!d&&d.contains(document.activeElement)`);
  await execute(session, `document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return true;`);
  await waitFor(session, 'mobile close', `return !document.querySelector('[role="dialog"][aria-label="Navigation"]')`);
  await waitFor(session, 'focus restored', `return document.activeElement?.getAttribute('aria-label')==='Open navigation menu'`);
  await semanticSmoke(session, 'Mobile catalog');
}

const session = await createSession();
try {
  console.log(`Browser QA base: ${BASE_URL}`);
  await desktopFlow(session);
  console.log('✓ desktop catalog/details/favorites/workbench/direct-route flows');
  await failureFlow(session);
  console.log('✓ explicit fallback under blocked font network');
  await mobileFlow(session);
  console.log('✓ mobile navigation focus/Escape semantics');
  console.log('Browser QA passed.');
} finally {
  await wd('DELETE', `/session/${session}`).catch(() => {});
}
