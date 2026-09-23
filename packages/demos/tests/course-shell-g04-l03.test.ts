import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {loadAnimationModule} from '../src/animation-registry';
import courseShell from '../src/modules/shell-course-g04-l03-index-local';
import {matchPrototype} from '../src/prototype-manifest';
import {
  COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA,
  COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS
} from '../src/timelines/generated/shell-course-g04-l03-additional-domain-assets';
import {
  COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA,
  COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS
} from '../src/timelines/generated/shell-course-g04-l03-single-frame-domain-assets';
import {
  COURSE_SHELL_G04_L03_MOVIE,
  COURSE_SHELL_G04_L03_MOVER,
  COURSE_SHELL_G04_L03_MOUSE_OBJECT,
  COURSE_SHELL_G04_L03_NATIVE_MENU,
  COURSE_SHELL_G04_L03_NATIVE_MENU_FRAME_HASHES,
  COURSE_SHELL_G04_L03_POPUP,
  COURSE_SHELL_G04_L03_PROGRESS,
  COURSE_SHELL_G04_L03_ROOT_FRAME_ASSETS,
  COURSE_SHELL_G04_L03_SECTIONS,
  COURSE_SHELL_G04_L03_SOURCE,
  courseShellG04L03InteractionForScenario,
  courseShellG04L03PhaseAtFrame,
  getCourseShellG04L03FrameState,
  normalizeCourseShellG04L03NativeMenuFrame,
  normalizeCourseShellG04L03ControlFrame,
  normalizeCourseShellG04L03ProgressFrame,
  normalizeCourseShellG04L03AdditionalFrame,
  normalizeCourseShellG04L03MoverFrame,
  normalizeCourseShellG04L03Frame,
  transitionCourseShellG04L03
} from '../src/timelines/shell-course-g04-l03-index-local';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRoot = `${repositoryRoot}migrations/shell-course-g04-l03-index-local`;

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('G4 L3 shell preserves source identity and exact root runtime metadata', async () => {
  assert.deepEqual(COURSE_SHELL_G04_L03_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_SHELL_G04_L03_MOVIE.fps, 12);
  assert.equal(COURSE_SHELL_G04_L03_MOVIE.frameCount, 50);
  assert.equal(COURSE_SHELL_G04_L03_MOVIE.durationMs, (50 * 1_000) / 12);
  assert.equal(courseShell.playbackMode, 'once');
  assert.equal(courseShell.playbackEndFrame, 49);
  assert.equal(courseShell.reducedMotionFrame, 49);
  assert.deepEqual(courseShell.audioCues, []);
  assert.equal(courseShell.runtime?.frameCount, 50);
  assert.deepEqual(courseShell.runtime?.frameDomains, [
    {id: 'root', frameCount: 50},
    {id: 'sprite-1011', frameCount: 48, fps: 12, rootFrame: 50},
    {id: 'sprite-132', frameCount: 100, fps: 12, rootFrame: 1},
      {id: 'sprite-302', frameCount: 149, fps: 12, rootFrame: 49},
      {id: 'sprite-327', frameCount: 132, fps: 12, rootFrame: 49},
      {id: 'sprite-528', frameCount: 871, fps: 12, rootFrame: 49},
      ...COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.map((id) => ({
        id,
        frameCount: COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id].frameCount,
        fps: 12,
        rootFrame: COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id].rootFrame
      })),
      ...COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.map((id) => ({
        id,
        frameCount: 1,
        fps: 12,
        rootFrame: COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA[id].rootFrame
      }))
  ]);
  assert.deepEqual(courseShell.playbackEndFrameByDomain, {
    root: 49,
    'sprite-1011': 48,
    'sprite-132': 100,
    'sprite-302': 149,
    'sprite-327': 132,
    'sprite-528': 871,
    ...Object.fromEntries(
      COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.map((id) => [
        id,
        COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id].frameCount
      ])
    ),
    ...Object.fromEntries(COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.map((id) => [id, 1]))
  });

  const sourceRoot = `${repositoryRoot}source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3`;
  const [swf, xml] = await Promise.all([
    readFile(`${sourceRoot}/index_local.swf`),
    readFile(`${sourceRoot}/index.xml`)
  ]);
  assert.equal(sha256(swf), COURSE_SHELL_G04_L03_SOURCE.swfSha256);
  assert.equal(sha256(xml), COURSE_SHELL_G04_L03_SOURCE.courseXmlSha256);
});

