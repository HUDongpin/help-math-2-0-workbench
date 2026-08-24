import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');

test('G4 L5 six-page predecessor freeze remains preserved and acceptance-neutral', async () => {
  const freeze = JSON.parse(await readFile(new URL(
    '../catalog/product-bridge-calibrations/g4-l5-ffdec-product-factory-v2.json',
    import.meta.url,
  ), 'utf8'));
  assert.deepEqual(freeze.selectedOccurrences, [2, 11, 30, 37, 43, 52]);
  assert.equal(freeze.pageOnlyScope.activePageCount, 53);
  assert.equal(freeze.pageOnlyScope.legacyCourseShellCount, 0);
  assert.equal(freeze.pageOnlyScope.selectedCurrentJsCount, 6);
  assert.equal(freeze.pageOnlyScope.remainingCurrentJsCount, 47);
  assert.equal(freeze.sourceSequence.length, 53);
  assert.deepEqual(
    freeze.sourceSequence.map((page) => page.sourceOccurrence),
    Array.from({length: 53}, (_, index) => index + 1),
  );
  assert.equal(freeze.audioMaterialization.length, 4);
  assert.ok(
    Object.values(freeze.acceptanceEffects).every((value) => value === false),
  );
  assert.equal(
    freeze.licensingBoundary.compilerEvidence,
    'private-evidence-only-not-bundled',
  );
  const adapter = await readFile(
    new URL('../packages/demos/src/g4-l5-product-candidate.tsx', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(adapter, /ffdec|p-code|GPL/iu);
  for (const audio of freeze.audioMaterialization) {
    const bytes = await readFile(
      new URL(`../${audio.destinationPath}`, import.meta.url),
    );
    assert.equal(bytes.byteLength, audio.bytes);
    assert.equal(sha256(bytes), audio.sha256);
    assert.equal(audio.spokenLanguage, 'undetermined');
    assert.equal(audio.acceptanceEffect, 'none');
  }
});
