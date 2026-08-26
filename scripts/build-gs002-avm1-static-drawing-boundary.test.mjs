import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';

import {
  OUTPUT_PATH,
  buildGs002Avm1StaticDrawingBoundary,
  serializeGs002Avm1StaticDrawingBoundary,
  validateStaticDrawingBoundary
} from './build-gs002-avm1-static-drawing-boundary.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationRoot = path.join(root, 'migrations/course-g04-l09-gs-002');

async function loadBoundaryInputs() {
  const [ffdecBytes, scenarioInventory, canvasAdapterSpec, canvasManifest, rendererAudit] =
    await Promise.all([
      readFile(path.join(migrationRoot, 'audit/machine/ffdec-scripts.txt.gz')),
      readFile(path.join(migrationRoot, 'audit/scenario-inventory.json'), 'utf8').then(JSON.parse),
      readFile(path.join(migrationRoot, 'audit/canvas-adapter-spec.json'), 'utf8').then(JSON.parse),
      readFile(
        path.join(root, 'public/flash-assets/courses/course-g04-l09-gs-002/manifest.json'),
        'utf8'
      ).then(JSON.parse),
      readFile(path.join(migrationRoot, 'audit/renderer-frame-domain-support.json'), 'utf8').then(JSON.parse)
    ]);
  return {
    ffdecText: gunzipSync(ffdecBytes).toString('utf8'),
    scenarioInventory,
    canvasAdapterSpec,
    canvasManifest,
    rendererAudit
  };
}

test('GS002 frame 642-653 source scripts prove the static drawing/natural state boundary', async () => {
  const facts = validateStaticDrawingBoundary(await loadBoundaryInputs());
  assert.equal(facts.scriptBlockCount, 66);
  assert.match(facts.frame642.sha256, /^[a-f0-9]{64}$/);
  assert.equal(facts.questionScripts.length, 10);
  assert.deepEqual(
    facts.questionScripts.map(({frame}) => frame),
    [643, 644, 645, 646, 647, 648, 649, 650, 651, 652]
  );
  assert.match(facts.frame653.sha256, /^[a-f0-9]{64}$/);
});

test('GS002 boundary rejects loss of the frame-642 hide/random initialization facts', async () => {
  const inputs = await loadBoundaryInputs();
  const withoutPopupHide = {
    ...inputs,
    ffdecText: inputs.ffdecText.replace('Mc_Popup._visible = false;', 'Mc_Popup._visible = true;')
  };
  assert.throws(
    () => validateStaticDrawingBoundary(withoutPopupHide),
    /Mc_Popup\._visible = false/
  );

  const withoutRandom = {
    ...inputs,
    ffdecText: inputs.ffdecText.replace(
      '_loc1_.tempQNo = random(_loc1_.quizLabelArray.length);',
      '_loc1_.tempQNo = 0;'
    )
  };
  assert.throws(() => validateStaticDrawingBoundary(withoutRandom), /random/);
});

test('GS002 boundary rejects any static adapter claim that AVM1 executes or frame 653 is ready', async () => {
  const inputs = await loadBoundaryInputs();
  const executesAvm1 = structuredClone(inputs.canvasManifest);
  executesAvm1.safety.noLegacyActionScriptExecuted = false;
  assert.throws(
    () => validateStaticDrawingBoundary({...inputs, canvasManifest: executesAvm1}),
    /static\/no-AVM1 authority boundary/
  );

  const rendererLeak = structuredClone(inputs.rendererAudit);
  const terminal = rendererLeak.probes.find(
    ({request}) =>
      request.frameDomain === 'sprite-787' &&
      request.scenario === 'source-drawing-lead-in' &&
      request.language === 'en' &&
      request.frame === 653
  );
  terminal.outcome = 'renderable-exact';
  rendererLeak.summary.renderableCount += 1;
  rendererLeak.summary.blockedCount -= 1;
  assert.throws(
    () => validateStaticDrawingBoundary({...inputs, rendererAudit: rendererLeak}),
    /5 renderable \/ 23 blocked/
  );
});

test('GS002 checked-in boundary preserves current renderer and capture closure without acceptance', async () => {
  const report = await buildGs002Avm1StaticDrawingBoundary();
  assert.equal(report.status, 'verified-static-drawing-is-not-natural-game-state');
  assert.deepEqual(report.authorityBoundary.avm1DependentUnresolvedRange, {
    firstFrame: 642,
    lastFrame: 653
  });
  assert.deepEqual(report.rendererProbeSnapshot, {
    probeCount: 28,
    exactIdentityCount: 28,
    renderableCount: 5,
    blockedCount: 23,
    implementationChangedByThisAudit: false
  });
  assert.equal(report.captureClosureSnapshot.requirementCount, 3);
  assert.equal(report.captureClosureSnapshot.capturedFrameCount, 661);
  assert.equal(report.captureClosureSnapshot.captures.length, 3);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.match(report.strictAcceptanceEffect, /^none;/);

  const checkedIn = await readFile(path.join(root, OUTPUT_PATH), 'utf8');
  assert.equal(checkedIn, serializeGs002Avm1StaticDrawingBoundary(report));
});