test('sprite-1011 is a separate 48-frame structural domain without runtime promotion', async () => {
  assert.equal(normalizeCourseShellG04L03NativeMenuFrame(Number.NaN), 1);
  assert.equal(normalizeCourseShellG04L03NativeMenuFrame(0), 1);
  assert.equal(normalizeCourseShellG04L03NativeMenuFrame(49), 48);
  const state = getCourseShellG04L03FrameState(9, {
    frameDomain: 'sprite-1011',
    lang: 'es',
    scenario: 'native-menu-structural',
    seed: 3
  });
  assert.equal(state.frameDomain, 'sprite-1011');
  assert.equal(state.frame, 9);
  assert.equal(state.rootFrame, 50);
  assert.equal(state.phase, 'source-native-menu-static-structure');
  assert.equal(state.presentation, 'ffdec-structural-native-menu');
  assert.equal(state.nestedFrameAsset?.sha256, COURSE_SHELL_G04_L03_NATIVE_MENU_FRAME_HASHES[8]);
  assert.deepEqual(state.nestedGeometry, COURSE_SHELL_G04_L03_NATIVE_MENU);
  assert.equal(state.actionScriptExecuted, false);
  assert.equal(state.originalRuntimeBaselineComplete, false);
  assert.equal(state.strictAcceptanceEffect, 'none');

  const manifest = JSON.parse(
    await readFile(
      `${repositoryRoot}public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-1011/manifest.json`,
      'utf8'
    )
  );
  assert.equal(manifest.runtime.frameDomain, 'sprite-1011');
  assert.equal(manifest.runtime.frameCount, 48);
  assert.equal(manifest.authority.actionScriptExecuted, false);
  assert.equal(manifest.authority.originalRuntimeBaseline, false);
  assert.equal(manifest.strictAcceptanceEffect, 'none');
  assert.deepEqual(
    manifest.frames.map(({sha256}: {sha256: string}) => sha256),
    COURSE_SHELL_G04_L03_NATIVE_MENU_FRAME_HASHES
  );
});

test('sprite-528 retains all 871 source-static mover frames without hover-causality promotion', async () => {
  assert.equal(normalizeCourseShellG04L03MoverFrame(Number.NaN), 1);
  assert.equal(normalizeCourseShellG04L03MoverFrame(0), 1);
  assert.equal(normalizeCourseShellG04L03MoverFrame(872), 871);
  const state = getCourseShellG04L03FrameState(8, {
    frameDomain: 'sprite-528',
    lang: 'es',
    scenario: 'mover-tooltip-structural',
    seed: 11
  });
  assert.equal(state.frameDomain, 'sprite-528');
  assert.equal(state.frame, 8);
  assert.equal(state.rootFrame, 49);
  assert.equal(state.phase, 'source-mover-tooltip-static-structure');
  assert.equal(state.presentation, 'ffdec-structural-mover-tooltip');
  assert.match(state.nestedFrameAsset?.source ?? '', /sprite-528\/visual-\d{3}-[a-f0-9]{12}\.png$/);
  assert.deepEqual(state.nestedGeometry, COURSE_SHELL_G04_L03_MOVER);
  assert.equal(state.actionScriptExecuted, false);
  assert.equal(state.originalRuntimeBaselineComplete, false);
  assert.equal(state.strictAcceptanceEffect, 'none');

  const manifest = JSON.parse(
    await readFile(
      `${repositoryRoot}public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-528/manifest.json`,
      'utf8'
    )
  );
  assert.equal(manifest.runtime.frameDomain, 'sprite-528');
  assert.equal(manifest.runtime.frameCount, 871);
  assert.equal(manifest.deduplication.uniqueVisualCount, 100);
  assert.equal(manifest.frames.length, 871);
  assert.equal(manifest.authority.actionScriptExecuted, false);
  assert.equal(manifest.authority.originalRuntimeBaseline, false);
  assert.equal(manifest.strictAcceptanceEffect, 'none');
});

test('sprite-302 and sprite-327 retain complete source-static control states without mouse promotion', async () => {
  assert.equal(normalizeCourseShellG04L03ControlFrame(Number.NaN, 'sprite-302'), 1);
  assert.equal(normalizeCourseShellG04L03ControlFrame(150, 'sprite-302'), 149);
  assert.equal(normalizeCourseShellG04L03ControlFrame(133, 'sprite-327'), 132);
  for (const descriptor of [
    {
      frameDomain: 'sprite-302' as const,
      frame: 2,
      scenario: 'popup-control-structural',
      geometry: COURSE_SHELL_G04_L03_POPUP,
      expectedFrameCount: 149,
      expectedUniqueVisualCount: 20
    },
    {
      frameDomain: 'sprite-327' as const,
      frame: 2,
      scenario: 'mouse-object-control-structural',
      geometry: COURSE_SHELL_G04_L03_MOUSE_OBJECT,
      expectedFrameCount: 132,
      expectedUniqueVisualCount: 22
    }
  ]) {
    const state = getCourseShellG04L03FrameState(descriptor.frame, {
      frameDomain: descriptor.frameDomain,
      lang: 'es',
      scenario: descriptor.scenario,
      seed: 13
    });
    assert.equal(state.frameDomain, descriptor.frameDomain);
    assert.equal(state.frame, descriptor.frame);
    assert.equal(state.rootFrame, 49);
    assert.equal(state.phase, 'source-control-tooltip-static-structure');
    assert.equal(state.presentation, 'ffdec-structural-control-tooltip');
    assert.match(state.nestedFrameAsset?.source ?? '', new RegExp(`${descriptor.frameDomain}/visual-\\d{3}-[a-f0-9]{12}\\.png$`));
    assert.deepEqual(state.nestedGeometry, descriptor.geometry);
    assert.equal(state.actionScriptExecuted, false);
    assert.equal(state.originalRuntimeBaselineComplete, false);
    const manifest = JSON.parse(
      await readFile(
        `${repositoryRoot}public/flash-assets/courses/shell-course-g04-l03-index-local/${descriptor.frameDomain}/manifest.json`,
        'utf8'
      )
    );
    assert.equal(manifest.runtime.frameCount, descriptor.expectedFrameCount);
    assert.equal(manifest.deduplication.uniqueVisualCount, descriptor.expectedUniqueVisualCount);
    assert.equal(manifest.frames.length, descriptor.expectedFrameCount);
    assert.equal(manifest.authority.actionScriptExecuted, false);
    assert.equal(manifest.strictAcceptanceEffect, 'none');
  }
});

