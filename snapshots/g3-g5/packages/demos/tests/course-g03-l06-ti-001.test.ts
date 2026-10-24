import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {loadAnimationModule} from '../src/animation-registry';
import courseTi001 from '../src/modules/course-g03-l06-ti-001';
import {matchPrototype} from '../src/prototype-manifest';
import {
  COURSE_G03_L06_TI_001_MOVIE,
  COURSE_G03_L06_TI_001_RUNTIME,
  COURSE_G03_L06_TI_001_SOURCE,
  getCourseG03L06Ti001FrameState,
  normalizeCourseG03L06Ti001Frame,
  normalizeCourseG03L06Ti001RootFrame
} from '../src/timelines/course-g03-l06-ti-001';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('TI001 candidate is bound to the preserved source and local sprite timeline', async () => {
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G03_L06_TI_001_SOURCE.swf}`)),
    COURSE_G03_L06_TI_001_SOURCE.swfSha256
  );
  assert.deepEqual(COURSE_G03_L06_TI_001_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G03_L06_TI_001_MOVIE.fps, 12);
  assert.equal(COURSE_G03_L06_TI_001_MOVIE.frameCount, 142);
  assert.equal(COURSE_G03_L06_TI_001_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G03_L06_TI_001_RUNTIME.defaultFrameDomain, 'sprite-21');
  assert.deepEqual(COURSE_G03_L06_TI_001_RUNTIME.frameDomains, [
    {id: 'sprite-21', frameCount: 142, rootFrame: 6}
  ]);
  assert.equal(courseTi001.runtime, COURSE_G03_L06_TI_001_RUNTIME);
  assert.equal(COURSE_G03_L06_TI_001_SOURCE.rootFrameCount, 10);
  assert.equal(COURSE_G03_L06_TI_001_SOURCE.localObjectId, 21);
  assert.equal(courseTi001.reducedMotionFrame, 142);
  assert.deepEqual(courseTi001.playbackEndFrameByDomain, {root: 1, 'sprite-21': 142});
});

test('TI001 pure state is one-indexed and makes both random outcomes deterministic', () => {
  assert.equal(normalizeCourseG03L06Ti001Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG03L06Ti001Frame(0), 1);
  assert.equal(normalizeCourseG03L06Ti001Frame(142.9), 142);
  assert.equal(normalizeCourseG03L06Ti001Frame(999), 142);
  assert.equal(normalizeCourseG03L06Ti001RootFrame(999), 10);
  const seed0 = getCourseG03L06Ti001FrameState(5, {
    scenario: 'sound-from-seed',
    lang: 'en',
    seed: 0
  });
  const seed1 = getCourseG03L06Ti001FrameState(5, {
    scenario: 'sound-from-seed',
    lang: 'en',
    seed: 1
  });
  const explicit0 = getCourseG03L06Ti001FrameState(142, {
    scenario: 'sound-0',
    lang: 'en',
    seed: 99
  });
  const explicit1 = getCourseG03L06Ti001FrameState(142, {
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
  assert.equal(seed0.selectedSoundLocalFrameAuthority, 'source-exact-goto-and-play-frame-2-request');
  assert.equal(explicit1.selectedSoundLocalFrame, null);
  assert.equal(explicit1.soundInstancesPresent, false);
  assert.equal(explicit1.selectedSoundLocalFrameAuthority, 'source-exact-parent-removal');
  assert.equal(explicit1.audioStartRequested, false);
  assert.equal(explicit1.audioPlaybackWindowOpen, false);
  assert.equal(explicit1.audioRendered, true);
  assert.equal(explicit1.terminalStopReached, true);
  assert.equal(explicit1.playbackState, 'source-terminal-stop');
  assert.equal(explicit1.scenarioAuthority, 'source-random-outcome-requirement');
  assert.equal(seed0.scenarioAuthority, 'implementation-capture-projection');

  const phaseUnknown = getCourseG03L06Ti001FrameState(6, {
    scenario: 'sound-0',
    lang: 'en',
    seed: 0
  });
  const beforeRemoval = getCourseG03L06Ti001FrameState(136, {
    scenario: 'sound-0',
    lang: 'en',
    seed: 0
  });
  const removed = getCourseG03L06Ti001FrameState(137, {
    scenario: 'sound-0',
    lang: 'en',
    seed: 0
  });
  assert.equal(phaseUnknown.selectedSoundLocalFrame, null);
  assert.equal(phaseUnknown.selectedSoundLocalFrameAuthority, 'runtime-tick-phase-unresolved');
  assert.equal(phaseUnknown.audioPlaybackWindowOpen, true);
  assert.equal(beforeRemoval.soundInstancesPresent, true);
  assert.equal(removed.soundInstancesPresent, false);
});

test('TI001 root domain is a separately addressable ten-frame structural background', () => {
  const root = getCourseG03L06Ti001FrameState(10, {
    frameDomain: 'root',
    rootFrame: 10,
    scenario: 'root-standalone',
    lang: 'es',
    seed: 19
  });
  assert.equal(root.frameDomain, 'root');
  assert.equal(root.frame, 10);
  assert.equal(root.rootFrame, 10);
  assert.equal(root.scenario, 'root-standalone');
  assert.equal(root.language, 'es');
  assert.equal(root.status, 'ready');
  assert.equal(root.structuralVisual, 'uniform-source-background');
  assert.equal(root.captureAuthority, 'direct-seek-structural-not-natural-playback');
  assert.equal(root.naturalPlaybackStopFrame, 1);
});

test('TI001 Spanish preserves the single shipped visual timeline and leaves spoken language unresolved', () => {
  const spanish = getCourseG03L06Ti001FrameState(14, {
    scenario: 'sound-from-seed',
    lang: 'es',
    seed: 0
  });
  assert.equal(spanish.status, 'ready');
  assert.equal(spanish.blocker, null);
  assert.equal(spanish.visualLocalizationStatus, 'source-shared-untranslated-visual');
  assert.equal(spanish.audioLocalizationStatus, 'unresolved');
  assert.equal(courseTi001.audioCues.length, 4);
  assert.deepEqual(courseTi001.audioCues.map(({frame, endFrame, frameDomain, language, spokenLanguage}) => ({frame, endFrame, frameDomain, language, spokenLanguage})), [
    {frame: 5, endFrame: 137, frameDomain: 'sprite-21', language: 'shared', spokenLanguage: 'undetermined'},
    {frame: 5, endFrame: 137, frameDomain: 'sprite-21', language: 'shared', spokenLanguage: 'undetermined'},
    {frame: 5, endFrame: 137, frameDomain: 'sprite-21', language: 'shared', spokenLanguage: 'undetermined'},
    {frame: 5, endFrame: 137, frameDomain: 'sprite-21', language: 'shared', spokenLanguage: 'undetermined'}
  ]);
  assert.deepEqual(courseTi001.audioCues.filter(({scenario}) => scenario === 'sound-from-seed').map(({seedModulo}) => seedModulo), [{divisor: 2, remainder: 0}, {divisor: 2, remainder: 1}]);
  assert.equal(courseTi001.audioTracks, undefined);
});

test('TI001 renderer exposes native local and root domains without claiming translated source text', () => {
  const requirementId = 'req-natural-sprite-21-en';
  const traceId = 'natural-sprite-21-en';
  const entryStateSha256 = 'b'.repeat(64);
  const render = (frame: number, scenario: string, lang: 'en' | 'es') => {
    const state = courseTi001.getFrameState(frame, {frame, scenario, lang, seed: 17});
    return renderToStaticMarkup(
      createElement(courseTi001.Renderer, {
        frame,
        scenario,
        lang,
        seed: 17,
        requirementId,
        traceId,
        entryStateSha256,
        state,
        onReplay: () => undefined
      })
    );
  };
  const ready = render(14, 'sound-from-seed', 'en');
  assert.match(ready, /class="faithful-stage-wrap"/);
  assert.match(ready, /data-animation-id="course-g03-l06-ti-001"/);
  assert.match(ready, /data-capture-stage="true"/);
  assert.match(ready, /data-render-state="loading"/);
  assert.match(ready, /data-flash-frame-domain="sprite-21"/);
  assert.match(ready, /data-flash-requirement-id="req-natural-sprite-21-en"/);
  assert.match(ready, /data-flash-trace-id="natural-sprite-21-en"/);
  assert.match(ready, new RegExp(`data-flash-entry-state-sha256="${entryStateSha256}"`));
  assert.match(ready, /data-flash-root-frame="6"/);
  assert.match(ready, /data-runtime-seed="17"/);
  assert.doesNotMatch(ready, /class="faithful-stage-wrap"[^>]+data-flash-frame="14"/);
  assert.match(ready, /<canvas[^>]+data-render-state="loading"/);
  assert.match(ready, /<canvas[^>]+data-render-visual="true"/);
  assert.doesNotMatch(ready, /<canvas[^>]+data-flash-frame="14"/);
  assert.match(ready, /<canvas[^>]+width="800"/);
  assert.match(ready, /<canvas[^>]+height="600"/);
  assert.match(ready, /<button[^>]*>Replay<\/button>/);

  const spanish = render(14, 'sound-from-seed', 'es');
  assert.match(spanish, /data-runtime-language="es"/);
  assert.match(spanish, /data-visual-localization-status="source-shared-untranslated-visual"/);
  assert.match(spanish, /data-audio-localization-status="unresolved"/);
  assert.match(spanish, /data-audio-rendered="true"/);
  assert.match(spanish, /<canvas/);
  assert.match(spanish, /embedded title remains English exactly as shipped/);

  const rootState = courseTi001.getFrameState(10, {
    frame: 10,
    frameDomain: 'root',
    rootFrame: 10,
    scenario: 'root-standalone',
    lang: 'es',
    seed: 17
  });
  const root = renderToStaticMarkup(
    createElement(courseTi001.Renderer, {
      frame: 10,
      frameDomain: 'root',
      rootFrame: 10,
      scenario: 'root-standalone',
      lang: 'es',
      seed: 17,
      requirementId: 'req-root-standalone-es',
      traceId: 'root-standalone-es',
      entryStateSha256,
      state: rootState,
      onReplay: () => undefined
    })
  );
  assert.match(root, /data-flash-frame-domain="root"/);
  assert.match(root, /data-flash-frame="10"/);
  assert.match(root, /data-render-state="ready"/);
  assert.match(root, /data-render-visual="true"/);
  assert.match(root, /data-flash-requirement-id="req-root-standalone-es"/);
  assert.match(root, /data-flash-trace-id="root-standalone-es"/);
  assert.match(root, /data-root-visual-authority="ffdec-static-structure"/);
  assert.doesNotMatch(root, /Versión en español no disponible/);
});

test('TI001 generated asset is current, local-only, and explicitly non-strict', async () => {
  const manifest = JSON.parse(
    await readFile(
      `${repositoryRoot}public/flash-assets/courses/course-g03-l06-ti-001/manifest.json`,
      'utf8'
    )
  ) as {
    inputs: {sourceSwf: {sha256: string}};
    output: {script: string; sha256: string};
    safety: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  const runtime = await readFile(`${repositoryRoot}${manifest.output.script}`);
  assert.equal(manifest.inputs.sourceSwf.sha256, COURSE_G03_L06_TI_001_SOURCE.swfSha256);
  assert.equal(sha256(runtime), manifest.output.sha256);
  assert.equal(manifest.safety.noDynamicEvaluation, true);
  assert.equal(manifest.safety.noNetworkPrimitives, true);
  assert.equal(manifest.safety.noTimersOrAutoplay, true);
  assert.equal(manifest.strictAcceptanceEffect, 'none');
  assert.equal(courseTi001.maturity, 'legacy-prototype');
});

test('TI001 candidate is discoverable only by stable placement identity', async () => {
  const byId = matchPrototype({animationId: 'course-g03-l06-ti-001'});
  const ambiguousBasename = matchPrototype({sourcePath: 'HELP_COURSES/ELMGR3/L6/TI/L6TI01.swf'});
  assert.equal(byId?.key, 'course-g03-l06-ti-001');
  assert.equal(byId?.movie.frameCount, 142);
  assert.equal(ambiguousBasename, undefined);
  const loaded = await loadAnimationModule('course-g03-l06-ti-001');
  assert.equal(loaded?.key, 'course-g03-l06-ti-001');
  assert.equal(loaded?.maturity, 'legacy-prototype');
});
