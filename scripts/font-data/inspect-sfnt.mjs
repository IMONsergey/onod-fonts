import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const TAG_SFNT_TRUE = 0x00010000;
const TAG_OTTO = 0x4f54544f;
const TAG_TRUE = 0x74727565;
const TAG_TYP1 = 0x74797031;

const ensure = (buffer, offset, length, label) => {
  if (offset < 0 || length < 0 || offset + length > buffer.length) {
    throw new Error(`${label}: out-of-bounds read at ${offset}+${length} (buffer=${buffer.length})`);
  }
};

const u16 = (buffer, offset) => { ensure(buffer, offset, 2, 'u16'); return buffer.readUInt16BE(offset); };
const i16 = (buffer, offset) => { ensure(buffer, offset, 2, 'i16'); return buffer.readInt16BE(offset); };
const u32 = (buffer, offset) => { ensure(buffer, offset, 4, 'u32'); return buffer.readUInt32BE(offset); };
const i32 = (buffer, offset) => { ensure(buffer, offset, 4, 'i32'); return buffer.readInt32BE(offset); };
const fixed16_16 = (buffer, offset) => i32(buffer, offset) / 65536;
const tagAt = (buffer, offset) => { ensure(buffer, offset, 4, 'tag'); return buffer.toString('ascii', offset, offset + 4); };

const decodeUtf16Be = buffer => {
  if (buffer.length % 2 !== 0) return '';
  const copy = Buffer.from(buffer);
  copy.swap16();
  return copy.toString('utf16le').replace(/\u0000/g, '').trim();
};

const decodeNameString = (platformID, encodingID, bytes) => {
  if (platformID === 0 || platformID === 3) return decodeUtf16Be(bytes);
  if (platformID === 1) return bytes.toString('latin1').replace(/\u0000/g, '').trim();
  if (encodingID === 1 || encodingID === 10) return decodeUtf16Be(bytes);
  return bytes.toString('latin1').replace(/\u0000/g, '').trim();
};

const parseTableDirectory = buffer => {
  ensure(buffer, 0, 12, 'sfnt header');
  const scalerType = u32(buffer, 0);
  if (![TAG_SFNT_TRUE, TAG_OTTO, TAG_TRUE, TAG_TYP1].includes(scalerType)) {
    throw new Error(`Unsupported SFNT scaler type: 0x${scalerType.toString(16)}`);
  }

  const numTables = u16(buffer, 4);
  ensure(buffer, 12, numTables * 16, 'table directory');
  const tables = new Map();
  for (let index = 0; index < numTables; index += 1) {
    const recordOffset = 12 + index * 16;
    const tag = tagAt(buffer, recordOffset);
    const checksum = u32(buffer, recordOffset + 4);
    const offset = u32(buffer, recordOffset + 8);
    const length = u32(buffer, recordOffset + 12);
    ensure(buffer, offset, length, `table ${tag}`);
    tables.set(tag, { tag, checksum, offset, length });
  }

  return {
    scalerType,
    format: scalerType === TAG_OTTO ? 'otf-cff' : 'ttf-sfnt',
    numTables,
    tables,
  };
};

const withTable = (directory, tag, callback) => {
  const table = directory.tables.get(tag);
  if (!table) return undefined;
  return callback(table);
};

const NAME_IDS = new Map([
  [0, 'copyright'],
  [1, 'family'],
  [2, 'subfamily'],
  [3, 'uniqueId'],
  [4, 'fullName'],
  [5, 'version'],
  [6, 'postScriptName'],
  [13, 'licenseDescription'],
  [14, 'licenseInfoUrl'],
  [16, 'typographicFamily'],
  [17, 'typographicSubfamily'],
]);

