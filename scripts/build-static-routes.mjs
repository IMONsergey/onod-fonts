import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { mockFonts } from '../src/app/data/mockFonts.ts';
import { getEffectiveFamilyName } from '../src/app/lib/fontTrust.ts';
const shell=await readFile('dist/index.html','utf8');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const routes=[['compare','Workbench',true],['favorites','Saved fonts',true],['protocol','Typography guide',false],['about','About ONOD Fonts',false],['privacy','Privacy',false],['terms','Terms',false],['license','Typeface licensing',false],...mockFonts.map(font=>[font.id,getEffectiveFamilyName(font),false])];
for(const [path,title,privatePage] of routes) {
  if(!/^[A-Za-z0-9_-]+$/.test(path)) throw new Error(`Invalid public route ${path}`);
  await mkdir(`dist/${path}`,{recursive:true});
  let html=shell.replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(title)} — ONOD Fonts</title>`);
  if(privatePage) html=html.replace(/name="robots" content="[^"]*"/, 'name="robots" content="noindex, follow"');
  await writeFile(`dist/${path}/index.html`,html);
}
await writeFile('dist/404.html',shell.replace(/name="robots" content="[^"]*"/,'name="robots" content="noindex, follow"'));
await writeFile('dist/.nojekyll','');
console.log(`Materialized ${routes.length} static public routes. Known routes no longer depend on a 404 fallback.`);
