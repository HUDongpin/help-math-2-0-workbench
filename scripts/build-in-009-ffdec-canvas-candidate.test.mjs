import assert from 'node:assert/strict';
import {execFile as execFileCallback} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {createContext, Script} from 'node:vm';

import {
  buildSafeRuntime,
  captureRootFromImplementationCaptureAdoption,
  currentJavascriptCandidateReportFingerprint,
  generateIn009CanvasCandidate,
  parseArguments,
  resolveCandidateFrameState,
  validateCandidateEvidence,
  validateCurrentImplementationCaptureAdoption,
  validateIn009CurrentJavascriptCandidateReport,
  validateOwnerHostLocalizationContract,
  validateRootRuntimeBaseline
} from './build-in-009-ffdec-canvas-candidate.mjs';

const execFile = promisify(execFileCallback);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_PATH = path.join(
  ROOT,
  'migrations/course-g04-l03-in-009/audit/canvas-candidate-spec.json'
);

async function loadInputs() {
  const spec = JSON.parse(await readFile(SPEC_PATH, 'utf8'));
  const [helperSource, framesHtml, scenarioInventory, audioAudit, rootBaseline, ownerContract] = await Promise.all([
    readFile(path.join(ROOT, spec.ffdecExport.helper), 'utf8'),
    readFile(path.join(ROOT, spec.ffdecExport.framesHtml), 'utf8'),
    readFile(path.join(ROOT, spec.evidence.scenarioInventory), 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, spec.evidence.audioAudit), 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, spec.evidence.rootRuntimeBaseline), 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, spec.evidence.ownerHostLocalizationContract), 'utf8').then(JSON.parse)
  ]);
  const rootFrameAssets = await Promise.all(
    rootBaseline.frames.map(async (entry) => ({
      frame: entry.frame,
      file: entry.file,
      path: path.posix.join(spec.evidence.rootRuntimeFrameArchive, entry.file),
      sha256: entry.sha256,
      bytes: await readFile(path.join(ROOT, spec.evidence.rootRuntimeFrameArchive, entry.file))
    }))
  );
  const parsed = await execFile('python3', [
    path.join(ROOT, spec.evidence.placementParser),
    '--swfmill',
    path.join(ROOT, spec.evidence.swfmillXml),
    '--object-id',
    '200',
    '--placement-name',
    'animation'
  ]);
  return {
    spec,
    helperSource,
    framesHtml,
    scenarioInventory,
    audioAudit,
    rootBaseline,
    ownerContract,
    rootFrameAssets,
    placement: JSON.parse(parsed.stdout)
  };
}

test('IN09 candidate CLI is explicit and rejects unknown arguments', () => {
  assert.deepEqual(parseArguments(['--check'], {root: ROOT}), {
    check: true,
    specPath: SPEC_PATH
  });
  assert.throws(() => parseArguments(['--spec'], {root: ROOT}), /requires a path/);
  assert.throws(() => parseArguments(['--unknown'], {root: ROOT}), /Unknown argument/);
});

test('IN009 candidate reuses the shared capture validator and rejects stale or tampered adoption paths', async () => {
  const adoption = {
    animationId: 'course-g04-l03-in-009',
    requirements: [
      'req-root-root-standalone-en',
      'req-root-root-standalone-es',
      'req-sprite-200-default-en',
      'req-sprite-200-default-es'
    ].map((directory) => ({
      captureManifest: {
        path: `output/playwright/in009-fresh/${directory}/capture-manifest.json`
      }
    }))
  };
  assert.equal(
    captureRootFromImplementationCaptureAdoption(ROOT, adoption),
    path.join(ROOT, 'output/playwright/in009-fresh')
  );

  const calls = [];
  const validated = await validateCurrentImplementationCaptureAdoption({
    root: ROOT,
    adoption,
    runAdoptionValidator: async (options) => {
      calls.push(options);
      return {
        animationId: 'course-g04-l03-in-009',
        mode: 'check',
        requirementCount: 4,
        declaredRequirementCount: 4,
        missingRequirementCount: 0,
        capturedFrameCount: 1294,
        strictAcceptanceChanged: false
      };
    }
  });
  assert.equal(validated.captureRoot, path.join(ROOT, 'output/playwright/in009-fresh'));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].check, true);
  assert.equal(calls[0].allowPartial, false);
  assert.equal(calls[0].invalidateCurrentJsApproval, false);

  await assert.rejects(
    validateCurrentImplementationCaptureAdoption({
      root: ROOT,
      adoption,
      runAdoptionValidator: async () => {
        throw new Error(
          'implementationArtifactClosure.algorithm must be sha256-canonical-artifact-and-projection-rows-v2'
        );
      }
    }),
    /implementationArtifactClosure\.algorithm must be .*v2/
  );

  const traversal = structuredClone(adoption);
  traversal.requirements[0].captureManifest.path = '../capture-manifest.json';
  assert.throws(
    () => captureRootFromImplementationCaptureAdoption(ROOT, traversal),
    /escapes project root/
  );

  const splitRoot = structuredClone(adoption);
  splitRoot.requirements[3].captureManifest.path =
    'output/playwright/in009-other/req-sprite-200-default-es/capture-manifest.json';
  assert.throws(
    () => captureRootFromImplementationCaptureAdoption(ROOT, splitRoot),
    /do not share one capture root/
  );
});

