import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import animationModule, {
  buildCourseG05L13Rw002CaptureAttributes
} from '../src/modules/course-g05-l13-rw-002';
import {loadAnimationModule} from '../src/animation-registry';
import {
  COURSE_G05_L13_RW_002_MOVIE,
  COURSE_G05_L13_RW_002_EN_TRACE_SPEC,
  COURSE_G05_L13_RW_002_ES_TRACE_SPEC,
  COURSE_G05_L13_RW_002_ROOT_FRAME_ASSETS,
  COURSE_G05_L13_RW_002_RUNTIME,
  COURSE_G05_L13_RW_002_SCENARIOS,
  COURSE_G05_L13_RW_002_SOURCE,
  COURSE_G05_L13_RW_002_VISUAL_LOCALIZATION,
  getCourseG05L13Rw002FrameState,
  normalizeCourseG05L13Rw002RootFrame
} from '../src/timelines/course-g05-l13-rw-002';

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const rw002PredecessorReceiptPath =
  'migrations/course-g05-l13-rw-002/evidence/source-routed-spanish-audio-product-qa.json';
const rw002PredecessorReceiptSha256 =
  '36bde91455ac750990e50ee18ae42c2d13be24c84ee58f3284034eba09628652';
const rw002BindingSuccessorR1Path =
  'migrations/course-g05-l13-rw-002/evidence/current-javascript-shared-runtime-binding-successor-2026-08-01-r1.json';
const rw002BindingSuccessorR1Sha256 =
  'f879c1d1c225247ab6186c05a752e79f51d451f84c4710e7bdf6e6cc358346e4';
const rw002BindingSuccessorR2Path =
  'migrations/course-g05-l13-rw-002/evidence/current-javascript-shared-runtime-binding-successor-2026-08-07-r2.json';
const rw002BindingSuccessorR2Bytes = 10220;
const rw002BindingSuccessorR2Sha256 =
  'f49840ffd75fddcedeaac6db6b952e865da335e68182a133885fa024d05f82f8';
const rw002BindingSuccessorR2StaleRoles = [
  'englishSourceSchedule',
  'productQaContractTest',
  'productRuntime',
  'runtimeContract',
  'spanishSourceSchedule',
  'timeline'
] as const;
const rw002SuccessorDriftRoles = new Set([
  'englishSourceSchedule',
  'productRuntime',
  'runtimeContract',
  'runtimeHelpers',
  'productQaContractTest',
  'spanishSourceSchedule',
  'timeline'
]);

