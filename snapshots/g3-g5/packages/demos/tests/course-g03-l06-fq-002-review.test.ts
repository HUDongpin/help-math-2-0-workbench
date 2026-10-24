import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access, readFile, readdir} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {loadAnimationModule} from '../src/animation-registry';
import animationModule, {CourseG03L06Fq002ReviewRenderer} from '../src/modules/course-g03-l06-fq-002-review';
import {
  COURSE_G03_L06_FQ_002_REVIEW_MOVIE,
  COURSE_G03_L06_FQ_002_REVIEW_QUESTION_BANK,
  COURSE_G03_L06_FQ_002_REVIEW_QUIZ_DRAW_COUNT,
  COURSE_G03_L06_FQ_002_REVIEW_REPLAY_SOURCE_DISPOSITION,
  COURSE_G03_L06_FQ_002_REVIEW_ROOT_FRAME_ASSETS,
  COURSE_G03_L06_FQ_002_REVIEW_RUNTIME,
  COURSE_G03_L06_FQ_002_REVIEW_SOURCE,
  createCourseG03L06Fq002ReviewSourceInitializationVector,
  getCourseG03L06Fq002ReviewHostAudioCandidatePath,
  getCourseG03L06Fq002ReviewFrameState,
  getCourseG03L06Fq002ReviewSourceGrade,
  normalizeCourseG03L06Fq002ReviewRootFrame
} from '../src/timelines/course-g03-l06-fq-002-review';

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

test('FQ review candidate is bound to the preserved source and local sprite timeline', async () => {
  const bytes = await readFile(`${repositoryRoot}${COURSE_G03_L06_FQ_002_REVIEW_SOURCE.swf}`);
  assert.equal(sha256(bytes), COURSE_G03_L06_FQ_002_REVIEW_SOURCE.swfSha256);
  assert.deepEqual(COURSE_G03_L06_FQ_002_REVIEW_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G03_L06_FQ_002_REVIEW_MOVIE.fps, 12);
  assert.equal(COURSE_G03_L06_FQ_002_REVIEW_MOVIE.frameCount, 82);
  assert.equal(COURSE_G03_L06_FQ_002_REVIEW_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G03_L06_FQ_002_REVIEW_RUNTIME.defaultFrameDomain, 'sprite-1168');
  assert.deepEqual(COURSE_G03_L06_FQ_002_REVIEW_RUNTIME.frameDomains, [
    {id: 'sprite-1168', frameCount: 82, rootFrame: 6}
  ]);
  assert.equal(animationModule.runtime, COURSE_G03_L06_FQ_002_REVIEW_RUNTIME);
  assert.deepEqual(animationModule.playbackEndFrameByDomain, {root: 1, 'sprite-1168': 1});
  assert.equal(animationModule.playbackEndFrame, 1);
});

test('FQ review state is one-indexed and never claims interaction, score, or audio execution', () => {
  const state = getCourseG03L06Fq002ReviewFrameState(50, {lang: 'en', seed: 17});
  assert.equal(state.frame, 50);
  assert.equal(state.exportFrame, 49);
  assert.equal(state.frameDomain, 'sprite-1168');
  assert.equal(state.status, 'ready');
  assert.equal(state.interactionResolved, false);
  assert.equal(state.scoreResolved, false);
  assert.equal(state.audioRendered, false);
  assert.equal(getCourseG03L06Fq002ReviewFrameState(999, {lang: 'en', seed: 0}).frame, 82);
});

