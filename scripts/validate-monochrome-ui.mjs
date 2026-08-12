import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, 'src');
const globalsPath = path.join(ROOT, 'src/styles/globals.css');

const chromaticFamilies = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
];

const sourceExtensions = new Set(['.css', '.ts', '.tsx', '.js', '.jsx']);
const failures = [];

const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const fullPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return walk(fullPath);
  return sourceExtensions.has(path.extname(entry.name)) ? [fullPath] : [];
});

const sourceFiles = walk(SRC_ROOT);
const sourceText = sourceFiles.map(file => ({
  file,
  relative: path.relative(ROOT, file),
  text: fs.readFileSync(file, 'utf8'),
}));

const expandHex = value => {
  const raw = value.slice(1).toLowerCase();
  if (raw.length === 3 || raw.length === 4) return raw.split('').map(char => char + char).join('');
  return raw;
};

for (const { relative, text } of sourceText) {
  for (const match of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const expanded = expandHex(match[0]);
    if (expanded.length !== 6 && expanded.length !== 8) continue;
    const r = expanded.slice(0, 2);
    const g = expanded.slice(2, 4);
    const b = expanded.slice(4, 6);
    if (!(r === g && g === b)) failures.push(`${relative}: chromatic HEX is not allowed: ${match[0]}`);
  }

  for (const match of text.matchAll(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/gi)) {
    const [, r, g, b] = match;
    if (!(Number(r) === Number(g) && Number(g) === Number(b))) failures.push(`${relative}: chromatic rgb()/rgba() is not allowed: ${match[0]}`);
  }

  for (const match of text.matchAll(/oklch\(\s*[^\s)]+\s+([^\s/)]+)/gi)) {
    const chroma = Number(match[1]);
    if (!Number.isNaN(chroma) && chroma !== 0) failures.push(`${relative}: OKLCH chroma must be 0: ${match[0]}`);
  }

  for (const match of text.matchAll(/hsla?\(\s*[^,\s]+[,\s]+([\d.]+)%/gi)) {
    const saturation = Number(match[1]);
    if (!Number.isNaN(saturation) && saturation !== 0) failures.push(`${relative}: HSL saturation must be 0%: ${match[0]}`);
  }

  for (const family of chromaticFamilies) {
    const utilityPattern = new RegExp(`\\b(?:bg|text|border|ring|outline|decoration|divide|placeholder|caret|accent|fill|stroke|shadow|from|via|to)-${family}(?:-\\d{2,3})?(?:\\/\\d+)?\\b`, 'g');
    for (const match of text.matchAll(utilityPattern)) {
      failures.push(`${relative}: chromatic Tailwind utility is not allowed: ${match[0]}`);
    }

    const namedPaintPattern = new RegExp(`(?:fill|stroke|color|background(?:-color)?|border-color)\\s*[:=]\\s*["']?${family}\\b`, 'gi');
    for (const match of text.matchAll(namedPaintPattern)) {
      failures.push(`${relative}: chromatic named paint is not allowed: ${match[0]}`);
    }
  }
}

const globals = fs.readFileSync(globalsPath, 'utf8');

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
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`ONOD monochrome UI validation passed across ${sourceFiles.length} source files.`);