test('sprite-132 retains all 100 preloader progress frames without loading-causality promotion', async () => {
  assert.equal(normalizeCourseShellG04L03ProgressFrame(Number.NaN), 1);
  assert.equal(normalizeCourseShellG04L03ProgressFrame(0), 1);
  assert.equal(normalizeCourseShellG04L03ProgressFrame(101), 100);
  const state = getCourseShellG04L03FrameState(50, {
    frameDomain: 'sprite-132',
    lang: 'en',
    scenario: 'preloader-progress-structural',
    seed: 17
  });
  assert.equal(state.frameDomain, 'sprite-132');
  assert.equal(state.frame, 50);
  assert.equal(state.rootFrame, 1);
  assert.equal(state.phase, 'source-preloader-progress-static-structure');
  assert.equal(state.presentation, 'ffdec-structural-preloader-progress');
  assert.match(state.nestedFrameAsset?.source ?? '', /sprite-132\/frame-0050\.png$/);
  assert.deepEqual(state.nestedGeometry, COURSE_SHELL_G04_L03_PROGRESS);
  assert.equal(state.actionScriptExecuted, false);
  assert.equal(state.originalRuntimeBaselineComplete, false);
  assert.equal(state.strictAcceptanceEffect, 'none');

  const manifest = JSON.parse(
    await readFile(
      `${repositoryRoot}public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-132/manifest.json`,
      'utf8'
    )
  );
  assert.equal(manifest.runtime.frameCount, 100);
  assert.equal(manifest.frames.length, 100);
  assert.equal(new Set(manifest.frames.map(({sha256}: {sha256: string}) => sha256)).size, 100);
  assert.equal(manifest.authority.actionScriptExecuted, false);
  assert.equal(manifest.strictAcceptanceEffect, 'none');
});

test('all 14 additional multi-frame domains render complete hash-bound FFDec lookups without acceptance promotion', async () => {
  assert.equal(COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.length, 14);
  assert.equal(
    COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.reduce(
      (sum, id) => sum + COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id].frameCount,
      0
    ),
    142
  );
  for (const frameDomain of COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS) {
    const data = COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[frameDomain];
    assert.equal(normalizeCourseShellG04L03AdditionalFrame(Number.NaN, frameDomain), 1);
    assert.equal(normalizeCourseShellG04L03AdditionalFrame(0, frameDomain), 1);
    assert.equal(
      normalizeCourseShellG04L03AdditionalFrame(data.frameCount + 1, frameDomain),
      data.frameCount
    );
    const state = getCourseShellG04L03FrameState(data.frameCount, {
      frameDomain,
      lang: 'es',
      scenario: data.scenarioId,
      seed: 19
    });
    assert.equal(state.frameDomain, frameDomain);
    assert.equal(state.frame, data.frameCount);
    assert.equal(state.rootFrame, data.rootFrame);
    assert.equal(state.phase, 'source-additional-domain-static-structure');
    assert.equal(state.presentation, 'ffdec-structural-additional-domain');
    assert.deepEqual(state.nestedGeometry, data);
    assert.match(
      state.nestedFrameAsset?.source ?? '',
      new RegExp(`${frameDomain}/visual-\\d{3}-[a-f0-9]{12}\\.png$`)
    );
    assert.equal(state.actionScriptExecuted, false);
    assert.equal(state.originalRuntimeBaselineComplete, false);
    assert.equal(state.strictAcceptanceEffect, 'none');

    const manifestBytes = await readFile(
      `${repositoryRoot}public/flash-assets/courses/shell-course-g04-l03-index-local/${frameDomain}/manifest.json`
    );
    const manifest = JSON.parse(manifestBytes.toString('utf8'));
    assert.equal(sha256(manifestBytes), data.assetManifestSha256);
    assert.equal(manifest.runtime.frameDomain, frameDomain);
    assert.equal(manifest.runtime.frameCount, data.frameCount);
    assert.equal(manifest.frames.length, data.frameCount);
    assert.equal(manifest.deduplication.everyFrameMapped, true);
    assert.equal(manifest.authority.actionScriptExecuted, false);
    assert.equal(manifest.authority.originalRuntimeBaseline, false);
    assert.equal(manifest.authority.naturalPlaybackClaimed, false);
    assert.equal(manifest.strictAcceptanceEffect, 'none');

    const markup = renderToStaticMarkup(
      createElement(courseShell.Renderer, {
        entryStateSha256: 'c'.repeat(64),
        frame: data.frameCount,
        frameDomain,
        lang: 'es',
        requirementId: `req:${frameDomain}:${data.scenarioId}:es`,
        rootFrame: data.rootFrame,
        scenario: data.scenarioId,
        seed: 19,
        state,
        traceId: `trace:${frameDomain}:${data.scenarioId}:es:seed-0`
      })
    );
    assert.match(markup, new RegExp(`data-flash-frame-domain="${frameDomain}"`));
    assert.match(markup, /data-shell-presentation="ffdec-structural-additional-domain"/);
    assert.match(markup, /data-additional-domain-manifest-sha256="[a-f0-9]{64}"/);
    assert.match(markup, /data-additional-domain-frame-sha256="[a-f0-9]{64}"/);
    assert.match(markup, /transform:matrix\(/);
    assert.match(markup, /data-actionscript-executed="false"/);
    assert.match(markup, /data-original-runtime-baseline-complete="false"/);
    assert.match(markup, /data-strict-acceptance-effect="none"/);
  }
});