test('RW002 candidate is bound to the preserved source and distinct root/local domains', async () => {
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G05_L13_RW_002_SOURCE.swf}`)),
    COURSE_G05_L13_RW_002_SOURCE.swfSha256
  );
  assert.deepEqual(COURSE_G05_L13_RW_002_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G05_L13_RW_002_MOVIE.fps, 12);
  assert.equal(COURSE_G05_L13_RW_002_MOVIE.frameCount, 1873);
  assert.equal(COURSE_G05_L13_RW_002_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G05_L13_RW_002_RUNTIME.defaultFrameDomain, 'sprite-334');
  assert.deepEqual(COURSE_G05_L13_RW_002_RUNTIME.frameDomains, [
    {id: 'sprite-334', frameCount: 1873, rootFrame: 6}
  ]);
  assert.equal(animationModule.runtime, COURSE_G05_L13_RW_002_RUNTIME);
  assert.equal(animationModule.playbackEndFrame, 673);
  assert.deepEqual(animationModule.playbackEndFrameByDomain, {root: 1, 'sprite-334': 673});
  assert.equal(animationModule.reducedMotionFrame, 673);
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G05_L13_RW_002_EN_TRACE_SPEC.path}`)),
    COURSE_G05_L13_RW_002_EN_TRACE_SPEC.sha256
  );
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G05_L13_RW_002_ES_TRACE_SPEC.path}`)),
    COURSE_G05_L13_RW_002_ES_TRACE_SPEC.sha256
  );
});

test('RW002 local state exposes the source-shared untranslated drawing in en/es without claiming execution', () => {
  const firstStop = getCourseG05L13Rw002FrameState(673, {lang: 'en', seed: 0});
  const afterStop = getCourseG05L13Rw002FrameState(674, {lang: 'en', seed: 0});
  const lateChild = getCourseG05L13Rw002FrameState(1872, {lang: 'en', seed: 0});
  const terminal = getCourseG05L13Rw002FrameState(1873, {lang: 'en', seed: 0});
  assert.equal(firstStop.exportFrame, 672);
  assert.equal(firstStop.status, 'ready');
  assert.equal(firstStop.blocker, null);
  assert.deepEqual(firstStop.staticAddressableRange, {firstFrame: 1, lastFrame: 1873});
  assert.equal(firstStop.sourceSchedulePhase, 'frame-673-source-stop-awaiting-press');
  assert.equal(firstStop.localPlayState, 'stopped');
  assert.equal(firstStop.quizSection, true);
  assert.equal(firstStop.postStopSegmentReached, false);
  assert.equal(afterStop.status, 'ready');
  assert.equal(afterStop.blocker, null);
  assert.equal(afterStop.postStopSegmentReached, true);
  assert.equal(afterStop.sourceSchedulePhase, 'frames-674-1872-resumed-play');
  assert.equal(afterStop.sourceScheduleStepRequired, true);
  assert.equal(afterStop.sourceScheduleStepExecutionClaimed, false);
  assert.equal(afterStop.localPlayState, 'playing');
  assert.equal(afterStop.quizSection, false);
  assert.equal(lateChild.status, 'ready');
  assert.equal(lateChild.blocker, null);
  assert.equal(terminal.status, 'ready');
  assert.equal(terminal.blocker, null);
  assert.equal(terminal.sourceSchedulePhase, 'frame-1873-terminal-source-stop');
  assert.equal(terminal.localPlayState, 'stopped');
  assert.equal(terminal.postStopTransitionSourceEvidenced, true);
  assert.equal(terminal.terminalStateSourceEvidenced, true);
  assert.equal(terminal.authoritativeRuntimeExecutionComplete, false);
  assert.equal(terminal.replayResolved, false);
  assert.equal(terminal.interactionResolved, false);
  assert.equal(terminal.audioRendered, false);
  assert.deepEqual(terminal.strictAcceptanceBlockers, [
    'authoritative-original-runtime-execution-pending',
    'source-replay-unresolved',
    'audio-not-rendered',
    'human-and-owner-acceptance-pending'
  ]);
  assert.equal(getCourseG05L13Rw002FrameState(9999, {lang: 'en', seed: 0}).frame, 1873);
  const spanish = getCourseG05L13Rw002FrameState(673, {lang: 'es', seed: 0});
  assert.equal(spanish.status, 'ready');
  assert.equal(spanish.blocker, null);
  assert.equal(spanish.language, 'es');
  assert.equal(
    spanish.visualLocalizationStatus,
    COURSE_G05_L13_RW_002_VISUAL_LOCALIZATION
  );
  assert.equal(spanish.audioLocalizationStatus, 'unresolved');
  assert.equal(spanish.audioStatus, 'blocked-not-rendered');
  assert.equal(spanish.audioRendered, false);
  assert.equal(
    spanish.sourceScheduleSha256,
    COURSE_G05_L13_RW_002_ES_TRACE_SPEC.sha256
  );
  assert.deepEqual(spanish.strictAcceptanceBlockers, terminal.strictAcceptanceBlockers);
});

test('RW002 root domain reuses exact standalone source frames in en/es without claiming translation or child entry', () => {
  assert.equal(normalizeCourseG05L13Rw002RootFrame(Number.NaN), 1);
  assert.equal(normalizeCourseG05L13Rw002RootFrame(99), 10);
  const root = getCourseG05L13Rw002FrameState(10, {
    frameDomain: 'root',
    rootFrame: 10,
    scenario: 'root-standalone',
    lang: 'en',
    seed: 0
  });
  assert.equal(root.frameDomain, 'root');
  assert.equal(root.frame, 10);
  assert.equal(root.rootFrame, 10);
  assert.equal(root.scenario, 'root-standalone');
  assert.equal(root.status, 'ready');
  assert.equal(root.blocker, null);
  assert.equal(root.naturalPlaybackStopFrame, 1);
  assert.equal(root.originalHostStateResolved, false);
  assert.equal(root.captureAuthority, 'adobe-standalone-deterministic-step-root-only');
  assert.equal(
    root.rootFrameAsset.source,
    '/flash-assets/courses/course-g05-l13-rw-002/root-frames/frame-0010.png'
  );
  assert.equal(
    root.rootFrameAsset.sha256,
    '099c5dc507391e2fdfce788e00f0d58b07b834ad662620e3e03428d0b4dd4b0c'
  );
  const spanishRoot = getCourseG05L13Rw002FrameState(10, {
    frameDomain: 'root',
    rootFrame: 10,
    scenario: 'root-standalone',
    lang: 'es',
    seed: 0
  });
  assert.equal(spanishRoot.status, 'ready');
  assert.equal(spanishRoot.blocker, null);
  assert.equal(spanishRoot.language, 'es');
  assert.equal(
    spanishRoot.visualLocalizationStatus,
    'source-shared-untranslated-visual'
  );
  assert.equal(spanishRoot.audioRendered, false);
  assert.deepEqual(spanishRoot.rootFrameAsset, root.rootFrameAsset);
});

test('RW002 renderer shows only source-proven visual states and names every blocker', () => {
  const render = (
    frame: number,
    frameDomain: 'root' | 'sprite-334',
    scenario: 'root-standalone' | 'default',
    lang: 'en' | 'es'
  ) => {
    const state = getCourseG05L13Rw002FrameState(frame, {
      frameDomain,
      rootFrame: frameDomain === 'root' ? frame : 6,
      scenario,
      lang,
      seed: 0
    });
    return renderToStaticMarkup(createElement(animationModule.Renderer, {
      frame,
      frameDomain,
      rootFrame: frameDomain === 'root' ? frame : 6,
      scenario,
      lang,
      seed: 0,
      requirementId: `req:${frameDomain}:${scenario}:${lang}`,
      traceId: `trace:${frameDomain}:${scenario}:${lang}:seed-0`,
      entryStateSha256: '4dfbb3290627139f130afd170b4c6d925c09dd7262e32d9cbc1e1142632f9deb',
      state
    }));
  };

  const firstStop = render(673, 'sprite-334', 'default', 'en');
  assert.match(firstStop, /data-flash-frame-domain="sprite-334"/);
  assert.match(firstStop, /<canvas[^>]+width="800"/);

  const afterStop = render(674, 'sprite-334', 'default', 'en');
  assert.match(afterStop, /data-source-schedule-phase="frames-674-1872-resumed-play"/);
  assert.match(afterStop, /data-source-schedule-step-execution-claimed="false"/);
  assert.doesNotMatch(afterStop, /data-fail-closed-reason/);
  assert.match(afterStop, /<canvas/);

  const terminal = render(1873, 'sprite-334', 'default', 'en');
  assert.match(terminal, /data-source-schedule-phase="frame-1873-terminal-source-stop"/);
  assert.match(
    terminal,
    new RegExp(
      `data-source-schedule-sha256="${COURSE_G05_L13_RW_002_EN_TRACE_SPEC.sha256}"`
    )
  );
  assert.match(terminal, /data-strict-acceptance-effect="none"/);
  assert.doesNotMatch(terminal, /data-fail-closed-reason/);
  assert.match(terminal, /<canvas/);

  const spanish = render(673, 'sprite-334', 'default', 'es');
  assert.match(spanish, /data-candidate-status="engineering-not-strict"/);
  assert.match(spanish, /data-runtime-language="es"/);
  assert.match(spanish, /data-visual-localization-status="source-shared-untranslated-visual"/);
  assert.match(spanish, /data-audio-localization-status="unresolved"/);
  assert.match(spanish, /data-audio-rendered="false"/);
  assert.match(
    spanish,
    new RegExp(
      `data-source-schedule-sha256="${COURSE_G05_L13_RW_002_ES_TRACE_SPEC.sha256}"`
    )
  );
  assert.doesNotMatch(spanish, /data-fail-closed-reason/);
  assert.match(spanish, /<canvas/);

  const root = render(10, 'root', 'root-standalone', 'en');
  assert.match(root, /data-animation-id="course-g05-l13-rw-002"/);
  assert.match(root, /data-capture-stage="true"/);
  assert.match(root, /data-flash-frame="10"/);
  assert.match(root, /data-flash-frame-domain="root"/);
  assert.match(root, /data-flash-root-frame="10"/);
  assert.match(root, /data-render-state="ready"/);
  assert.match(root, /data-root-visual-authority="adobe-standalone-deterministic-step-root-only"/);
  assert.match(root, /root-frames\/frame-0010\.png/);
  assert.match(root, /data-root-frame-sha256="099c5dc5/);
  assert.doesNotMatch(root, /<canvas/);

  const spanishRoot = render(10, 'root', 'root-standalone', 'es');
  assert.match(spanishRoot, /data-render-state="ready"/);
  assert.match(spanishRoot, /data-runtime-language="es"/);
  assert.match(spanishRoot, /data-visual-localization-status="source-shared-untranslated-visual"/);
  assert.match(spanishRoot, /root-frames\/frame-0010\.png/);
  assert.doesNotMatch(spanishRoot, /data-fail-closed-reason/);
  assert.match(spanishRoot, /<img/);
  assert.doesNotMatch(spanishRoot, /<canvas/);
});

test('RW002 Canvas exposes the complete deterministic capture identity only after the exact frame renders', () => {
  const state = getCourseG05L13Rw002FrameState(674, {
    frameDomain: 'sprite-334',
    scenario: 'default',
    lang: 'en',
    seed: 17
  });
  const identity = {
    entryStateSha256: 'dc78597804254203703c3d81f5b389dd51bff069cb4375baea1c32d971ac3ce2',
    requirementId: 'req:sprite-334:default:en',
    traceId: 'trace:sprite-334:default:en:seed-0'
  };
  const ready = buildCourseG05L13Rw002CaptureAttributes({
    canvasStatus: 'ready',
    state,
    ...identity
  });
  assert.equal(ready['data-capture-stage'], 'true');
  assert.equal(ready['data-render-state'], 'ready');
  assert.equal(ready['data-render-visual'], 'true');
  assert.equal(ready['data-animation-id'], 'course-g05-l13-rw-002');
  assert.equal(ready['data-flash-frame'], 674);
  assert.equal(ready['data-flash-frame-domain'], 'sprite-334');
  assert.equal(ready['data-flash-root-frame'], 6);
  assert.equal(ready['data-runtime-language'], 'en');
  assert.equal(ready['data-runtime-scenario'], 'default');
  assert.equal(ready['data-runtime-seed'], 17);
  assert.equal(
    ready['data-visual-localization-status'],
    'source-shared-untranslated-visual'
  );

  const loading = buildCourseG05L13Rw002CaptureAttributes({
    canvasStatus: 'loading',
    state,
    ...identity
  });
  assert.equal(loading['data-capture-stage'], undefined);
  assert.equal(loading['data-render-state'], 'loading');
  assert.equal(loading['data-render-visual'], undefined);
});

test('RW002 generated Canvas asset is current, local-only, and non-strict', async () => {
  const manifest = JSON.parse(
    await readFile(`${repositoryRoot}public/flash-assets/courses/course-g05-l13-rw-002/manifest.json`, 'utf8')
  );
  const runtime = await readFile(`${repositoryRoot}${manifest.output.script}`);
  assert.equal(sha256(runtime), manifest.output.sha256);
  assert.equal(manifest.safety.noNetworkPrimitives, true);
  assert.equal(manifest.safety.noDynamicEvaluation, true);
  assert.equal(manifest.safety.noTimersOrAutoplay, true);
  assert.equal(manifest.timeline.deterministicContentTimeline.stateCoverage, 'static-source-drawing-only');
  assert.deepEqual(manifest.timeline.supportedLanguages, ['en', 'es']);
  assert.equal(
    manifest.timeline.visualLocalization,
    'single-source-drawing-timeline-with-embedded-english-title-and-no-language-branch; es preserves source pixels without claiming translation'
  );
  assert.equal(manifest.strictAcceptanceEffect, 'none');
});

test('RW002 root implementation assets exactly copy the hash-bound standalone frames', async () => {
  const root = `${repositoryRoot}public/flash-assets/courses/course-g05-l13-rw-002/root-frames/`;
  const manifest = JSON.parse(await readFile(`${root}manifest.json`, 'utf8')) as {
    animationId: string;
    source: {swfSha256: string};
    sourceReport: {path: string; sha256: string; authorityBoundary: string};
    runtime: {frameDomain: string; frameCount: number; language: string};
    frames: Array<{
      frame: number;
      file: string;
      sha256: string;
      bytes: number;
      width: number;
      height: number;
    }>;
    strictAcceptanceEffect: string;
  };
  assert.equal(manifest.animationId, 'course-g05-l13-rw-002');
  assert.equal(manifest.source.swfSha256, COURSE_G05_L13_RW_002_SOURCE.swfSha256);
  assert.equal(manifest.runtime.frameDomain, 'root');
  assert.equal(manifest.runtime.frameCount, 10);
  assert.equal(manifest.runtime.language, 'en');
  assert.equal(manifest.frames.length, 10);
  assert.equal(manifest.strictAcceptanceEffect, 'none');
  assert.match(manifest.sourceReport.authorityBoundary, /not natural child entry/);
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${manifest.sourceReport.path}`)),
    manifest.sourceReport.sha256
  );
  assert.deepEqual(
    manifest.frames.map(({frame, file, sha256: hash}) => ({frame, file, sha256: hash})),
    COURSE_G05_L13_RW_002_ROOT_FRAME_ASSETS
  );
  for (const frame of manifest.frames) {
    const bytes = await readFile(`${root}${frame.file}`);
    assert.equal(bytes.length, frame.bytes, frame.file);
    assert.equal(sha256(bytes), frame.sha256, frame.file);
    assert.equal(frame.width, 800, frame.file);
    assert.equal(frame.height, 600, frame.file);
  }
});

