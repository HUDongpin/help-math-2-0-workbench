import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {INPUTS, OUTPUT, assertEntryMatchesSource, buildSuccessorGlossary,
  decodeGlossaryText, resolveSourceGlossary} from './build-g678-alg-l11-instructional-successor-glossary.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recoveryRoot = process.env.PRIVATE_RECOVERY_CONTAINERS;
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const load = async (file) => JSON.parse(await readFile(path.join(ROOT, file)));
const live = {skip: !recoveryRoot && 'Exact private recovery root is required for actual XML-byte tests'};
async function sourceContext() {
  const artifact = await load(OUTPUT);
  const xml = {};
  for (const lang of ['en', 'es']) {
    const file = artifact.keyTermSources[lang];
    const bytes = await readFile(path.join(recoveryRoot, file.path));
    assert.equal(bytes.length, file.bytes);
    assert.equal(hash(bytes), file.sha256);
    xml[lang] = bytes.toString('utf8');
  }
  return {artifact, xml, keys: artifact.existingLessonReconciliation.mergedGlossaryEntries.map((entry) => entry.sourceKeyAttribute)};
}

test('projection preserves exact13 memberships and reconciles all33 existing terms into43 without registry changes', async () => {
  const artifact = await load(OUTPUT);
  assert.equal((await lstat(path.join(ROOT, OUTPUT))).mode & 0o222, 0);
  assert.deepEqual(artifact.inputs, INPUTS);
  for (const input of Object.values(INPUTS)) {
    const bytes = await readFile(path.join(ROOT, input.path));
    assert.equal(bytes.length, input.bytes);
    assert.equal(hash(bytes), input.sha256);
  }
  assert.deepEqual(artifact.counts, {successorPages: 13, successorUniqueTerms: 26,
    existingUniqueTerms: 33, mergedUniqueTerms: 43});
  assert.equal(artifact.existingLessonReconciliation.entryOccurrenceCount, 82);
  assert.equal(artifact.existingLessonReconciliation.overlapWithSimpleGlossaryIds.length, 13);
  assert.equal(artifact.existingLessonReconciliation.addedAgainstExistingLessonIds.length, 10);
  assert.ok(artifact.existingLessonReconciliation.uniqueExistingIds.includes('solve'));
  assert.deepEqual(artifact.existingLessonReconciliation.conflicts, []);
  assert.ok(Object.values(artifact.acceptanceEffects).every((value) => value === false));
  for (const member of artifact.members) {
    const config = await load(member.sourceConfig.path);
    assert.deepEqual(member.glossaryEntries.map((entry) => entry.id),
      (config.glossaryEntries ?? config.entries).map((entry) => entry.id));
    for (const entry of member.glossaryEntries) assert.deepEqual(Object.keys(entry),
      ['id', 'sourceKeyAttribute', 'labels', 'definitions', 'source']);
  }
});

test('source comparison rejects changed bilingual labels, definitions and XML provenance', async () => {
  const artifact = await load(OUTPUT);
  const solve = artifact.existingLessonReconciliation.mergedGlossaryEntries.find((entry) => entry.id === 'solve');
  assert.equal(assertEntryMatchesSource(solve, solve), true);
  for (const mutate of [
    (entry) => { entry.labels.es = 'Incorrect label'; },
    (entry) => { entry.definitions.en = 'Source visual distractor'; },
    (entry) => { entry.source.en.sha256 = '0'.repeat(64); },
    (entry) => { entry.id = 'different-id'; },
  ]) {
    const changed = structuredClone(solve); mutate(changed);
    assert.throws(() => assertEntryMatchesSource(changed, solve), /source conflict/u);
  }
  assert.equal(decodeGlossaryText('x &#x2265; 5'), 'x ≥ 5');
  assert.throws(() => decodeGlossaryText('&#60;'), /unsupported source entity/u);
  assert.throws(() => decodeGlossaryText('&#xFFFF;'), /unsupported source entity/u);
});

test('actual recovered XML bytes reproduce the immutable projection exactly', live, async () => {
  const before = await readFile(path.join(ROOT, OUTPUT));
  const result = await buildSuccessorGlossary({check: true, recoveryRoot});
  assert.equal(result.sha256, hash(before));
  assert.deepEqual(await readFile(path.join(ROOT, OUTPUT)), before);
  await assert.rejects(buildSuccessorGlossary({recoveryRoot}), {code: 'EEXIST'});
  assert.deepEqual(await readFile(path.join(ROOT, OUTPUT)), before);
});

test('actual bilingual source records reject duplicates, missing locales and altered definitions', live, async () => {
  const {artifact, xml, keys} = await sourceContext();
  const records = resolveSourceGlossary(xml, keys, artifact.source);
  assert.equal(records.length, 43);
  for (const entry of records) {
    assertEntryMatchesSource(entry, artifact.existingLessonReconciliation.mergedGlossaryEntries.find((row) => row.id === entry.id));
    const binding = artifact.sourceEntryBindings.find((row) => row.id === entry.id);
    assert.deepEqual(binding.sourceEntrySha256, entry.sourceEntrySha256);
    assert.deepEqual(binding.extractionLfNormalizedEntrySha256, entry.extractionLfNormalizedEntrySha256);
  }
  const term = [...xml.en.matchAll(/<([^\s>]+~LNG~[^\s>]+)\s+([^>]*)>([\s\S]*?)<\/\1\s*>/gu)]
    .find((match) => match[1].startsWith('Solve~LNG~') && match[2].includes('ScreenkeyTerm="Solve"'));
  assert.ok(term);
  assert.throws(() => resolveSourceGlossary({...xml, en: xml.en + term[0]}, keys, artifact.source), /ambiguous exact bilingual entry/u);
  assert.throws(() => resolveSourceGlossary({...xml, en: xml.en.replace(term[0], '')}, keys, artifact.source), /missing or ambiguous/u);
  const changed = term[0].replace('To solve the problem', 'To invent a different definition');
  assert.notEqual(changed, term[0]);
  assert.throws(() => resolveSourceGlossary({...xml, en: xml.en.replace(term[0], changed)}, keys, artifact.source), /bilingual source definition\/label disagreement/u);
  const less = records.find((entry) => entry.id === 'less-than');
  assert.notEqual(less.sourceEntrySha256.en, less.extractionLfNormalizedEntrySha256.en);
  assert.equal(less.sourceEntrySha256.en, 'deec3068d8a8338e4a3ce7950333b880580d739a9e323ff8f5ae712d84b58694');
  assert.equal(less.extractionLfNormalizedEntrySha256.en, '971947cc52bb02c0e5aac2ba3a1cbe9d1a87f2d369783af6e67754e6c4596996');
});
