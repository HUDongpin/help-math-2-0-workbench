import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {loadAnimationModule} from '../src/animation-registry';
import animationModule, {
  buildCourseG04L09Gs002CaptureAttributes
} from '../src/modules/course-g04-l09-gs-002';
import {matchPrototype} from '../src/prototype-manifest';
import {
  COURSE_G04_L09_GS_002_MOVIE,
  COURSE_G04_L09_GS_002_ROOT_FRAME_ASSET_BASE,
  COURSE_G04_L09_GS_002_ROOT_FRAME_ASSETS,
  COURSE_G04_L09_GS_002_ROOT_VISUAL_LOCALIZATION,
  COURSE_G04_L09_GS_002_RUNTIME,
  COURSE_G04_L09_GS_002_SCENARIOS,
  COURSE_G04_L09_GS_002_SOURCE,
  getCourseG04L09Gs002FrameState,
  normalizeCourseG04L09Gs002Frame
} from '../src/timelines/course-g04-l09-gs-002';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRoot = `${repositoryRoot}migrations/course-g04-l09-gs-002`;

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('GS002 candidate is bound to the preserved SWF, Spanish audio, and audited frame domain', async () => {
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L09_GS_002_SOURCE.swf}`)),
    COURSE_G04_L09_GS_002_SOURCE.swfSha256
  );
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L09_GS_002_SOURCE.externalSpanishAudio}`)),
    COURSE_G04_L09_GS_002_SOURCE.externalSpanishAudioSha256
  );
  assert.deepEqual(COURSE_G04_L09_GS_002_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L09_GS_002_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L09_GS_002_MOVIE.frameCount, 653);
  assert.equal(COURSE_G04_L09_GS_002_SOURCE.rootFrameCount, 10);
  assert.equal(COURSE_G04_L09_GS_002_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L09_GS_002_RUNTIME.defaultFrameDomain, 'sprite-787');
  assert.deepEqual(COURSE_G04_L09_GS_002_RUNTIME.frameDomains, [
    {id: 'sprite-787', frameCount: 653, fps: 12, rootFrame: 6}
  ]);
  assert.equal(animationModule.runtime, COURSE_G04_L09_GS_002_RUNTIME);
  assert.equal(COURSE_G04_L09_GS_002_SOURCE.localObjectId, 787);
  assert.equal(COURSE_G04_L09_GS_002_SOURCE.buttonTargetCount, 14);
  assert.equal(COURSE_G04_L09_GS_002_SOURCE.embeddedSoundStreamCount, 12);
  assert.equal(COURSE_G04_L09_GS_002_SOURCE.staticDrawingReadyEndFrame, 641);
  assert.equal(animationModule.playbackEndFrame, 641);
  assert.deepEqual(animationModule.playbackEndFrameByDomain, {root: 1, 'sprite-787': 641});
  assert.equal(animationModule.reducedMotionFrame, 641);
});

test('GS002 pure state is one-indexed, deterministic, and stops before unresolved question frames', () => {
  assert.equal(normalizeCourseG04L09Gs002Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L09Gs002Frame(0), 1);
  assert.equal(normalizeCourseG04L09Gs002Frame(642.9), 642);
  assert.equal(normalizeCourseG04L09Gs002Frame(999), 653);
  assert.equal(normalizeCourseG04L09Gs002Frame(999, 'root'), 10);
  const lastStaticDrawing = getCourseG04L09Gs002FrameState(641, {
    frameDomain: 'sprite-787',
    scenario: 'source-drawing-lead-in',
    lang: 'en',
    seed: -1
  });
  assert.equal(lastStaticDrawing.status, 'ready');
  assert.equal(lastStaticDrawing.frame, 641);
  assert.equal(lastStaticDrawing.exportFrame, 640);
  assert.equal(lastStaticDrawing.frameDomain, 'sprite-787');
  assert.equal(lastStaticDrawing.rootFrame, 6);
  assert.equal(lastStaticDrawing.rootState, 'stopped-at-begin-while-child-plays');
  assert.equal(lastStaticDrawing.seed, 4294967295);
  assert.equal(lastStaticDrawing.structuralDrawingOnly, true);
  assert.equal(lastStaticDrawing.avm1Executed, false);
  assert.equal(lastStaticDrawing.questionStateResolved, false);
  assert.equal(lastStaticDrawing.randomStateResolved, false);
  assert.equal(lastStaticDrawing.scoringResolved, false);
  assert.equal(lastStaticDrawing.audioRendered, false);

  for (const frame of [642, 643, 644, 652, 653]) {
    const state = getCourseG04L09Gs002FrameState(frame, {
      frameDomain: 'sprite-787',
      scenario: 'source-drawing-lead-in',
      lang: 'en',
      seed: 7
    });
    assert.equal(state.status, 'blocked');
    assert.equal(state.blocker, 'question-final-avm1-state-unresolved');
  }
});

