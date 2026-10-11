import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4187/onod-fonts/';
const OUT = process.env.QA_OUTPUT_DIR || '.worklogs/browser-qa';
const browserType = process.env.QA_BROWSER || 'chromium';
const executablePath = process.env.QA_CHROME_PATH || (process.platform === 'darwin' && browserType === 'chromium' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
const browser = await ({chromium,firefox,webkit}[browserType]).launch({headless:true,...(executablePath?{executablePath}:{})});
await mkdir(OUT,{recursive:true});
const results=[];
async function check(name, fn, {width=1440,height=1000,language='ru',init}={}) {
  const context=await browser.newContext({viewport:{width,height}, reducedMotion:'reduce'});
  await context.addInitScript(language=>{try{localStorage.setItem('app-language',language)}catch{}},language);
  if(init) await context.addInitScript(init);
  const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try { const evidence=await fn(page,context);assert.deepEqual(errors,[],`Page errors: ${errors.join('; ')}`);await page.screenshot({path:`${OUT}/${name}.png`});results.push({name,status:'pass',evidence});console.log(`PASS ${name} ${JSON.stringify(evidence||{})}`); }
  catch(error){await page.screenshot({path:`${OUT}/${name}-failure.png`}).catch(()=>{});results.push({name,status:'fail',message:error.message,errors});console.log(`FAIL ${name}: ${error.message}`);}
  finally{await context.close();}
}
async function go(page,path='') {await page.goto(BASE+path,{waitUntil:'domcontentloaded'});await page.locator('#main-content').waitFor();await page.waitForTimeout(600);}
const activeButton = (page,name) => page.getByRole('button',{name,exact:true});
async function axe(page) {
 const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
 const violations=result.violations.filter(v=>v.impact==='critical'||v.impact==='serious').map(v=>({id:v.id,count:v.nodes.length,targets:v.nodes.slice(0,4).map(n=>n.target)}));
 assert.deepEqual(violations,[],'Serious/critical accessibility violations');return result.violations.map(v=>({id:v.id,count:v.nodes.length}));
}
await check('search-and-private-preview',async page=>{
 await go(page,'?q=Inter&preview=TEST');
 assert.equal(await page.locator('[data-font-id]').first().getAttribute('data-font-id'),'rsms-288');
 const preview=page.getByRole('textbox',{name:'Образец',exact:true});assert.equal(await preview.inputValue(),'TEST');await preview.fill('');await page.waitForTimeout(500);assert.equal(await preview.inputValue(),'');
 await preview.fill('CONFIDENTIAL CLIENT COPY');await page.waitForTimeout(300);assert.equal(new URL(page.url()).searchParams.has('preview'),false);assert.ok(!page.url().includes('CONFIDENTIAL'));return {firstResult:'Inter',cleared:true,privateTextNotInUrl:true};
});
await check('workbench-idle-ratio-and-empty',async(page,context)=>{
 await context.addInitScript(()=>{window.__replaces=0;const original=history.replaceState.bind(history);history.replaceState=(...args)=>{window.__replaces++;return original(...args)}});
 await go(page,'compare?fonts=rsms-288,gf5-1101&ratio=1.25');await page.waitForTimeout(400);
 const before=await page.evaluate(()=>window.__replaces);await page.waitForTimeout(1800);const after=await page.evaluate(()=>window.__replaces);assert.equal(after,before,'Idle page must not rewrite history');assert.equal(await page.locator('#workbench-ratio').inputValue(),'1.25');
 await page.locator('#workbench-ratio').selectOption('1.5');await page.waitForTimeout(300);assert.equal(new URL(page.url()).searchParams.get('ratio'),'1.5');
 const removals=page.locator('button[aria-label^="Remove:"],button[aria-label^="Удалить:"],button[aria-label^="Убрать:"]');
 const labels=await removals.evaluateAll(els=>els.map(e=>e.getAttribute('aria-label')));
 for(const label of labels) {const button=page.getByRole('button',{name:label,exact:true});if(await button.count()) await button.click();await page.waitForTimeout(250)}
 assert.equal(new URL(page.url()).searchParams.get('fonts'),'');await page.reload();await page.waitForTimeout(600);assert.equal(await page.locator('#workbench-ratio').count(),0);assert.match(await page.locator('#main-content').innerText(),/Выберите шрифты/i);
 return {idleReplaces:after-before,initialReplaces:before,ratio:1.5,emptySurvivesRefresh:true};
});
await check('catalog-80-return-anchor',async page=>{
 await go(page);
 for(let i=0;i<3;i++){await page.getByRole('button',{name:/^Показать ещё/}).click();await page.waitForFunction(expected=>document.querySelectorAll('[data-font-id]').length===expected,40+i*20,{timeout:8000})}
 assert.equal(await page.locator('[data-font-id]').count(),80);
 const card=page.locator('[data-font-id]').nth(27);await card.scrollIntoViewIfNeeded();await page.waitForTimeout(300);
 const anchor=await card.getAttribute('data-font-id'),before=await card.evaluate(e=>({top:e.getBoundingClientRect().top,scrollY}));
 await card.locator('a').first().click();await page.getByRole('tablist').waitFor();await page.waitForTimeout(300);await page.getByRole('button',{name:'Назад',exact:true}).click();
 await page.waitForTimeout(900);assert.equal(await page.locator('[data-font-id]').count(),80);
 const after=await page.locator(`[data-font-id="${anchor}"]`).evaluate(e=>({top:e.getBoundingClientRect().top,scrollY}));assert.ok(Math.abs(after.top-before.top)<16,`Lost anchor: ${JSON.stringify({before,after})}`);
 return {anchor,before,after,cards:80};
});
await check('filter-drawer-focus-and-escape',async page=>{
 await go(page);const trigger=activeButton(page,'Фильтры');await trigger.click();const drawer=page.getByRole('dialog',{name:'Фильтры',exact:true});await drawer.waitFor();
 assert.equal(await page.locator('#root').evaluate(e=>e.inert),true);assert.equal(await drawer.evaluate(e=>e.contains(document.activeElement)),true);
 const duplicates=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.filter((id,i)=>ids.indexOf(id)!==i)});assert.deepEqual(duplicates,[]);
 await drawer.getByText('Cyrillic',{exact:true}).click();await page.waitForTimeout(200);assert.equal(await drawer.evaluate(e=>e.contains(document.activeElement)),true,'Checkbox update lost focus');
 await page.keyboard.press('Escape');await page.waitForTimeout(150);assert.equal(await drawer.count(),0);assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);assert.equal(await page.locator('#root').evaluate(e=>e.inert),false);
 return {focusRestored:true,duplicateIds:0,script:new URL(page.url()).searchParams.get('script')};
},{width:390,height:844});
await check('storage-denial-is-usable',async page=>{
 await go(page);assert.equal(await page.locator('[data-font-id]').count(),20);assert.match(await page.locator('body').innerText(),/Хранилище браузера недоступно/);await page.locator('[data-font-id]').first().getByRole('button',{name:'Сохранить',exact:true}).click();return {usable:true};
},{init:()=>{for(const key of ['getItem','setItem','removeItem'])Storage.prototype[key]=function(){throw new DOMException('Storage unavailable test','SecurityError')}}});
await check('details-real-axes-and-mobile-preview',async page=>{
 await go(page,'rsms-288');const specimen=page.getByRole('textbox',{name:'Inter specimen',exact:true});const top=await specimen.evaluate(e=>e.getBoundingClientRect().top);assert.ok(top<600,`Specimen starts below mobile interaction area: ${top}`);
 assert.equal(await specimen.evaluate(e=>getComputedStyle(e).fontStyle),'normal');
 const style=page.getByRole('combobox',{name:'Начертание',exact:true});await style.selectOption('italic');await page.waitForTimeout(1200);assert.equal(await specimen.evaluate(e=>getComputedStyle(e).fontStyle),'italic');
 const weight=page.getByRole('spinbutton',{name:'Ось wght · 100–900: значение',exact:true});await weight.fill('650');await weight.press('Enter');await page.waitForFunction(()=>getComputedStyle(document.querySelector('textarea[aria-label="Inter specimen"]')).fontWeight==='650',undefined,{timeout:8000});assert.equal(await specimen.evaluate(e=>getComputedStyle(e).fontWeight),'650');
 const loaded = await page.evaluate(async()=>{const faces=await document.fonts.load('italic 650 16px \"Inter\"','Привет');return faces.length});assert.ok(loaded>0,'Selected Inter face is not actually loaded');
 await activeButton(page,'Свой текст').click();await specimen.fill('Мой образец');await activeButton(page,'Латиница').click();await activeButton(page,'Свой текст').click();assert.equal(await specimen.inputValue(),'Мой образец');
 await page.getByRole('tab',{name:'Глифы',exact:true}).click();await page.locator('#glyph-search').fill('U+0416');assert.match(await page.getByRole('status').last().innerText(),/U\+0416/);await axe(page);return {specimenTop:top,italic:true,wght:650,glyphLookup:'Ж'};
},{width:390,height:844});
await check('empty-css-does-not-pass-as-ready',async(page,context)=>{
 await context.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:'/* intentionally empty provider response */'}));
 await go(page,'gf5-1101');await page.waitForTimeout(500);assert.match(await page.locator('#main-content').innerText(),/Шрифт не загрузился/);return {falseReadyPrevented:true};
});
await check('workbench-share-and-back-forward',async page=>{
 await go(page,'compare?fonts=rsms-288,gf5-1101&mode=pair&heading=gf5-1101&body=rsms-288&base=20&ratio=1.5&line=1.8');
 assert.equal(await page.locator('#workbench-heading').inputValue(),'gf5-1101');assert.equal(await page.locator('#workbench-base').inputValue(),'20');assert.equal(await page.locator('#workbench-ratio').inputValue(),'1.5');
 await page.locator('#workbench-base').fill('');await page.locator('#workbench-base').press('Enter');assert.equal(await page.locator('#workbench-base').inputValue(),'20');
 await page.locator('#workbench-base').fill('30');await page.locator('#workbench-base').press('Escape');assert.equal(await page.locator('#workbench-base').inputValue(),'20');
 await page.getByRole('link',{name:/^ИНДЕКС$/i}).first().click();await page.waitForTimeout(200);await page.goBack();await page.waitForTimeout(600);assert.equal(await page.locator('#workbench-heading').inputValue(),'gf5-1101');assert.equal(await page.locator('#workbench-base').inputValue(),'20');return {sharedRolesRestored:true,numericDraftSafe:true};
});

