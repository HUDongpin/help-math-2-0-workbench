import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {loadAnimationModule} from '../src/animation-registry';
import courseTs008 from '../src/modules/course-g03-l01-ts-008';
import {matchPrototype} from '../src/prototype-manifest';
import {
  COURSE_G03_L01_TS_008_MOVIE,
  COURSE_G03_L01_TS_008_ROOT_FRAME_ASSETS,
  COURSE_G03_L01_TS_008_RUNTIME,
  COURSE_G03_L01_TS_008_SCENARIOS,
  COURSE_G03_L01_TS_008_SOURCE,
  getCourseG03L01Ts008FrameState,
  normalizeCourseG03L01Ts008Frame,
  normalizeCourseG03L01Ts008RootFrame
} from '../src/timelines/course-g03-l01-ts-008';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRoot = `${repositoryRoot}migrations/course-g03-l01-ts-008`;

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('TS008 candidate is bound to the preserved SWF, external audio, and local frame domain', async () => {
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G03_L01_TS_008_SOURCE.swf}`)),
    COURSE_G03_L01_TS_008_SOURCE.swfSha256
  );
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G03_L01_TS_008_SOURCE.externalAudio}`)),
    COURSE_G03_L01_TS_008_SOURCE.externalAudioSha256
  );
  assert.deepEqual(COURSE_G03_L01_TS_008_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G03_L01_TS_008_MOVIE.fps, 12);
  assert.equal(COURSE_G03_L01_TS_008_MOVIE.frameCount, 747);
  assert.equal(COURSE_G03_L01_TS_008_SOURCE.rootFrameCount, 10);
  assert.equal(COURSE_G03_L01_TS_008_SOURCE.localObjectId, 348);
  assert.equal(COURSE_G03_L01_TS_008_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G03_L01_TS_008_RUNTIME.defaultFrameDomain, 'sprite-348');
  assert.deepEqual(COURSE_G03_L01_TS_008_RUNTIME.frameDomains, [
    {id: 'sprite-348', frameCount: 747, rootFrame: 6}
  ]);
  assert.equal(courseTs008.runtime, COURSE_G03_L01_TS_008_RUNTIME);
  assert.equal(courseTs008.playbackEndFrame, 295);
  assert.deepEqual(courseTs008.playbackEndFrameByDomain, {root: 1, 'sprite-348': 295});
  assert.equal(courseTs008.reducedMotionFrame, 295);
});

test('TS008 pure frame state is one-indexed, deterministic, and explicitly source-drawing-only', () => {
  assert.equal(normalizeCourseG03L01Ts008Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG03L01Ts008Frame(0), 1);
  assert.equal(normalizeCourseG03L01Ts008Frame(295.9), 295);
  assert.equal(normalizeCourseG03L01Ts008Frame(999), 747);
  const first = getCourseG03L01Ts008FrameState(1, {
    scenario: 'source-drawing-default',
    lang: 'en',
    seed: 0
  });
  const stop = getCourseG03L01Ts008FrameState(295, {
    scenario: 'source-drawing-default',
    lang: 'en',
    seed: -1
  });
  assert.equal(first.frame, 1);
  assert.equal(first.exportFrame, 0);
  assert.equal(first.rootFrame, 6);
  assert.equal(first.status, 'ready');
  assert.equal(stop.frameDomain, 'sprite-348');
  assert.equal(stop.seed, 4294967295);
  assert.equal(stop.sourceDrawingOnly, true);
  assert.equal(stop.interactiveStateResolved, false);
  assert.equal(stop.scoringResolved, false);
  assert.equal(stop.visualLocalizationStatus, 'source-shared-untranslated-visual');
  assert.equal(stop.audioLocalizationStatus, 'unresolved');
  assert.equal(stop.audioRendered, false);
});