const parseName = (buffer, directory) => withTable(directory, 'name', table => {
  if (table.length < 6) return {};
  const base = table.offset;
  const format = u16(buffer, base);
  const count = u16(buffer, base + 2);
  const stringOffset = u16(buffer, base + 4);
  ensure(buffer, base + 6, count * 12, 'name records');
  const values = new Map();

  for (let index = 0; index < count; index += 1) {
    const record = base + 6 + index * 12;
    const platformID = u16(buffer, record);
    const encodingID = u16(buffer, record + 2);
    const languageID = u16(buffer, record + 4);
    const nameID = u16(buffer, record + 6);
    const length = u16(buffer, record + 8);
    const offset = u16(buffer, record + 10);
    if (!NAME_IDS.has(nameID)) continue;

    const absolute = base + stringOffset + offset;
    if (absolute < base || absolute + length > base + table.length) continue;
    const decoded = decodeNameString(platformID, encodingID, buffer.subarray(absolute, absolute + length));
    if (!decoded) continue;

    const key = NAME_IDS.get(nameID);
    const items = values.get(key) || [];
    if (!items.some(item => item.value === decoded)) items.push({ value: decoded, platformID, encodingID, languageID });
    values.set(key, items);
  }

  const preferred = items => {
    if (!items?.length) return undefined;
    return items.find(item => item.platformID === 3 && [0x0409, 0].includes(item.languageID))?.value
      || items.find(item => item.platformID === 0)?.value
      || items.find(item => item.platformID === 3)?.value
      || items[0].value;
  };

  return Object.fromEntries(Array.from(values.entries()).map(([key, items]) => [key, preferred(items)]).filter(([, value]) => Boolean(value)).concat([['format', format]]));
});

const parseHead = (buffer, directory) => withTable(directory, 'head', table => {
  if (table.length < 54) return undefined;
  const base = table.offset;
  return {
    unitsPerEm: u16(buffer, base + 18),
    xMin: i16(buffer, base + 36),
    yMin: i16(buffer, base + 38),
    xMax: i16(buffer, base + 40),
    yMax: i16(buffer, base + 42),
    macStyle: u16(buffer, base + 44),
    indexToLocFormat: i16(buffer, base + 50),
  };
});

const parseHhea = (buffer, directory) => withTable(directory, 'hhea', table => {
  if (table.length < 36) return undefined;
  const base = table.offset;
  return {
    ascender: i16(buffer, base + 4),
    descender: i16(buffer, base + 6),
    lineGap: i16(buffer, base + 8),
    advanceWidthMax: u16(buffer, base + 10),
    minLeftSideBearing: i16(buffer, base + 12),
    minRightSideBearing: i16(buffer, base + 14),
    xMaxExtent: i16(buffer, base + 16),
    numberOfHMetrics: u16(buffer, base + 34),
  };
});

const parseMaxp = (buffer, directory) => withTable(directory, 'maxp', table => {
  if (table.length < 6) return undefined;
  return { numGlyphs: u16(buffer, table.offset + 4) };
});

const parseOs2 = (buffer, directory) => withTable(directory, 'OS/2', table => {
  if (table.length < 78) return undefined;
  const base = table.offset;
  const version = u16(buffer, base);
  const result = {
    version,
    xAvgCharWidth: i16(buffer, base + 2),
    weightClass: u16(buffer, base + 4),
    widthClass: u16(buffer, base + 6),
    fsType: u16(buffer, base + 8),
    vendorId: buffer.toString('ascii', base + 58, base + 62),
    fsSelection: u16(buffer, base + 62),
    firstCharIndex: u16(buffer, base + 64),
    lastCharIndex: u16(buffer, base + 66),
    typoAscender: i16(buffer, base + 68),
    typoDescender: i16(buffer, base + 70),
    typoLineGap: i16(buffer, base + 72),
    winAscent: u16(buffer, base + 74),
    winDescent: u16(buffer, base + 76),
  };

  if (version >= 1 && table.length >= 86) {
    result.codePageRange1 = u32(buffer, base + 78);
    result.codePageRange2 = u32(buffer, base + 82);
  }
  if (version >= 2 && table.length >= 96) {
    result.xHeight = i16(buffer, base + 86);
    result.capHeight = i16(buffer, base + 88);
    result.defaultChar = u16(buffer, base + 90);
    result.breakChar = u16(buffer, base + 92);
    result.maxContext = u16(buffer, base + 94);
  }
  return result;
});