test('RW002 candidate is discoverable only by its stable placement identity', async () => {
  const loaded = await loadAnimationModule('course-g05-l13-rw-002');
  assert.equal(loaded?.key, 'course-g05-l13-rw-002');
  assert.equal(loaded?.movie.frameCount, 1873);
  assert.equal(loaded?.runtime?.frameCount, 10);
  assert.deepEqual(loaded?.scenarios.map(({id}) => id), [...COURSE_G05_L13_RW_002_SCENARIOS]);
  assert.equal(loaded?.maturity, 'legacy-prototype');
});

test('RW002 stages the exact Spanish asset but withholds a behaviorally incomplete host control', async () => {
  assert.equal(animationModule.audioTracks, undefined);
  const bytes = await readFile(`${repositoryRoot}public/flash-assets/audio/courses/course-g05-l13-rw-002/es.mp3`);
  assert.equal(
    sha256(bytes),
    '2e809c69df60cec11427a71d38b37b830a0a9ec805e3c8ff4f68734cb53bfcd2'
  );
  const manifest = JSON.parse(
    await readFile(`${repositoryRoot}public/flash-assets/audio/courses/manifest.json`, 'utf8')
  );
  const entry = manifest.entries.find(({animationId}: {animationId: string}) => animationId === animationModule.key);
  assert.equal(entry.sourceSha256, sha256(bytes));
  assert.equal(entry.authoritativeListeningComplete, false);
  assert.equal(entry.synchronizationComplete, false);
  assert.equal(manifest.strictAcceptanceEffect, false);
});