test('FQ review source contract preserves all 31 questions, answer keys, review frames, and grade bands', () => {
  assert.equal(COURSE_G03_L06_FQ_002_REVIEW_QUESTION_BANK.length, 31);
  assert.equal(COURSE_G03_L06_FQ_002_REVIEW_QUIZ_DRAW_COUNT, 10);
  assert.deepEqual(COURSE_G03_L06_FQ_002_REVIEW_QUESTION_BANK[0], {
    questionNumber: 1,
    questionLabel: 'Q1',
    questionFrame: 2,
    reviewLabel: 'R1',
    reviewFrame: 51,
    correctOption: 3
  });
  assert.deepEqual(COURSE_G03_L06_FQ_002_REVIEW_QUESTION_BANK[30], {
    questionNumber: 31,
    questionLabel: 'Q31',
    questionFrame: 32,
    reviewLabel: 'R31',
    reviewFrame: 81,
    correctOption: 3
  });
  assert.equal(
    new Set(COURSE_G03_L06_FQ_002_REVIEW_QUESTION_BANK.map(({questionFrame}) => questionFrame)).size,
    31
  );
  assert.equal(
    new Set(COURSE_G03_L06_FQ_002_REVIEW_QUESTION_BANK.map(({reviewFrame}) => reviewFrame)).size,
    31
  );
  assert.deepEqual(
    [0, 3, 4, 6, 7, 8, 9, 10].map(getCourseG03L06Fq002ReviewSourceGrade),
    [
      'Unsatisfactory',
      'Unsatisfactory',
      'Partially Proficient',
      'Partially Proficient',
      'Proficient',
      'Proficient',
      'Advanced',
      'Advanced'
    ]
  );
  assert.equal(getCourseG03L06Fq002ReviewSourceGrade(11), null);
  assert.equal(getCourseG03L06Fq002ReviewSourceGrade(1.5), null);
});

test('FQ review source reset vector is complete, fresh, and still requires the immediate random draw', () => {
  const first = createCourseG03L06Fq002ReviewSourceInitializationVector();
  const second = createCourseG03L06Fq002ReviewSourceInitializationVector();
  assert.deepEqual(first, second);
  assert.notEqual(first.quizLabels, second.quizLabels);
  assert.notEqual(first.responseAnswers, second.responseAnswers);
  assert.equal(first.totalQuestionsCount, 10);
  assert.equal(first.totQuizCount, 0);
  assert.equal(first.reviewCount, 0);
  assert.equal(first.quizSection, true);
  assert.equal(first.finishVisible, false);
  assert.equal(first.finishFrame, 1);
  assert.equal(first.resultVisible, false);
  assert.equal(first.quizLabels.length, 31);
  assert.equal(first.reviewLabels.length, 31);
  assert.equal(first.answerIds.length, 31);
  assert.equal(first.answerIds[0], 'A1Opt3');
  assert.equal(first.answerIds[30], 'A31Opt3');
  assert.deepEqual(COURSE_G03_L06_FQ_002_REVIEW_REPLAY_SOURCE_DISPOSITION, {
    hostAction: 'loadSWFMovie()',
    childResetMechanism: 'reload-child-swf-and-rerun-frame-1-initialization',
    activeXmlNavigation: 'OFF',
    activeHostReplayControlVisible: false,
    reviewVariantHostPlacementProven: false,
    strictReplayResolved: false
  });
});

test('FQ review host audio routing proves a Review-path conflict, not an audio association', async () => {
  const activePath =
    'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/FQ/L6FQ02.swf';
  const reviewPath = COURSE_G03_L06_FQ_002_REVIEW_SOURCE.swf;
  const activeEnglish = getCourseG03L06Fq002ReviewHostAudioCandidatePath(
    activePath,
    11,
    'en'
  );
  const activeSpanishAnswer = getCourseG03L06Fq002ReviewHostAudioCandidatePath(
    activePath,
    11,
    'es',
    3
  );
  const reviewEnglish = getCourseG03L06Fq002ReviewHostAudioCandidatePath(
    reviewPath,
    11,
    'en'
  );
  const reviewSpanishAnswer = getCourseG03L06Fq002ReviewHostAudioCandidatePath(
    reviewPath,
    11,
    'es',
    3
  );

  assert.equal(activeEnglish, activePath.replace('L6FQ02.swf', 'EA/Q10.mp3'));
  assert.equal(activeSpanishAnswer, activePath.replace('L6FQ02.swf', 'SA/Q10C.mp3'));
  assert.equal(reviewEnglish, reviewPath.replace('L6FQ02.swf', 'EA/Q10.mp3'));
  assert.equal(reviewSpanishAnswer, reviewPath.replace('L6FQ02.swf', 'SA/Q10C.mp3'));
  await access(`${repositoryRoot}${activeEnglish}`);
  await access(`${repositoryRoot}${activeSpanishAnswer}`);
  await assert.rejects(access(`${repositoryRoot}${reviewEnglish}`));
  await assert.rejects(access(`${repositoryRoot}${reviewSpanishAnswer}`));
  assert.equal(
    (await readdir(`${repositoryRoot}${activePath.slice(0, activePath.lastIndexOf('/'))}/EA`))
      .filter((file) => file.endsWith('.mp3')).length,
    53
  );
  assert.equal(
    (await readdir(`${repositoryRoot}${activePath.slice(0, activePath.lastIndexOf('/'))}/SA`))
      .filter((file) => file.endsWith('.mp3')).length,
    76
  );
  assert.equal(getCourseG03L06Fq002ReviewHostAudioCandidatePath(activePath, 1, 'en'), null);
  assert.equal(getCourseG03L06Fq002ReviewHostAudioCandidatePath('L6FQ02.swf', 2, 'en'), null);
});

