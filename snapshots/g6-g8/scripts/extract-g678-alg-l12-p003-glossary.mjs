import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveSourceGlossary} from './build-g678-alg-l11-instructional-successor-glossary.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const swfPath = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/RW/L12RW03.swf';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const parser = {path: 'scripts/build-g678-alg-l11-instructional-successor-glossary.mjs',
  sha256: '25c9aa4c25a4bc84539b080cebb8dfcbaee5f57189531c6798be14e87ac09d59'};
const pins = {
  en: {file: 'L1KTE01.xml', bytes: 345838, sha256: '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'},
  es: {file: 'L1KTS01.xml', bytes: 344456, sha256: '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'},
};
const swfSha256 = '384f7e8e269768063d8e6ca410350ccbd5c321596fd6f55d68903cc1b6d2bccb';
const buttons = [
  {characterId: 150, requestedSourceKey: 'Graph', sha256: '5f789f785f961f26fba79d3dd3167089fc8251e9da0e0cff9852831b2f890788'},
  {characterId: 151, requestedSourceKey: 'Relation', sha256: 'bb9bd516b984a08cc4f3b3c85d9e4a7cc0243e1384a6f2497aa8e29990b4744e'},
  {characterId: 156, requestedSourceKey: 'Function', sha256: 'bf18a4b6722a58696805f4dd043c6b04a1b1c3cc9a605ef84301790c08bb4cfa'},
  {characterId: 157, requestedSourceKey: 'Equation', sha256: '0b89848d79d735127115901984f60c2c8c2996f9561d150573068e496601ed4b'},
  {characterId: 161, requestedSourceKey: 'Linear equation', sha256: 'd948fd97117ca73ce7b5f3b2eae8c1cca20de3106f5b5cea8e1f5912e29ab177'},
  {characterId: 162, requestedSourceKey: 'Linear function', sha256: '169f8cafc520f88fdfa78737eccf7e9bb8e6d726a05a25c9b70ce99002cafc7a'},
];

async function pinnedFile(file, sha256, bytesExpected) {
  assert.equal(await realpath(file), file, `${file}: source path is not canonical`);
  const before = await lstat(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n, `${file}: source is not a single regular file`);
  const bytes = await readFile(file);
  const after = await lstat(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mode', 'mtimeNs', 'nlink']) assert.equal(before[key], after[key], `${file}: changed during read`);
  if (bytesExpected !== undefined) assert.equal(bytes.length, bytesExpected, `${file}: byte count drift`);
  assert.equal(hash(bytes), sha256, `${file}: SHA-256 drift`);
  return bytes;
}

assert(['--write', '--check'].includes(process.argv[2]) && process.argv.length === 3,
  'usage: extract-g678-alg-l12-p003-glossary.mjs --write|--check');
const sourceRootStat = await lstat(sourceRoot);
assert(sourceRootStat.isDirectory() && !sourceRootStat.isSymbolicLink());
assert.equal(await realpath(sourceRoot), sourceRoot);
await pinnedFile(path.join(root, parser.path), parser.sha256);
await pinnedFile(swfPath, swfSha256);

const requested = buttons.map(button => button.requestedSourceKey);
assert.equal(new Set(requested.map(term => term.toLowerCase())).size, 6);
for (const button of buttons) {
  const file = path.join(root, `migrations/shared-alg001-l12-p003/audit/source-scripts/scripts/DefineButton2_${button.characterId}/BUTTONCONDACTION on(release).as`);
  const script = (await pinnedFile(file, button.sha256)).toString('utf8');
  const match = script.match(/_global\.KeyAttribute = "([^"]+)";/gu);
  assert.deepEqual(match, [`_global.KeyAttribute = "${button.requestedSourceKey}";`]);
  assert.match(script, /_root\.DoHyperLinks\(\);/u);
  assert.match(script, /_root\.animation_mc\.animation\.stop\(\);/u);
}

const xml = {}, source = {};
for (const [lang, pin] of Object.entries(pins)) {
  xml[lang] = (await pinnedFile(path.join(sourceRoot, pin.file), pin.sha256, pin.bytes)).toString('utf8');
  source[lang] = {assetId: `G678${pin.file}`, path: `HELP_KEYTERMS/KT/XML/${pin.file}`, sha256: pin.sha256};
}
const entries = resolveSourceGlossary(xml, requested, source).map(entry => {
  const matches = buttons.filter(button => button.requestedSourceKey.toLowerCase() === entry.sourceKeyAttribute.toLowerCase());
  assert.equal(matches.length, 1, `${entry.sourceKeyAttribute}: missing or ambiguous SWF request`);
  const requestedSourceKey = matches[0].requestedSourceKey;
  return {...entry, rawScreenkeyTerm: entry.sourceKeyAttribute, sourceKeyAttribute: requestedSourceKey,
    requestedSourceKey, characterId: matches[0].characterId,
    keyMappingDecision: entry.sourceKeyAttribute === requestedSourceKey ? 'exact' :
      'Unique case-insensitive ScreenkeyTerm and English element-label match to the exact SWF request; original host lookup unverified.'};
});
assert.equal(entries.length, 6);
assert.deepEqual(new Set(entries.map(entry => entry.requestedSourceKey)), new Set(requested));
const payload = {schemaVersion: 1, animationId: 'shared-alg001-l12-p003',
  sourceSwf: {path: swfPath, sha256: swfSha256}, parser, sourceDirectory: sourceRoot,
  physicalSources: pins, buttonSources: buttons, entries,
  originalHostLookupVerified: false, companionMediaVerified: false, acceptanceEffect: 'none'};
const output = path.join(root, 'migrations/shared-alg001-l12-p003/audit/source-glossary-v1.json');
const value = `${JSON.stringify(payload, null, 2)}\n`;
if (process.argv[2] === '--write') await writeFile(output, value, {flag: 'wx'});
else assert.equal(await readFile(output, 'utf8'), value);
console.log(JSON.stringify({entries: entries.map(entry => ({id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute,
  raw: entry.rawScreenkeyTerm})), bytes: Buffer.byteLength(value), sha256: hash(value)}));
