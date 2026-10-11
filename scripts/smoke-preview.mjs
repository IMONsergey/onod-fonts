import { createServer, get } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

// Test actual emitted static routes, not Vite's SPA fallback. Loopback http.get
// intentionally avoids machine proxy settings. An OS-assigned port cannot clash
// with another project on the designer's workstation.
const root=resolve('dist'), base='/onod-fonts/';
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://127.0.0.1');
    if(!url.pathname.startsWith(base)) {res.writeHead(404).end();return;}
    let file=resolve(root,decodeURIComponent(url.pathname.slice(base.length)) || 'index.html');
    if(file!==root && !file.startsWith(root+sep)) {res.writeHead(403).end();return;}
    try {if((await stat(file)).isDirectory()) file=resolve(file,'index.html');}
    catch {res.writeHead(404,{'content-type':'text/html'}).end(await readFile(resolve(root,'404.html')));return;}
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'}).end(await readFile(file));
  } catch(error) {res.writeHead(500).end(String(error));}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
const origin=`http://127.0.0.1:${server.address().port}`;
function request(path) {return new Promise((resolve,reject)=>{const req=get(origin+path,res=>{let body='';res.setEncoding('utf8');res.on('data',part=>body+=part);res.on('end',()=>resolve({status:res.statusCode,body,headers:res.headers}))});req.on('error',reject);req.setTimeout(5000,()=>req.destroy(new Error(`Timeout requesting ${path}`)))});}
try {
  const home=await request(base);
  for(const path of [base,`${base}compare?fonts=rsms-288`,`${base}rsms-288`,`${base}favorites`,`${base}license`]) {
    const response=await request(path);
    if(response.status!==200 || !response.body.includes('<div id="root"></div>')) throw new Error(`Static route ${path}: HTTP ${response.status} or missing app shell`);
  }
  const missing=await request(`${base}__not_a_real_route__`);
  if(missing.status!==404) throw new Error(`Unknown route returned ${missing.status}`);
  const urls=[...new Set([...home.body.matchAll(/(?:src|href)="(\/onod-fonts\/assets\/[^"]+)"/g)].map(match=>match[1]))];
  if(!urls.length) throw new Error('No production assets in app shell');
  for(const url of urls) {const response=await request(url);if(response.status!==200 || !/javascript|css|image/.test(response.headers['content-type']||'')) throw new Error(`Bad production asset ${url}`);}
  console.log(`Static production smoke passed: home, 4 direct routes, real 404, ${urls.length} assets; port ${server.address().port}.`);
} finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