await check('mobile-navigation-and-resize',async page=>{
 await go(page);await activeButton(page,'Open navigation menu').click();const menu=page.getByRole('dialog',{name:'ONOD Fonts',exact:true});await menu.waitFor();await axe(page);
 assert.equal(await menu.evaluate(e=>e.contains(document.activeElement)),true);await activeButton(page,'Закрыть меню').click();assert.equal(await menu.count(),0);
 await activeButton(page,'Open navigation menu').click();await page.setViewportSize({width:1440,height:1000});await page.waitForFunction(()=>!document.getElementById('root').inert,undefined,{timeout:8000});assert.equal(await page.locator('#root').evaluate(e=>e.inert),false);assert.equal(await menu.count(),0);return {keyboardModal:true,resizeUnlocks:true};
},{width:390,height:844});
await check('saved-import-merges-and-rejects-invalid',async page=>{
 await go(page,'favorites');const input=page.locator('input[type=file]');
 await input.setInputFiles({name:'saved.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,fontIds:['gf5-1101','unknown-typeface','gf5-1101']}))});await page.waitForFunction(()=>JSON.parse(localStorage.getItem('font-catalog-favorites')||'[]').includes('gf5-1101'),undefined,{timeout:8000});
 const ids=await page.evaluate(()=>JSON.parse(localStorage.getItem('font-catalog-favorites')));assert.deepEqual([...ids].sort(),['gf5-1101','rsms-288']);
 await input.setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":99,"fontIds":[]}')});await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('font-catalog-favorites'))),ids);
 await axe(page);return {validMerged:2,unknownIgnored:true,malformedDidNotErase:true};
},{width:390,height:844,init:()=>localStorage.setItem('font-catalog-favorites','["rsms-288"]')});
await check('exports-preserve-current-sizes',async page=>{
 await go(page,'compare?fonts=rsms-288,gf5-1101&mode=pair&base=20&ratio=1.5');await page.locator('#workbench-export-format').selectOption('json');
 const result=JSON.parse(await page.locator('pre').innerText());assert.equal(result.scale.baseSize,20);assert.equal(result.scale.ratio,1.5);assert.equal(result.roles.heading.fontSize,'101px');assert.equal(result.roles.body.fontSize,'30px');
 await page.locator('#workbench-export-format').selectOption('css');const css=await page.locator('pre').innerText();assert.match(css,/font-synthesis: none/);assert.match(css,/--onod-size-heading: 101px/);return {scale:result.scale,heading:'101px',body:'30px'};
});
await check('real-pinned-faces-and-request-budget',async page=>{
 const requests=[];page.on('request',r=>{if(/fonts\.googleapis|raw\.githubusercontent/.test(r.url()))requests.push(r.url())});
 await go(page);await page.waitForTimeout(1000);const initial=requests.length;assert.ok(initial<=8,`Too many initial font sources: ${initial}`);
 for(const [id,name] of [['0xproto','0xProto'],['gh-hubot','Hubot Sans'],['geist-sans','Geist Sans']]){
  await go(page,id);const weight=page.getByRole('combobox',{name:'Веса',exact:true});await weight.selectOption('700');await page.waitForTimeout(500);
  const faces=await page.evaluate(async(name)=>{const faces=await document.fonts.load(`normal 700 16px "${name}"`,'Hamburgefontsiv');return faces.map(face=>({family:face.family,weight:face.weight,status:face.status}))},name);
  assert.ok(faces.length>0,`${name}: no real face`);assert.ok(faces.every(face=>face.status==='loaded'));assert.ok(!(await page.locator('#main-content').innerText()).includes('Шрифт не загрузился'),`${name}: loader error`);
 }
 return {initialFontSources:initial,boldFacesVerified:3};
});

if(process.env.QA_FAST!=='1') {
 for(const language of ['ru','en']) for(const width of [320,390,768,1024,1440,1920]) {
  await check(`catalog-${language}-${width}`,async page=>{
   await go(page);await page.waitForTimeout(600);const metrics=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,header:[...document.querySelector('header').querySelectorAll('a,button')].filter(e=>e.getBoundingClientRect().width).map(e=>({label:e.textContent,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}))}));
   assert.ok(metrics.overflow<=1,JSON.stringify(metrics));assert.ok(metrics.header.every(b=>b.left>=-1&&b.right<=width+1),'Clipped navigation controls');
   const issues=await axe(page);
   if(width>=1280){const before=await page.locator('aside').first().boundingBox();await page.evaluate(()=>scrollTo(0,1400));await page.waitForTimeout(100);const after=await page.locator('aside').first().boundingBox();assert.ok(Math.abs(before.y-128)<2&&Math.abs(after.y-128)<2,'Fixed sidebar moved');assert.ok(Math.abs(before.x)<1);}
   return {overflow:metrics.overflow,axe:issues};
  },{width,height:width<600?844:1000,language});
 }
 for(const [name,path] of [['details','rsms-288'],['workbench','compare?fonts=rsms-288,gf5-1101'],['favorites','favorites']])for(const width of [390,1440]) {
  await check(`${name}-a11y-${width}`,async page=>{await go(page,path);await page.waitForTimeout(1000);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=1);const issues=await axe(page);return {overflow,axe:issues}}, {width,height:width<600?844:1000,init:()=>localStorage.setItem('font-catalog-favorites','["rsms-288","gf5-1101"]')});
 }
}
await browser.close();await writeFile(`${OUT}/results.json`,JSON.stringify({browser:browserType,base:BASE,at:new Date().toISOString(),passed:results.filter(r=>r.status==='pass').length,failed:results.filter(r=>r.status==='fail').length,results},null,2));
console.log(`RESULT ${results.filter(r=>r.status==='pass').length}/${results.length} passed`);
if(results.some(r=>r.status==='fail')) process.exitCode=1;