test('RW002 Spanish host-audio product predecessor stays immutable and keeps strict audio pending', async () => {
  const receiptBytes = await readFile(`${repositoryRoot}${rw002PredecessorReceiptPath}`);
  assert.equal(receiptBytes.length, 10695);
  assert.equal(sha256(receiptBytes), rw002PredecessorReceiptSha256);
  const receipt = JSON.parse(receiptBytes.toString('utf8')) as {
    schemaVersion: number;
    artifactType: string;
    status: string;
    bindings: Record<string, {file: string; sha256: string}>;
    normalPlaybackPage: {pass: boolean; observations: Record<string, unknown>};
    deterministicCapturePage: {
      pass: boolean;
      observations: Record<string, unknown>;
      diagnostics: {identityMatches: boolean};
    };
    controls: {
      sourceAndMigrationBytesUnchanged: boolean;
      bindingsUnchangedDuringObservation: boolean;
    };
    traceGeneratorProvenanceRebind: {
      status: string;
      receipt: {file: string; sha256: string};
      englishNestedTrace: {file: string; sha256: string};
      spanishNestedTrace: {file: string; sha256: string};
      exactChangedJsonPointerCountPerTrace: number;
      everyHistoricalTraceHashReconstructed: boolean;
      sourceInputsUnchanged: boolean;
      currentIndexVerified: boolean;
      strictAcceptanceEffect: string;
    };
    audioAcceptance: Record<string, unknown>;
    claims: Record<string, boolean>;
    strictAcceptanceEffect: boolean;
    humanReviewRecorded: boolean;
    ownerReviewRecorded: boolean;
  };
  for (const [name, binding] of Object.entries(receipt.bindings)) {
    assert.match(binding.sha256, /^[a-f0-9]{64}$/, name);
    const currentSha256 = sha256(await readFile(`${repositoryRoot}${binding.file}`));
    if (rw002SuccessorDriftRoles.has(name)) {
      assert.notEqual(currentSha256, binding.sha256, `${name}: expected successor drift`);
    } else {
      assert.equal(currentSha256, binding.sha256, name);
    }
  }
  assert.equal(receipt.schemaVersion, 2);
  assert.equal(
    receipt.artifactType,
    'source-routed-host-audio-withheld-source-shared-visual-machine-product-qa'
  );
  assert.equal(
    receipt.status,
    'machine-product-source-shared-visual-ready-with-strict-audio-gate-still-pending'
  );
  assert.equal(receipt.normalPlaybackPage.pass, true);
  assert.equal(receipt.deterministicCapturePage.pass, true);
  assert.equal(receipt.deterministicCapturePage.diagnostics.identityMatches, true);
  assert.equal(receipt.normalPlaybackPage.observations.externalRequestCount, 0);
  assert.equal(receipt.normalPlaybackPage.observations.anyMp3Requested, false);
  assert.equal(
    receipt.normalPlaybackPage.observations.visualLocalizationStatus,
    'source-shared-untranslated-visual'
  );
  assert.equal(
    receipt.normalPlaybackPage.observations.audioLocalizationStatus,
    'unresolved'
  );
  assert.equal(receipt.normalPlaybackPage.observations.failClosedReason, null);
  assert.equal(receipt.deterministicCapturePage.observations.audioControlRendered, false);
  assert.equal(
    receipt.deterministicCapturePage.observations.candidateCanvasStatus,
    'ready'
  );
  assert.equal(receipt.deterministicCapturePage.observations.publicMp3Requested, false);
  assert.equal(receipt.deterministicCapturePage.observations.anyMp3Requested, false);
  assert.equal(receipt.controls.sourceAndMigrationBytesUnchanged, true);
  assert.equal(receipt.controls.bindingsUnchangedDuringObservation, true);
  assert.equal(
    receipt.traceGeneratorProvenanceRebind.status,
    'verified-acceptance-neutral-generator-provenance-only-rebind'
  );
  assert.deepEqual(
    receipt.traceGeneratorProvenanceRebind.receipt,
    receipt.bindings.traceGeneratorProvenanceRebindReceipt
  );
  assert.deepEqual(
    receipt.traceGeneratorProvenanceRebind.englishNestedTrace,
    receipt.bindings.englishSourceSchedule
  );
  assert.deepEqual(
    receipt.traceGeneratorProvenanceRebind.spanishNestedTrace,
    receipt.bindings.spanishSourceSchedule
  );
  assert.equal(
    receipt.traceGeneratorProvenanceRebind.exactChangedJsonPointerCountPerTrace,
    1
  );
  assert.equal(
    receipt.traceGeneratorProvenanceRebind.everyHistoricalTraceHashReconstructed,
    true
  );
  assert.equal(receipt.traceGeneratorProvenanceRebind.sourceInputsUnchanged, true);
  assert.equal(receipt.traceGeneratorProvenanceRebind.currentIndexVerified, true);
  assert.equal(receipt.traceGeneratorProvenanceRebind.strictAcceptanceEffect, 'none');
  assert.equal(receipt.audioAcceptance.exactBytesStagedAndHashVerified, true);
  assert.equal(receipt.audioAcceptance.authoritativeListeningComplete, false);
  assert.equal(receipt.audioAcceptance.pauseResumeSynchronizationComplete, false);
  assert.equal(receipt.audioAcceptance.strictAudioAcceptance, 'pending');
  assert.equal(receipt.strictAcceptanceEffect, false);
  assert.equal(receipt.humanReviewRecorded, false);
  assert.equal(receipt.ownerReviewRecorded, false);
  assert.equal(Object.values(receipt.claims).every((value) => value === false), true);
});

