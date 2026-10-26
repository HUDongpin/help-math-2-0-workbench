/** Forensic vector reconstruction probe. No product registration or fidelity claim. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {geoL06P002MainState} from '../packages/demos/src/geo-l06-p002-display-state-v1';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'migrations/shared-geo001-l06-p002/audit/vector-assets-v1');
const MANIFEST_SHA = '8652fa4164c1c2a11e12684ac9ee9485e33fd67523aab21942f6707eada8725a';
const hash = (value: Buffer) => createHash('sha256').update(value).digest('hex');
const format = (value: number) => Number(value.toFixed(7)).toString();

const args = process.argv.slice(2);
assert(args.length === 4 && args[0] === '--frame' && args[2] === '--output',
  'Usage: tsx render-g678-geo-l06-p002-svg-probe.ts --frame N --output path');
const frame = Number(args[1]);
const output = path.resolve(args[3]);
const manifestBytes = await readFile(path.join(ASSETS, 'manifest.json'));
assert.equal(hash(manifestBytes), MANIFEST_SHA, 'vector asset manifest drift');
const manifest = JSON.parse(manifestBytes.toString('utf8')) as {
  records: {characterId: number; path: string; sha256: string;
    geometry: {x: number; y: number; width: number; height: number}}[];
};
const assets = new Map<number, {geometry: (typeof manifest.records)[number]['geometry']; inner: string}>();
for (const record of manifest.records) {
  const bytes = await readFile(path.join(ASSETS, record.path));
  assert.equal(hash(bytes), record.sha256, `vector asset drift: ${record.path}`);
  const sourceSvg = bytes.toString('utf8');
  const root = /^<\?xml[^>]*\?>\s*<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/.exec(sourceSvg);
  assert(root, `vector asset root drift: ${record.path}`);
  assets.set(record.characterId, {geometry: record.geometry, inner: root[1]});
}

const state = geoL06P002MainState(frame, {
  frame, frameDomain: 'sprite-230', scenario: 'default', lang: 'en', seed: 0,
});
const masked: string[] = [];
const unmasked: string[] = [];
for (const object of state.objects) {
  if (object.depth === 1 && object.characterId === 4 && object.clipDepth === 668) continue;
  if ([211, 212, 213, 214].includes(object.characterId)) continue;
  if (object.characterId >= 209 && object.characterId <= 229 && !assets.has(object.characterId)) continue;
  const asset = assets.get(object.characterId);
  if (!asset) throw Error(`GEO_L06_P002_PROBE_UNSUPPORTED_CHARACTER_${object.characterId}`);
  const {x, y} = asset.geometry;
  const transform = object.transform;
  const a = Number(transform.scaleX ?? 1), b = Number(transform.skewY ?? 0);
  const c = Number(transform.skewX ?? 0), d = Number(transform.scaleY ?? 1);
  const e = Number(transform.transX ?? 0) / 20, f = Number(transform.transY ?? 0) / 20;
  const alpha = object.colorTransform.factorAlpha === undefined
    ? 1 : Number(object.colorTransform.factorAlpha) / 256;
  assert([a, b, c, d, e, f, alpha].every(Number.isFinite) && alpha >= 0 && alpha <= 1);
  const prefix = `depth${object.depth}-`;
  const ids = new Set([...asset.inner.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  const references = [...asset.inner.matchAll(/url\(#([^)]+)\)/g)].map(match => match[1]);
  assert(references.every(id => ids.has(id)), `vector asset reference drift: ${object.characterId}`);
  const inner = asset.inner.replace(/\bid="([^"]+)"/g, (_full, id: string) => `id="${prefix}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_full, id: string) => `url(#${prefix}${id})`);
  const tag = `<g transform="matrix(${[a, b, c, d, e, f].map(format).join(' ')})" opacity="${format(alpha)}">` +
    `<g transform="translate(${format(x)} ${format(y)})">${inner}</g></g>`;
  (object.depth <= 668 ? masked : unmasked).push(tag);
}
const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ffdec="https://www.free-decompiler.com/flash" width="800" height="600" viewBox="0 0 800 600">` +
  `<rect width="800" height="600" fill="#b8d8f7"/>` +
  `<defs><clipPath id="source-mask" clipPathUnits="userSpaceOnUse"><rect x="-303.35" y="-195" width="602.15" height="352.8"/></clipPath></defs>` +
  `<g transform="translate(412.4 303.3)"><g clip-path="url(#source-mask)">${masked.join('')}</g>${unmasked.join('')}</g></svg>\n`;
await writeFile(output, svg, {flag: 'wx'});
console.log(JSON.stringify({frame, maskedObjects: masked.length, unmaskedObjects: unmasked.length,
  bytes: Buffer.byteLength(svg), sha256: hash(Buffer.from(svg)),
  claimBoundary: 'forensic source-vector drawing only; original runtime and fidelity unverified'}));