test('GS002 exposes source-shared untranslated en/es root drawings without claiming translation or an original-runtime baseline', async () => {
  const [adobe, structural] = await Promise.all([
    readFile(
      `${migrationRoot}/baseline/adobe-flash-player-32-standalone-default-partial.json`,
      'utf8'
    ).then(JSON.parse),
    readFile(`${migrationRoot}/baseline/ffdec-root-frames.json`, 'utf8').then(JSON.parse)
  ]);
  assert.equal(adobe.runtime.frameCount, 10);
  assert.equal(adobe.runtime.capturedFrameCount, 4);
  assert.equal(adobe.runtime.completeRootTimeline, false);
  assert.equal(structural.status, 'structural-baseline-only');
  assert.equal(structural.authority.kind, 'swf-static-root-timeline-render');

  for (const lang of ['en', 'es'] as const) {
    for (const frame of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const state = getCourseG04L09Gs002FrameState(frame, {
        frameDomain: 'root',
        scenario: 'root-standalone',
        lang,
        seed: 0
      });
      assert.equal(state.frameDomain, 'root');
      assert.equal(state.frame, frame);
      assert.equal(state.rootFrame, frame);
      assert.equal(state.exportFrame, frame - 1);
      assert.equal(state.scenario, 'root-standalone');
      assert.equal(state.language, lang);
      assert.equal(
        state.rootState,
        'ffdec-structural-root-inspection-original-runtime-baseline-incomplete'
      );
      assert.equal(state.status, 'ready');
      assert.equal(state.blocker, null);
      assert.equal(
        state.visualLocalizationStatus,
        COURSE_G04_L09_GS_002_ROOT_VISUAL_LOCALIZATION
      );
      assert.equal(state.spanishTranslationSupplied, false);
      assert.equal(state.audioLocalizationStatus, 'unresolved');
      assert.equal(state.audioRendered, false);
      assert.deepEqual(state.rootFrameAsset, {
        source: `${COURSE_G04_L09_GS_002_ROOT_FRAME_ASSET_BASE}/frame-${String(frame).padStart(4, '0')}.png`,
        sha256: COURSE_G04_L09_GS_002_ROOT_FRAME_ASSETS[frame - 1].sha256
      });
      assert.equal(
        state.rootVisualAuthority,
        'ffdec-static-root-timeline-structural-render-not-original-runtime'
      );
      assert.equal(state.originalRuntimeBaselineComplete, false);
      assert.equal(state.naturalPlaybackStopFrame, 1);
      assert.equal(state.strictAcceptanceEffect, 'none');
    }
  }
});