test('FQ review bilingual and Replay disposition is hash-bound and acceptance-neutral', async () => {
  const migrationRoot = `${repositoryRoot}migrations/course-g03-l06-fq-002-review/`;
  const disposition = JSON.parse(
    await readFile(`${migrationRoot}audit/bilingual-replay-source-disposition.json`, 'utf8')
  );
  assert.equal(disposition.schemaVersion, 1);
  assert.equal(disposition.animationId, 'course-g03-l06-fq-002-review');
  assert.equal(
    disposition.disposition,
    'spanish-and-replay-blockers-retained-with-narrowed-source-reasons'
  );
  assert.match(disposition.strictAcceptanceEffect, /^none;/);
  assert.equal(disposition.bilingualSourceDisposition.blockerResolved, false);
  assert.equal(
    disposition.bilingualSourceDisposition.pathResolution.ifLoadedFromPreservedReviewPath
      .exactAudioFileCount,
    0
  );
  assert.equal(disposition.bilingualSourceDisposition.parentAudioCandidates.englishFileCount, 53);
  assert.equal(disposition.bilingualSourceDisposition.parentAudioCandidates.spanishFileCount, 76);
  assert.equal(
    disposition.bilingualSourceDisposition.parentAudioCandidates.promotionToReviewCues,
    false
  );
  assert.deepEqual(
    disposition.behaviorAndReplayDisposition.unresolvedReachableFrameDomains.map(
      ({timelineId, frameCount}: {timelineId: string; frameCount: number}) => ({
        timelineId,
        frameCount
      })
    ),
    [
      {timelineId: 'sprite-212', frameCount: 2},
      {timelineId: 'sprite-256', frameCount: 8},
      {timelineId: 'sprite-255', frameCount: 2}
    ]
  );
  assert.equal(disposition.behaviorAndReplayDisposition.hostReplay.strictReplayResolved, false);
  assert.equal(
    disposition.behaviorAndReplayDisposition.currentCoverageGap.acceptedRequirementCount,
    0
  );

  for (const binding of Object.values(disposition.sourceBindings) as Array<{
    path: string;
    bytes?: number;
    sha256: string;
  }>) {
    const path = binding.path.startsWith('audit/')
      ? `${migrationRoot}${binding.path}`
      : `${repositoryRoot}${binding.path}`;
    const bytes = await readFile(path);
    if (binding.bytes !== undefined) assert.equal(bytes.length, binding.bytes, binding.path);
    assert.equal(sha256(bytes), binding.sha256, binding.path);
  }
});