test('TS008 root domain resolves exact English standalone frames without claiming host behavior', () => {
  assert.equal(normalizeCourseG03L01Ts008RootFrame(Number.NaN), 1);
  assert.equal(normalizeCourseG03L01Ts008RootFrame(99), 10);
  const root = getCourseG03L01Ts008FrameState(10, {
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
  assert.equal(root.language, 'en');
  assert.equal(root.status, 'ready');
  assert.equal(root.blocker, null);
  assert.equal(root.sourceDrawingOnly, false);
  assert.equal(root.naturalPlaybackStopFrame, 1);
  assert.equal(root.originalHostStateResolved, false);
  assert.equal(root.captureAuthority, 'adobe-standalone-deterministic-step-root-only');
  assert.equal(
    root.rootFrameAsset.source,
    '/flash-assets/courses/course-g03-l01-ts-008/root-frames/frame-0010.png'
  );
  assert.equal(
    root.rootFrameAsset.sha256,
    'ef821b3f9df3d6983fef9c11206ebc7f9e3e924ce969bb7f654a9fbe9bb171ed'
  );
});

test('TS008 source pixels are shared for Spanish while every test/host branch stays blocked', async () => {
  const expected = new Map([
    ['answer-correct-unavailable', 'correct-answer-host-state-unresolved'],
    ['answer-first-wrong-unavailable', 'first-wrong-answer-host-state-unresolved'],
    ['answer-second-wrong-unavailable', 'second-wrong-answer-host-state-unresolved'],
    ['glossary-popup-unavailable', 'glossary-popup-host-state-unresolved'],
    [
      'completion-scoring-replay-unavailable',
      'completion-scoring-replay-host-state-unresolved'
    ]
  ]);
  for (const [scenario, blocker] of expected) {
    for (const lang of ['en', 'es'] as const) {
      const state = getCourseG03L01Ts008FrameState(295, {scenario, lang, seed: 0});
      assert.equal(state.status, 'blocked');
      assert.equal(state.blocker, blocker);
      assert.equal(state.audioRendered, false);
    }
  }
  const spanish = getCourseG03L01Ts008FrameState(295, {
    scenario: 'source-drawing-default',
    lang: 'es',
    seed: 0
  });
  assert.equal(spanish.status, 'ready');
  assert.equal(spanish.blocker, null);
  assert.equal(spanish.sourceDrawingOnly, true);
  assert.equal(spanish.visualLocalizationStatus, 'source-shared-untranslated-visual');
  assert.equal(spanish.audioLocalizationStatus, 'unresolved');
  assert.equal(spanish.audioRendered, false);
  const spanishRoot = getCourseG03L01Ts008FrameState(10, {
    frameDomain: 'root',
    rootFrame: 10,
    scenario: 'root-standalone',
    lang: 'es',
    seed: 0
  });
  assert.equal(spanishRoot.frameDomain, 'root');
  assert.equal(spanishRoot.scenario, 'root-standalone');
  assert.equal(spanishRoot.status, 'ready');
  assert.equal(spanishRoot.blocker, null);
  assert.equal(spanishRoot.audioRendered, false);
  assert.equal(courseTs008.audioCues.length, 0);
  assert.deepEqual(courseTs008.audioTracks, [
    {
      id: 'course-g03-l01-ts-008-es-host-audio',
      language: 'es',
      label: 'Audio en español',
      source: '/flash-assets/audio/courses/course-g03-l01-ts-008/es.mp3',
      durationMs: 9408,
      sha256: 'e81753a65c066c3b0112abf7dda689712a15aa022c8cc5ee7b4e38724c9fb734',
      activation: 'user',
      visibleWhen: ['es'],
      frameDomains: ['sprite-348'],
      timelineBehavior: 'pause-while-playing'
    }
  ]);
  assert.equal(
    sha256(await readFile(`${repositoryRoot}public/flash-assets/audio/courses/course-g03-l01-ts-008/es.mp3`)),
    courseTs008.audioTracks?.[0]?.sha256
  );
  assert.deepEqual(
    courseTs008.scenarios.map(({id}) => id),
    [...COURSE_G03_L01_TS_008_SCENARIOS]
  );
});

test('TS008 pure state exhaustively preserves the 747-frame source-drawing boundary', () => {
  const blockedScenarios = new Map([
    ['answer-correct-unavailable', 'correct-answer-host-state-unresolved'],
    ['answer-first-wrong-unavailable', 'first-wrong-answer-host-state-unresolved'],
    ['answer-second-wrong-unavailable', 'second-wrong-answer-host-state-unresolved'],
    ['glossary-popup-unavailable', 'glossary-popup-host-state-unresolved'],
    [
      'completion-scoring-replay-unavailable',
      'completion-scoring-replay-host-state-unresolved'
    ]
  ]);

  for (let frame = 1; frame <= COURSE_G03_L01_TS_008_SOURCE.localFrameCount; frame += 1) {
    for (const lang of ['en', 'es'] as const) {
      const sourceDrawing = getCourseG03L01Ts008FrameState(frame, {
        frameDomain: 'sprite-348',
        scenario: 'source-drawing-default',
        lang,
        seed: 0
      });
      assert.equal(sourceDrawing.frameDomain, 'sprite-348');
      assert.equal(sourceDrawing.frame, frame);
      assert.equal(sourceDrawing.exportFrame, frame - 1);
      assert.equal(sourceDrawing.scenario, 'source-drawing-default');
      assert.equal(sourceDrawing.language, lang);
      assert.equal(sourceDrawing.status, 'ready');
      assert.equal(sourceDrawing.blocker, null);
      assert.equal(sourceDrawing.sourceDrawingOnly, true);
      assert.equal(sourceDrawing.interactiveStateResolved, false);
      assert.equal(sourceDrawing.scoringResolved, false);
      assert.equal(sourceDrawing.audioRendered, false);

      for (const [scenario, blocker] of blockedScenarios) {
        const interaction = getCourseG03L01Ts008FrameState(frame, {
          frameDomain: 'sprite-348',
          scenario,
          lang,
          seed: 0
        });
        assert.equal(interaction.frameDomain, 'sprite-348');
        assert.equal(interaction.frame, frame);
        assert.equal(interaction.exportFrame, frame - 1);
        assert.equal(interaction.scenario, scenario);
        assert.equal(interaction.language, lang);
        assert.equal(interaction.status, 'blocked');
        assert.equal(interaction.blocker, blocker);
        assert.equal(interaction.interactiveStateResolved, false);
        assert.equal(interaction.scoringResolved, false);
        assert.equal(interaction.audioRendered, false);
      }
    }
  }
});

test('TS008 hash-bound host contracts do not masquerade as runtime branch evidence', async () => {
  const bindingBytes = await readFile(`${migrationRoot}/audit/host-function-binding.json`);
  const binding = JSON.parse(bindingBytes.toString('utf8')) as {
    status: string;
    authority: Record<string, boolean | string>;
    childActionScript: {path: string; sha256: string};
    sourceContracts: {
      correctAnswer: {
        childCalls: string;
        deterministicVariantMappingResolved: boolean;
        randomExpression: string;
      };
      wrongAnswer: {
        childCalls: string;
        deterministicVariantMappingResolved: boolean;
        randomExpression: string;
      };
      glossary: {spanishGlossaryProtocolResolved: boolean};
      replay: {fullStateResetResolved: boolean};
    };
  };

  assert.equal(binding.status, 'source-contract-proven-runtime-state-unresolved');
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${binding.childActionScript.path}`)),
    binding.childActionScript.sha256
  );
  assert.equal(binding.authority.childToHostFunctionNamesSourceProven, true);
  assert.equal(binding.authority.hostFunctionBodiesSourceProven, true);
  assert.equal(binding.authority.originalRuntimeExecutionObserved, false);
  assert.equal(binding.authority.randomOutcomeMappingResolved, false);
  assert.equal(binding.authority.retryAndForcedContinuationResolved, false);
  assert.equal(binding.authority.scoringResolved, false);
  assert.equal(binding.authority.terminalStateResolved, false);
  assert.equal(binding.authority.audioExecutedOrAccepted, false);
  assert.equal(binding.authority.strictAcceptanceEffect, 'none');
  assert.deepEqual(
    {
      call: binding.sourceContracts.correctAnswer.childCalls,
      random: binding.sourceContracts.correctAnswer.randomExpression,
      resolved: binding.sourceContracts.correctAnswer.deterministicVariantMappingResolved
    },
    {call: '_root.showRightFeed', random: 'random(4) + 1', resolved: false}
  );
  assert.deepEqual(
    {
      call: binding.sourceContracts.wrongAnswer.childCalls,
      random: binding.sourceContracts.wrongAnswer.randomExpression,
      resolved: binding.sourceContracts.wrongAnswer.deterministicVariantMappingResolved
    },
    {call: '_root.showWrongFeed', random: 'random(3) + 1', resolved: false}
  );
  assert.equal(binding.sourceContracts.glossary.spanishGlossaryProtocolResolved, false);
  assert.equal(binding.sourceContracts.replay.fullStateResetResolved, false);
});

test('TS008 renderer exposes a native Canvas and omits it for blocked states', () => {
  const render = (frame: number, scenario: string, lang: 'en' | 'es') => {
    const state = courseTs008.getFrameState(frame, {frame, scenario, lang, seed: 17});
    return renderToStaticMarkup(
      createElement(courseTs008.Renderer, {
        frame,
        scenario,
        lang,
        seed: 17,
        state,
        onReplay: () => undefined
      })
    );
  };
  const ready = render(295, 'source-drawing-default', 'en');
  assert.match(ready, /class="faithful-stage-wrap"/);
  assert.match(ready, /data-flash-frame-domain="sprite-348"/);
  assert.match(ready, /data-flash-root-frame="6"/);
  assert.match(ready, /data-runtime-seed="17"/);
  assert.match(ready, /<canvas[^>]+width="800"/);
  assert.match(ready, /<canvas[^>]+height="600"/);
  assert.match(ready, /<button[^>]*>Replay<\/button>/);
  assert.match(ready, /Source-drawing inspection only/);

  const spanish = render(295, 'source-drawing-default', 'es');
  assert.match(spanish, /data-runtime-language="es"/);
  assert.match(spanish, /data-visual-localization="source-shared-untranslated-visual"/);
  assert.match(spanish, /data-visual-localization-status="source-shared-untranslated-visual"/);
  assert.match(spanish, /data-audio-localization-status="unresolved"/);
  assert.match(spanish, /data-audio-rendered="false"/);
  assert.match(spanish, /<canvas[^>]+width="800"/);
  assert.doesNotMatch(spanish, /data-fail-closed-reason/);

  const scoring = render(295, 'completion-scoring-replay-unavailable', 'en');
  assert.match(scoring, /Completion, scoring, and source Replay unavailable/);
  assert.doesNotMatch(scoring, /<canvas/);
  const spanishScoring = render(295, 'completion-scoring-replay-unavailable', 'es');
  assert.match(
    spanishScoring,
    /data-fail-closed-reason="completion-scoring-replay-host-state-unresolved"/
  );
  assert.doesNotMatch(spanishScoring, /<canvas/);
});

test('TS008 inner Canvas exposes the exact schema-v4 deterministic capture identity', () => {
  const entryStateSha256 = 'dc78597804254203703c3d81f5b389dd51bff069cb4375baea1c32d971ac3ce2';
  const requirementId = 'req:sprite-348:source-drawing-default:en';
  const traceId = 'trace:sprite-348:source-drawing-default:en:seed-17';
  const state = getCourseG03L01Ts008FrameState(295, {
    frameDomain: 'sprite-348',
    scenario: 'source-drawing-default',
    lang: 'en',
    seed: 17
  });
  const markup = renderToStaticMarkup(
    createElement(courseTs008.Renderer, {
      frame: 295,
      frameDomain: 'sprite-348',
      scenario: 'source-drawing-default',
      lang: 'en',
      seed: 17,
      requirementId,
      traceId,
      entryStateSha256,
      state
    })
  );
  const canvas = markup.match(/<canvas\b[^>]*>/)?.[0];
  assert.ok(canvas, 'expected the nested Canvas visual');
  assert.match(canvas, /data-animation-id="course-g03-l01-ts-008"/);
  assert.match(canvas, new RegExp(`data-flash-entry-state-sha256="${entryStateSha256}"`));
  assert.match(canvas, /data-flash-frame="295"/);
  assert.match(canvas, /data-flash-frame-domain="sprite-348"/);
  assert.match(canvas, new RegExp(`data-flash-requirement-id="${requirementId}"`));
  assert.match(canvas, /data-flash-root-frame="6"/);
  assert.match(canvas, new RegExp(`data-flash-trace-id="${traceId}"`));
  assert.match(canvas, /data-render-state="loading"/);
  assert.match(canvas, /data-render-visual="true"/);
  assert.match(canvas, /data-runtime-language="en"/);
  assert.match(canvas, /data-runtime-scenario="source-drawing-default"/);
  assert.match(canvas, /data-runtime-seed="17"/);
});

test('TS008 renderer exposes the same hash-bound root frame for English and Spanish contexts', () => {
  const entryStateSha256 = 'e14d4055a3423625f5d527da156620cc160a8927660136703761e681527526a5';
  const state = getCourseG03L01Ts008FrameState(7, {
    frameDomain: 'root',
    rootFrame: 7,
    scenario: 'root-standalone',
    lang: 'en',
    seed: 0
  });
  const markup = renderToStaticMarkup(
    createElement(courseTs008.Renderer, {
      frame: 7,
      frameDomain: 'root',
      rootFrame: 7,
      scenario: 'root-standalone',
      lang: 'en',
      seed: 0,
      requirementId: 'req:root:root-standalone:en',
      traceId: 'trace:root:root-standalone:en:seed-0',
      entryStateSha256,
      state
    })
  );
  assert.match(markup, /data-animation-id="course-g03-l01-ts-008"/);
  assert.match(markup, /data-capture-stage="true"/);
  assert.match(markup, /data-flash-frame="7"/);
  assert.match(markup, /data-flash-frame-domain="root"/);
  assert.match(markup, /data-flash-root-frame="7"/);
  assert.match(markup, /data-flash-requirement-id="req:root:root-standalone:en"/);
  assert.match(markup, /data-flash-trace-id="trace:root:root-standalone:en:seed-0"/);
  assert.match(markup, new RegExp(`data-flash-entry-state-sha256="${entryStateSha256}"`));
  assert.match(markup, /data-render-state="ready"/);
  assert.match(markup, /data-root-visual-authority="adobe-standalone-deterministic-step-root-only"/);
  assert.match(markup, /root-frames\/frame-0007\.png/);
  assert.match(markup, /data-root-frame-sha256="ef821b3f/);
  assert.doesNotMatch(markup, /<canvas/);

  const spanishState = getCourseG03L01Ts008FrameState(7, {
    frameDomain: 'root',
    rootFrame: 7,
    scenario: 'root-standalone',
    lang: 'es',
    seed: 0
  });
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseTs008.Renderer, {
      frame: 7,
      frameDomain: 'root',
      rootFrame: 7,
      scenario: 'root-standalone',
      lang: 'es',
      seed: 0,
      state: spanishState
    })
  );
  assert.match(spanishMarkup, /data-render-state="ready"/);
  assert.match(spanishMarkup, /data-runtime-language="es"/);
  assert.match(spanishMarkup, /data-visual-localization="source-shared-untranslated-visual"/);
  assert.match(spanishMarkup, /root-frames\/frame-0007\.png/);
  assert.match(spanishMarkup, /data-root-frame-sha256="ef821b3f/);
  assert.doesNotMatch(spanishMarkup, /<canvas/);
});

test('TS008 generated asset is hash-bound, static, local-only, and explicitly non-strict', async () => {
  const manifest = JSON.parse(
    await readFile(
      `${repositoryRoot}public/flash-assets/courses/course-g03-l01-ts-008/manifest.json`,
      'utf8'
    )
  ) as {
    inputs: {
      sourceSwf: {sha256: string};
      bilingualVisualDisposition: {path: string; sha256: string};
    };
    output: {script: string; sha256: string};
    safety: Record<string, boolean | string[]>;
    timeline: {
      deterministicContentTimeline: {frameCount: number; playbackMode: string};
      supportedLanguages: string[];
      visualLocalization: string;
    };
    unresolved: string[];
    strictAcceptanceEffect: string;
  };
  const runtime = await readFile(`${repositoryRoot}${manifest.output.script}`);
  const spec = JSON.parse(
    await readFile(`${migrationRoot}/audit/canvas-adapter-spec.json`, 'utf8')
  ) as {
    evidence: {
      bilingualVisualDisposition: string;
      bilingualVisualDispositionSha256: string;
    };
    runtimeContract: {
      kind: string;
      supportedLanguages: string[];
      visualLocalization: string;
      unresolved: string[];
    };
  };
  assert.equal(manifest.inputs.sourceSwf.sha256, COURSE_G03_L01_TS_008_SOURCE.swfSha256);
  assert.equal(sha256(runtime), manifest.output.sha256);
  assert.equal(manifest.safety.noLegacyActionScriptExecuted, true);
  assert.equal(manifest.safety.noDynamicEvaluation, true);
  assert.equal(manifest.safety.noNetworkPrimitives, true);
  assert.equal(manifest.safety.noTimersOrAutoplay, true);
  assert.equal(manifest.timeline.deterministicContentTimeline.frameCount, 747);
  assert.equal(manifest.timeline.deterministicContentTimeline.playbackMode, 'state-explorer');
  assert.equal(spec.runtimeContract.kind, 'structural-local-frame');
  assert.deepEqual(spec.runtimeContract.supportedLanguages, ['en', 'es']);
  assert.deepEqual(manifest.timeline.supportedLanguages, ['en', 'es']);
  assert.equal(
    manifest.timeline.visualLocalization,
    spec.runtimeContract.visualLocalization
  );
  assert.equal(
    manifest.inputs.bilingualVisualDisposition.path,
    spec.evidence.bilingualVisualDisposition
  );
  assert.equal(
    manifest.inputs.bilingualVisualDisposition.sha256,
    spec.evidence.bilingualVisualDispositionSha256
  );
  assert.match(spec.runtimeContract.unresolved.join(' '), /scoring/);
  assert.match(spec.runtimeContract.unresolved.join(' '), /not a Spanish translation/);
  assert.match(manifest.unresolved.join(' '), /authoritative baseline/);
  assert.equal(manifest.strictAcceptanceEffect, 'none');
  assert.equal(courseTs008.maturity, 'legacy-prototype');
});

test('TS008 root implementation assets exactly copy the hash-bound standalone frames', async () => {
  const root = `${repositoryRoot}public/flash-assets/courses/course-g03-l01-ts-008/root-frames/`;
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
  assert.equal(manifest.animationId, 'course-g03-l01-ts-008');
  assert.equal(manifest.source.swfSha256, COURSE_G03_L01_TS_008_SOURCE.swfSha256);
  assert.equal(manifest.runtime.frameDomain, 'root');
  assert.equal(manifest.runtime.frameCount, 10);
  assert.equal(manifest.runtime.language, 'en');
  assert.equal(manifest.frames.length, 10);
  assert.equal(manifest.strictAcceptanceEffect, 'none');
  assert.match(manifest.sourceReport.authorityBoundary, /not natural host traversal/);
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${manifest.sourceReport.path}`)),
    manifest.sourceReport.sha256
  );
  assert.deepEqual(
    manifest.frames.map(({frame, file, sha256: hash}) => ({frame, file, sha256: hash})),
    COURSE_G03_L01_TS_008_ROOT_FRAME_ASSETS
  );
  for (const frame of manifest.frames) {
    const bytes = await readFile(`${root}${frame.file}`);
    assert.equal(bytes.length, frame.bytes, frame.file);
    assert.equal(sha256(bytes), frame.sha256, frame.file);
    assert.equal(frame.width, 800, frame.file);
    assert.equal(frame.height, 600, frame.file);
  }
});

test('TS008 candidate is discoverable only by stable placement identity', async () => {
  const byId = matchPrototype({animationId: 'course-g03-l01-ts-008'});
  const ambiguousBasename = matchPrototype({
    sourcePath: 'HELP_COURSES/ELMGR3/L1/TS/L1TS08.swf'
  });
  assert.equal(byId?.key, 'course-g03-l01-ts-008');
  assert.equal(byId?.movie.frameCount, 747);
  assert.equal(ambiguousBasename, undefined);
  const loaded = await loadAnimationModule('course-g03-l01-ts-008');
  assert.equal(loaded?.key, 'course-g03-l01-ts-008');
  assert.equal(loaded?.runtime?.frameCount, 10);
  assert.deepEqual(loaded?.scenarios.map(({id}) => id), [...COURSE_G03_L01_TS_008_SCENARIOS]);
  assert.equal(loaded?.playbackEndFrame, 295);
  assert.equal(loaded?.maturity, 'legacy-prototype');
});