test('GS002 rejects frame-domain/scenario mismatches and unknown runtime requests', () => {
  const rootWithSpriteScenario = getCourseG04L09Gs002FrameState(10, {
    frameDomain: 'root',
    scenario: 'source-drawing-lead-in',
    lang: 'en',
    seed: 0
  });
  assert.equal(rootWithSpriteScenario.frameDomain, 'root');
  assert.equal(rootWithSpriteScenario.frame, 10);
  assert.equal(rootWithSpriteScenario.scenario, 'source-drawing-lead-in');
  assert.equal(rootWithSpriteScenario.blocker, 'frame-domain-scenario-mismatch');

  const spriteWithRootScenario = getCourseG04L09Gs002FrameState(653, {
    frameDomain: 'sprite-787',
    scenario: 'root-standalone',
    lang: 'en',
    seed: 0
  });
  assert.equal(spriteWithRootScenario.frameDomain, 'sprite-787');
  assert.equal(spriteWithRootScenario.frame, 653);
  assert.equal(spriteWithRootScenario.scenario, 'root-standalone');
  assert.equal(spriteWithRootScenario.blocker, 'frame-domain-scenario-mismatch');

  assert.equal(
    getCourseG04L09Gs002FrameState(1, {
      frameDomain: 'unknown-domain',
      scenario: 'source-drawing-lead-in',
      lang: 'en',
      seed: 0
    }).blocker,
    'unsupported-runtime-request'
  );
  assert.equal(
    getCourseG04L09Gs002FrameState(1, {
      frameDomain: 'sprite-787',
      scenario: 'unknown-scenario',
      lang: 'en',
      seed: 0
    }).blocker,
    'unsupported-runtime-request'
  );
});

test('GS002 sprite Spanish and every game/host obligation remain fail closed', async () => {
  const expected = new Map([
    ['questions-q1-q10-unavailable', 'questions-q1-q10-host-state-unresolved'],
    ['answer-correct-unavailable', 'correct-answer-feedback-unresolved'],
    ['answer-wrong-unavailable', 'wrong-answer-feedback-unresolved'],
    ['random-scoring-unavailable', 'random-selection-and-scoring-unresolved'],
    [
      'final-replay-glossary-routing-unavailable',
      'final-replay-glossary-and-course-routing-unresolved'
    ]
  ]);
  for (const [scenario, blocker] of expected) {
    const state = getCourseG04L09Gs002FrameState(642, {
      frameDomain: 'sprite-787',
      scenario,
      lang: 'en',
      seed: 0
    });
    assert.equal(state.status, 'blocked');
    assert.equal(state.blocker, blocker);
  }
  for (const frame of [1, 641, 642, 653]) {
    const spanish = getCourseG04L09Gs002FrameState(frame, {
      frameDomain: 'sprite-787',
      scenario: 'source-drawing-lead-in',
      lang: 'es',
      seed: 0
    });
    assert.equal(spanish.status, 'blocked');
    assert.equal(spanish.blocker, 'spanish-visual-and-audio-not-source-proven');
    assert.equal(spanish.visualLocalizationStatus, 'english-source-only-spanish-unresolved');
    assert.equal(spanish.audioRendered, false);
  }
  for (const scenario of expected.keys()) {
    const spanish = getCourseG04L09Gs002FrameState(1, {
      frameDomain: 'sprite-787',
      scenario,
      lang: 'es',
      seed: 0
    });
    assert.equal(spanish.status, 'blocked');
    assert.equal(spanish.blocker, 'spanish-visual-and-audio-not-source-proven');
  }
  assert.equal(animationModule.audioCues.length, 0);
  assert.equal(animationModule.audioTracks, undefined);
  assert.equal(
    sha256(await readFile(`${repositoryRoot}public/flash-assets/audio/courses/course-g04-l09-gs-002/es.mp3`)),
    COURSE_G04_L09_GS_002_SOURCE.externalSpanishAudioSha256
  );
  assert.deepEqual(
    animationModule.scenarios.map(({id}) => id),
    [...COURSE_G04_L09_GS_002_SCENARIOS]
  );
});

