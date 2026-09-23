import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {loadAnimationModule} from '../src/animation-registry';
import courseVb004 from '../src/modules/course-g03-l01-vb-004';
import {matchPrototype} from '../src/prototype-manifest';
import {
  COURSE_G03_L01_VB_004_MOVIE,
  COURSE_G03_L01_VB_004_PLAYBACK_END_FRAME,
  COURSE_G03_L01_VB_004_RUNTIME,
  COURSE_G03_L01_VB_004_SOURCE,
  getCourseG03L01Vb004FrameState,
  normalizeCourseG03L01Vb004Frame,
  normalizeCourseG03L01Vb004RootFrame
} from '../src/timelines/course-g03-l01-vb-004';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('VB004 binds the native candidate to preserved FLA and SWF bytes', async () => {
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G03_L01_VB_004_SOURCE.fla}`)),
    COURSE_G03_L01_VB_004_SOURCE.flaSha256
  );
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G03_L01_VB_004_SOURCE.swf}`)),
    COURSE_G03_L01_VB_004_SOURCE.swfSha256
  );
  assert.deepEqual(COURSE_G03_L01_VB_004_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G03_L01_VB_004_MOVIE.fps, 12);
  assert.equal(COURSE_G03_L01_VB_004_MOVIE.frameCount, 222);
  assert.equal(COURSE_G03_L01_VB_004_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G03_L01_VB_004_RUNTIME.defaultFrameDomain, 'sprite-231');
  assert.deepEqual(COURSE_G03_L01_VB_004_RUNTIME.frameDomains, [
    {id: 'sprite-231', frameCount: 222, rootFrame: 6}
  ]);
  assert.equal(courseVb004.runtime, COURSE_G03_L01_VB_004_RUNTIME);
  assert.equal(COURSE_G03_L01_VB_004_PLAYBACK_END_FRAME, 56);
  assert.equal(courseVb004.playbackEndFrame, 56);
  assert.deepEqual(courseVb004.playbackEndFrameByDomain, {root: 1, 'sprite-231': 56});
  assert.equal(courseVb004.reducedMotionFrame, 56);
});

test('VB004 pure state preserves one-indexing, the natural stop, and structural inspection', () => {
  assert.equal(normalizeCourseG03L01Vb004Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG03L01Vb004Frame(0), 1);
  assert.equal(normalizeCourseG03L01Vb004Frame(56.9), 56);
  assert.equal(normalizeCourseG03L01Vb004Frame(999), 222);
  assert.equal(normalizeCourseG03L01Vb004RootFrame(0), 1);
  assert.equal(normalizeCourseG03L01Vb004RootFrame(999), 10);

  const stop = getCourseG03L01Vb004FrameState(56, {
    scenario: 'linear-to-quiz-stop',
    lang: 'en',
    seed: -1
  });
  const structural = getCourseG03L01Vb004FrameState(222, {
    scenario: 'authoring-frame-inspection',
    lang: 'en',
    seed: 7
  });
  assert.equal(stop.status, 'ready');
  assert.equal(stop.interactionBoundary, true);
  assert.equal(stop.naturalPlaybackFrame, 56);
  assert.equal(stop.seed, 4294967295);
  assert.equal(structural.status, 'ready');
  assert.equal(structural.exportFrame, 221);
  assert.equal(structural.naturalPlaybackFrame, 56);
  assert.equal(structural.runtimeReachability, 'structural-only-runtime-reachability-unproven');
});

test('VB004 root endpoints are deterministic in both requested languages', () => {
  for (const lang of ['en', 'es'] as const) {
    const first = getCourseG03L01Vb004FrameState(1, {
      frameDomain: 'root',
      scenario: 'root-standalone',
      lang,
      seed: 17
    });
    const last = getCourseG03L01Vb004FrameState(10, {
      frameDomain: 'root',
      scenario: 'root-standalone',
      lang,
      seed: 17
    });
    assert.equal(first.frameDomain, 'root');
    assert.equal(first.rootFrame, 1);
    assert.equal(first.localCompositeFrame, null);
    assert.equal(first.status, 'ready');
    assert.equal(last.rootFrame, 10);
    assert.equal(last.localCompositeFrame, 10);
    assert.equal(last.status, 'ready');
    assert.equal(last.language, lang);
    assert.equal(last.visualLocalizationStatus, 'source-shared-untranslated-visual');
    assert.equal(last.audioRendered, false);
  }
});

test('VB004 admits untranslated source visuals and structural frames but rejects quiz behavior', () => {
  const spanish = getCourseG03L01Vb004FrameState(1, {
    scenario: 'linear-to-quiz-stop',
    lang: 'es',
    seed: 0
  });
  const postStop = getCourseG03L01Vb004FrameState(57, {
    scenario: 'linear-to-quiz-stop',
    lang: 'en',
    seed: 0
  });
  const quiz = getCourseG03L01Vb004FrameState(56, {
    scenario: 'quiz-interaction-unavailable',
    lang: 'en',
    seed: 0
  });
  assert.equal(spanish.status, 'ready');
  assert.equal(spanish.blocker, null);
  assert.equal(spanish.visualLocalizationStatus, 'source-shared-untranslated-visual');
  assert.equal(spanish.audioLocalizationStatus, 'unresolved');
  assert.equal(postStop.status, 'ready');
  assert.equal(postStop.blocker, null);
  assert.equal(postStop.runtimeReachability, 'structural-only-runtime-reachability-unproven');
  assert.equal(postStop.renderingAuthority, 'source-structural-renderer-addressability-only');
  assert.equal(quiz.blocker, 'quiz-branches-scoring-and-feedback-unresolved');
  assert.equal(courseVb004.audioCues.length, 0);
  assert.equal(courseVb004.audioTracks, undefined);
});

