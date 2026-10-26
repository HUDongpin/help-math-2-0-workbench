import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveSourceGlossary} from './build-g678-alg-l11-instructional-successor-glossary.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const hash = b => createHash('sha256').update(b).digest('hex');
const pins = {
  en: {file: 'L1KTE01.xml', bytes: 345838, sha256: '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'},
  es: {file: 'L1KTS01.xml', bytes: 344456, sha256: '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'},
};
const requested = ['Vertical-line test', 'Vertical', 'Graph', 'Point', 'Function'];
assert(['--write', '--check'].includes(process.argv[2]) && process.argv.length === 3);
assert.equal(hash(await readFile(path.join(root, 'scripts/build-g678-alg-l11-instructional-successor-glossary.mjs'))),
  '25c9aa4c25a4bc84539b080cebb8dfcbaee5f57189531c6798be14e87ac09d59');
const xml = {}, source = {};
for (const [lang, pin] of Object.entries(pins)) {
  const file = path.join(sourceRoot, pin.file);
  assert.equal(await realpath(file), file);
  const before = await lstat(file, {bigint: true}), bytes = await readFile(file), after = await lstat(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n);
  for (const key of ['dev', 'ino', 'size', 'mode', 'mtimeNs', 'nlink']) assert.equal(before[key], after[key]);
  assert.equal(bytes.length, pin.bytes); assert.equal(hash(bytes), pin.sha256);
  xml[lang] = bytes.toString('utf8');
  source[lang] = {assetId: `G678${pin.file}`, path: `HELP_KEYTERMS/KT/XML/${pin.file}`, sha256: pin.sha256};
}
const entries = resolveSourceGlossary(xml, requested, source).map(entry => {
  const matches = requested.filter(term => term.toLowerCase() === entry.sourceKeyAttribute.toLowerCase());
  assert.equal(matches.length, 1);
  return {...entry, rawScreenkeyTerm: entry.sourceKeyAttribute, sourceKeyAttribute: matches[0],
    requestedSourceKey: matches[0],
    keyMappingDecision: entry.sourceKeyAttribute === matches[0] ? 'exact' :
      'Unique case-insensitive ScreenkeyTerm and English element-label match to the exact SWF request; original host lookup unverified.'};
});
assert.equal(entries.length, 5);
const payload = {schemaVersion: 1, animationId: 'shared-alg001-l12-p004',
  sourceDirectory: sourceRoot, physicalSources: pins, entries,
  originalHostLookupVerified: false, companionMediaVerified: false, acceptanceEffect: 'none'};
const output = path.join(root, 'migrations/shared-alg001-l12-p004/audit/source-glossary-v1.json');
const value = `${JSON.stringify(payload, null, 2)}\n`;
if (process.argv[2] === '--write') await writeFile(output, value, {flag: 'wx'});
else assert.equal(await readFile(output, 'utf8'), value);
console.log(JSON.stringify({entries: entries.map(e => ({id: e.id, sourceKeyAttribute: e.sourceKeyAttribute, raw: e.rawScreenkeyTerm})), bytes: Buffer.byteLength(value), sha256: hash(value)}));
