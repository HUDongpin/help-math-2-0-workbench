#!/usr/bin/env node
/** Exact P003 source exports and generated Canvas; no fidelity/admission claim. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L6/RW/L6RW03.swf`;
const AUDIT = '/Volumes/American Dream/hudongpin/g678-p003-audit.11qugt';
const EXPORT = `${AUDIT}/ffdec-audit`;
const CANVAS = '/Volumes/American Dream/hudongpin/g678-p003-candidate-v2.w5AS1a/canvas-renderer.js';
const OUTPUT = path.join(ROOT, 'migrations/shared-alg001-l06-p003/asset-inventory.csv');
const PIN = Object.freeze({
  source: 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766',
  audit: '26d5e3a113fd0268d678b8831b70deedfa913c84beb017f3c2e1b7f1a71ec35f',
  xml: '06a62bfa3791432396d16a1eff2751576b98f13216560220492b59f03c84d72e',
  canvas: '87694adc7d08f6f95069deede781410ab912a24a44a6cfce0fc05a43118f205c',
});
const HEADER = 'asset_id,swf_character_id,library_symbol,type,source_file,source_frame,exported_file,sha256,format,dimensions_or_bounds,font_glyphs,transformation,confidence,license_or_provenance,notes';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const csv = value => {
  const text = String(value ?? '');
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

function readOrdinary(file) {
  assert.equal(realpathSync(file), file, `physical file: ${file}`);
  const before = lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n, `ordinary file: ${file}`);
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'nlink']) assert.equal(before[key], after[key], `stable file: ${file}`);
  return bytes;
}

export function buildP003AssetInventory(sourceRoot) {
  assert.equal(sourceRoot, SOURCE_ROOT, 'exact source root');
  assert.equal(realpathSync(sourceRoot), sourceRoot, 'physical source root');
  assert(lstatSync(sourceRoot).isDirectory() && !lstatSync(sourceRoot).isSymbolicLink(), 'real source root');
  assert.equal(digest(readOrdinary(SOURCE)), PIN.source, 'SWF drift');
  const audit = JSON.parse(readOrdinary(`${AUDIT}/source-audit.json`));
  assert.equal(digest(readOrdinary(`${AUDIT}/source-audit.json`)), PIN.audit, 'audit drift');
  assert.equal(audit.source.sha256, PIN.source);
  assert.equal(audit.acceptance.currentJsRegistered, false);
  const xmlBytes = readOrdinary(`${AUDIT}/source.xml`);
  assert.equal(digest(xmlBytes), PIN.xml, 'source XML drift');
  const sourceDefinitions = {images: new Set(), shapes: new Set(), texts: new Set()};
  for (const match of xmlBytes.toString().matchAll(/<(DefineShape(?:2|3)?|DefineBits(?:JPEG3)?|DefineText)\b[^>]*\bobjectID="(\d+)"/gu)) {
    const kind = match[1].startsWith('DefineShape') ? 'shapes'
      : match[1].startsWith('DefineBits') ? 'images' : 'texts';
    const id = Number(match[2]);
    assert(!sourceDefinitions[kind].has(id), `duplicate source definition: ${id}`);
    sourceDefinitions[kind].add(id);
  }
  const definitions = new Map(audit.sourceText.definitions.map(item => [item.characterId, item]));
  assert.equal(definitions.size, 16, 'source text count');
  const rows = [HEADER];
  const kinds = [
    {directory: 'images', count: 7, type: 'bitmap', extensions: ['jpg', 'png']},
    {directory: 'shapes', count: 129, type: 'vector', extensions: ['svg']},
    {directory: 'texts', count: 16, type: 'static-text', extensions: ['txt']},
  ];
  for (const kind of kinds) {
    const directory = `${EXPORT}/${kind.directory}`;
    assert.equal(realpathSync(directory), directory, `physical export directory: ${directory}`);
    const files = readdirSync(directory).sort((a, b) => {
      const left = Number(a.split('.')[0]), right = Number(b.split('.')[0]);
      return left - right;
    });
    assert.equal(files.length, kind.count, `${kind.directory} count`);
    const ids = new Set();
    for (const name of files) {
      const match = /^(\d+)\.([a-z]+)$/u.exec(name);
      assert(match && kind.extensions.includes(match[2]), `unexpected ${kind.directory} export: ${name}`);
      const id = Number(match[1]);
      assert(!ids.has(id), `duplicate ${kind.directory} character: ${id}`);
      ids.add(id);
      const file = `${directory}/${name}`, bytes = readOrdinary(file);
      const sourceText = kind.type === 'static-text' ? definitions.get(id) : undefined;
      if (kind.type === 'static-text') {
        assert(sourceText, `unmapped text character: ${id}`);
        assert.equal(bytes.toString(), sourceText.text, `text drift: ${id}`);
      }
      const notes = kind.type === 'static-text'
        ? `Source text character ${id}: ${sourceText.text}; tag SHA-256 ${sourceText.sourceTagSha256}`
        : kind.type === 'vector' && id === 1
          ? 'Source clip mask at depth 1 through 94; candidate normalizes source alpha for clipping only'
          : 'Extracted source definition; runtime visibility and original fidelity unaccepted';
      rows.push([`${kind.directory}-${name}`, id, '', kind.type, SOURCE, '', file,
        digest(bytes), match[2], '', '', 'FFDec 26.2.1 source extraction; retained outside Git',
        'verified-byte', 'Owner-provided SWF; local engineering only', notes].map(csv).join(','));
    }
    assert.deepEqual([...ids].sort((a, b) => a - b),
      [...sourceDefinitions[kind.directory]].sort((a, b) => a - b),
      `${kind.directory} exports match exact source definition IDs`);
    if (kind.type === 'static-text') assert.deepEqual([...ids].sort((a, b) => a - b),
      [...definitions.keys()].sort((a, b) => a - b), 'all audited text characters represented');
  }
  const canvasBytes = readOrdinary(CANVAS);
  assert.equal(digest(canvasBytes), PIN.canvas, 'candidate Canvas drift');
  rows.push(['canvas-renderer.js', '', '', 'generated-canvas-candidate', SOURCE, '', CANVAS,
    PIN.canvas, 'js', '800x600; sprite-154 frames 1-719', '',
    'Pinned FFDec Canvas adapter with source clip-mask normalization; not hand-edited',
    'source-bound-candidate', 'Owner-provided SWF; local engineering only',
    'Unregistered drawing asset; two-run audio clock and semantic formula are separate maintained code'].map(csv).join(','));
  assert.equal(rows.length, 154, 'header plus 153 source/candidate rows');
  return Buffer.from(`${rows.join('\n')}\n`);
}

function main() {
  assert(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--check'),
    'usage: materialize-g678-alg-l06-p003-asset-inventory-v1.mjs [--check]');
  const bytes = buildP003AssetInventory(process.env.HELP_MATH_G678_SOURCE_ROOT);
  if (process.argv[2] === '--check') assert(readFileSync(OUTPUT).equals(bytes), 'inventory drift');
  else try {writeFileSync(OUTPUT, bytes, {flag: 'wx'});}
  catch (error) {if (error.code !== 'EEXIST') throw error; assert(readFileSync(OUTPUT).equals(bytes), 'inventory exists with other bytes');}
  console.log(JSON.stringify({status: process.argv[2] === '--check' ? 'verified' : 'created',
    rows: 153, bytes: bytes.length, sha256: digest(bytes), output: OUTPUT}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