test('RW002 r1 binding successor remains immutable historical evidence', async () => {
  const successorBytes = await readFile(
    `${repositoryRoot}${rw002BindingSuccessorR1Path}`
  );
  assert.equal(successorBytes.length, 10257);
  assert.equal(sha256(successorBytes), rw002BindingSuccessorR1Sha256);
  const successor = JSON.parse(successorBytes.toString('utf8')) as {
    schemaVersion: number;
    artifactType: string;
    animationId: string;
    status: string;
    predecessorReceipt: {
      file: string;
      bytes: number;
      sha256: string;
      retainedByteForByte: boolean;
      browserObservationsInherited: boolean;
      browserObservationsCurrentForSuccessor: boolean;
    };
    currentBindings: Record<string, {
      file: string;
      bytes: number;
      sha256: string;
    }>;
    machineChecks: {
      browserQaExecutedForSuccessor: boolean;
      predecessorBrowserObservationsReusedAsCurrent: boolean;
    };
    acceptanceNeutral: boolean;
    strictAcceptanceEffect: string;
    acceptanceEffects: Record<string, boolean>;
    claims: Record<string, boolean>;
  };
  const predecessorBytes = await readFile(
    `${repositoryRoot}${successor.predecessorReceipt.file}`
  );
  assert.equal(predecessorBytes.length, successor.predecessorReceipt.bytes);
  assert.equal(sha256(predecessorBytes), successor.predecessorReceipt.sha256);
  assert.equal(successor.predecessorReceipt.sha256, rw002PredecessorReceiptSha256);
  assert.equal(successor.predecessorReceipt.retainedByteForByte, true);
  assert.equal(successor.predecessorReceipt.browserObservationsInherited, false);
  assert.equal(successor.predecessorReceipt.browserObservationsCurrentForSuccessor, false);
  assert.equal(successor.currentBindings.productRuntime?.bytes, 31489);
  assert.notEqual(
    sha256(await readFile(`${repositoryRoot}apps/web/components/animation-runtime.tsx`)),
    successor.currentBindings.productRuntime?.sha256
  );
  assert.equal(successor.schemaVersion, 1);
  assert.equal(
    successor.artifactType,
    'g5-l13-rw002-current-javascript-shared-runtime-binding-successor'
  );
  assert.equal(successor.animationId, 'course-g05-l13-rw-002');
  assert.equal(
    successor.status,
    'current-javascript-bindings-reconciled-browser-observations-not-revalidated'
  );
  assert.equal(successor.machineChecks.browserQaExecutedForSuccessor, false);
  assert.equal(
    successor.machineChecks.predecessorBrowserObservationsReusedAsCurrent,
    false
  );
  assert.equal(successor.acceptanceNeutral, true);
  assert.equal(successor.strictAcceptanceEffect, 'none');
  assert.equal(
    Object.values(successor.acceptanceEffects).every((value) => value === false),
    true
  );
  assert.equal(Object.values(successor.claims).every((value) => value === false), true);
});

