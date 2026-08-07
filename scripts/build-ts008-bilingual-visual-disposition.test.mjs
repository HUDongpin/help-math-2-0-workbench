import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  SOURCE_SHARED_VISUAL_LOCALIZATION,
  TS008_OUTPUT,
  buildTs008BilingualVisualDisposition,
  serializeTs008BilingualVisualDisposition,
  validateTs008SourceSharedVisualInputs
} from './build-ts008-bilingual-visual-disposition.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationRoot = path.join(root, 'migrations/course-g03-l01-ts-008');

async function loadInputs() {
  const [ffdecBytes, scenarioInventory] = await Promise.all([
    readFile(path.join(migrationRoot, 'audit/machine/ffdec-scripts.txt.gz')),
    readFile(path.join(migrationRoot, 'audit/scenario-inventory.json'), 'utf8')
      .then(JSON.parse)
  ]);
  return {
    ffdecText: gunzipSync(ffdecBytes).toString('utf8'),
    scenarioInventory
  };
}

test('TS008 source evidence proves only an untranslated source-shared visual', async () => {
  const validated = validateTs008SourceSharedVisualInputs(await loadInputs());
  assert.equal(validated.root.frameCount, 10);
  assert.equal(validated.main.frameCount, 747);
  assert.equal(validated.scriptBlockCount, 86);
  assert.deepEqual(validated.languageSensitiveActionScriptMatches, []);
  assert.deepEqual(validated.editTexts, []);
  assert.deepEqual(validated.dependencyBindings, []);
  assert.deepEqual(validated.languageFlashVars, []);
  assert.equal(validated.subpage.attributes.EngSubTitleName, 'Question 2');
  assert.equal(validated.subpage.attributes.SpanSubTitleName, 'Pregunta 2');
});

test('TS008 disposition fails closed on language-sensitive source drift', async () => {
  const inputs = await loadInputs();
  assert.throws(
    () => validateTs008SourceSharedVisualInputs({
      ...inputs,
      ffdecText: `${inputs.ffdecText}\nif (_root.language == "Spanish") { stop(); }\n`
    }),
    /language-sensitive branch/
  );

  const withEditText = structuredClone(inputs.scenarioInventory);
  withEditText.interactions.editTexts.push({objectId: '999'});
  assert.throws(
    () => validateTs008SourceSharedVisualInputs({
      ffdecText: inputs.ffdecText,
      scenarioInventory: withEditText
    }),
    /dynamic EditText/
  );
});

test('TS008 generated disposition binds 757 frames without promoting acceptance', async () => {
  const report = await buildTs008BilingualVisualDisposition();
  assert.equal(report.status, 'verified-source-shared-untranslated-visual');
  assert.equal(
    report.implementationDisposition.visualLocalization,
    SOURCE_SHARED_VISUAL_LOCALIZATION
  );
  assert.equal(report.implementationDisposition.newlyRenderableFrameCount, 757);
  assert.deepEqual(
    report.implementationDisposition.sourceSharedRequirements.map(
      ({requirementId, frameCount}) => [requirementId, frameCount]
    ),
    [
      ['req:root:root-standalone:es', 10],
      ['req:sprite-348:source-drawing-default:es', 747]
    ]
  );
  assert.equal(report.implementationDisposition.audioRendered, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.match(report.strictAcceptanceEffect, /^none;/);

  const checkedIn = await readFile(path.join(root, TS008_OUTPUT), 'utf8');
  assert.equal(checkedIn, serializeTs008BilingualVisualDisposition(report));
});