const parseFvar = (buffer, directory) => withTable(directory, 'fvar', table => {
  if (table.length < 16) return undefined;
  const base = table.offset;
  const axesArrayOffset = u16(buffer, base + 4);
  const axisCount = u16(buffer, base + 8);
  const axisSize = u16(buffer, base + 10);
  const instanceCount = u16(buffer, base + 12);
  const instanceSize = u16(buffer, base + 14);
  if (axisSize < 20) return { axes: [], instanceCount, instanceSize };
  ensure(buffer, base + axesArrayOffset, axisCount * axisSize, 'fvar axes');

  const axes = [];
  for (let index = 0; index < axisCount; index += 1) {
    const offset = base + axesArrayOffset + index * axisSize;
    axes.push({
      tag: tagAt(buffer, offset),
      min: fixed16_16(buffer, offset + 4),
      default: fixed16_16(buffer, offset + 8),
      max: fixed16_16(buffer, offset + 12),
      flags: u16(buffer, offset + 16),
      nameId: u16(buffer, offset + 18),
    });
  }
  return { axes, instanceCount, instanceSize };
});

const parseCmapFormat4 = (buffer, subtableOffset, codepoints) => {
  const length = u16(buffer, subtableOffset + 2);
  ensure(buffer, subtableOffset, length, 'cmap format 4');
  const segCount = u16(buffer, subtableOffset + 6) / 2;
  const endCodes = subtableOffset + 14;
  const startCodes = endCodes + segCount * 2 + 2;
  const idDeltas = startCodes + segCount * 2;
  const idRangeOffsets = idDeltas + segCount * 2;

  for (let index = 0; index < segCount; index += 1) {
    const start = u16(buffer, startCodes + index * 2);
    const end = u16(buffer, endCodes + index * 2);
    const delta = i16(buffer, idDeltas + index * 2);
    const rangeOffsetWord = idRangeOffsets + index * 2;
    const rangeOffset = u16(buffer, rangeOffsetWord);
    if (start > end) continue;

    for (let code = start; code <= end && code !== 0xffff; code += 1) {
      let glyphId = 0;
      if (rangeOffset === 0) {
        glyphId = (code + delta) & 0xffff;
      } else {
        const glyphAddress = rangeOffsetWord + rangeOffset + (code - start) * 2;
        if (glyphAddress + 2 > subtableOffset + length) continue;
        glyphId = u16(buffer, glyphAddress);
        if (glyphId !== 0) glyphId = (glyphId + delta) & 0xffff;
      }
      if (glyphId !== 0) codepoints.add(code);
    }
  }
};

const parseCmapFormat12 = (buffer, subtableOffset, codepoints) => {
  const length = u32(buffer, subtableOffset + 4);
  ensure(buffer, subtableOffset, length, 'cmap format 12');
  const groupCount = u32(buffer, subtableOffset + 12);
  ensure(buffer, subtableOffset + 16, groupCount * 12, 'cmap format 12 groups');
  for (let index = 0; index < groupCount; index += 1) {
    const group = subtableOffset + 16 + index * 12;
    const start = u32(buffer, group);
    const end = u32(buffer, group + 4);
    const startGlyph = u32(buffer, group + 8);
    if (start > end || end > 0x10ffff) continue;
    for (let code = start; code <= end; code += 1) {
      const glyph = startGlyph + (code - start);
      if (glyph !== 0) codepoints.add(code);
    }
  }
};