test('RW002 r2 successor remains immutable dated historical evidence', async () => {
  const successorBytes = await readFile(
    `${repositoryRoot}${rw002BindingSuccessorR2Path}`
  );
  assert.equal(successorBytes.length, rw002BindingSuccessorR2Bytes);
  assert.equal(sha256(successorBytes), rw002BindingSuccessorR2Sha256);
  const successor = JSON.parse(successorBytes.toString('utf8')) as {
    schemaVersion: number;
    artifactType: string;
    animationId: string;
    status: string;
    predecessorSuccessor: {
      file: string;
      bytes: number;
      sha256: string;
      retainedByteForByte: boolean;
      browserObservationDisposition: string;
    };
    driftSummary: {
      changedBindingCount: number;
      unexpectedDriftCount: number;
      changedRoles: string[];
    };
    currentBindings: Record<string, {
      file: string;
      bytes: number;
      sha256: string;
      predecessorSuccessorSha256: string;
      relationToPredecessorSuccessor: string;
    }>;
    changeCharacterization: {
      productRuntime: {
        causalAttributionEstablishedForCurrentJavascript: boolean;
        originalRuntimeBehaviorInferred: boolean;
        rw002BehavioralEquivalenceEstablished: boolean;
      };
    };
    machineChecks: {
      browserQaExecutedForSuccessor: boolean;
      predecessorBrowserObservationsReusedAsCurrent: boolean;
    };
    acceptanceNeutral: boolean;
    strictAcceptanceEffect: string;
    acceptanceEffects: Record<string, boolean>;
    claims: Record<string, boolean>;
    normalPlaybackPage?: unknown;
    deterministicCapturePage?: unknown;
  };
  const predecessorSuccessorBytes = await readFile(
    `${repositoryRoot}${successor.predecessorSuccessor.file}`
  );
  assert.equal(
    predecessorSuccessorBytes.length,
    successor.predecessorSuccessor.bytes
  );
  assert.equal(
    sha256(predecessorSuccessorBytes),
    successor.predecessorSuccessor.sha256
  );
  assert.equal(successor.predecessorSuccessor.sha256, rw002BindingSuccessorR1Sha256);
  assert.equal(successor.predecessorSuccessor.retainedByteForByte, true);
  assert.equal(
    successor.predecessorSuccessor.browserObservationDisposition,
    'none-inherited-none-current'
  );
  const staleRoles: string[] = [];
  for (const [name, binding] of Object.entries(successor.currentBindings)) {
    const bytes = await readFile(`${repositoryRoot}${binding.file}`);
    const currentSha256 = sha256(bytes);
    if (bytes.length !== binding.bytes || currentSha256 !== binding.sha256) {
      staleRoles.push(name);
      assert.notEqual(
        currentSha256,
        binding.sha256,
        `${name}: dated SHA-256 must be stale`
      );
    } else {
      assert.equal(bytes.length, binding.bytes, `${name}: bytes`);
      assert.equal(currentSha256, binding.sha256, `${name}: SHA-256`);
    }
  }
  assert.deepEqual(staleRoles.sort(), [...rw002BindingSuccessorR2StaleRoles]);
  assert.equal(successor.schemaVersion, 2);
  assert.equal(
    successor.artifactType,
    'g5-l13-rw002-current-javascript-shared-runtime-binding-successor'
  );
  assert.equal(successor.animationId, 'course-g05-l13-rw-002');
  assert.equal(
    successor.status,
    'current-javascript-bindings-reconciled-browser-observations-not-revalidated'
  );
  assert.deepEqual(successor.driftSummary.changedRoles, [
    'productRuntime',
    'productQaContractTest'
  ]);
  assert.equal(successor.driftSummary.changedBindingCount, 2);
  assert.equal(successor.driftSummary.unexpectedDriftCount, 0);
  assert.equal(successor.machineChecks.browserQaExecutedForSuccessor, false);
  assert.equal(
    successor.machineChecks.predecessorBrowserObservationsReusedAsCurrent,
    false
  );
  assert.equal(
    successor.changeCharacterization.productRuntime.originalRuntimeBehaviorInferred,
    false
  );
  assert.equal(
    successor.changeCharacterization.productRuntime
      .rw002BehavioralEquivalenceEstablished,
    false
  );
  assert.equal(
    successor.changeCharacterization.productRuntime
      .causalAttributionEstablishedForCurrentJavascript,
    true
  );
  assert.equal(successor.normalPlaybackPage, undefined);
  assert.equal(successor.deterministicCapturePage, undefined);
  assert.equal(successor.acceptanceNeutral, true);
  assert.equal(successor.strictAcceptanceEffect, 'none');
  assert.equal(
    Object.values(successor.acceptanceEffects).every((value) => value === false),
    true
  );
  assert.equal(Object.values(successor.claims).every((value) => value === false), true);
});
