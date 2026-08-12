import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const styleFiles = [
  path.join(ROOT, 'src/styles/globals.css'),
  path.join(ROOT, 'src/styles/index.css'),
];

const chromaticFamilies = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
];

const failures = [];
const text = styleFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');

const expandHex = value => {
  const raw = value.slice(1).toLowerCase();
  if (raw.length === 3 || raw.length === 4) return raw.split('').map(char => char + char).join('');
  return raw;
};

for (const match of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
  const expanded = expandHex(match[0]);
  if (expanded.length !== 6 && expanded.length !== 8) continue;
  const r = expanded.slice(0, 2);
  const g = expanded.slice(2, 4);
  const b = expanded.slice(4, 6);
  if (!(r === g && g === b)) failures.push(`Chromatic HEX is not allowed: ${match[0]}`);
}

for (const match of text.matchAll(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/gi)) {
  const [, r, g, b] = match;
  if (!(Number(r) === Number(g) && Number(g) === Number(b))) failures.push(`Chromatic rgb()/rgba() is not allowed: ${match[0]}`);
}

for (const match of text.matchAll(/oklch\(\s*[^\s)]+\s+([^\s/)]+)/gi)) {
  const chroma = Number(match[1]);
  if (!Number.isNaN(chroma) && chroma !== 0) failures.push(`OKLCH chroma must be 0: ${match[0]}`);
}

for (const match of text.matchAll(/hsla?\(\s*[^,\s]+[,\s]+([\d.]+)%/gi)) {
  const saturation = Number(match[1]);
  if (!Number.isNaN(saturation) && saturation !== 0) failures.push(`HSL saturation must be 0%: ${match[0]}`);
}

const globals = fs.readFileSync(path.join(ROOT, 'src/styles/globals.css'), 'utf8');

for (const family of chromaticFamilies) {
  if (!globals.includes(`[class*="-${family}-"]`)) {
    failures.push(`Monochrome safety net is missing Tailwind family: ${family}`);
  }
}

if (!/img,\s*\n\s*video,\s*\n\s*canvas\s*\{[\s\S]*?filter:\s*grayscale\(1\)\s*!important;/m.test(globals)) {
  failures.push('Interface media must remain grayscale, including hover states.');
}

if (!/:root \*::selection[\s\S]*?background:\s*#[0-9a-fA-F]{6}\s*!important;/m.test(globals)) {
  failures.push('Text selection must be explicitly pinned to the monochrome palette.');
}

if (failures.length) {
  console.error('ONOD monochrome UI validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ONOD monochrome UI validation passed.');