test('GS002 renderer exposes Canvas only for the source-derived nested lead-in', () => {
  const render = (
    frame: number,
    scenario: string,
    lang: 'en' | 'es',
    frameDomain = 'sprite-787'
  ) => {
    const state = animationModule.getFrameState(frame, {
      frame,
      frameDomain,
      scenario,
      lang,
      seed: 17
    });
    return renderToStaticMarkup(
      createElement(animationModule.Renderer, {
        entryStateSha256: '4dfbb3290627139f130afd170b4c6d925c09dd7262e32d9cbc1e1142632f9deb',
        frame,
        frameDomain,
        requirementId: `req:${frameDomain}:${scenario}:${lang}`,
        scenario,
        lang,
        seed: 17,
        state,
        traceId: `trace:${frameDomain}:${scenario}:${lang}:seed-17`,
        onReplay: () => undefined
      })
    );
  };
  const ready = render(641, 'source-drawing-lead-in', 'en');
  assert.match(ready, /class="faithful-stage-wrap"/);
  assert.match(ready, /data-flash-frame-domain="sprite-787"/);
  assert.match(ready, /data-flash-root-frame="6"/);
  assert.match(ready, /data-runtime-seed="17"/);
  assert.match(ready, /<canvas[^>]+width="800"/);
  assert.match(ready, /<canvas[^>]+height="600"/);
  assert.match(ready, /Q1–Q10, fourteen button targets/);

  const scriptedStop = render(642, 'source-drawing-lead-in', 'en');
  assert.match(scriptedStop, /data-fail-closed-reason="question-final-avm1-state-unresolved"/);
  assert.doesNotMatch(scriptedStop, /<canvas/);

  const question = render(643, 'source-drawing-lead-in', 'en');
  assert.match(question, /data-fail-closed-reason="question-final-avm1-state-unresolved"/);
  assert.doesNotMatch(question, /<canvas/);

  for (const frame of [1, 641, 642, 653]) {
    const spanish = render(frame, 'source-drawing-lead-in', 'es');
    assert.match(
      spanish,
      /data-fail-closed-reason="spanish-visual-and-audio-not-source-proven"/
    );
    assert.match(
      spanish,
      /data-visual-localization-status="english-source-only-spanish-unresolved"/
    );
    assert.doesNotMatch(spanish, /<canvas/);
  }

  const root = render(10, 'root-standalone', 'en', 'root');
  assert.match(root, /data-flash-frame="10"/);
  assert.match(root, /data-flash-frame-domain="root"/);
  assert.match(root, /data-flash-root-frame="10"/);
  assert.match(root, /data-flash-requirement-id="req:root:root-standalone:en"/);
  assert.match(root, /data-flash-trace-id="trace:root:root-standalone:en:seed-17"/);
  assert.match(root, /data-original-runtime-baseline-complete="false"/);
  assert.match(root, /data-root-visual-authority="ffdec-static-root-timeline-structural-render-not-original-runtime"/);
  assert.match(root, /root-frames\/frame-0010\.png/);
  assert.match(root, /data-root-frame-sha256="d196b2c6/);
  assert.match(root, /not a Spanish translation or original-runtime baseline/);
  assert.match(root, /<img/);
  assert.doesNotMatch(root, /<canvas/);

  const rootSpanish = render(10, 'root-standalone', 'es', 'root');
  assert.match(rootSpanish, /data-flash-frame="10"/);
  assert.match(rootSpanish, /data-runtime-language="es"/);
  assert.match(rootSpanish, /data-spanish-translation-supplied="false"/);
  assert.match(rootSpanish, /data-visual-localization="source-shared-untranslated-visual"/);
  assert.match(
    rootSpanish,
    /data-visual-localization-status="source-shared-untranslated-visual"/
  );
  assert.match(rootSpanish, /root-frames\/frame-0010\.png/);
  assert.match(rootSpanish, /not a Spanish translation/);
  assert.match(rootSpanish, /<img/);
  assert.doesNotMatch(rootSpanish, /<canvas/);
});

test('GS002 marks only the ready audited supplemental Canvas as a schema-v4 visual target', () => {
  const state = animationModule.getFrameState(641, {
    frame: 641,
    frameDomain: 'sprite-787',
    scenario: 'source-drawing-lead-in',
    lang: 'en',
    seed: 0
  });
  const identity = {
    entryStateSha256: 'eac16c8a6d549d9073515fb54d06504374f1809e4b2a6e281ea581db58a72363',
    requirementId: 'req:sprite-787:source-drawing-lead-in:en:partial-frames-1-641',
    traceId: 'trace:sprite-787:source-drawing-lead-in:en:seed-0:partial-frames-1-641'
  };
  const ready = buildCourseG04L09Gs002CaptureAttributes({
    canvasStatus: 'ready',
    state,
    ...identity
  });
  assert.equal(ready['data-animation-id'], 'course-g04-l09-gs-002');
  assert.equal(ready['data-render-state'], 'ready');
  assert.equal(ready['data-render-visual'], 'true');
  assert.equal(ready['data-flash-frame'], 641);
  assert.equal(ready['data-flash-frame-domain'], 'sprite-787');
  assert.equal(ready['data-flash-root-frame'], 6);
  assert.equal(ready['data-flash-entry-state-sha256'], identity.entryStateSha256);
  assert.equal(ready['data-flash-requirement-id'], identity.requirementId);
  assert.equal(ready['data-flash-trace-id'], identity.traceId);
  assert.equal(ready['data-runtime-language'], 'en');
  assert.equal(ready['data-runtime-scenario'], 'source-drawing-lead-in');
  assert.equal(ready['data-runtime-seed'], 0);
  assert.equal(ready['data-original-runtime-baseline-complete'], 'false');
  assert.equal(ready['data-strict-acceptance-effect'], 'none');

  const loading = buildCourseG04L09Gs002CaptureAttributes({
    canvasStatus: 'loading',
    state,
    ...identity
  });
  assert.equal(loading['data-render-state'], 'loading');
  assert.equal(loading['data-render-visual'], undefined);
  assert.equal(loading['data-flash-frame'], undefined);

  for (const [label, changes] of [
    ['canonical requirement', {requirementId: 'req:sprite-787:source-drawing-lead-in:en'}],
    ['wrong trace', {traceId: 'trace:sprite-787:source-drawing-lead-in:en:seed-0'}],
    ['wrong entry state', {entryStateSha256: '4dfbb3290627139f130afd170b4c6d925c09dd7262e32d9cbc1e1142632f9deb'}]
  ] as const) {
    const rejected = buildCourseG04L09Gs002CaptureAttributes({
      canvasStatus: 'ready',
      state,
      ...identity,
      ...changes
    });
    assert.equal(rejected['data-render-visual'], undefined, label);
    assert.equal(rejected['data-flash-frame'], undefined, label);
  }

  const nonzeroSeedState = animationModule.getFrameState(641, {
    frame: 641,
    frameDomain: 'sprite-787',
    scenario: 'source-drawing-lead-in',
    lang: 'en',
    seed: 17
  });
  const nonzeroSeed = buildCourseG04L09Gs002CaptureAttributes({
    canvasStatus: 'ready',
    state: nonzeroSeedState,
    ...identity
  });
  assert.equal(nonzeroSeed['data-render-visual'], undefined);
  assert.equal(nonzeroSeed['data-runtime-seed'], 17);
});

test('GS002 generated asset is hash-bound, local-only, static, and explicitly non-strict', async () => {
  const manifest = JSON.parse(
    await readFile(
      `${repositoryRoot}public/flash-assets/courses/course-g04-l09-gs-002/manifest.json`,
      'utf8'
    )
  ) as {
    inputs: {sourceSwf: {sha256: string}};
    output: {script: string; sha256: string};
    safety: Record<string, boolean | string[]>;
    timeline: {
      deterministicContentTimeline: {frameCount: number; playbackMode: string};
      scenarios: string[];
    };
    unresolved: string[];
    strictAcceptanceEffect: string;
  };
  const runtime = await readFile(`${repositoryRoot}${manifest.output.script}`);
  const spec = JSON.parse(
    await readFile(`${migrationRoot}/audit/canvas-adapter-spec.json`, 'utf8')
  ) as {runtimeContract: {kind: string; supportedLanguages: string[]; unresolved: string[]}};
  assert.equal(manifest.inputs.sourceSwf.sha256, COURSE_G04_L09_GS_002_SOURCE.swfSha256);
  assert.equal(sha256(runtime), manifest.output.sha256);
  assert.equal(manifest.safety.noLegacyActionScriptExecuted, true);
  assert.equal(manifest.safety.noDynamicEvaluation, true);
  assert.equal(manifest.safety.noNetworkPrimitives, true);
  assert.equal(manifest.safety.noTimersOrAutoplay, true);
  assert.equal(manifest.timeline.deterministicContentTimeline.frameCount, 653);
  assert.equal(manifest.timeline.deterministicContentTimeline.playbackMode, 'state-explorer');
  assert.deepEqual(manifest.timeline.scenarios, ['source-drawing-lead-in']);
  assert.equal(spec.runtimeContract.kind, 'structural-local-frame');
  assert.deepEqual(spec.runtimeContract.supportedLanguages, ['en']);
  assert.match(spec.runtimeContract.unresolved.join(' '), /Fourteen button targets/);
  assert.match(manifest.unresolved.join(' '), /authoritative natural-runtime all-state baseline/);
  assert.equal(manifest.strictAcceptanceEffect, 'none');
  assert.equal(animationModule.maturity, 'legacy-prototype');
});

test('GS002 canonical lead-in scenario is the source-proven GS_Begin drawing path', async () => {
  const [inventory, spec] = await Promise.all([
    readFile(`${migrationRoot}/audit/scenario-inventory.json`, 'utf8').then(JSON.parse),
    readFile(`${migrationRoot}/audit/canvas-adapter-spec.json`, 'utf8').then(JSON.parse)
  ]);
  const local = inventory.timelineInventory.find(
    (timeline: {timelineId: string}) => timeline.timelineId === 'sprite-787'
  );
  assert.deepEqual(local.frameLabels.slice(0, 2), [
    {frame: 642, label: 'GS_Begin'},
    {frame: 643, label: 'Q1'}
  ]);
  assert.ok(
    local.controlStates
      .find((state: {frame: number}) => state.frame === 642)
      .reasons.includes('script-stop-state')
  );
  assert.equal(spec.runtimeContract.defaultScenario, 'source-drawing-lead-in');
  assert.deepEqual(spec.runtimeContract.scenarios, ['source-drawing-lead-in']);
  assert.ok(!animationModule.scenarios.some(({id}) => id === 'default'));
});

test('GS002 FFDec root implementation assets are deterministic, hash-bound, and structural-only', async () => {
  const manifest = JSON.parse(
    await readFile(
      `${repositoryRoot}public/flash-assets/courses/course-g04-l09-gs-002/root-frames/manifest.json`,
      'utf8'
    )
  ) as {
    evidenceType: string;
    authority: {
      actionScriptExecuted: boolean;
      originalRuntimeBaseline: boolean;
      naturalPlaybackClaimed: boolean;
      authorityBoundary: string;
    };
    generator: {path: string; sha256: string};
    source: {swfSha256: string};
    sourceReport: {path: string; sha256: string; status: string; archive: string};
    visualDisposition: {
      path: string;
      sha256: string;
      status: string;
      visualClassification: string;
      strictAcceptanceEffect: string;
    };
    runtime: {
      supportedLanguages: string[];
      visualLocalizationStatus: string;
      spanishTranslationSupplied: boolean;
      naturalPlaybackStopFrame: number;
    };
    frames: Array<{frame: number; file: string; sha256: string; width: number; height: number}>;
    strictAcceptanceEffect: string;
  };
  assert.equal(manifest.evidenceType, 'ffdec-structural-root-frame-implementation-assets');
  assert.equal(manifest.source.swfSha256, COURSE_G04_L09_GS_002_SOURCE.swfSha256);
  assert.equal(manifest.sourceReport.status, 'structural-baseline-only');
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${manifest.sourceReport.path}`)),
    manifest.sourceReport.sha256
  );
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${manifest.generator.path}`)),
    manifest.generator.sha256
  );
  assert.equal(manifest.authority.actionScriptExecuted, false);
  assert.equal(manifest.authority.originalRuntimeBaseline, false);
  assert.equal(manifest.authority.naturalPlaybackClaimed, false);
  assert.match(
    manifest.authority.authorityBoundary,
    /not Spanish translation, an original-runtime baseline/
  );
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${manifest.visualDisposition.path}`)),
    manifest.visualDisposition.sha256
  );
  assert.equal(
    manifest.visualDisposition.status,
    'verified-root-source-shared-untranslated-visual'
  );
  assert.equal(
    manifest.visualDisposition.visualClassification,
    'source-shared-untranslated-visual'
  );
  assert.equal(manifest.visualDisposition.strictAcceptanceEffect, 'none');
  assert.deepEqual(manifest.runtime.supportedLanguages, ['en', 'es']);
  assert.equal(
    manifest.runtime.visualLocalizationStatus,
    'source-shared-untranslated-visual'
  );
  assert.equal(manifest.runtime.spanishTranslationSupplied, false);
  assert.equal(manifest.runtime.naturalPlaybackStopFrame, 1);
  assert.equal(manifest.strictAcceptanceEffect, 'none');
  assert.equal(manifest.frames.length, 10);

  for (const [index, frame] of manifest.frames.entries()) {
    const expected = COURSE_G04_L09_GS_002_ROOT_FRAME_ASSETS[index];
    assert.equal(frame.frame, index + 1);
    assert.equal(frame.file, expected.file);
    assert.equal(frame.sha256, expected.sha256);
    assert.equal(frame.width, 800);
    assert.equal(frame.height, 600);
    const [archiveBytes, publicBytes] = await Promise.all([
      readFile(`${repositoryRoot}${manifest.sourceReport.archive}/${index + 1}.png`),
      readFile(
        `${repositoryRoot}public/flash-assets/courses/course-g04-l09-gs-002/root-frames/${frame.file}`
      )
    ]);
    assert.equal(sha256(archiveBytes), frame.sha256);
    assert.equal(sha256(publicBytes), frame.sha256);
    assert.deepEqual(publicBytes, archiveBytes);
  }
});

test('GS002 dedicated renderer-domain evidence has exact identity and honest blockers', async () => {
  const report = JSON.parse(
    await readFile(`${migrationRoot}/audit/renderer-frame-domain-support.json`, 'utf8')
  );
  assert.equal(report.animationId, 'course-g04-l09-gs-002');
  assert.equal(report.status, 'renderer-frame-domain-support-incomplete');
  assert.equal(report.summary.probeCount, 28);
  assert.equal(report.summary.exactIdentityCount, 28);
  assert.equal(report.summary.blockedCount, 23);
  assert.equal(report.summary.renderableCount, 5);
  assert.deepEqual(report.summary.outcomeCounts, {
    'renderable-exact': 5,
    'blocked-not-renderable': 23,
    'scenario-undeclared-by-module': 0,
    'identity-mismatch': 0,
    'probe-error': 0
  });
  const root = report.domainSupport.find(
    (domain: {frameDomain: string}) => domain.frameDomain === 'root'
  );
  assert.deepEqual(
    {
      probeCount: root.probeCount,
      exactIdentityCount: root.exactIdentityCount,
      blockedCount: root.blockedCount,
      renderableCount: root.renderableCount,
      fullyRenderable: root.fullyRenderable
    },
    {
      probeCount: 4,
      exactIdentityCount: 4,
      blockedCount: 0,
      renderableCount: 4,
      fullyRenderable: true
    }
  );
  const rootProbes = report.probes.filter(
    (probe: {request: {frameDomain: string}}) => probe.request.frameDomain === 'root'
  );
  assert.equal(
    rootProbes.filter((probe: {request: {language: string}; renderable: boolean}) =>
      probe.request.language === 'en' && probe.renderable
    ).length,
    2
  );
  assert.equal(
    rootProbes.filter((probe: {request: {language: string}; renderable: boolean}) =>
      probe.request.language === 'es' && probe.renderable
    ).length,
    2
  );
  assert.match(report.strictAcceptanceEffect, /^none;/);
});

test('GS002 candidate is discoverable only by stable placement identity', async () => {
  const byId = matchPrototype({animationId: 'course-g04-l09-gs-002'});
  const ambiguousBasename = matchPrototype({
    sourcePath: 'HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf'
  });
  assert.equal(byId?.key, 'course-g04-l09-gs-002');
  assert.equal(byId?.movie.frameCount, 653);
  assert.equal(byId?.runtime.frameCount, 10);
  assert.equal(ambiguousBasename, undefined);
  const loaded = await loadAnimationModule('course-g04-l09-gs-002');
  assert.equal(loaded?.key, 'course-g04-l09-gs-002');
  assert.equal(loaded?.playbackEndFrame, 641);
  assert.equal(loaded?.runtime?.frameCount, 10);
  assert.deepEqual(loaded?.playbackEndFrameByDomain, {root: 1, 'sprite-787': 641});
  assert.equal(loaded?.maturity, 'legacy-prototype');
});
