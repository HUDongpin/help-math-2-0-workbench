/** Local-only source-vector symbol sheet for the dynamic P002 candidate. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT = path.join(ROOT, 'migrations/shared-geo001-l06-p002/audit');
const ASSETS = path.join(AUDIT, 'vector-assets-v1');
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/GEO001/L6/RW/L6RW02.swf';
const SOURCE_SHA = '3f340d0201e0f4eed1c8e73d364641d5de4b625e64c33680059842b523002c44';
const XML_SHA = '241debfeeb1def99d6eebc5f7b8b3cc2d0a8966ca50fa6dc627b7c0bdd491a73';
const MANIFEST_SHA = '8652fa4164c1c2a11e12684ac9ee9485e33fd67523aab21942f6707eada8725a';
const DEFAULT_OUTPUT = path.join(AUDIT, 'source-symbol-sheet-v1.svg');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fmt = value => Number(value.toFixed(7)).toString();

const args = process.argv.slice(2);
assert(args.length === 1 || args.length === 3,
  'Usage: build-g678-geo-l06-p002-symbol-sheet.mjs --write|--check [--output path]');
assert(['--write', '--check'].includes(args[0]) &&
  (args.length === 1 || args[1] === '--output'));
const output = args.length === 3 ? path.resolve(args[2]) : DEFAULT_OUTPUT;

assert.equal((await lstat(SOURCE)).isFile(), true);
assert.equal(await realpath(SOURCE), SOURCE, 'source must be a physical file');
assert.equal(sha(await readFile(SOURCE)), SOURCE_SHA, 'source SWF drift');
assert.equal(sha(await readFile(path.join(AUDIT, 'movie.xml'))), XML_SHA, 'source XML drift');
const manifestBytes = await readFile(path.join(ASSETS, 'manifest.json'));
assert.equal(sha(manifestBytes), MANIFEST_SHA, 'vector manifest drift');
const manifest = JSON.parse(manifestBytes.toString('utf8'));
assert.equal(manifest.records.length, 207);
const symbols = [];
for (const record of manifest.records) {
  assert(Number.isSafeInteger(record.characterId) && record.characterId > 0);
  const file = path.join(ASSETS, record.path);
  assert(file.startsWith(`${ASSETS}${path.sep}`));
  assert.equal((await lstat(file)).isFile(), true);
  const bytes = await readFile(file);
  assert.equal(sha(bytes), record.sha256, `vector drift: ${record.path}`);
  const sourceSvg = bytes.toString('utf8');
  const root = /^<\?xml[^>]*\?>\s*<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/.exec(sourceSvg);
  assert(root, `invalid SVG: ${record.path}`);
  const prefix = `geo-p002-c${record.characterId}-`;
  const ids = new Set([...root[1].matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  const references = [...root[1].matchAll(/url\(#([^)]+)\)/g)].map(match => match[1]);
  references.push(...[...root[1].matchAll(/(?:xlink:)?href="#([^"]+)"/g)].map(match => match[1]));
  assert(references.every(id => ids.has(id)), `unresolved SVG reference: ${record.path}`);
  const inner = root[1].replace(/\bid="([^"]+)"/g, (_full, id) => `id="${prefix}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_full, id) => `url(#${prefix}${id})`)
    .replace(/((?:xlink:)?href="#)([^"]+)(")/g,
      (_full, before, id, after) => `${before}${prefix}${id}${after}`);
  const {x, y} = record.geometry;
  assert(Number.isFinite(x) && Number.isFinite(y));
  symbols.push(`<g id="geo-p002-character-${record.characterId}" transform="translate(${fmt(x)} ${fmt(y)})">${inner}</g>`);
}
const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
  `xmlns:ffdec="https://www.free-decompiler.com/flash" width="800" height="600" viewBox="0 0 800 600">` +
  `<defs>${symbols.join('')}</defs></svg>\n`;
const bytes = Buffer.from(svg);
if (args[0] === '--write') await writeFile(output, bytes, {flag: 'wx'});
else assert.deepEqual(await readFile(output), bytes, 'symbol sheet drift');
console.log(JSON.stringify({characters: symbols.length, bytes: bytes.length, sha256: sha(bytes),
  claimBoundary: 'local candidate assets only; distribution and product admission unreviewed'}));