test('all 14 scripted or interactive one-frame domains render source-bound structure without behavior promotion', async () => {
  assert.equal(COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.length, 14);
  for (const frameDomain of COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS) {
    const data = COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA[frameDomain];
    const state = getCourseShellG04L03FrameState(99, {frameDomain, lang: 'es', scenario: data.scenarioId, seed: 23});
    assert.equal(state.frameDomain, frameDomain);
    assert.equal(state.frame, 1);
    assert.equal(state.rootFrame, data.rootFrame);
    assert.equal(state.phase, 'source-single-frame-domain-static-structure');
    assert.equal(state.presentation, 'ffdec-structural-single-frame-domain');
    assert.deepEqual(state.nestedGeometry, data);
    assert.match(state.nestedFrameAsset?.source ?? '', new RegExp(`${frameDomain}/visual-001-[a-f0-9]{12}\\.png$`));
    assert.equal(state.actionScriptExecuted, false);
    assert.equal(state.originalRuntimeBaselineComplete, false);
    assert.equal(state.strictAcceptanceEffect, 'none');

    const manifestBytes = await readFile(`${repositoryRoot}public/flash-assets/courses/shell-course-g04-l03-index-local/${frameDomain}/manifest.json`);
    const manifest = JSON.parse(manifestBytes.toString('utf8'));
    assert.equal(sha256(manifestBytes), data.assetManifestSha256);
    assert.equal(manifest.runtime.frameDomain, frameDomain);
    assert.equal(manifest.runtime.frameCount, 1);
    assert.equal(manifest.frames.length, 1);
    assert.equal(manifest.authority.actionScriptExecuted, false);
    assert.equal(manifest.authority.originalRuntimeBaseline, false);
    assert.equal(manifest.strictAcceptanceEffect, 'none');

    const markup = renderToStaticMarkup(createElement(courseShell.Renderer, {
      entryStateSha256: 'd'.repeat(64), frame: 1, frameDomain, lang: 'es',
      requirementId: `req:${frameDomain}:${data.scenarioId}:es`, rootFrame: data.rootFrame,
      scenario: data.scenarioId, seed: 23, state,
      traceId: `trace:${frameDomain}:${data.scenarioId}:es:seed-0`
    }));
    assert.match(markup, new RegExp(`data-flash-frame-domain="${frameDomain}"`));
    assert.match(markup, /data-shell-presentation="ffdec-structural-single-frame-domain"/);
    assert.match(markup, /data-single-frame-domain-manifest-sha256="[a-f0-9]{64}"/);
    assert.match(markup, /data-single-frame-domain-frame-sha256="[a-f0-9]{64}"/);
    assert.match(markup, /transform:matrix\(/);
    assert.match(markup, /data-strict-acceptance-effect="none"/);
  }
});

test('all 50 root drawings are structural-only and the audit map remains a separate presentation', () => {
  assert.equal(normalizeCourseShellG04L03Frame(Number.NaN), 1);
  assert.equal(normalizeCourseShellG04L03Frame(0), 1);
  assert.equal(normalizeCourseShellG04L03Frame(49.9), 49);
  assert.equal(normalizeCourseShellG04L03Frame(51), 50);
  assert.equal(courseShellG04L03PhaseAtFrame(1), 'source-loading-static-structure');
  assert.equal(courseShellG04L03PhaseAtFrame(48), 'source-loading-static-structure');
  assert.equal(
    courseShellG04L03PhaseAtFrame(49),
    'source-initialization-static-structure'
  );
  assert.equal(
    courseShellG04L03PhaseAtFrame(50),
    'source-close-confirmation-static-structure'
  );

  const structural = getCourseShellG04L03FrameState(48, {
    lang: 'es',
    scenario: 'source-root-structural',
    seed: 7
  });
  assert.equal(structural.view, 'menu');
  assert.equal(structural.selectedSection, null);
  assert.equal(structural.status, 'ready');
  assert.equal(structural.blocker, null);
  assert.equal(structural.presentation, 'ffdec-structural-root');
  assert.equal(structural.originalRuntimeBaselineComplete, false);
  assert.equal(structural.actionScriptExecuted, false);
  assert.equal(structural.strictAcceptanceEffect, 'none');
  assert.equal(structural.rootFrameAsset.sha256, COURSE_SHELL_G04_L03_ROOT_FRAME_ASSETS[47].sha256);

  const initialization = getCourseShellG04L03FrameState(49, {
    lang: 'en',
    scenario: 'source-root-structural',
    seed: 0
  });
  assert.equal(initialization.status, 'ready');
  assert.equal(initialization.blocker, null);
  assert.equal(initialization.presentation, 'ffdec-structural-root');

  const projection = getCourseShellG04L03FrameState(50, {
    lang: 'es',
    scenario: 'section-vb',
    seed: 7
  });
  assert.equal(projection.view, 'section');
  assert.equal(projection.selectedSection, 'VB');
  assert.equal(projection.lessonTitle, 'Negative Numbers');
  assert.equal(projection.lessonTitleLanguage, 'en');
  assert.equal(projection.lessonTitleFallback, true);
  assert.equal(projection.status, 'ready');
  assert.equal(projection.blocker, null);
  assert.equal(projection.presentation, 'current-javascript-lesson-map');
});

test('public structural root assets exactly match the FFDec report and generated manifest', async () => {
  const [sourceReport, publicManifest] = await Promise.all([
    readFile(`${migrationRoot}/baseline/ffdec-root-frames.json`, 'utf8').then(JSON.parse),
    readFile(
      `${repositoryRoot}public/flash-assets/courses/shell-course-g04-l03-index-local/root-frames/manifest.json`,
      'utf8'
    ).then(JSON.parse)
  ]);
  assert.equal(sourceReport.status, 'structural-baseline-only');
  assert.equal(publicManifest.classification, 'engineering-structural-inspection-not-strict-acceptance');
  assert.equal(publicManifest.authority.actionScriptExecuted, false);
  assert.equal(publicManifest.authority.originalRuntimeBaseline, false);
  assert.equal(publicManifest.strictAcceptanceEffect, 'none');
  assert.equal(publicManifest.frames.length, 50);
  assert.deepEqual(
    publicManifest.frames.map(({frame, file, sha256}: {frame: number; file: string; sha256: string}) => ({frame, file, sha256})),
    COURSE_SHELL_G04_L03_ROOT_FRAME_ASSETS
  );
  for (const frame of publicManifest.frames) {
    const bytes = await readFile(
      `${repositoryRoot}public/flash-assets/courses/shell-course-g04-l03-index-local/root-frames/${frame.file}`
    );
    assert.equal(sha256(bytes), frame.sha256);
    assert.equal(bytes.length, frame.bytes);
  }
});

test('39-page current-JavaScript projection exactly matches the generated source-local contract', async () => {
  const contract = JSON.parse(
    await readFile(
      `${migrationRoot}/audit/source-local-current-javascript-shell-contract.json`,
      'utf8'
    )
  ) as {
    sourceEvidence: {
      frame35HostContract: {sha256: string};
      frame49InitializationStop: {sha256: string};
      frame50ChildLoadCandidate: {sha256: string};
    };
    pages: Array<{
      globalPageOrdinal: number;
      sectionPageOrdinal: number;
      sectionCode: string;
      sourcePath: string;
      animationId: string;
      titleEnglish: string;
      titleSpanish: string | null;
      spanishTitleStatus: string;
    }>;
    acceptance: Record<string, boolean>;
  };
  const pages = COURSE_SHELL_G04_L03_SECTIONS.flatMap((section) => section.pages);
  assert.equal(pages.length, 39);
  assert.deepEqual(
    pages.map((page) => ({
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      sourcePath: page.sourcePath,
      animationId: page.animationId,
      titleEnglish: page.titleEnglish,
      titleSpanish: page.titleSpanish,
      spanishTitleStatus: page.spanishTitleStatus
    })),
    contract.pages.map((page) => ({
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      sourcePath: page.sourcePath,
      animationId: page.animationId,
      titleEnglish: page.titleEnglish,
      titleSpanish: page.titleSpanish,
      spanishTitleStatus: page.spanishTitleStatus
    }))
  );
  assert.equal(
    contract.sourceEvidence.frame35HostContract.sha256,
    COURSE_SHELL_G04_L03_SOURCE.frame35ScriptSha256
  );
  assert.equal(
    contract.sourceEvidence.frame49InitializationStop.sha256,
    COURSE_SHELL_G04_L03_SOURCE.frame49ScriptSha256
  );
  assert.equal(
    contract.sourceEvidence.frame50ChildLoadCandidate.sha256,
    COURSE_SHELL_G04_L03_SOURCE.frame50ScriptSha256
  );
  assert.ok(Object.values(contract.acceptance).every((value) => value === false));
  assert.equal(pages.filter((page) => page.strictRoute).length, 0);
  assert.ok(
    pages.every((page) => page.auditRoute.endsWith('?auditContext=g4-l3-lesson'))
  );
});

test('interaction state and Replay reset only the current shell map', () => {
  const initial = courseShellG04L03InteractionForScenario('default');
  const section = transitionCourseShellG04L03(initial, {
    type: 'select-section',
    section: 'IN'
  });
  const modal = transitionCourseShellG04L03(section, {type: 'request-quit'});
  assert.deepEqual(section, {view: 'section', selectedSection: 'IN'});
  assert.deepEqual(modal, {view: 'quit-confirmation', selectedSection: 'IN'});
  assert.deepEqual(transitionCourseShellG04L03(modal, {type: 'cancel-quit'}), section);
  assert.deepEqual(transitionCourseShellG04L03(modal, {type: 'replay'}), initial);
  assert.deepEqual(courseShellG04L03InteractionForScenario('section-fq'), {
    view: 'section',
    selectedSection: 'FQ'
  });
  assert.deepEqual(courseShellG04L03InteractionForScenario('section-unknown'), initial);
});

test('renderer separates FFDec structural roots from the frame-50 JavaScript audit map', () => {
  const render = (scenario: string, lang: 'en' | 'es', frame: number, replay = 0) => {
    const state = courseShell.getFrameState(frame, {frame, scenario, lang, seed: 17});
    return renderToStaticMarkup(
      createElement(courseShell.Renderer, {
        entryStateSha256: 'b'.repeat(64),
        frame,
        frameDomain: 'root',
        lang,
        requirementId: `req-root-${scenario}-${lang}`,
        replay,
        rootFrame: frame,
        scenario,
        seed: 17,
        state,
        traceId: `trace-root-${scenario}-${lang}`
      })
    );
  };

  const structural = render('source-root-structural', 'en', 1);
  assert.match(structural, /data-shell-phase="source-loading-static-structure"/);
  assert.match(structural, /data-shell-presentation="ffdec-structural-root"/);
  assert.match(structural, /data-render-state="ready"/);
  assert.match(structural, /data-render-visual="true"/);
  assert.match(structural, /frame-0001\.png/);
  assert.match(structural, /data-actionscript-executed="false"/);
  assert.match(structural, /data-original-runtime-baseline-complete="false"/);
  assert.match(structural, /data-strict-acceptance-effect="none"/);
  assert.doesNotMatch(structural, /39 active pages/);

  const stopped = render('source-root-structural', 'en', 49);
  assert.match(stopped, /data-shell-phase="source-initialization-static-structure"/);
  assert.match(stopped, /data-render-state="ready"/);
  assert.match(stopped, /frame-0049\.png/);

  const sourceClose = render('source-root-structural', 'en', 50);
  assert.match(sourceClose, /data-shell-phase="source-close-confirmation-static-structure"/);
  assert.match(sourceClose, /frame-0050\.png/);
  assert.doesNotMatch(sourceClose, /course-shell-sections/);

  const nativeMenuState = courseShell.getFrameState(9, {
    frame: 9,
    frameDomain: 'sprite-1011',
    rootFrame: 50,
    scenario: 'native-menu-structural',
    lang: 'en',
    seed: 0
  });
  const nativeMenu = renderToStaticMarkup(
    createElement(courseShell.Renderer, {
      frame: 9,
      frameDomain: 'sprite-1011',
      rootFrame: 50,
      scenario: 'native-menu-structural',
      lang: 'en',
      seed: 0,
      state: nativeMenuState
    })
  );
  assert.match(nativeMenu, /data-flash-frame-domain="sprite-1011"/);
  assert.match(nativeMenu, /data-shell-phase="source-native-menu-static-structure"/);
  assert.match(nativeMenu, /data-shell-presentation="ffdec-structural-native-menu"/);
  assert.match(nativeMenu, /frame-0009\.png/);
  assert.match(nativeMenu, /data-full-stage-composition-claimed="false"/);
  assert.match(nativeMenu, /data-actionscript-executed="false"/);
  assert.match(nativeMenu, /data-original-runtime-baseline-complete="false"/);

  const moverState = courseShell.getFrameState(8, {
    frame: 8,
    frameDomain: 'sprite-528',
    rootFrame: 49,
    scenario: 'mover-tooltip-structural',
    lang: 'es',
    seed: 0
  });
  const mover = renderToStaticMarkup(
    createElement(courseShell.Renderer, {
      frame: 8,
      frameDomain: 'sprite-528',
      rootFrame: 49,
      scenario: 'mover-tooltip-structural',
      lang: 'es',
      seed: 0,
      state: moverState
    })
  );
  assert.match(mover, /data-flash-frame-domain="sprite-528"/);
  assert.match(mover, /data-shell-phase="source-mover-tooltip-static-structure"/);
  assert.match(mover, /data-shell-presentation="ffdec-structural-mover-tooltip"/);
  assert.match(mover, /sprite-528\/visual-\d{3}-[a-f0-9]{12}\.png/);
  assert.match(mover, /data-full-stage-composition-claimed="false"/);
  assert.match(mover, /data-actionscript-executed="false"/);
  assert.match(mover, /data-original-runtime-baseline-complete="false"/);

  const popupState = courseShell.getFrameState(2, {
    frame: 2,
    frameDomain: 'sprite-302',
    rootFrame: 49,
    scenario: 'popup-control-structural',
    lang: 'en',
    seed: 0
  });
  const popup = renderToStaticMarkup(
    createElement(courseShell.Renderer, {
      frame: 2,
      frameDomain: 'sprite-302',
      rootFrame: 49,
      scenario: 'popup-control-structural',
      lang: 'en',
      seed: 0,
      state: popupState
    })
  );
  assert.match(popup, /data-flash-frame-domain="sprite-302"/);
  assert.match(popup, /data-shell-phase="source-control-tooltip-static-structure"/);
  assert.match(popup, /data-shell-presentation="ffdec-structural-control-tooltip"/);
  assert.match(popup, /sprite-302\/visual-\d{3}-[a-f0-9]{12}\.png/);
  assert.match(popup, /data-full-stage-composition-claimed="false"/);
  assert.match(popup, /data-actionscript-executed="false"/);

  const progressState = courseShell.getFrameState(50, {
    frame: 50,
    frameDomain: 'sprite-132',
    rootFrame: 1,
    scenario: 'preloader-progress-structural',
    lang: 'en',
    seed: 0
  });
  const progress = renderToStaticMarkup(
    createElement(courseShell.Renderer, {
      frame: 50,
      frameDomain: 'sprite-132',
      rootFrame: 1,
      scenario: 'preloader-progress-structural',
      lang: 'en',
      seed: 0,
      state: progressState
    })
  );
  assert.match(progress, /data-flash-frame-domain="sprite-132"/);
  assert.match(progress, /data-shell-phase="source-preloader-progress-static-structure"/);
  assert.match(progress, /data-shell-presentation="ffdec-structural-preloader-progress"/);
  assert.match(progress, /sprite-132\/frame-0050\.png/);
  assert.match(progress, /data-full-stage-composition-claimed="false"/);
  assert.match(progress, /data-actionscript-executed="false"/);

  const menu = render('lesson-map-audit', 'en', 50);
  assert.match(menu, /data-flash-frame="50"/);
  assert.match(menu, /data-render-state="ready"/);
  assert.match(menu, /data-flash-entry-state-sha256="b{64}"/);
  assert.match(menu, /data-render-visual="true"/);
  assert.match(menu, /data-shell-page-count="39"/);
  assert.match(menu, /data-shell-source-visual-parity="false"/);
  assert.match(menu, /data-shell-static-page-count-conflict="unresolved"/);
  assert.match(menu, /Counting on Numbers/);
  assert.match(menu, /Negative Numbers/);
  assert.match(menu, /39 active pages/);
  assert.doesNotMatch(menu, /ruffle|\.swf/i);

  const spanish = render('section-in', 'es', 50);
  assert.match(spanish, /Título en español no disponible en la fuente/);
  assert.match(spanish, /Apréndelo/);
  assert.match(spanish, /Los números en la recta numérica/);
  assert.match(spanish, /Texto inglés: no hay título español de página en la fuente/);
  assert.match(
    spanish,
    /href="\/es\/animations\/course-g04-l03-in-002\?auditContext=g4-l3-lesson"/
  );
  assert.match(spanish, /data-route-authority="local-current-javascript-audit-only"/);
  assert.doesNotMatch(spanish, /strict-complete/);

  const modal = render('quit-confirmation', 'en', 50);
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /Yes \(disabled\)/);

  const replayedSection = render('section-in', 'en', 50, 1);
  assert.match(replayedSection, /data-shell-view="menu"/);
  assert.doesNotMatch(replayedSection, /course-shell-g04-l03-IN-title/);
});