const rangesFromSet = codepoints => {
  const sorted = Array.from(codepoints).sort((a, b) => a - b);
  const ranges = [];
  let start;
  let previous;
  for (const code of sorted) {
    if (start === undefined) {
      start = previous = code;
      continue;
    }
    if (code === previous + 1) {
      previous = code;
      continue;
    }
    ranges.push([start, previous]);
    start = previous = code;
  }
  if (start !== undefined) ranges.push([start, previous]);
  return { sorted, ranges };
};

const parseCmap = (buffer, directory) => withTable(directory, 'cmap', table => {
  if (table.length < 4) return undefined;
  const base = table.offset;
  const count = u16(buffer, base + 2);
  ensure(buffer, base + 4, count * 8, 'cmap encoding records');
  const codepoints = new Set();
  const formats = new Set();
  const encodings = [];

  for (let index = 0; index < count; index += 1) {
    const record = base + 4 + index * 8;
    const platformID = u16(buffer, record);
    const encodingID = u16(buffer, record + 2);
    const relative = u32(buffer, record + 4);
    const subtable = base + relative;
    if (subtable < base || subtable + 2 > base + table.length) continue;
    const format = u16(buffer, subtable);
    formats.add(format);
    encodings.push({ platformID, encodingID, format });

    const isUnicode = platformID === 0 || (platformID === 3 && [1, 10].includes(encodingID));
    if (!isUnicode) continue;
    if (format === 4) parseCmapFormat4(buffer, subtable, codepoints);
    else if (format === 12) parseCmapFormat12(buffer, subtable, codepoints);
  }

  const { sorted, ranges } = rangesFromSet(codepoints);
  return {
    codepointCount: sorted.length,
    minCodepoint: sorted[0],
    maxCodepoint: sorted.at(-1),
    formats: Array.from(formats).sort((a, b) => a - b),
    encodings,
    ranges,
  };
});

const parseFeatureTags = (buffer, directory, tableTag) => withTable(directory, tableTag, table => {
  if (table.length < 10) return [];
  const base = table.offset;
  const featureListOffset = u16(buffer, base + 6);
  if (featureListOffset === 0 || featureListOffset + 2 > table.length) return [];
  const featureList = base + featureListOffset;
  const count = u16(buffer, featureList);
  ensure(buffer, featureList + 2, count * 6, `${tableTag} FeatureList`);
  const tags = new Set();
  for (let index = 0; index < count; index += 1) tags.add(tagAt(buffer, featureList + 2 + index * 6));
  return Array.from(tags).sort();
});

export const inspectSfnt = (buffer, metadata = {}) => {
  if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer);
  const directory = parseTableDirectory(buffer);
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  const tableDirectory = Array.from(directory.tables.values())
    .map(({ tag, checksum, length }) => ({ tag, checksum: `0x${checksum.toString(16).padStart(8, '0')}`, length }))
    .sort((a, b) => a.tag.localeCompare(b.tag));

  return {
    ...metadata,
    sha256,
    size: buffer.length,
    sfntFormat: directory.format,
    tables: tableDirectory,
    name: parseName(buffer, directory),
    head: parseHead(buffer, directory),
    hhea: parseHhea(buffer, directory),
    maxp: parseMaxp(buffer, directory),
    os2: parseOs2(buffer, directory),
    fvar: parseFvar(buffer, directory),
    cmap: parseCmap(buffer, directory),
    openTypeFeatures: {
      gsub: parseFeatureTags(buffer, directory, 'GSUB') || [],
      gpos: parseFeatureTags(buffer, directory, 'GPOS') || [],
    },
    statPresent: directory.tables.has('STAT'),
  };
};

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) {
  const input = process.argv[2];
  const output = process.argv[3];
  if (!input) {
    console.error('Usage: node scripts/font-data/inspect-sfnt.mjs <font.ttf|font.otf> [output.json]');
    process.exit(2);
  }
  const result = inspectSfnt(readFileSync(input), { filename: basename(input) });
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (output) writeFileSync(output, serialized);
  else process.stdout.write(serialized);
}
