import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';

import {
  GS002_OUTPUT,
  GS002_SOURCE_SHARED_REQUIREMENT,
  GS002_VISUAL_LOCALIZATION,
  buildGs002RootBilingualVisualDisposition,
  serializeGs002RootBilingualVisualDisposition,
  validateGs002RootBilingualInputs
} from './build-gs002-root-bilingual-visual-disposition.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationRoot = path.join(root, 'migrations/course-g04-l09-gs-002');

async function loadInputs() {
  const [
    ffdecBytes,
    scenarioInventory,
    rootStructuralReport,
    spriteCanvasAdapterSpec
  ] = await Promise.all([
    readFile(path.join(migrationRoot, 'audit/machine/ffdec-scripts.txt.gz')),
    readFile(path.join(migrationRoot, 'audit/scenario-inventory.json'), 'utf8').then(JSON.parse),
    readFile(path.join(migrationRoot, 'baseline/ffdec-root-frames.json'), 'utf8').then(JSON.parse),
    readFile(path.join(migrationRoot, 'audit/canvas-adapter-spec.json'), 'utf8').then(JSON.parse)
  ]);
  return {
    ffdecText: gunzipSync(ffdecBytes).toString('utf8'),
    scenarioInventory,
    rootStructuralReport,
    spriteCanvasAdapterSpec
  };
}

test('GS002 source evidence proves only root source-shared untranslated pixels', async () => {
  const validated = validateGs002RootBilingualInputs(await loadInputs());
  assert.equal(validated.rootTimeline.frameCount, 10);
  assert.equal(validated.spriteTimeline.frameCount, 653);
  assert.equal(validated.scriptBlockCount, 66);
  assert.deepEqual(validated.languageSensitiveActionScriptMatches, []);
  assert.equal(validated.gsSection.pages[0].path, 'GS/L9GS02.swf');
  assert.equal(validated.gsSection.titles.english, 'Play It');
  assert.equal(validated.gsSection.titles.spanish, 'Juégalo');
});

test('GS002 disposition rejects language drift and an ES sprite-adapter scope leak', async () => {
  const inputs = await loadInputs();
  assert.throws(
    () =>
      validateGs002RootBilingualInputs({
        ...inputs,
        ffdecText: `${inputs.ffdecText}\nif (_root.language == "Spanish") { stop(); }\n`
      }),
    /language-sensitive branch/
  );

  const leaked = structuredClone(inputs.spriteCanvasAdapterSpec);
  leaked.runtimeContract.supportedLanguages = ['en', 'es'];
  leaked.runtimeContract.visualLocalization = GS002_VISUAL_LOCALIZATION;
  assert.throws(
    () =>
      validateGs002RootBilingualInputs({
        ...inputs,
        spriteCanvasAdapterSpec: leaked
      }),
    /remain English-only/
  );
});

test('GS002 generated disposition advances only ten ES root frames and no acceptance gate', async () => {
  const report = await buildGs002RootBilingualVisualDisposition();
  assert.equal(report.status, 'verified-root-source-shared-untranslated-visual');
  assert.deepEqual(
    report.implementationDisposition.sourceSharedRequirements,
    [GS002_SOURCE_SHARED_REQUIREMENT]
  );
  assert.equal(report.implementationDisposition.newlyRenderableFrameCount, 10);
  assert.deepEqual(
    report.implementationDisposition.rootFrameAdapter.supportedLanguages,
    ['en', 'es']
  );
  assert.equal(
    report.implementationDisposition.rootFrameAdapter.visualClassification,
    GS002_VISUAL_LOCALIZATION
  );
  assert.deepEqual(
    report.implementationDisposition.spriteCanvasAdapter.supportedLanguages,
    ['en']
  );
  assert.equal(
    report.implementationDisposition.spriteCanvasAdapter.spanishLeadInFrames1Through641Ready,
    false
  );
  assert.equal(report.implementationDisposition.spriteCanvasAdapter.frame642Ready, false);
  assert.equal(
    report.implementationDisposition.spriteCanvasAdapter.frames643Through653Ready,
    false
  );
  assert.equal(report.implementationDisposition.audioRendered, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.match(report.strictAcceptanceEffect, /^none;/);

  const checkedIn = await readFile(path.join(root, GS002_OUTPUT), 'utf8');
  assert.equal(checkedIn, serializeGs002RootBilingualVisualDisposition(report));
});
