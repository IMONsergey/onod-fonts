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
  if (!response.ok || payload?.value?.error) throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(payload)}`);
  return payload.value;
}

async function createSession(width = 1440, height = 1100) {
  const value = await wd('POST', '/session', {
    capabilities: {
      alwaysMatch: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', `--window-size=${width},${height}`],
        },
      },
    },
  });
  return value.sessionId;
}

const path = (session, suffix) => `/session/${session}${suffix}`;
const navigate = (session, url) => wd('POST', path(session, '/url'), { url });
const execute = (session, script, args = []) => wd('POST', path(session, '/execute/sync'), { script, args });
const resize = (session, width, height) => wd('POST', path(session, '/window/rect'), { width, height, x: 0, y: 0 });

async function waitFor(session, label, script, timeout = 10000) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeout) {
    try {
      last = await execute(session, script);
      if (last) return last;
    } catch (error) {
      last = error.message;
    }
    await sleep(120);
  }
  throw new Error(`Timed out waiting for ${label}. Last result: ${JSON.stringify(last)}`);
}

async function click(session, selector) {
  const element = await wd('POST', path(session, '/element'), { using: 'css selector', value: selector });
  await wd('POST', path(session, `/element/${element[ELEMENT_KEY]}/click`), {});
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function desktopLayout(session) {
  await resize(session, 1440, 1100);
  await navigate(session, BASE_URL);
  await waitFor(session, 'catalog and fixed filters', `
    return document.querySelectorAll('article').length > 0 &&
      [...document.querySelectorAll('aside[aria-label="Font filters"]')].some(el => getComputedStyle(el).display !== 'none');
  `);
  await sleep(500);

  const before = await execute(session, `
    const sidebar = [...document.querySelectorAll('aside[aria-label="Font filters"]')].find(el => getComputedStyle(el).display !== 'none');
    const toolbar = document.querySelector('main .sticky');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const transformedAncestors = [];
    let node = sidebar?.parentElement;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      if (style.transform !== 'none' || style.perspective !== 'none' || style.filter !== 'none') {
        transformedAncestors.push({ tag: node.tagName, className: node.className, transform: style.transform, perspective: style.perspective, filter: style.filter });
      }
      node = node.parentElement;
    }
    const s = sidebar?.getBoundingClientRect();
    const t = toolbar?.getBoundingClientRect();
    const h = header?.getBoundingClientRect();
    const f = footer?.getBoundingClientRect();
    return {
      sidebarPosition: sidebar && getComputedStyle(sidebar).position,
      sidebarTop: s?.top,
      sidebarLeft: s?.left,
      sidebarBottom: s?.bottom,
      toolbarPosition: toolbar && getComputedStyle(toolbar).position,
      toolbarTop: t?.top,
      headerPosition: header && getComputedStyle(header).position,
      headerTop: h?.top,
      footerLeft: f?.left,
      footerWidth: f?.width,
      viewport: innerWidth,
      transformedAncestors,
    };
  `);

  assert(before.sidebarPosition === 'fixed', `Sidebar is not fixed: ${JSON.stringify(before)}`);
  assert(Math.abs(before.sidebarTop - 128) <= 2, `Sidebar top offset is wrong: ${JSON.stringify(before)}`);
  assert(Math.abs(before.sidebarLeft) <= 1, `Sidebar left offset is wrong: ${JSON.stringify(before)}`);
  assert(before.transformedAncestors.length === 0, `Fixed sidebar has transformed containing-block ancestor: ${JSON.stringify(before.transformedAncestors)}`);
  assert(before.toolbarPosition === 'sticky', `Catalog toolbar is not sticky: ${JSON.stringify(before)}`);
  assert(before.headerPosition === 'sticky', `Header is not sticky: ${JSON.stringify(before)}`);
  assert(before.footerLeft >= 287, `Catalog footer overlaps filter column: ${JSON.stringify(before)}`);
  assert(before.footerWidth <= before.viewport - 287 + 2, `Catalog footer width exceeds content column: ${JSON.stringify(before)}`);

  await execute(session, `window.scrollTo(0, Math.min(1200, document.documentElement.scrollHeight - innerHeight - 10)); return true;`);
  await waitFor(session, 'real document scroll', `return window.scrollY > 300`);
  await sleep(150);

  const after = await execute(session, `
    const sidebar = [...document.querySelectorAll('aside[aria-label="Font filters"]')].find(el => getComputedStyle(el).display !== 'none');
    const toolbar = document.querySelector('main .sticky');
    const header = document.querySelector('header');
    const s = sidebar?.getBoundingClientRect();
    const t = toolbar?.getBoundingClientRect();
    const h = header?.getBoundingClientRect();
    return { sidebarTop: s?.top, sidebarLeft: s?.left, toolbarTop: t?.top, headerTop: h?.top, scrollY };
  `);

  assert(Math.abs(after.sidebarTop - before.sidebarTop) <= 1, `Fixed sidebar moved during scroll: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
  assert(Math.abs(after.sidebarLeft - before.sidebarLeft) <= 1, `Fixed sidebar shifted horizontally during scroll: ${JSON.stringify(after)}`);
  assert(Math.abs(after.headerTop) <= 1, `Sticky header moved off viewport: ${JSON.stringify(after)}`);
  assert(Math.abs(after.toolbarTop - 64) <= 2, `Sticky catalog toolbar moved off expected top=64: ${JSON.stringify(after)}`);
}

