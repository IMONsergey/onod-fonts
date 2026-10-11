// Reparse the EXACT pinned upstream blobs. No silent license/source updates.
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseGoogleMetadata } from './parse-google-metadata.mjs';
const target = 'src/app/data/verified/google-fonts.json';
const original = JSON.parse(await readFile(target, 'utf8'));
const entries = Object.entries(original);
const token = process.env.GITHUB_TOKEN || execFileSync('gh',['auth','token'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const cache = '.worklogs/google-blobs'; await mkdir(cache,{recursive:true});
const result = {}, failures = []; let cursor=0, count=0;
const sha = text => createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0`).update(text).digest('hex');
async function fetchBlob(hash) {
  const file = `${cache}/${hash}.pb`;
  try { const cached = await readFile(file,'utf8'); if(sha(cached) === hash) return cached; } catch {}
  for(let attempt=0; attempt<4; attempt++) {
    try {
      const response=await fetch(`https://api.github.com/repos/google/fonts/git/blobs/${hash}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','User-Agent':'onod-evidence-repair'},signal:AbortSignal.timeout(30000)});
      if(!response.ok) throw new Error(`GitHub blob HTTP ${response.status}`);
      const payload=await response.json();
      const text=Buffer.from(payload.content.replace(/\s/g,''),'base64').toString('utf8');
      if(sha(text)!==hash) throw new Error(`Hash mismatch ${hash}`);
      await writeFile(file,text);return text;
    } catch(e) { if(attempt===3) throw e; await new Promise(r=>setTimeout(r,500*2**attempt)); }
  }
}
async function worker() {
  while(cursor<entries.length) {
    const [name,old]=entries[cursor++];
    try {
      const text=await fetchBlob(old.metadataSha);
      const parsed=parseGoogleMetadata(text,old.metadataPath,old.metadataSha);
      if(parsed.family!==old.family || parsed.license!==old.license) throw new Error('Pinned identity/license unexpectedly changed');
      result[name]=parsed;
    } catch(error) {failures.push({name,error:error.message});}
    count++;if(count%100===0) console.log(`Reparsed ${count}/${entries.length}; failures=${failures.length}`);
  }
}
await Promise.all(Array.from({length:8},worker));
if(failures.length) {await writeFile('.worklogs/repair-failures.json',JSON.stringify(failures,null,2));throw new Error(`Atomic repair cancelled: ${failures.length} failures; previous evidence unchanged`);}
const ordered=Object.fromEntries(Object.entries(result).sort(([a],[b])=>a.localeCompare(b)));
const report={schemaVersion:2,reviewedAt:new Date().toISOString(),method:'Reparse exact existing blob SHAs; identity and license unchanged',families:entries.length,variable:Object.values(result).filter(v=>Object.keys(v.axes).length).length,italic:Object.values(result).filter(v=>v.styles.includes('italic')).length,emptyWeights:Object.values(result).filter(v=>!v.weights.length).length,emptyStyles:Object.values(result).filter(v=>!v.styles.length).length,changes:entries.map(([name,old])=>({name,metadataSha:old.metadataSha,before:{axes:old.axes,weights:old.weights,styles:old.styles},after:{axes:result[name].axes,weights:result[name].weights,styles:result[name].styles}}))};
await writeFile(`${target}.tmp`,JSON.stringify(ordered,null,2)+'\n');await rename(`${target}.tmp`,target);
await mkdir('docs/evidence',{recursive:true});await writeFile('docs/evidence/google-metadata-repair-2026-10-11.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,changes:undefined},null,2));
