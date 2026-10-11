import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Preserves the original fixed/sticky/footer regression coverage. Playwright
// viewport sizes are exact CSS pixels, unlike an outer WebDriver window size.
const base=process.env.QA_BASE_URL || 'http://127.0.0.1:4187/onod-fonts/';
const executablePath=process.env.QA_CHROME_PATH || (process.platform==='darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');
const browser=await chromium.launch({headless:true,executablePath});
const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
async function geometry() {
 return page.evaluate(()=>{
   const sidebar=document.querySelector('aside'),toolbar=document.querySelector('main .sticky'),header=document.querySelector('header'),footer=document.querySelector('footer');
   const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,left:r.left,bottom:r.bottom,width:r.width,position:getComputedStyle(e).position}};
   const ancestors=[];for(let node=sidebar?.parentElement;node&&node!==document.body;node=node.parentElement){const css=getComputedStyle(node);if(css.transform!=='none'||css.filter!=='none'||css.perspective!=='none')ancestors.push(node.tagName)}
   return {sidebar:rect(sidebar),toolbar:rect(toolbar),header:rect(header),footer:rect(footer),ancestors,scrollY,width:innerWidth};
 });
}
try {
 await page.goto(base);await page.locator('aside').waitFor();await page.waitForTimeout(200);
 const before=await geometry();assert.equal(before.sidebar.position,'fixed');assert.ok(Math.abs(before.sidebar.top-128)<2);assert.ok(Math.abs(before.sidebar.left)<1);assert.deepEqual(before.ancestors,[]);assert.equal(before.toolbar.position,'sticky');assert.equal(before.header.position,'sticky');assert.ok(before.footer.left>=287);assert.ok(before.footer.width<=before.width-287+2);
 await page.evaluate(()=>scrollTo(0,1200));await page.waitForTimeout(200);const after=await geometry();assert.ok(after.scrollY>300);assert.ok(Math.abs(after.sidebar.top-before.sidebar.top)<1);assert.ok(Math.abs(after.header.top)<1);assert.ok(Math.abs(after.toolbar.top-64)<2);
 console.log('PASS desktop fixed sidebar, sticky header/toolbar and footer geometry');
 await page.setViewportSize({width:390,height:844});await page.goto(base);await page.getByRole('button',{name:'Фильтры',exact:true}).click();const drawer=page.getByRole('dialog',{name:'Фильтры',exact:true});await drawer.waitFor();
 const mobile=await drawer.evaluate(el=>{const rect=el.getBoundingClientRect();const ancestors=[];for(let n=el.parentElement;n&&n!==document.body;n=n.parentElement){const s=getComputedStyle(n);if(s.transform!=='none'||s.filter!=='none')ancestors.push(n.tagName)}return {top:rect.top,left:rect.left,bottom:rect.bottom,height:innerHeight,ancestors}});
 // The accessible full-height modal intentionally includes its own close header.
 assert.ok(Math.abs(mobile.top)<1);assert.ok(Math.abs(mobile.left)<1);assert.ok(Math.abs(mobile.bottom-mobile.height)<2);assert.deepEqual(mobile.ancestors,[]);
 await page.keyboard.press('Escape');assert.equal(await drawer.count(),0);
 console.log('PASS viewport-anchored mobile drawer, close action and no transformed ancestors');
} finally {await browser.close();}