test('VB004 renderer exposes the local adapter, identity contract, Replay, and honest limitations', () => {
  const render = (
    frame: number,
    scenario: string,
    lang: 'en' | 'es',
    frameDomain: 'root' | 'sprite-231' = 'sprite-231'
  ) => {
    const state = courseVb004.getFrameState(frame, {
      frame,
      frameDomain,
      scenario,
      lang,
      seed: 17
    });
    return renderToStaticMarkup(
      createElement(courseVb004.Renderer, {
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
  const ready = render(56, 'linear-to-quiz-stop', 'en');
  assert.match(ready, /data-flash-frame-domain="sprite-231"/);
  assert.match(ready, /data-flash-root-frame="6"/);
  assert.match(ready, /data-runtime-seed="17"/);
  assert.match(ready, /data-render-state="loading"/);
  assert.match(ready, /<iframe/);
  assert.match(ready, /embed=1/);
  assert.doesNotMatch(ready, /sandbox=/);
  assert.match(ready, /<button[^>]*>Replay<\/button>/);

  const spanish = render(1, 'linear-to-quiz-stop', 'es');
  assert.match(spanish, /data-visual-localization-status="source-shared-untranslated-visual"/);
  assert.match(spanish, /La única línea visual de origen se muestra sin traducir/);
  assert.match(spanish, /<iframe/);

  const postStop = render(57, 'linear-to-quiz-stop', 'en');
  assert.match(postStop, /data-runtime-reachability="structural-only-runtime-reachability-unproven"/);
  assert.match(postStop, /engineering inspection only/);
  assert.match(postStop, /<iframe/);

  const root = render(10, 'root-standalone', 'en', 'root');
  assert.match(root, /data-flash-frame-domain="root"/);
  assert.match(root, /data-flash-root-frame="10"/);
  assert.match(root, /Standalone root frames are source-addressable/);

  const quiz = render(56, 'quiz-interaction-unavailable', 'en');
  assert.match(quiz, /data-fail-closed-reason="quiz-branches-scoring-and-feedback-unresolved"/);
  assert.doesNotMatch(quiz, /<iframe/);
});

test('VB004 generated adapter remains hash-pinned, deterministic, local, and fail-closed', async () => {
  const manifestPath = `${repositoryRoot}public/flash-assets/courses/course-g03-l01-vb-004/manifest.json`;
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
    source: {swfSha256: string; flaSha256: string};
    generatedFiles: Record<string, {sha256: string; bytes: number}>;
    deterministicRuntime: {
      ambientPlaybackLoop: boolean;
      rootFrameCount: number;
      defaultFrameDomain: string;
      supportedLanguages: string[];
      visualLocalizationStatus: string;
      audioLocalizationStatus: string;
      scenarios: Array<{id: string; frameDomain: string}>;
    };
    strictAcceptanceEffect: string;
  };
  assert.equal(manifest.source.swfSha256, COURSE_G03_L01_VB_004_SOURCE.swfSha256);
  assert.equal(manifest.source.flaSha256, COURSE_G03_L01_VB_004_SOURCE.flaSha256);
  assert.equal(manifest.deterministicRuntime.ambientPlaybackLoop, false);
  assert.equal(manifest.deterministicRuntime.rootFrameCount, 10);
  assert.equal(manifest.deterministicRuntime.defaultFrameDomain, 'sprite-231');
  assert.deepEqual(manifest.deterministicRuntime.supportedLanguages, ['en', 'es']);
  assert.equal(
    manifest.deterministicRuntime.visualLocalizationStatus,
    'source-shared-untranslated-visual'
  );
  assert.equal(manifest.deterministicRuntime.audioLocalizationStatus, 'unresolved');
  assert.ok(
    manifest.deterministicRuntime.scenarios.some(
      ({id, frameDomain}) => id === 'root-standalone' && frameDomain === 'root'
    )
  );
  assert.match(manifest.strictAcceptanceEffect, /cannot satisfy authoritative runtime/);
  for (const [name, expected] of Object.entries(manifest.generatedFiles)) {
    const bytes = await readFile(
      `${repositoryRoot}public/flash-assets/courses/course-g03-l01-vb-004/${name}`
    );
    assert.equal(bytes.byteLength, expected.bytes, name);
    assert.equal(sha256(bytes), expected.sha256, name);
  }
  const html = await readFile(
    `${repositoryRoot}public/flash-assets/courses/course-g03-l01-vb-004/index.html`,
    'utf8'
  );
  assert.match(html, /html\[data-embed="true"\]/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.equal(courseVb004.maturity, 'legacy-prototype');
});

test('VB004 candidate is discoverable only by stable placement identity', async () => {
  const byId = matchPrototype({animationId: 'course-g03-l01-vb-004'});
  const ambiguousBasename = matchPrototype({sourcePath: 'HELP_COURSES/ELMGR3/L1/VB/L1VB04.swf'});
  assert.equal(byId?.key, 'course-g03-l01-vb-004');
  assert.equal(byId?.movie.frameCount, 222);
  assert.equal(ambiguousBasename, undefined);
  const loaded = await loadAnimationModule('course-g03-l01-vb-004');
  assert.equal(loaded?.key, 'course-g03-l01-vb-004');
  assert.equal(loaded?.maturity, 'legacy-prototype');
});