test('all deterministic endpoints preserve exact runtime identity', () => {
  let probes = 0;
  for (const {id: scenario} of courseShell.scenarios.filter(
    ({id}) => ![
      'native-menu-structural',
      'mover-tooltip-structural',
      'popup-control-structural',
      'mouse-object-control-structural',
      'preloader-progress-structural',
      ...COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.map(
        (id) => COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id].scenarioId
      ),
      ...COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.map(
        (id) => COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA[id].scenarioId
      )
    ].includes(id)
  )) {
    for (const lang of ['en', 'es'] as const) {
      for (const frame of [1, 50]) {
        const state = courseShell.getFrameState(frame, {
          frame,
          frameDomain: 'root',
          rootFrame: frame,
          scenario,
          lang,
          seed: 0
        });
        assert.equal(state.frameDomain, 'root');
        assert.equal(state.frame, frame);
        assert.equal(state.rootFrame, frame);
        assert.equal(state.scenario, scenario);
        assert.equal(state.language, lang);
        assert.equal(state.status, 'ready');
        assert.equal(state.blocker, null);
        probes += 1;
      }
    }
  }
  for (const lang of ['en', 'es'] as const) {
    for (const frame of [1, 48]) {
      const state = courseShell.getFrameState(frame, {
        frame,
        frameDomain: 'sprite-1011',
        rootFrame: 50,
        scenario: 'native-menu-structural',
        lang,
        seed: 0
      });
      assert.equal(state.frameDomain, 'sprite-1011');
      assert.equal(state.frame, frame);
      assert.equal(state.rootFrame, 50);
      assert.equal(state.scenario, 'native-menu-structural');
      assert.equal(state.language, lang);
      assert.equal(state.status, 'ready');
      assert.equal(state.blocker, null);
      probes += 1;
    }
  }
  for (const lang of ['en', 'es'] as const) {
    for (const frame of [1, 871]) {
      const state = courseShell.getFrameState(frame, {
        frame,
        frameDomain: 'sprite-528',
        rootFrame: 49,
        scenario: 'mover-tooltip-structural',
        lang,
        seed: 0
      });
      assert.equal(state.frameDomain, 'sprite-528');
      assert.equal(state.frame, frame);
      assert.equal(state.rootFrame, 49);
      assert.equal(state.scenario, 'mover-tooltip-structural');
      assert.equal(state.language, lang);
      assert.equal(state.status, 'ready');
      assert.equal(state.blocker, null);
      probes += 1;
    }
  }
  for (const descriptor of [
    {frameDomain: 'sprite-302' as const, frameCount: 149, scenario: 'popup-control-structural'},
    {frameDomain: 'sprite-327' as const, frameCount: 132, scenario: 'mouse-object-control-structural'}
  ]) {
    for (const lang of ['en', 'es'] as const) {
      for (const frame of [1, descriptor.frameCount]) {
        const state = courseShell.getFrameState(frame, {
          frame,
          frameDomain: descriptor.frameDomain,
          rootFrame: 49,
          scenario: descriptor.scenario,
          lang,
          seed: 0
        });
        assert.equal(state.frameDomain, descriptor.frameDomain);
        assert.equal(state.frame, frame);
        assert.equal(state.rootFrame, 49);
        assert.equal(state.scenario, descriptor.scenario);
        assert.equal(state.language, lang);
        assert.equal(state.status, 'ready');
        assert.equal(state.blocker, null);
        probes += 1;
      }
    }
  }
  for (const lang of ['en', 'es'] as const) {
    for (const frame of [1, 100]) {
      const state = courseShell.getFrameState(frame, {
        frame,
        frameDomain: 'sprite-132',
        rootFrame: 1,
        scenario: 'preloader-progress-structural',
        lang,
        seed: 0
      });
      assert.equal(state.frameDomain, 'sprite-132');
      assert.equal(state.frame, frame);
      assert.equal(state.rootFrame, 1);
      assert.equal(state.scenario, 'preloader-progress-structural');
      assert.equal(state.language, lang);
      assert.equal(state.status, 'ready');
      assert.equal(state.blocker, null);
      probes += 1;
    }
  }
  for (const frameDomain of COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS) {
    const data = COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[frameDomain];
    for (const lang of ['en', 'es'] as const) {
      for (const frame of [1, data.frameCount]) {
        const state = courseShell.getFrameState(frame, {
          frame,
          frameDomain,
          rootFrame: data.rootFrame,
          scenario: data.scenarioId,
          lang,
          seed: 0
        });
        assert.equal(state.frameDomain, frameDomain);
        assert.equal(state.frame, frame);
        assert.equal(state.rootFrame, data.rootFrame);
        assert.equal(state.scenario, data.scenarioId);
        assert.equal(state.language, lang);
        assert.equal(state.status, 'ready');
        assert.equal(state.blocker, null);
        probes += 1;
      }
    }
  }
  for (const frameDomain of COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS) {
    const data = COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA[frameDomain];
    for (const lang of ['en', 'es'] as const) {
      const state = courseShell.getFrameState(1, {frame: 1, frameDomain, rootFrame: data.rootFrame, scenario: data.scenarioId, lang, seed: 0});
      assert.equal(state.frameDomain, frameDomain);
      assert.equal(state.frame, 1);
      assert.equal(state.rootFrame, data.rootFrame);
      assert.equal(state.scenario, data.scenarioId);
      assert.equal(state.language, lang);
      assert.equal(state.status, 'ready');
      assert.equal(state.blocker, null);
      probes += 1;
    }
  }
  assert.equal(probes, 148);
});

