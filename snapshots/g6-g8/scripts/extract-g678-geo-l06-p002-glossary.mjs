#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {decodeGlossaryText, resolveSourceGlossary} from './build-g678-alg-l11-instructional-successor-glossary.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRECTORY = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const SWF = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/GEO001/L6/RW/L6RW02.swf';
const OUTPUT = path.join(ROOT, 'migrations/shared-geo001-l06-p002/audit/source-glossary-v1.json');
const SOURCE_SHA = '3f340d0201e0f4eed1c8e73d364641d5de4b625e64c33680059842b523002c44';
const PARSER_SHA = '25c9aa4c25a4bc84539b080cebb8dfcbaee5f57189531c6798be14e87ac09d59';
const SOURCES = Object.freeze({
  en: {name: 'L1KTE01.xml', bytes: 345838, sha256: '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'},
  es: {name: 'L1KTS01.xml', bytes: 344456, sha256: '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'},
});
const BUTTONS = Object.freeze([
  {id: 211, key: 'Figure', sha256: 'fbddee021841f018d8e5f2087caf0db0c212b186f74ba1b6bc6a4625c0fd9a2f'},
  {id: 212, key: 'Area', sha256: 'e0b738c17061f85940fafab2abf9cf3694934e35481a9de226125f56edfea826'},
  {id: 213, key: 'Surface', sha256: 'f18256b6c284bf7353ff8f60ece93e79c4ec2c1d8e01c5864100fee15c57bb5b'},
  {id: 214, key: 'Two dimensional', sha256: '6fc98d8e173241d99eb0c4a235475dc2b7fa0e839f283937afca57f202f62112'},
]);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function exactSurfaceVariant(xml) {
  const matches = [...xml.matchAll(/<([^\s>]+~LNG~[^\s>]+)\s+([^>]*)>([\s\S]*?)<\/\1\s*>/gu)]
    .filter(match => /ScreenkeyTerm\s*=\s*"Surface"/.test(match[2]));
  assert.equal(matches.length, 1, 'Surface must resolve to one source entry');
  const match = matches[0], names = match[1].split('~LNG~').map(name => decodeGlossaryText(name.replaceAll('~', ' ')));
  const descriptions = match[3].split('~LNG~').map(decodeGlossaryText);
  assert.deepEqual(names, ['Surface', 'Superficie']);
  assert.equal(descriptions.length, 2);
  return {definitions: {en: descriptions[0], es: descriptions[1]}, sha256: hash(Buffer.from(match[0])),
    lfNormalizedSha256: hash(Buffer.from(match[0].replace(/\r\n?/gu, '\n')))};
}

async function physicalBytes(file, expectedSha, expectedBytes) {
  const before = await lstat(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n);
  assert.equal(await realpath(file), file);
  const bytes = await readFile(file), after = await lstat(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'nlink']) assert.equal(before[key], after[key]);
  assert.equal(hash(bytes), expectedSha, `${file}: source hash drift`);
  if (expectedBytes !== undefined) assert.equal(bytes.length, expectedBytes);
  return bytes;
}

async function build() {
  await physicalBytes(SWF, SOURCE_SHA, 1117764);
  await physicalBytes(path.join(ROOT, 'scripts/build-g678-alg-l11-instructional-successor-glossary.mjs'), PARSER_SHA);
  const xml = {}, source = {};
  for (const [language, pin] of Object.entries(SOURCES)) {
    xml[language] = (await physicalBytes(path.join(DIRECTORY, pin.name), pin.sha256, pin.bytes)).toString('utf8');
    source[language] = {assetId: `G678L1KT${language === 'en' ? 'E' : 'S'}01.xml`,
      path: `HELP_KEYTERMS/KT/XML/${pin.name}`, sha256: pin.sha256};
  }
  const controls = [];
  for (const button of BUTTONS) {
    const relative = `migrations/shared-geo001-l06-p002/audit/ffdec-26.2.1/scripts/DefineButton2_${button.id}/BUTTONCONDACTION on(release).as`;
    const script = (await physicalBytes(path.join(ROOT, relative), button.sha256)).toString('utf8');
    assert.equal(/_global\.KeyAttribute\s*=\s*"([^"]+)"/.exec(script)?.[1], button.key);
    assert.match(script, /_root\.DoHyperLinks\(\)/);
    assert.match(script, /_root\.animation_mc\.animation\.stop\(\)/);
    controls.push({sourceCharacterId: button.id, sourceFrame: 987, sourceKeyAttribute: button.key,
      entryId: button.key.toLowerCase().replace(/[^a-z0-9]+/g, '-'), script: {path: relative, sha256: button.sha256}});
  }
  const entries = resolveSourceGlossary(xml, BUTTONS.filter(button => button.key !== 'Surface').map(button => button.key), source);
  const surfaceEn = exactSurfaceVariant(xml.en), surfaceEs = exactSurfaceVariant(xml.es);
  assert.notEqual(surfaceEn.definitions.en, surfaceEs.definitions.en,
    'expected Surface English definition disagreement must remain visible');
  assert.equal(surfaceEn.definitions.es, surfaceEs.definitions.es,
    'Surface Spanish definition unexpectedly drifted');
  entries.push({id: 'surface', sourceKeyAttribute: 'Surface', labels: {en: 'Surface', es: 'Superficie'},
    definitions: {en: surfaceEn.definitions.en, es: surfaceEs.definitions.es}, source,
    sourceEntrySha256: {en: surfaceEn.sha256, es: surfaceEs.sha256},
    extractionLfNormalizedEntrySha256: {en: surfaceEn.lfNormalizedSha256, es: surfaceEs.lfNormalizedSha256}});
  entries.sort((left, right) => left.id.localeCompare(right.id));
  assert.deepEqual(entries.map(entry => entry.id), ['area', 'figure', 'surface', 'two-dimensional']);
  assert(controls.every(control => entries.some(entry => entry.id === control.entryId &&
    entry.sourceKeyAttribute === control.sourceKeyAttribute)));
  return Buffer.from(`${JSON.stringify({schemaVersion: 1, animationId: 'shared-geo001-l06-p002',
    sourceSwfSha256: SOURCE_SHA, glossarySources: SOURCES, controls, entries,
    sourceConflicts: [{key: 'Surface', field: 'definitions.en',
      englishIndexValue: surfaceEn.definitions.en, spanishIndexValue: surfaceEs.definitions.en,
      engineeringTextSelection: 'EN text from L1KTE01.xml; ES text from L1KTS01.xml',
      originalHostSelectionVerified: false}],
    originalHostLookupVerified: false, companionMediaVerified: false,
    qualification: 'Exact bilingual glossary text and source button keys only; no original host runtime or audio acceptance.'}, null, 2)}\n`);
}

const args = process.argv.slice(2);
assert(args.length >= 1 && ['--write', '--check'].includes(args[0]) &&
  (args.length === 1 || (args.length === 3 && args[1] === '--output')),
  'Usage: node scripts/extract-g678-geo-l06-p002-glossary.mjs <--write|--check> [--output path]');
const output = args.length === 3 ? path.resolve(args[2]) : OUTPUT;
const rendered = await build();
if (args[0] === '--write') await writeFile(output, rendered, {flag: 'wx'});
else assert.deepEqual(await readFile(output), rendered, 'glossary output drift');
console.log(JSON.stringify({status: 'PASS', entries: 4, sha256: hash(rendered)}));
