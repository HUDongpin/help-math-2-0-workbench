import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {ROOT, CONTROLS, INPUTS, XML, OUTPUT, MODULE, sourceGlossary, validateGlossaryScript,
  reconcileExisting, readBound, binding, publish, build} from './build-g678-nms-l01-p044-source-glossary.mjs';

const source = Object.fromEntries(['en', 'es'].map(lang => [lang, {assetId: `G678L1KT${lang === 'en' ? 'E' : 'S'}01.xml`,
  path: `HELP_KEYTERMS/KT/XML/L1KT${lang === 'en' ? 'E' : 'S'}01.xml`, sha256: XML[lang].sha256}]));
const record = key => `<${key}~LNG~${key} ScreenkeyTerm="${key}" SubLinkEng="sum,Sum" SubLinkSpan="suma,Suma" ExFileName="${key}.swf">A definition.~LNG~Una definición.</${key}~LNG~${key}>`;
const fixture = () => {const xml = `<KeyTerms>${CONTROLS.map(c => record(c.sourceKeyAttribute)).join('\n')}</KeyTerms>`; return {en: xml, es: xml};};
test('three exact source buttons and bilingual terms preserve legacy references and raw entry hashes', () => {
  const xml = fixture(), entries = sourceGlossary(xml, source);
  assert.deepEqual(entries.map(e => e.id), ['multiplication', 'solve', 'total']);
  for (const e of entries) {
    assert.deepEqual(e.source, source); assert.match(e.sourceEntrySha256.en, /^[a-f0-9]{64}$/u);
    assert.deepEqual(e.legacyCompanionReferences, {exampleSwf: `${e.sourceKeyAttribute}.swf`, subLinksEn: ['sum,Sum'], subLinksEs: ['suma,Suma']});
  }
});
test('missing, duplicate, mismatched, unsafe companion and unreviewed entities fail closed', () => {
  for (const mutate of [x => {x.es = x.es.replace(record('Total'), '');},
    x => {x.en += record('Total');}, x => {x.es = x.es.replace('A definition.', 'Changed definition.');},
    x => {x.es = x.es.replace('sum,Sum', 'different,Different');},
    x => {x.en = x.en.replace('ExFileName="Total.swf"', 'ExFileName="https://example.invalid/Total.swf"');},
    x => {x.en = x.en.replace('A definition.', '&unreviewed;');}]) {
    const x = fixture(); mutate(x); assert.throws(() => sourceGlossary(x, source));
  }
});
test('exact AS source operation is not replaced by an arbitrary key, host call, or trailing instruction', () => {
  for (const {sourceKeyAttribute: key} of CONTROLS) {
    const text = `on(release){\n   _global.KeyAttribute = "${key}";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}`;
    validateGlossaryScript(text.replaceAll('\n', '\r\n'), key);
    assert.throws(() => validateGlossaryScript(text + '\ngetURL("https://example.invalid");', key));
    assert.throws(() => validateGlossaryScript(text.replace('DoHyperLinks', 'OtherHost'), key));
  }
});
test('lesson reconciliation requires exact existing solve and adds only multiplication/total without registry changes', async () => {
  const freeze = JSON.parse(await readFile(path.join(ROOT, INPUTS.freeze.path)));
  const existing = freeze.selectedPages.filter(p => p.stableLessonKey === 'shared-nms002-l01').flatMap(p => p.glossaryEntries ?? []);
  const entries = sourceGlossary(fixture(), source).map(entry => entry.id === 'solve' ?
    {...existing.find(e => e.id === 'solve'), sourceEntrySha256: entry.sourceEntrySha256, extractionLfNormalizedEntrySha256: entry.extractionLfNormalizedEntrySha256} : entry);
  assert.deepEqual(reconcileExisting(freeze, entries), {existingUniqueTerms: 20, candidateTerms: 3, overlappingIds: ['solve'],
    proposedAdditionalIds: ['multiplication', 'total'], proposedMergedUniqueTerms: 22, registeredGlossaryChanged: false});
  const changed = structuredClone(entries); changed.find(e => e.id === 'solve').definitions.en = 'Invented';
  assert.throws(() => reconcileExisting(freeze, changed));
});
async function temporary(t) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'p044-glossary-test-')));
  t.after(() => rm(root, {recursive: true, force: true})); return root;
}
test('input reader rejects source traversal, symlink, changed bytes, and hash/size drift', async t => {
  const root = await temporary(t), bytes = Buffer.from('source\n');
  await writeFile(path.join(root, 'source'), bytes); const expected = binding('source', bytes);
  assert.ok((await readBound(root, expected)).bytes.equals(bytes));
  await symlink(path.join(root, 'source'), path.join(root, 'alias'));
  await assert.rejects(readBound(root, {...expected, path: 'alias'}));
  await assert.rejects(readBound(root, {...expected, path: '../source'}));
  await assert.rejects(readBound(root, {...expected, bytes: 1}));
  await writeFile(path.join(root, 'source'), 'changed'); await assert.rejects(readBound(root, expected));
});
test('two-file publisher is exclusive, preserves partial conflicts, and checks without writing', async t => {
  const root = await temporary(t), outputs = [[OUTPUT, Buffer.from('{}\n')], [MODULE, Buffer.from('// fixture\n')]];
  for (const [file] of outputs) await mkdir(path.dirname(path.join(root, file)), {recursive: true});
  assert.equal(await publish(outputs, {root}), 2);
  assert.equal(await publish(outputs, {root, check: true}), 0);
  await assert.rejects(publish(outputs, {root}));
  await assert.rejects(publish([[OUTPUT, Buffer.from('changed')], outputs[1]], {root, check: true}));
  assert.ok((await readFile(path.join(root, OUTPUT))).equals(outputs[0][1]));
});
test('actual source projection plan is write-free when scoped source roots are supplied', async t => {
  if (!process.env.HELP_MATH_G678_SOURCE_ROOT || !process.env.PRIVATE_RECOVERY_CONTAINERS) {
    t.skip('Physical source roots intentionally not defaulted; actual plan is run separately.'); return;
  }
  const result = await build(); assert.equal(result.filesWritten, 0); assert.equal(result.registeredGlossaryChanged, false);
  assert.equal(result.candidateTerms, 3); assert.ok(Object.values(result.acceptanceEffects).every(v => v === false));
});