test('ElementTree parser proves the root placement and 637-frame sprite boundary', async () => {
  const {spec, scenarioInventory, audioAudit, placement} = await loadInputs();
  const evidence = validateCandidateEvidence(spec, scenarioInventory, audioAudit, placement);
  assert.equal(placement.parser, 'python-xml.etree.ElementTree');
  assert.deepEqual(placement.rootPlacement.translationPixels, {x: 413.4, y: 283.3});
  assert.equal(placement.targetSprite.frameCount, 637);
  assert.equal(evidence.local.timelineId, 'sprite-200');
  assert.equal(evidence.stream.firstBlockFrame, 7);
  assert.equal(evidence.external.startFrame, null);

  const mutated = structuredClone(scenarioInventory);
  mutated.timelineInventory.find((entry) => entry.timelineId === 'sprite-200').controlStates.at(-1).reasons.push('script-stop-state');
  assert.throws(
    () => validateCandidateEvidence(spec, mutated, audioAudit, placement),
    /terminal frame unexpectedly stops/
  );
});

test('pure candidate state renders the shared untranslated visual for both routes and fails closed only for unsupported behavior', async () => {
  const {spec} = await loadInputs();
  assert.deepEqual(resolveCandidateFrameState({frame: 637, scenario: 'default', lang: 'en', seed: -1}, spec), {
    frameDomain: 'sprite-200',
    localFrame: 637,
    exportFrame: 636,
    rootFrame: 6,
    rootState: 'stopped-at-begin-while-child-plays',
    scenario: 'default',
    lang: 'en',
    seed: 4294967295,
    renderable: true,
    blocker: null,
    visualBranchIndependent: true,
    visualLocalizationStatus: 'source-shared-untranslated-visual',
    audioLocalizationStatus: 'unresolved',
    audioRendered: false
  });
  const spanish = resolveCandidateFrameState(
    {frame: 637, scenario: 'default', lang: 'es', seed: -1},
    spec
  );
  assert.equal(spanish.renderable, true);
  assert.equal(spanish.blocker, null);
  assert.equal(spanish.visualLocalizationStatus, 'source-shared-untranslated-visual');
  assert.equal(spanish.audioLocalizationStatus, 'unresolved');
  assert.equal(spanish.audioRendered, false);
  assert.deepEqual({...spanish, lang: 'en'}, resolveCandidateFrameState(
    {frame: 637, scenario: 'default', lang: 'en', seed: -1},
    spec
  ));
  assert.deepEqual(
    resolveCandidateFrameState(
      {frame: 10, frameDomain: 'root', scenario: 'root-standalone', lang: 'en', seed: 0},
      spec
    ),
    {
      frameDomain: 'root',
      localFrame: 10,
      exportFrame: null,
      rootFrame: 10,
      rootState: 'direct-frame-accurate-only',
      scenario: 'root-standalone',
      lang: 'en',
      seed: 0,
      renderable: true,
      blocker: null,
      visualBranchIndependent: true,
      visualLocalizationStatus: 'source-shared-untranslated-visual',
      audioLocalizationStatus: 'unresolved',
      audioRendered: false
    }
  );
  assert.equal(resolveCandidateFrameState(
    {frame: 1, frameDomain: 'root', scenario: 'root-standalone', lang: 'es', seed: 0},
    spec
  ).renderable, true);
  assert.equal(
    resolveCandidateFrameState(
      {frame: 1, frameDomain: 'root', scenario: 'default', lang: 'en', seed: 0},
      spec
    ).blocker,
    'frame-domain-scenario-mismatch'
  );
  assert.equal(
    resolveCandidateFrameState({frame: 142, scenario: 'glossary-temperature-unavailable', lang: 'en', seed: 1}, spec).renderable,
    false
  );
  assert.equal(
    resolveCandidateFrameState({frame: 142, scenario: 'glossary-measure-unavailable', lang: 'en', seed: 2}, spec).blocker,
    'measure-glossary-host-contract-unresolved'
  );
  assert.throws(() => resolveCandidateFrameState({frame: 638}, spec), /within 1\.\.637 for sprite-200/);
  assert.throws(
    () =>
      resolveCandidateFrameState(
        {frame: 11, frameDomain: 'root', scenario: 'root-standalone'},
        spec
      ),
    /within 1\.\.10 for root/
  );
});