test('FQ review root domain resolves exact English standalone frames without claiming host behavior', () => {
  assert.equal(normalizeCourseG03L06Fq002ReviewRootFrame(Number.NaN), 1);
  assert.equal(normalizeCourseG03L06Fq002ReviewRootFrame(99), 10);
  const root = getCourseG03L06Fq002ReviewFrameState(10, {
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
  assert.equal(root.naturalPlaybackStopFrame, 1);
  assert.equal(root.originalHostStateResolved, false);
  assert.equal(root.captureAuthority, 'adobe-standalone-deterministic-step-root-only');
  assert.equal(
    root.rootFrameAsset.source,
    '/flash-assets/courses/course-g03-l06-fq-002-review/root-frames/frame-0010.png'
  );
  assert.equal(
    root.rootFrameAsset.sha256,
    '804c7c47b8e0b8954b9b142d4601d1a00bae54ecbdfb77a09f357ea25ad94bef'
  );
});

test('FQ review Spanish fails closed rather than inventing visual or audio states', () => {
  const state = getCourseG03L06Fq002ReviewFrameState(2, {lang: 'es', seed: 0});
  assert.equal(state.status, 'blocked');
  assert.equal(state.blocker, 'spanish-visual-and-audio-not-source-proven');
  const markup = renderToStaticMarkup(
    createElement(CourseG03L06Fq002ReviewRenderer, {
      frame: 2,
      lang: 'es',
      scenario: 'default',
      seed: 0,
      state
    })
  );
  assert.match(markup, /data-fail-closed-reason="spanish-visual-and-audio-not-source-proven"/);
  assert.doesNotMatch(markup, /<canvas/);

  const root = getCourseG03L06Fq002ReviewFrameState(10, {
    frameDomain: 'root',
    rootFrame: 10,
    scenario: 'root-standalone',
    lang: 'es',
    seed: 0
  });
  assert.equal(root.frameDomain, 'root');
  assert.equal(root.scenario, 'root-standalone');
  assert.equal(root.status, 'blocked');
  assert.equal(root.blocker, 'spanish-visual-and-audio-not-source-proven');
  const rootMarkup = renderToStaticMarkup(
    createElement(CourseG03L06Fq002ReviewRenderer, {
      frame: 10,
      frameDomain: 'root',
      rootFrame: 10,
      lang: 'es',
      scenario: 'root-standalone',
      seed: 0,
      state: root
    })
  );
  assert.match(rootMarkup, /data-flash-frame-domain="root"/);
  assert.match(rootMarkup, /data-render-state="blocked"/);
  assert.doesNotMatch(rootMarkup, /<img/);
  assert.doesNotMatch(rootMarkup, /<canvas/);
});

test('FQ review renderer identifies the local-only candidate and limitations', () => {
  const entryStateSha256 = '4ce6c15541a7d1f300616f94dcf91717314c4ca31375222334557e8dd1efe81a';
  const state = getCourseG03L06Fq002ReviewFrameState(2, {lang: 'en', seed: 0});
  const markup = renderToStaticMarkup(
    createElement(CourseG03L06Fq002ReviewRenderer, {
      frame: 2,
      frameDomain: 'sprite-1168',
      lang: 'en',
      scenario: 'default',
      seed: 0,
      requirementId: 'req:sprite-1168:default:en',
      traceId: 'trace:sprite-1168:default:en:seed-0',
      entryStateSha256,
      state
    })
  );
  assert.match(markup, /data-candidate-status="engineering-structural-frame-only"/);
  assert.match(markup, /answer handling, score, review navigation, reporting, bilingual audio/);
  assert.match(markup, /Source-derived final quiz structural drawing/);
  assert.match(markup, /<canvas/);
  assert.match(markup, /data-animation-id="course-g03-l06-fq-002-review"/);
  assert.match(markup, /data-flash-frame="2"/);
  assert.match(markup, /data-flash-frame-domain="sprite-1168"/);
  assert.match(markup, /data-flash-root-frame="6"/);
  assert.match(markup, /data-flash-requirement-id="req:sprite-1168:default:en"/);
  assert.match(markup, /data-flash-trace-id="trace:sprite-1168:default:en:seed-0"/);
  assert.match(markup, new RegExp(`data-flash-entry-state-sha256="${entryStateSha256}"`));
  assert.match(markup, /data-runtime-language="en"/);
  assert.match(markup, /data-runtime-scenario="default"/);
  assert.match(markup, /data-runtime-seed="0"/);
  assert.match(markup, /data-render-visual="true"/);
});

test('FQ review renderer exposes the hash-bound English root frame and complete capture identity', () => {
  const entryStateSha256 = '4dfbb3290627139f130afd170b4c6d925c09dd7262e32d9cbc1e1142632f9deb';
  const state = getCourseG03L06Fq002ReviewFrameState(6, {
    frameDomain: 'root',
    rootFrame: 6,
    scenario: 'root-standalone',
    lang: 'en',
    seed: 0
  });
  const markup = renderToStaticMarkup(
    createElement(CourseG03L06Fq002ReviewRenderer, {
      frame: 6,
      frameDomain: 'root',
      rootFrame: 6,
      lang: 'en',
      scenario: 'root-standalone',
      seed: 0,
      requirementId: 'req:root:root-standalone:en',
      traceId: 'trace:root:root-standalone:en:seed-0',
      entryStateSha256,
      state
    })
  );
  assert.match(markup, /data-animation-id="course-g03-l06-fq-002-review"/);
  assert.match(markup, /data-capture-stage="true"/);
  assert.match(markup, /data-flash-frame="6"/);
  assert.match(markup, /data-flash-frame-domain="root"/);
  assert.match(markup, /data-flash-root-frame="6"/);
  assert.match(markup, /data-flash-requirement-id="req:root:root-standalone:en"/);
  assert.match(markup, /data-flash-trace-id="trace:root:root-standalone:en:seed-0"/);
  assert.match(markup, new RegExp(`data-flash-entry-state-sha256="${entryStateSha256}"`));
  assert.match(markup, /data-render-state="ready"/);
  assert.match(markup, /data-root-visual-authority="adobe-standalone-deterministic-step-root-only"/);
  assert.match(markup, /root-frames\/frame-0006\.png/);
  assert.match(markup, /data-root-frame-sha256="804c7c47/);
  assert.doesNotMatch(markup, /<canvas/);
});

test('FQ review generated Canvas asset is local-only and explicitly non-strict', async () => {
  const manifest = JSON.parse(
    await readFile(`${repositoryRoot}public/flash-assets/courses/course-g03-l06-fq-002-review/manifest.json`, 'utf8')
  );
  assert.equal(manifest.animationId, 'course-g03-l06-fq-002-review');
  assert.equal(manifest.safety.noNetworkPrimitives, true);
  assert.equal(manifest.safety.noDynamicEvaluation, true);
  assert.equal(manifest.safety.noTimersOrAutoplay, true);
  assert.equal(manifest.strictAcceptanceEffect, 'none');
  assert.match(manifest.timeline.deterministicContentTimeline.stateCoverage, /static-source-drawing-only/);
});

test('FQ review root implementation assets exactly copy the hash-bound standalone frames', async () => {
  const root = `${repositoryRoot}public/flash-assets/courses/course-g03-l06-fq-002-review/root-frames/`;
  const manifest = JSON.parse(await readFile(`${root}manifest.json`, 'utf8'));
  assert.equal(manifest.animationId, 'course-g03-l06-fq-002-review');
  assert.equal(manifest.source.swfSha256, COURSE_G03_L06_FQ_002_REVIEW_SOURCE.swfSha256);
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
    manifest.frames.map(({frame, file, sha256: hash}: {frame: number; file: string; sha256: string}) => ({frame, file, sha256: hash})),
    COURSE_G03_L06_FQ_002_REVIEW_ROOT_FRAME_ASSETS
  );
  for (const frame of manifest.frames) {
    const bytes = await readFile(`${root}${frame.file}`);
    assert.equal(bytes.length, frame.bytes, frame.file);
    assert.equal(sha256(bytes), frame.sha256, frame.file);
    assert.equal(frame.width, 800, frame.file);
    assert.equal(frame.height, 600, frame.file);
  }
});

test('FQ review candidate is discoverable only by its stable placement identity', async () => {
  const loaded = await loadAnimationModule('course-g03-l06-fq-002-review');
  assert.equal(loaded?.key, 'course-g03-l06-fq-002-review');
  assert.equal(loaded?.movie.frameCount, 82);
  assert.equal(loaded?.runtime?.frameCount, 10);
  assert.deepEqual(loaded?.scenarios.map(({id}) => id), ['default', 'root-standalone']);
  assert.equal(loaded?.maturity, 'legacy-prototype');
});

test('FQ review renderer endpoints remain exactly 4/8 renderable until Spanish source behavior is proven', async () => {
  const endpoints = [
    {frameDomain: 'root', frame: 1, scenario: 'root-standalone', lang: 'en'},
    {frameDomain: 'root', frame: 10, scenario: 'root-standalone', lang: 'en'},
    {frameDomain: 'root', frame: 1, scenario: 'root-standalone', lang: 'es'},
    {frameDomain: 'root', frame: 10, scenario: 'root-standalone', lang: 'es'},
    {frameDomain: 'sprite-1168', frame: 1, scenario: 'default', lang: 'en'},
    {frameDomain: 'sprite-1168', frame: 82, scenario: 'default', lang: 'en'},
    {frameDomain: 'sprite-1168', frame: 1, scenario: 'default', lang: 'es'},
    {frameDomain: 'sprite-1168', frame: 82, scenario: 'default', lang: 'es'}
  ] as const;

  const actual = endpoints.map((endpoint) => {
    const state = endpoint.frameDomain === 'root'
      ? getCourseG03L06Fq002ReviewFrameState(endpoint.frame, {
          frameDomain: 'root',
          rootFrame: endpoint.frame,
          scenario: endpoint.scenario,
          lang: endpoint.lang,
          seed: 0
        })
      : getCourseG03L06Fq002ReviewFrameState(endpoint.frame, {
          frameDomain: 'sprite-1168',
          scenario: endpoint.scenario,
          lang: endpoint.lang,
          seed: 0
        });
    return {
      requestId: `${endpoint.frameDomain}::${endpoint.scenario}::${endpoint.lang}::${endpoint.frame}`,
      status: state.status,
      blocker: state.blocker
    };
  });

  assert.deepEqual(actual, [
    {requestId: 'root::root-standalone::en::1', status: 'ready', blocker: null},
    {requestId: 'root::root-standalone::en::10', status: 'ready', blocker: null},
    {
      requestId: 'root::root-standalone::es::1',
      status: 'blocked',
      blocker: 'spanish-visual-and-audio-not-source-proven'
    },
    {
      requestId: 'root::root-standalone::es::10',
      status: 'blocked',
      blocker: 'spanish-visual-and-audio-not-source-proven'
    },
    {requestId: 'sprite-1168::default::en::1', status: 'ready', blocker: null},
    {requestId: 'sprite-1168::default::en::82', status: 'ready', blocker: null},
    {
      requestId: 'sprite-1168::default::es::1',
      status: 'blocked',
      blocker: 'spanish-visual-and-audio-not-source-proven'
    },
    {
      requestId: 'sprite-1168::default::es::82',
      status: 'blocked',
      blocker: 'spanish-visual-and-audio-not-source-proven'
    }
  ]);

  const report = JSON.parse(
    await readFile(
      `${repositoryRoot}migrations/course-g03-l06-fq-002-review/audit/renderer-frame-domain-support.json`,
      'utf8'
    )
  );
  assert.equal(report.status, 'renderer-frame-domain-support-incomplete');
  assert.equal(report.migrationStatusChanged, false);
  assert.deepEqual(report.summary, {
    declaredFrameDomainCount: 2,
    fullyRenderableFrameDomainCount: 0,
    probeCount: 8,
    exactIdentityCount: 8,
    blockedCount: 4,
    renderableCount: 4,
    outcomeCounts: {
      'renderable-exact': 4,
      'blocked-not-renderable': 4,
      'scenario-undeclared-by-module': 0,
      'identity-mismatch': 0,
      'probe-error': 0
    }
  });
  assert.deepEqual(
    report.probes.map((probe: {
      request: {requestId: string};
      actual: {status: string; blocker: string | null};
    }) => ({
      requestId: probe.request.requestId,
      status: probe.actual.status,
      blocker: probe.actual.blocker
    })),
    actual
  );
});

test('FQ review English-bound implementation assets cannot be relabeled as request-context invariant', async () => {
  const migrationRoot = `${repositoryRoot}migrations/course-g03-l06-fq-002-review/`;
  const publicAssetRoot = `${repositoryRoot}public/flash-assets/courses/course-g03-l06-fq-002-review/`;
  const adapterSpecBytes = await readFile(`${migrationRoot}audit/canvas-adapter-spec.json`);
  const adapterSpec = JSON.parse(adapterSpecBytes.toString('utf8'));
  const generatedManifest = JSON.parse(
    await readFile(`${publicAssetRoot}manifest.json`, 'utf8')
  );
  const rootManifest = JSON.parse(
    await readFile(`${publicAssetRoot}root-frames/manifest.json`, 'utf8')
  );

  assert.deepEqual(adapterSpec.runtimeContract.supportedLanguages, ['en']);
  assert.match(
    adapterSpec.runtimeContract.unresolved.join('\n'),
    /Spanish visual behavior is not source-proven.*must fail closed/
  );
  assert.equal(generatedManifest.inputs.spec.sha256, sha256(adapterSpecBytes));
  assert.equal(generatedManifest.strictAcceptanceEffect, 'none');
  assert.equal(rootManifest.runtime.language, 'en');
  assert.match(rootManifest.sourceReport.authorityBoundary, /^Standalone English root-frame visuals only;/);
  assert.equal(rootManifest.strictAcceptanceEffect, 'none');
});
