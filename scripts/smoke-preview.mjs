import { spawn } from 'node:child_process';

const host = '127.0.0.1';
const port = 4173;
const origin = `http://${host}:${port}`;
const base = '/onod-fonts/';

const child = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env },
});

let stderr = '';
child.stderr.on('data', chunk => { stderr += chunk.toString(); });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`vite preview exited early (${child.exitCode}): ${stderr}`);
    try {
      const response = await fetch(`${origin}${base}`);
      if (response.ok) return response;
    } catch {
      // Server is still starting.
    }
    await sleep(250);
  }
  throw new Error(`vite preview did not become ready: ${stderr}`);
}

async function assertHtml(path) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const html = await response.text();
  if (!html.includes('<div id="root"></div>')) throw new Error(`${path} is not the ONOD application shell.`);
  return html;
}

async function assertAssets(html) {
  const urls = Array.from(html.matchAll(/(?:src|href)="(\/onod-fonts\/assets\/[^"]+)"/g), match => match[1]);
  if (!urls.length) throw new Error('No production assets were referenced from the application shell.');
  const unique = Array.from(new Set(urls));
  for (const url of unique) {
    const response = await fetch(`${origin}${url}`);
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!/javascript|css|image|font|octet-stream/.test(contentType)) throw new Error(`${url} returned unexpected content-type: ${contentType}`);
  }
  return unique.length;
}

try {
  await waitForServer();
  const home = await assertHtml(base);
  await assertHtml(`${base}compare?fonts=rsms-288`);
  await assertHtml(`${base}rsms-288`);
  const assetCount = await assertAssets(home);
  console.log(`Production preview smoke passed: home + direct routes + ${assetCount} assets.`);
} finally {
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => child.once('exit', resolve)),
    sleep(1500).then(() => child.kill('SIGKILL')),
  ]);
}
