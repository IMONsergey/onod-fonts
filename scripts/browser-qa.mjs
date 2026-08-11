const WEBDRIVER = process.env.WEBDRIVER_URL || 'http://127.0.0.1:9515';
const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/onod-fonts/';
const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function wd(method, path, body) {
  const response = await fetch(`${WEBDRIVER}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.value?.error) {
    throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  return payload.value;
}

async function createSession(width = 1440, height = 1100) {
  const value = await wd('POST', '/session', {
    capabilities: {
      alwaysMatch: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: [
            '--headless=new',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            `--window-size=${width},${height}`,
          ],
        },
      },
    },
  });
  return value.sessionId;
}

const path = (session, suffix) => `/session/${session}${suffix}`;
const navigate = (session, url) => wd('POST', path(session, '/url'), { url });
const currentUrl = session => wd('GET', path(session, '/url'));
const execute = (session, script, args = []) => wd('POST', path(session, '/execute/sync'), { script, args });
const resize = (session, width, height) => wd('POST', path(session, '/window/rect'), { width, height, x: 0, y: 0 });

async function waitFor(session, label, script, timeout = 8000) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeout) {
    try {
      last = await execute(session, script);
      if (last) return last;
    } catch (error) {
      last = error.message;
    }
    await sleep(100);
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
  try {
    return await wd('POST', path(session, '/goog/cdp/execute'), { cmd, params });
  } catch {
    return wd('POST', path(session, '/chromium/send_command'), { cmd, params });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function semanticSmoke(session) {
  const issues = await execute(session, `
    const visible = element => !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    const unnamed = [...document.querySelectorAll('button')]
      .filter(visible)
      .filter(button => !button.getAttribute('aria-label') && !button.getAttribute('aria-labelledby') && !button.getAttribute('title') && !button.textContent.trim());
    const imagesWithoutAlt = [...document.querySelectorAll('img')]
      .filter(visible)
      .filter(img => !img.hasAttribute('alt'));
    return {
      unnamedButtons: unnamed.length,
      unnamedButtonSamples: unnamed.slice(0, 8).map(button => ({
        id: button.id,
        role: button.getAttribute('role'),
        slot: button.getAttribute('data-slot'),
        className: button.className,
        html: button.outerHTML.slice(0, 300),
      })),
      imagesWithoutAlt: imagesWithoutAlt.length,
      imageSamples: imagesWithoutAlt.slice(0, 5).map(img => img.outerHTML.slice(0, 300)),
    };
  `);
  assert(issues.unnamedButtons === 0, `Visible unnamed buttons: ${issues.unnamedButtons}; samples=${JSON.stringify(issues.unnamedButtonSamples)}`);
  assert(issues.imagesWithoutAlt === 0, `Visible images without alt: ${issues.imagesWithoutAlt}; samples=${JSON.stringify(issues.imageSamples)}`);
}

async function desktopFlow(session) {
  await navigate(session, BASE_URL);
  await waitFor(session, 'catalog cards', `return document.querySelectorAll('article').length >= 1`);
  await semanticSmoke(session);

  assert(await setInput(session, 'input[type="search"]', 'Inter'), 'Could not set catalog search');
  await waitFor(session, 'catalog q URL state', `return new URL(location.href).searchParams.get('q') === 'Inter'`);
  const filteredUrl = await currentUrl(session);
  await navigate(session, filteredUrl);
  await waitFor(session, 'search restoration after reload', `return document.querySelector('input[type="search"]')?.value === 'Inter'`);
  await waitFor(session, 'filtered catalog cards', `return document.querySelectorAll('article').length >= 1`);

  const clicked = await execute(session, `
    const button = document.querySelector('article button');
    if (!button) return false;
    button.click();
    return true;
  `);
  assert(clicked, 'Could not open font details from catalog');
  await waitFor(session, 'details route', `return location.pathname !== '/onod-fonts/' && !!document.querySelector('main textarea')`);

  const backClicked = await execute(session, `
    const button = document.querySelector('main .sticky button');
    if (!button) return false;
    button.click();
    return true;
  `);
  assert(backClicked, 'Could not navigate back from details');
  await waitFor(session, 'catalog context after details back', `return location.pathname === '/onod-fonts/' && new URL(location.href).searchParams.get('q') === 'Inter'`);

  await navigate(session, BASE_URL);
  await waitFor(session, 'catalog reset', `return document.querySelectorAll('article').length >= 1`);
  const favoriteClicked = await execute(session, `
    const button = document.querySelector('article button:has(svg.lucide-heart)');
    if (!button) return false;
    button.click();
    return true;
  `);
  assert(favoriteClicked, 'Could not toggle a favorite');
  await waitFor(session, 'favorites localStorage', `
    try { return JSON.parse(localStorage.getItem('font-catalog-favorites') || '[]').length >= 1; }
    catch { return false; }
  `);
  const favoritesBeforeReload = await execute(session, `return localStorage.getItem('font-catalog-favorites')`);
  await navigate(session, BASE_URL);
  await waitFor(session, 'catalog after favorite reload', `return document.querySelectorAll('article').length >= 1`);
  const favoritesAfterReload = await execute(session, `return localStorage.getItem('font-catalog-favorites')`);
  assert(favoritesBeforeReload === favoritesAfterReload, 'Favorites changed across reload');

  const workbenchUrl = new URL('compare', BASE_URL);
  workbenchUrl.searchParams.set('fonts', 'gh-mona,gh-hubot');
  workbenchUrl.searchParams.set('heading', 'gh-mona');
  workbenchUrl.searchParams.set('body', 'gh-hubot');
  workbenchUrl.searchParams.set('base', '18');
  workbenchUrl.searchParams.set('ratio', '1.333');
  workbenchUrl.searchParams.set('content', 'Browser QA');
  await navigate(session, workbenchUrl.toString());
  await waitFor(session, 'portable Workbench hydration', `return !!document.querySelector('#workbench-heading')`);
  const workbench = await execute(session, `return {
    heading: document.querySelector('#workbench-heading')?.value,
    body: document.querySelector('#workbench-body')?.value,
    base: document.querySelector('#workbench-base')?.value,
    ratio: document.querySelector('#workbench-ratio')?.value,
    content: document.querySelector('textarea')?.value,
  }`);
  assert(workbench.heading === 'gh-mona', `Workbench heading mismatch: ${workbench.heading}`);
  assert(workbench.body === 'gh-hubot', `Workbench body mismatch: ${workbench.body}`);
  assert(workbench.base === '18', `Workbench base mismatch: ${workbench.base}`);
  assert(workbench.ratio === '1.333', `Workbench ratio mismatch: ${workbench.ratio}`);
  assert(workbench.content === 'Browser QA', `Workbench content mismatch: ${workbench.content}`);

  await navigate(session, `${BASE_URL}?q=${encodeURIComponent('Cederville Cursive')}`);
  await waitFor(session, 'canonical correction search result', `return document.querySelectorAll('article').length >= 1`);
  const correction = await execute(session, `return document.body.innerText.includes('Cedarville Cursive')`);
  assert(correction, 'Canonical Cedarville Cursive name was not surfaced for recovered Cederville record');
  await execute(session, `document.querySelector('article button')?.click(); return true;`);
  await waitFor(session, 'canonical correction details', `return document.title.startsWith('Cedarville Cursive')`);
  const cedarResources = await execute(session, `return performance.getEntriesByType('resource').map(entry => entry.name)`);
  assert(cedarResources.some(url => /Cedarville\+Cursive|Cedarville%20Cursive/i.test(url)), 'Canonical Cedarville Google resource was not requested');

  await navigate(session, `${BASE_URL}?q=${encodeURIComponent('Source Sans Pro')}`);
  await waitFor(session, 'historical Source Sans Pro result', `return document.querySelectorAll('article').length >= 1`);
  await execute(session, `document.querySelector('article button')?.click(); return true;`);
  await waitFor(session, 'historical Source Sans Pro details', `return document.title.startsWith('Source Sans Pro')`);
  await waitFor(session, 'historical Source Sans Pro font registration', `return document.fonts?.check('400 16px "Source Sans Pro"') === true`, 12000);
  const historicalResources = await execute(session, `return performance.getEntriesByType('resource').map(entry => entry.name)`);
  assert(historicalResources.some(url => /SourceSansPro-Regular\.otf/i.test(url)), 'Exact historical Source Sans Pro artifact was not requested');
  assert(!historicalResources.some(url => /SourceSans3/i.test(url)), 'Source Sans 3 successor was silently requested');
}

async function failureFlow(session) {
  await cdp(session, 'Network.enable');
  await cdp(session, 'Network.setBlockedURLs', {
    urls: ['*fonts.googleapis.com/*', '*fonts.gstatic.com/*', '*api.fontshare.com/*', '*raw.githubusercontent.com/*'],
  });
  await navigate(session, BASE_URL);
  await waitFor(session, 'explicit fallback state under blocked font network', `return document.body.innerText.includes('FALLBACK')`, 12000);
  await cdp(session, 'Network.setBlockedURLs', { urls: [] });
}

async function mobileFlow(session) {
  await resize(session, 390, 844);
  await navigate(session, BASE_URL);
  await waitFor(session, 'mobile menu trigger', `return !!document.querySelector('button[aria-label="Open navigation menu"]')`);
  await click(session, 'button[aria-label="Open navigation menu"]');
  await waitFor(session, 'mobile navigation dialog', `return !!document.querySelector('[role="dialog"][aria-label="Navigation"]')`);
  await waitFor(session, 'focus trapped into mobile dialog', `
    const dialog = document.querySelector('[role="dialog"][aria-label="Navigation"]');
    return !!dialog && dialog.contains(document.activeElement);
  `);
  await execute(session, `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return true;`);
  await waitFor(session, 'mobile dialog close', `return !document.querySelector('[role="dialog"][aria-label="Navigation"]')`);
  await waitFor(session, 'focus restored to menu trigger', `return document.activeElement?.getAttribute('aria-label') === 'Open navigation menu'`);
  await semanticSmoke(session);
}

const session = await createSession();
try {
  console.log(`Browser QA base: ${BASE_URL}`);
  await desktopFlow(session);
  console.log('✓ desktop catalog/workbench/canonical/historical flows');
  await failureFlow(session);
  console.log('✓ explicit font fallback under blocked provider network');
  await mobileFlow(session);
  console.log('✓ mobile navigation focus/Escape semantics');
  console.log('Browser QA passed.');
} finally {
  await wd('DELETE', `/session/${session}`).catch(() => {});
}