test('manifest and generated registry expose the shell by placement ID only', async () => {
  const byId = matchPrototype({animationId: 'shell-course-g04-l03-index-local'});
  assert.equal(byId?.key, 'shell-course-g04-l03-index-local');
  assert.equal(byId?.runtime.frameCount, 50);
  assert.equal(byId?.title.en, 'Negative Numbers');
  assert.match(byId?.title.es ?? '', /título español no disponible en la fuente/);
  assert.equal(
    matchPrototype({sourcePath: 'HELP_COURSES/ELMGR5/L3/index_local.swf'}),
    undefined
  );

  const loaded = await loadAnimationModule('shell-course-g04-l03-index-local');
  assert.equal(loaded?.key, 'shell-course-g04-l03-index-local');
  assert.equal(loaded?.maturity, 'legacy-prototype');
  assert.deepEqual(loaded?.scenarios.map(({id}) => id), [
    'source-root-structural',
    'native-menu-structural',
    'mover-tooltip-structural',
    'popup-control-structural',
    'mouse-object-control-structural',
    'preloader-progress-structural',
    ...COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.map(
      (id) => COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id].scenarioId
    ),
    ...COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.map(
      (id) => COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA[id].scenarioId
    ),
    'lesson-map-audit',
    'section-ir',
    'section-rw',
    'section-vb',
    'section-in',
    'section-ti',
    'section-gs',
    'section-ts',
    'section-fq',
    'quit-confirmation'
  ]);
});