async function mobileLayout(session) {
  await resize(session, 390, 844);
  await navigate(session, BASE_URL);
  await waitFor(session, 'mobile filter trigger', `return !!document.querySelector('button[aria-label="Open filters"]')`);
  await click(session, 'button[aria-label="Open filters"]');
  await waitFor(session, 'mobile filter drawer', `
    return [...document.querySelectorAll('aside[aria-label="Font filters"]')].some(el => getComputedStyle(el).display !== 'none' && getComputedStyle(el).position === 'fixed');
  `);
  await sleep(200);

  const drawer = await execute(session, `
    const el = [...document.querySelectorAll('aside[aria-label="Font filters"]')].find(node => getComputedStyle(node).display !== 'none' && getComputedStyle(node).position === 'fixed');
    const r = el?.getBoundingClientRect();
    const transformedAncestors = [];
    let node = el?.parentElement;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      if (style.transform !== 'none' || style.perspective !== 'none' || style.filter !== 'none') {
        transformedAncestors.push({ tag: node.tagName, className: node.className, transform: style.transform, perspective: style.perspective, filter: style.filter });
      }
      node = node.parentElement;
    }
    return { position: el && getComputedStyle(el).position, top: r?.top, left: r?.left, bottom: r?.bottom, height: r?.height, viewportHeight: innerHeight, transformedAncestors };
  `);

  assert(drawer.position === 'fixed', `Mobile drawer is not fixed: ${JSON.stringify(drawer)}`);
  assert(Math.abs(drawer.top - 64) <= 2, `Mobile drawer top is wrong: ${JSON.stringify(drawer)}`);
  assert(Math.abs(drawer.left) <= 1, `Mobile drawer left is wrong: ${JSON.stringify(drawer)}`);
  assert(Math.abs(drawer.bottom - drawer.viewportHeight) <= 2, `Mobile drawer does not reach viewport bottom: ${JSON.stringify(drawer)}`);
  assert(drawer.transformedAncestors.length === 0, `Mobile fixed drawer has transformed containing-block ancestor: ${JSON.stringify(drawer.transformedAncestors)}`);
}

const session = await createSession();
try {
  console.log(`Layout regression base: ${BASE_URL}`);
  await desktopLayout(session);
  console.log('✓ desktop fixed sidebar / sticky header+toolbar / footer geometry');
  await mobileLayout(session);
  console.log('✓ mobile viewport-fixed filter drawer');
  console.log('Layout regression checks passed.');
} finally {
  await wd('DELETE', `/session/${session}`).catch(() => {});
}
