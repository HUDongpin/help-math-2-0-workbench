import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {loadAnimationModule} from '../src/animation-registry';
import courseIr001, {
  buildCourseG04L01Ir001CaptureAttributes
} from '../src/modules/course-g04-l01-ir-001';
import {matchPrototype} from '../src/prototype-manifest';
import {
  COURSE_G04_L01_IR_001_MOVIE,
  COURSE_G04_L01_IR_001_ROOT_FRAME_ASSETS,
  COURSE_G04_L01_IR_001_RUNTIME,
  COURSE_G04_L01_IR_001_SOURCE,
  getCourseG04L01Ir001FrameState,
  getCourseG04L01Ir001RootFrameAsset,
  normalizeCourseG04L01Ir001Frame,
  normalizeCourseG04L01Ir001RootFrame
} from '../src/timelines/course-g04-l01-ir-001';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('IR001 candidate is bound to the preserved FLA/SWF and local sprite timeline', async () => {
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L01_IR_001_SOURCE.fla}`)),
    COURSE_G04_L01_IR_001_SOURCE.flaSha256
  );
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L01_IR_001_SOURCE.swf}`)),
    COURSE_G04_L01_IR_001_SOURCE.swfSha256
  );
  assert.deepEqual(COURSE_G04_L01_IR_001_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L01_IR_001_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L01_IR_001_MOVIE.frameCount, 142);
  assert.equal(COURSE_G04_L01_IR_001_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L01_IR_001_RUNTIME.defaultFrameDomain, 'sprite-58');
  assert.deepEqual(COURSE_G04_L01_IR_001_RUNTIME.frameDomains, [
    {id: 'sprite-58', frameCount: 142, rootFrame: 6}
  ]);
  assert.equal(COURSE_G04_L01_IR_001_SOURCE.rootFrameCount, 10);
  assert.equal(COURSE_G04_L01_IR_001_SOURCE.localObjectId, 58);
  assert.equal(courseIr001.reducedMotionFrame, 142);
  assert.deepEqual(courseIr001.playbackEndFrameByDomain, {root: 1, 'sprite-58': 142});
});

test('IR001 pure state is one-indexed and makes both random outcomes deterministic', () => {
  assert.equal(normalizeCourseG04L01Ir001Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L01Ir001Frame(0), 1);
  assert.equal(normalizeCourseG04L01Ir001Frame(142.9), 142);
  assert.equal(normalizeCourseG04L01Ir001Frame(999), 142);
  const seed0 = getCourseG04L01Ir001FrameState(5, {
    scenario: 'sound-from-seed',
    lang: 'en',
    seed: 0
  });
  const seed1 = getCourseG04L01Ir001FrameState(5, {
    scenario: 'sound-from-seed',
    lang: 'en',
    seed: 1
  });
  const explicit0 = getCourseG04L01Ir001FrameState(142, {
    scenario: 'sound-0',
    lang: 'en',
    seed: 99
  });
  const explicit1 = getCourseG04L01Ir001FrameState(142, {
    scenario: 'sound-1',
    lang: 'en',
    seed: 0
  });
  assert.equal(seed0.soundOutcome, 0);
  assert.equal(seed1.soundOutcome, 1);
  assert.equal(explicit0.soundOutcome, 0);
  assert.equal(explicit1.soundOutcome, 1);
  assert.equal(seed0.audioStartRequested, true);
  assert.equal(seed0.selectedSoundLocalFrame, 2);
  assert.equal(explicit1.selectedSoundLocalFrame, 135);
  assert.equal(explicit1.audioRendered, false);
  assert.equal(explicit1.audioStatus, 'blocked-not-rendered');
  assert.equal(explicit1.hostIntegrationStatus, 'blocked-not-reconstructed');
});

test('IR001 root state addresses all ten authoritative standalone captures exactly', () => {
  assert.equal(normalizeCourseG04L01Ir001RootFrame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L01Ir001RootFrame(0), 1);
  assert.equal(normalizeCourseG04L01Ir001RootFrame(99), 10);
  assert.equal(COURSE_G04_L01_IR_001_ROOT_FRAME_ASSETS.length, 10);
  assert.equal(getCourseG04L01Ir001RootFrameAsset(10).file, 'frame-0010.png');

  for (let frame = 1; frame <= 10; frame += 1) {
    const state = getCourseG04L01Ir001FrameState(frame, {
      frameDomain: 'root',
      scenario: 'root-standalone',
      lang: 'en',
      seed: 17
    });
    assert.equal(state.frameDomain, 'root');
    assert.equal(state.frame, frame);
    assert.equal(state.rootFrame, frame);
    assert.equal(state.scenario, 'root-standalone');
    assert.equal(state.status, 'ready');
    assert.equal(state.renderingAuthority, 'authoritative-adobe-standalone-capture-raster');
    assert.equal(state.runtimeReachability, 'authoritative-standalone-step-only');
    assert.equal(state.audioStatus, 'blocked-not-rendered');
    assert.equal(state.hostIntegrationStatus, 'blocked-not-reconstructed');
    assert.equal(state.soundOutcome, null);
    assert.equal(state.rootAssetFile, `frame-${String(frame).padStart(4, '0')}.png`);
  }
});