test('Spanish visual rendering is bound only to the static owner host/localization contract', async () => {
  const {spec, ownerContract} = await loadInputs();
  const validated = validateOwnerHostLocalizationContract(spec, ownerContract);
  assert.equal(
    validated.sourceConclusions.childVisualLocalization.status,
    'source-shared-untranslated-visual'
  );
  assert.equal(validated.authority.authorizedOriginalRuntimeExecuted, false);
  assert.equal(validated.authority.audioListened, false);
  assert.equal(validated.authority.humanAccepted, false);
  assert.equal(validated.authority.ownerAccepted, false);
  assert.equal(validated.strictDisposition.strictAcceptanceEffect, 'none');

  const promoted = structuredClone(ownerContract);
  promoted.authority.audioListened = true;
  assert.throws(
    () => validateOwnerHostLocalizationContract(spec, promoted),
    /fail-closed authority boundary changed/
  );
  const translated = structuredClone(ownerContract);
  translated.sourceConclusions.childVisualLocalization.status = 'translated-spanish-visual';
  assert.throws(
    () => validateOwnerHostLocalizationContract(spec, translated),
    /shared untranslated visual finding changed/
  );
});

test('hash-pinned FFDec export becomes a no-network, no-eval, no-ticker runtime', async () => {
  const inputs = await loadInputs();
  validateRootRuntimeBaseline(inputs.spec, inputs.rootBaseline, inputs.rootFrameAssets);
  const built = buildSafeRuntime(inputs);
  assert.equal(built.metadata.sourceSwfSha256, inputs.spec.source.swfSha256);
  assert.equal(built.metadata.deterministicContentTimeline.frameCount, 637);
  assert.equal(built.metadata.rootTimeline.frameCount, 10);
  assert.equal(built.metadata.rootTimeline.naturalPlaybackClaimed, false);
  assert.equal(built.metadata.audioRendering, 'not-included');
  assert.deepEqual(built.metadata.sourceProvenVisualLanguages, ['en']);
  assert.deepEqual(built.metadata.renderableRouteLanguages, ['en', 'es']);
  assert.deepEqual(built.metadata.blockedLanguages, []);
  assert.equal(
    built.metadata.visualLocalizationStatus,
    'source-shared-untranslated-visual'
  );
  assert.equal(built.metadata.spanishVisualTranslationClaimed, false);
  assert.equal(built.metadata.bilingualVisualParityClaimed, false);
  assert.equal(built.placedFunctions.length, 182);
  assert.deepEqual(built.images, inputs.spec.ffdecExport.embeddedImageVariables);
  assert.deepEqual(
    built.rootImages.map(({sha256, frames}) => ({sha256, frames})),
    [
      {sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea', frames: [1, 2, 3, 4, 5]},
      {sha256: 'fdd35125be812492c613223108cf2f94c7c122070aae4a99550bd2c5f8a70de3', frames: [6, 7, 8]},
      {sha256: 'ce048fe682d277fd0344a10fda834ef40c5a8297339d09b557d7a3ed7f815221', frames: [9]},
      {sha256: '62851ab1681ed8392daf40b8d9a553249f3805ba0a354dd1fefe4934f2a70ab2', frames: [10]}
    ]
  );
  assert.match(built.runtime, /SAFE_OBJECTS = Object\.freeze/);
  assert.match(built.runtime, /var MASK_RENDER_DEPTH = 0;/);
  assert.match(built.runtime, /MASK_RENDER_DEPTH > 0 && transformedAlpha > 0 \? 1/);
  assert.equal(
    (built.runtime.match(/MASK_RENDER_DEPTH \+= 1;/g) ?? []).length,
    inputs.spec.ffdecExport.maskRenderBlockCount
  );
  assert.equal(
    (built.runtime.match(/MASK_RENDER_DEPTH -= 1;/g) ?? []).length,
    inputs.spec.ffdecExport.maskRenderBlockCount
  );
  assert.match(built.runtime, /data-flash-frame-domain/);
  assert.match(built.runtime, /data-visual-localization-status/);
  assert.match(built.runtime, /data-audio-rendered/);
  assert.match(built.runtime, /ROOT_FRAME_IMAGES/);
  assert.match(built.runtime, /ctx\.drawImage\(rootImage,0,0,800,600\)/);
  assert.doesNotMatch(built.runtime, /\beval\s*\(/);
  assert.doesNotMatch(built.runtime, /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/);
  assert.doesNotMatch(built.runtime, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/);
  assert.doesNotMatch(built.runtime, /document\.body|addEventListener\s*\(/);

  assert.throws(
    () =>
      buildSafeRuntime({
        ...inputs,
        framesHtml: inputs.framesHtml.replace(
          'var scalingGrids = {};',
          'var scalingGrids = {};\nvar injected = "https://invalid.example";'
        )
      }),
    /external URL/
  );

  const context = createContext({
    document: {
      createElement(kind) {
        assert.equal(kind, 'img');
        return {complete: true, naturalWidth: 1, src: ''};
      }
    }
  });
  new Script(built.runtime).runInContext(context);
  const asset = context.HELP_MATH_CANVAS_ASSETS['course-g04-l03-in-009'];
  const english = asset.resolveFrameState({
    frame: 637,
    frameDomain: 'sprite-200',
    scenario: 'default',
    lang: 'en',
    seed: 0
  });
  const spanish = asset.resolveFrameState({
    frame: 637,
    frameDomain: 'sprite-200',
    scenario: 'default',
    lang: 'es',
    seed: 0
  });
  assert.equal(spanish.renderable, true);
  assert.equal(spanish.audioRendered, false);
  assert.equal(spanish.visualLocalizationStatus, 'source-shared-untranslated-visual');
  assert.deepEqual(
    JSON.parse(JSON.stringify({...spanish, lang: 'en'})),
    JSON.parse(JSON.stringify(english))
  );
  assert.equal(
    asset.resolveFrameState({
      frame: 142,
      frameDomain: 'sprite-200',
      scenario: 'glossary-temperature-unavailable',
      lang: 'es',
      seed: 0
    }).blocker,
    'temperature-glossary-host-contract-unresolved'
  );
});

test('checked-in IN09 Canvas candidate is deterministic and current', async () => {
  const result = await generateIn009CanvasCandidate({
    root: ROOT,
    specPath: SPEC_PATH,
    check: true
  });
  assert.equal(result.animationId, 'course-g04-l03-in-009');
  assert.equal(result.localFrames, 637);
  assert.equal(result.rootFrames, 10);
  assert.equal(result.strictAcceptanceEffect, 'none');
});

test('IN009 canonical candidate report is fingerprinted, hash-bound, and acceptance-neutral', async () => {
  const first = await generateIn009CanvasCandidate({
    root: ROOT,
    specPath: SPEC_PATH,
    check: true
  });
  const second = await generateIn009CanvasCandidate({
    root: ROOT,
    specPath: SPEC_PATH,
    check: true
  });
  assert.equal(
    first.candidateReport.fingerprintSha256,
    second.candidateReport.fingerprintSha256
  );
  assert.equal(
    first.report.reportFingerprintSha256,
    currentJavascriptCandidateReportFingerprint(first.report)
  );
  assert.equal(first.report.reportType, 'current-javascript-engineering-candidate');
  assert.equal(first.report.disposition.currentJavaScriptCandidate, true);
  assert.equal(first.report.disposition.strictLedgerChanged, false);
  assert.equal(first.report.disposition.publicLibraryAdmitted, false);
  assert.equal(first.report.candidateRenderability.implementationCapture.capturedFrameCount, 1294);
  assert.ok(Object.values(first.report.authorization).every((value) => value === false));
  assert.ok(Object.values(first.report.acceptance).every((value) => value === false));
  assert.equal(first.report.strictAcceptanceEffect, 'none');
  validateIn009CurrentJavascriptCandidateReport(
    first.report,
    first.validationContext
  );

  const outputTamper = structuredClone(first.report);
  outputTamper.outputs.canvasRuntime.sha256 = '0'.repeat(64);
  outputTamper.reportFingerprintSha256 =
    currentJavascriptCandidateReportFingerprint(outputTamper);
  assert.throws(
    () =>
      validateIn009CurrentJavascriptCandidateReport(
        outputTamper,
        first.validationContext
      ),
    /Canvas runtime: file binding changed/
  );

  const inputTamper = structuredClone(first.report);
  inputTamper.integrationBindings[1].sha256 = '1'.repeat(64);
  inputTamper.reportFingerprintSha256 =
    currentJavascriptCandidateReportFingerprint(inputTamper);
  assert.throws(
    () =>
      validateIn009CurrentJavascriptCandidateReport(
        inputTamper,
        first.validationContext
      ),
    /integration binding changed/
  );

  const promoted = structuredClone(first.report);
  promoted.acceptance.strictMigrationComplete = true;
  promoted.reportFingerprintSha256 =
    currentJavascriptCandidateReportFingerprint(promoted);
  assert.throws(
    () =>
      validateIn009CurrentJavascriptCandidateReport(
        promoted,
        first.validationContext
      ),
    /acceptance was promoted/
  );
});