test('IR001 public root assets are byte-identical to the hash-bound Adobe baseline', async () => {
  const baselineBytes = await readFile(
    `${repositoryRoot}${COURSE_G04_L01_IR_001_SOURCE.rootStandaloneBaseline}`
  );
  assert.equal(
    sha256(baselineBytes),
    COURSE_G04_L01_IR_001_SOURCE.rootStandaloneBaselineSha256
  );
  const baseline = JSON.parse(baselineBytes.toString('utf8')) as {
    runtime: {stage: {width: number; height: number}; frameCount: number; lang: string};
    frames: Array<{frame: number; file: string; sha256: string}>;
  };
  const publicManifestBytes = await readFile(
    `${repositoryRoot}${COURSE_G04_L01_IR_001_SOURCE.rootStandaloneAssetManifest}`
  );
  const publicManifest = JSON.parse(publicManifestBytes.toString('utf8')) as {
    frameDomain: string;
    scenario: string;
    baseline: {sha256: string; frameCount: number; language: string};
    frames: Array<{frame: number; file: string; sha256: string}>;
    strictAcceptanceEffect: string;
  };
  assert.equal(baseline.runtime.frameCount, 10);
  assert.deepEqual(baseline.runtime.stage, {width: 800, height: 600});
  assert.equal(publicManifest.frameDomain, 'root');
  assert.equal(publicManifest.scenario, 'root-standalone');
  assert.equal(publicManifest.baseline.sha256, sha256(baselineBytes));
  assert.equal(publicManifest.baseline.frameCount, 10);
  assert.equal(publicManifest.baseline.language, 'en');
  assert.equal(publicManifest.strictAcceptanceEffect, 'none');
  assert.deepEqual(publicManifest.frames, COURSE_G04_L01_IR_001_ROOT_FRAME_ASSETS);

  for (const row of publicManifest.frames) {
    const baselineRow = baseline.frames.find(({frame}) => frame === row.frame);
    assert.ok(baselineRow);
    assert.equal(row.sha256, baselineRow.sha256);
    const publicBytes = await readFile(
      `${repositoryRoot}public/flash-assets/courses/course-g04-l01-ir-001/root-standalone/${row.file}`
    );
    const baselineFrameBytes = await readFile(
      `${repositoryRoot}artifacts/full-frame/pilot-baselines/course-g04-l01-ir-001/adobe-flash-player-32-standalone-default/${baselineRow.file}`
    );
    assert.equal(sha256(publicBytes), row.sha256);
    assert.equal(publicBytes.equals(baselineFrameBytes), true);
    assert.equal(publicBytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.deepEqual(
      {width: publicBytes.readUInt32BE(16), height: publicBytes.readUInt32BE(20)},
      {width: 800, height: 600}
    );
  }
});

test('IR001 preserves the same source visual for Spanish without accepting audio', () => {
  const spanish = getCourseG04L01Ir001FrameState(14, {
    scenario: 'sound-from-seed',
    lang: 'es',
    seed: 0
  });
  assert.equal(spanish.status, 'ready');
  assert.equal(spanish.blocker, null);
  assert.equal(spanish.visualLocalizationStatus, 'source-shared-untranslated-visual');
  assert.equal(spanish.audioLocalizationStatus, 'unresolved');
  assert.equal(spanish.audioStatus, 'blocked-not-rendered');
  assert.equal(spanish.audioRendered, false);
  const spanishRoot = getCourseG04L01Ir001FrameState(10, {
    frameDomain: 'root',
    scenario: 'root-standalone',
    lang: 'es',
    seed: 0
  });
  assert.equal(spanishRoot.frameDomain, 'root');
  assert.equal(spanishRoot.status, 'ready');
  assert.equal(spanishRoot.blocker, null);
  assert.equal(spanishRoot.visualLocalizationStatus, 'source-shared-untranslated-visual');
  assert.equal(spanishRoot.audioStatus, 'blocked-not-rendered');
  assert.equal(courseIr001.audioCues.length, 0);
  assert.equal(courseIr001.audioTracks, undefined);
});

test('IR001 renderer exposes the fixed source visual in both requested language contexts', () => {
  const render = (
    frame: number,
    scenario: string,
    lang: 'en' | 'es',
    frameDomain: 'root' | 'sprite-58' = 'sprite-58'
  ) => {
    const state = courseIr001.getFrameState(frame, {frame, frameDomain, scenario, lang, seed: 17});
    return renderToStaticMarkup(
      createElement(courseIr001.Renderer, {
        frame,
        frameDomain,
        scenario,
        lang,
        seed: 17,
        state,
        onReplay: () => undefined
      })
    );
  };
  const ready = render(14, 'sound-from-seed', 'en');
  assert.match(ready, /class="faithful-stage-wrap"/);
  assert.match(ready, /data-flash-frame-domain="sprite-58"/);
  assert.match(ready, /data-flash-root-frame="6"/);
  assert.match(ready, /data-runtime-seed="17"/);
  assert.match(ready, /<canvas[^>]+width="800"/);
  assert.match(ready, /<canvas[^>]+height="600"/);
  assert.match(ready, /<button[^>]*>Replay<\/button>/);

  const root = render(10, 'root-standalone', 'en', 'root');
  assert.match(root, /data-flash-frame-domain="root"/);
  assert.match(root, /data-flash-root-frame="10"/);
  assert.match(root, /data-runtime-scenario="root-standalone"/);
  assert.match(root, /data-rendering-authority="authoritative-adobe-standalone-capture-raster"/);
  assert.match(root, /<canvas[^>]+width="800"/);
  assert.doesNotMatch(root, /data-capture-stage=/, 'the loading Canvas must not claim capture readiness');

  const spanish = render(14, 'sound-from-seed', 'es');
  assert.match(spanish, /data-runtime-language="es"/);
  assert.match(spanish, /data-visual-localization-status="source-shared-untranslated-visual"/);
  assert.match(spanish, /data-audio-localization-status="unresolved"/);
  assert.match(spanish, /<canvas[^>]+width="800"/);
  assert.doesNotMatch(spanish, /data-fail-closed-reason=/);
  assert.match(spanish, /Se conserva sin traducir la única secuencia visual de la fuente/);
});

test('IR001 marks only a ready visual Canvas with the complete deterministic capture identity', () => {
  const state = courseIr001.getFrameState(10, {
    frame: 10,
    frameDomain: 'root',
    scenario: 'root-standalone',
    lang: 'en',
    seed: 0
  });
  const identity = {
    entryStateSha256: '4dfbb3290627139f130afd170b4c6d925c09dd7262e32d9cbc1e1142632f9deb',
    requirementId: 'req:root:root-standalone:en',
    traceId: 'trace:root:root-standalone:en:seed-0'
  };
  const ready = buildCourseG04L01Ir001CaptureAttributes({
    canvasStatus: 'ready',
    state,
    ...identity
  });
  assert.equal(ready['data-capture-stage'], 'true');
  assert.equal(ready['data-render-state'], 'ready');
  assert.equal(ready['data-render-visual'], 'true');
  assert.equal(ready['data-flash-frame'], 10);
  assert.equal(ready['data-flash-frame-domain'], 'root');
  assert.equal(ready['data-flash-root-frame'], 10);
  assert.equal(ready['data-flash-entry-state-sha256'], identity.entryStateSha256);
  assert.equal(ready['data-flash-requirement-id'], identity.requirementId);
  assert.equal(ready['data-flash-trace-id'], identity.traceId);

  const loading = buildCourseG04L01Ir001CaptureAttributes({
    canvasStatus: 'loading',
    state,
    ...identity
  });
  assert.equal(loading['data-capture-stage'], undefined);
  assert.equal(loading['data-render-visual'], undefined);
  assert.equal(loading['data-render-state'], 'loading');

  const missingIdentity = buildCourseG04L01Ir001CaptureAttributes({
    canvasStatus: 'ready',
    state,
    entryStateSha256: '',
    requirementId: '',
    traceId: ''
  });
  assert.equal(missingIdentity['data-capture-stage'], undefined);
  assert.equal(missingIdentity['data-render-visual'], 'true');
});

test('IR001 generated asset is current, local-only, and explicitly non-strict', async () => {
  const manifest = JSON.parse(
    await readFile(
      `${repositoryRoot}public/flash-assets/courses/course-g04-l01-ir-001/manifest.json`,
      'utf8'
    )
  ) as {
    inputs: {sourceSwf: {sha256: string}};
    output: {script: string; sha256: string};
    safety: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  const runtime = await readFile(`${repositoryRoot}${manifest.output.script}`);
  assert.equal(manifest.inputs.sourceSwf.sha256, COURSE_G04_L01_IR_001_SOURCE.swfSha256);
  assert.equal(sha256(runtime), manifest.output.sha256);
  assert.equal(manifest.safety.noDynamicEvaluation, true);
  assert.equal(manifest.safety.noNetworkPrimitives, true);
  assert.equal(manifest.safety.noTimersOrAutoplay, true);
  assert.equal(manifest.strictAcceptanceEffect, 'none');
  assert.equal(courseIr001.maturity, 'legacy-prototype');
  assert.equal(courseIr001.scenarios.some(({id}) => id === 'root-standalone'), true);
});

test('IR001 candidate is discoverable only by stable placement identity', async () => {
  const byId = matchPrototype({animationId: 'course-g04-l01-ir-001'});
  const ambiguousBasename = matchPrototype({sourcePath: 'HELP_COURSES/ELMGR4/L1/IR/L1RW01.swf'});
  assert.equal(byId?.key, 'course-g04-l01-ir-001');
  assert.equal(byId?.movie.frameCount, 142);
  assert.equal(ambiguousBasename, undefined);
  const loaded = await loadAnimationModule('course-g04-l01-ir-001');
  assert.equal(loaded?.key, 'course-g04-l01-ir-001');
  assert.equal(loaded?.maturity, 'legacy-prototype');
});
