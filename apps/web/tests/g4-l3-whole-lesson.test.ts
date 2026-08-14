import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {G4_L3_LESSON} from '../lib/g4-l3-lesson-navigation';
import {
  G4_L3_WHOLE_LESSON_STORAGE_KEY,
  completeG4L3Page,
  createInitialG4L3WholeLessonProgress,
  g4L3CompletionPercent,
  parseG4L3WholeLessonProgress,
  parseG4L3WholeLessonResumeCandidate,
  recordG4L3Replay,
  setG4L3LessonLanguage,
  startG4L3LessonAtBeginning,
  visitG4L3Page,
} from '../lib/g4-l3-whole-lesson';

test('whole-lesson state starts at the first exact XML placement', () => {
  const progress = createInitialG4L3WholeLessonProgress('en');
  assert.equal(G4_L3_WHOLE_LESSON_STORAGE_KEY, 'helpmath:g4-l3:whole-lesson-mvp:v1');
  assert.equal(progress.currentAnimationId, G4_L3_LESSON.pages[0]!.animationId);
  assert.deepEqual(progress.visitedAnimationIds, [G4_L3_LESSON.pages[0]!.animationId]);
  assert.deepEqual(progress.completedAnimationIds, []);
  assert.deepEqual(progress.replayCounts, {});
  assert.equal(g4L3CompletionPercent(progress), 0);
});

test('one learner session preserves navigation, progress, language, and replay state', () => {
  const first = G4_L3_LESSON.pages[0]!;
  const second = G4_L3_LESSON.pages[1]!;
  let progress = createInitialG4L3WholeLessonProgress('en');
  progress = completeG4L3Page(progress, first.animationId);
  progress = visitG4L3Page(progress, second.animationId);
  progress = recordG4L3Replay(progress, second.animationId);
  progress = recordG4L3Replay(progress, second.animationId);
  progress = setG4L3LessonLanguage(progress, 'es');

  assert.equal(progress.currentAnimationId, second.animationId);
  assert.deepEqual(progress.visitedAnimationIds, [first.animationId, second.animationId]);
  assert.deepEqual(progress.completedAnimationIds, [first.animationId]);
  assert.equal(progress.replayCounts[second.animationId], 2);
  assert.equal(progress.language, 'es');
  assert.equal(g4L3CompletionPercent(progress), 3);

  assert.deepEqual(parseG4L3WholeLessonProgress(
    JSON.stringify(progress),
    'es',
  ), progress);
  assert.equal(
    parseG4L3WholeLessonProgress(JSON.stringify(progress), 'en').language,
    'en',
  );
});

test('legacy bookmark choice offers later placement and No starts at page one without erasing review state', () => {
  const first = G4_L3_LESSON.pages[0]!;
  const later = G4_L3_LESSON.pages[8]!;
  let stopped = createInitialG4L3WholeLessonProgress('en');
  stopped = completeG4L3Page(stopped, first.animationId);
  stopped = visitG4L3Page(stopped, later.animationId);

  const candidate = parseG4L3WholeLessonResumeCandidate(
    JSON.stringify(stopped),
    'en',
  );
  assert.ok(candidate);
  assert.equal(candidate.currentAnimationId, later.animationId);

  const fromBeginning = startG4L3LessonAtBeginning(candidate);
  assert.equal(fromBeginning.currentAnimationId, first.animationId);
  assert.deepEqual(fromBeginning.completedAnimationIds, [first.animationId]);
  assert.ok(fromBeginning.visitedAnimationIds.includes(later.animationId));
  assert.equal(
    parseG4L3WholeLessonResumeCandidate(
      JSON.stringify(fromBeginning),
      'en',
    ),
    null,
  );
  assert.equal(
    parseG4L3WholeLessonResumeCandidate('{', 'en'),
    null,
  );
});

test('source-bound resume prompt stays local, explicit, and acceptance-neutral', async () => {
  const [
    playerSource,
    promptSource,
    shellSource,
    descriptorSource,
    globalCss,
    sourceVisual,
    sourceManifest,
  ] = await Promise.all([
    readFile(
      new URL('../components/g4-l3-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/legacy-resume-prompt.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../lib/g4-l3-whole-lesson-player-descriptor.ts', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
    readFile(new URL(
      '../../../public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-549/visual-002-6632508343f7.png',
      import.meta.url,
    )),
    readFile(new URL(
      '../../../public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-549/manifest.json',
      import.meta.url,
    )),
  ]);

  assert.equal(
    createHash('sha256').update(sourceVisual).digest('hex'),
    '6632508343f77058ce9ef012e08de4cec5917eba79ebd481376852691f6a5a86',
  );
  assert.equal(
    createHash('sha256').update(sourceManifest).digest('hex'),
    'ccdb8493c107edc5c29dfc0193579a4ea0440bb6a6e56aafed7f35c1ea5be38e',
  );
  assert.match(descriptorSource, /sourceCharacterId: 549/);
  assert.match(descriptorSource, /sourceInstanceName: 'bookmark_mc'/);
  assert.match(descriptorSource, /rootFrame: 49/);
  assert.match(descriptorSource, /localFrame: 2/);
  assert.match(descriptorSource, /rootCompositionOffset: Object\.freeze\(\{x: -617\.9, y: 2\.25\}\)/);
  assert.match(
    descriptorSource,
    /static-structural-candidate-original-runtime-not-established/,
  );
  assert.match(playerSource, /parseG4L3WholeLessonResumeCandidate/);
  assert.match(playerSource, /resumeDecision !== 'resolved'/);
  assert.match(playerSource, /startG4L3LessonAtBeginning\(resumeCandidate\)/);
  assert.match(playerSource, /stageOverlay=\{stageOverlay\}/);
  assert.match(playerSource, /paused=\{paused \|\| resumeDecision !== 'resolved'\}/);
  assert.match(
    shellSource,
    /data-session-decision-overlay=\{stageOverlayOpen \? 'open' : 'closed'\}/,
  );
  assert.match(shellSource, /inert=\{stageOverlayOpen \? true : undefined\}/);
  assert.match(shellSource, /aria-hidden=\{stageOverlayOpen \? true : undefined\}/);
  assert.match(shellSource, /: stageOverlay\}/);
  assert.match(promptSource, /aria-modal="true"/);
  assert.match(promptSource, /data-actionscript-executed="false"/);
  assert.match(
    promptSource,
    /data-legacy-bookmark-endpoint-executed="false"/,
  );
  assert.match(
    promptSource,
    /data-resume-functional-authority="modern-local-functional-equivalent"/,
  );
  assert.match(promptSource, /modern-functional-equivalent-source-spanish-absent/);
  assert.match(promptSource, /event\.key === 'Escape'/);
  assert.match(promptSource, /event\.key !== 'Tab'/);
  assert.match(promptSource, /document\.addEventListener\('focusin'/);
  assert.match(promptSource, /body\.style\.overflow = 'hidden'/);
  assert.match(promptSource, /decisionCommittedRef\.current/);
  assert.match(promptSource, /disabled=\{decisionCommitted\}/);
  assert.doesNotMatch(
    `${playerSource}\n${promptSource}`,
    /getURL|SharedObject|Bookmark_URL/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__resume-source-image \{[\s\S]*?left: -77\.2375%;[\s\S]*?width: 177\.125%;/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__resume-prompt \{[\s\S]*?z-index: 20;/,
  );
  assert.match(
    globalCss,
    /data-session-decision-overlay='open'/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__resume-modern-card \{[\s\S]*?max-height: 86%;[\s\S]*?overflow: auto;/,
  );
});

test('source-bound Exit prompt preserves the shell visual and replaces legacy network behavior locally', async () => {
  const [
    playerSource,
    descriptorPlayerSource,
    promptSource,
    shellSource,
    descriptorSource,
    globalCss,
    sourceVisual,
    sourceManifest,
  ] = await Promise.all([
    readFile(
      new URL('../components/g4-l3-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/descriptor-driven-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/legacy-exit-prompt.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../lib/g4-l3-whole-lesson-player-descriptor.ts', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
    readFile(new URL(
      '../../../public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-562/visual-002-a1ea76c78f66.png',
      import.meta.url,
    )),
    readFile(new URL(
      '../../../public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-562/manifest.json',
      import.meta.url,
    )),
  ]);

  assert.equal(
    createHash('sha256').update(sourceVisual).digest('hex'),
    'a1ea76c78f664442e1e3270affb9ec6a74a11dab889e30d111916d716b663d33',
  );
  assert.equal(
    createHash('sha256').update(sourceManifest).digest('hex'),
    'debf670d5e480a19bbfd67110f9ebcd9cbcf87edb6da4202a3536eaadbe477ff',
  );
  assert.match(
    descriptorSource,
    /exitPrompt: Object\.freeze\(\{[\s\S]*sourceCharacterId: 562[\s\S]*sourceInstanceName: 'quit'/,
  );
  assert.match(descriptorSource, /rootDepth: 448/);
  assert.match(descriptorSource, /exporterCanvas: Object\.freeze\(\{width: 1392, height: 596\}\)/);
  assert.match(descriptorSource, /rootCompositionOffset: Object\.freeze\(\{x: -594\.65, y: -3\.85\}\)/);
  assert.match(descriptorSource, /sourceButtonCharacterIds: Object\.freeze\(\{yes: 556, no: 560\}\)/);
  assert.match(descriptorSource, /x: 277\.7,[\s\S]*y: 304\.45,[\s\S]*width: 98\.5,[\s\S]*height: 30\.6/);
  assert.match(descriptorSource, /x: 417\.7,[\s\S]*y: 304\.45,[\s\S]*width: 98\.5,[\s\S]*height: 30\.6/);
  assert.match(descriptorSource, /sourceEnglishText: 'Are you sure want to close \?'/);
  assert.match(descriptorSource, /spanishTranslationSupplied: false/);

  assert.match(shellSource, /const stageOverlayOpen = Boolean\(stageOverlay\) \|\| exitPromptOpen/);
  assert.match(shellSource, /exitPausedBeforeOpenRef\.current = paused/);
  assert.match(shellSource, /if \(!paused\) onPausedChange\(true\)/);
  assert.match(shellSource, /onPausedChange\(pausedBeforeOpen\)/);
  assert.match(shellSource, /requestAnimationFrame\(\(\) => exitTriggerRef\.current\?\.focus\(\)\)/);
  assert.match(shellSource, /data-exit-trigger="legacy-source-hit-area"/);
  assert.match(shellSource, /data-exit-trigger="modern-accessible-control"/);
  assert.match(shellSource, /onClick=\{\(event\) => requestExit\(event\.currentTarget\)\}/);
  assert.match(shellSource, /exitPromptOpen[\s\S]*<LegacyExitPrompt[\s\S]*: stageOverlay\}/);
  assert.match(shellSource, /evidence=\{visualSkin\.exitPrompt\}/);
  assert.match(shellSource, /onConfirmExit=\{onExit\}/);
  assert.match(shellSource, /data-session-decision-kind=\{exitPromptOpen/);

  assert.match(promptSource, /aria-modal="true"/);
  assert.match(promptSource, /role="dialog"/);
  assert.match(promptSource, /cancelRef\.current\?\.focus\(\)/);
  assert.match(promptSource, /event\.key === 'Escape'/);
  assert.match(promptSource, /event\.stopPropagation\(\)/);
  assert.match(promptSource, /commitDecision\('stay'\)/);
  assert.match(promptSource, /event\.key !== 'Tab'/);
  assert.match(promptSource, /document\.addEventListener\('focusin'/);
  assert.match(promptSource, /body\.style\.overflow = 'hidden'/);
  assert.match(promptSource, /decisionCommittedRef\.current/);
  assert.match(promptSource, /disabled=\{decisionCommitted\}/);
  assert.match(promptSource, /naturalWidth ===[\s\S]*evidence\.exporterCanvas\.width/);
  assert.match(promptSource, /modern-functional-equivalent-source-spanish-absent/);
  assert.match(promptSource, /La fuente no incluye una versión visual en español/);
  for (const safetyMarker of [
    'data-actionscript-executed="false"',
    'data-external-legacy-endpoint-executed="false"',
    'data-legacy-bookmark-url-executed="false"',
    'data-legacy-report-url-executed="false"',
    'data-legacy-window-close-executed="false"',
  ]) {
    assert.ok(promptSource.includes(safetyMarker));
  }

  for (const player of [playerSource, descriptorPlayerSource]) {
    assert.match(player, /const exitToLibrary = \(\) => window\.location\.assign\(libraryHref\)/);
    assert.match(player, /onExit=\{exitToLibrary\}/);
    assert.doesNotMatch(player, /¿Salir de esta lección y volver a la biblioteca\?/);
    assert.doesNotMatch(player, /Exit this lesson and return to the library\?/);
  }
  assert.doesNotMatch(
    `${playerSource}\n${descriptorPlayerSource}\n${promptSource}\n${shellSource}`,
    /Report_URL|Bookmark_URL|Student_ID|Class_ID|getURL|fscommand|parent\.close/,
  );

  assert.match(globalCss, /\.lesson-shell2__exit-prompt \{[\s\S]*z-index: 20;/);
  assert.match(globalCss, /\.lesson-shell2__exit-source-image \{[\s\S]*var\(--lesson-exit-source-left\)[\s\S]*var\(--lesson-exit-source-width\)/);
  assert.match(globalCss, /\.lesson-shell2__exit-source-hit \{[\s\S]*height: max\(var\(--lesson-exit-hit-height\), 44px\)[\s\S]*width: max\(var\(--lesson-exit-hit-width\), 44px\)/);
  assert.match(globalCss, /\.lesson-shell2__exit-modern-card \{[\s\S]*max-height: 86%;[\s\S]*overflow: auto;/);
  assert.match(globalCss, /\.lesson-shell2__legacy-hit--exit \{[\s\S]*height: max\(7\.333333%, 44px\)[\s\S]*width: max\(6%, 44px\)/);
});

test('stored learner state fails closed to the 39-page allowlist', () => {
  const valid = G4_L3_LESSON.pages[4]!.animationId;
  const parsed = parseG4L3WholeLessonProgress(JSON.stringify({
    schemaVersion: 1,
    currentAnimationId: 'course-g04-l03-not-a-member',
    language: 'fr',
    visitedAnimationIds: [valid, valid, '../private-archive'],
    completedAnimationIds: [valid, 'shell-course-g04-l03-index-local'],
    replayCounts: {[valid]: 2, '../private-archive': 9, [G4_L3_LESSON.pages[5]!.animationId]: -1},
  }), 'en');

  assert.equal(parsed.currentAnimationId, G4_L3_LESSON.pages[0]!.animationId);
  assert.equal(parsed.language, 'en');
  assert.deepEqual(parsed.visitedAnimationIds, [
    G4_L3_LESSON.pages[0]!.animationId,
    valid,
  ]);
  assert.deepEqual(parsed.completedAnimationIds, [valid]);
  assert.deepEqual(parsed.replayCounts, {[valid]: 2});
});

test('all 39 learner pages can be completed without changing strict migration authority', () => {
  let progress = createInitialG4L3WholeLessonProgress('en');
  for (const page of G4_L3_LESSON.pages) {
    progress = visitG4L3Page(progress, page.animationId);
    progress = completeG4L3Page(progress, page.animationId);
  }
  assert.equal(progress.visitedAnimationIds.length, 39);
  assert.equal(progress.completedAnimationIds.length, 39);
  assert.equal(g4L3CompletionPercent(progress), 100);
  assert.equal(G4_L3_LESSON.acceptance.strictComplete, false);
  assert.equal(G4_L3_LESSON.acceptance.ownerAccepted, false);
});

test('course route mounts the whole-lesson player while keeping candidate labeling', async () => {
  const [routeSource, coursePlayerSource, registrySource, playerSource] = await Promise.all([
    readFile(
      new URL('../app/[locale]/courses/[grade]/[lesson]/page.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/whole-lesson-course-player.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../lib/whole-lesson-course-registry.ts', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/g4-l3-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
  ]);
  assert.match(routeSource, /<WholeLessonCoursePlayer/);
  assert.match(routeSource, /candidateMode=\{auditPreview \|\| !releasePublished\}/);
  assert.match(routeSource, /const auditPreview = developmentAuditPreview;/);
  assert.doesNotMatch(routeSource, /controlledPreview|ExecutivePreview/);
  assert.match(routeSource, /strictCompleteMemberCount=\{strictCompleteMemberCount\}/);
  assert.match(routeSource, /releaseMemberIds\.has\(animation\.animationId\)/);
  assert.doesNotMatch(registrySource, /isControlledPreviewEnabled|ControlledCeoPreview/);
  assert.match(
    coursePlayerSource,
    /registration\.player\.kind === 'preserved-custom'/,
  );
  assert.match(coursePlayerSource, /<G4L3WholeLessonPlayer/);
  assert.doesNotMatch(coursePlayerSource, /controlledPreview/);
  assert.match(playerSource, /data-lesson-player="g4-l3-whole-lesson-mvp"/);
  assert.match(playerSource, /data-progress-kind="learner-session"/);
  assert.match(playerSource, /data-current-replay-count=/);
  assert.match(playerSource, /lang=\{progress\.language\}/);
  assert.match(playerSource, /strict-fidelity or public-release claim/);
});

test('responsive lesson shell preserves the authored stage and separates modern equivalents', async () => {
  const [
    playerSource,
    shellSource,
    runtimeSource,
    loadedSwfHostSource,
    descriptorSource,
    layoutSource,
    globalCss,
  ] = await Promise.all([
    readFile(
      new URL('../components/g4-l3-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/animation-runtime.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/loaded-swf-host-canvas.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../lib/g4-l3-whole-lesson-player-descriptor.ts', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../lib/legacy-lesson-layout.ts', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ]);

  assert.match(playerSource, /<LegacyResponsiveLessonShell/);
  assert.match(playerSource, /LEGACY_MAP_RAIL_MIN_WIDTH/);
  assert.match(
    playerSource,
    /window\.innerWidth >= LEGACY_MAP_RAIL_MIN_WIDTH/,
  );
  assert.match(playerSource, /presentation="legacy-shell"/);
  assert.match(shellSource, /data-authored-stage=\{stageIdentity\}/);
  assert.match(shellSource, /data-native-composite-stage=\{stageIdentity\}/);
  assert.match(shellSource, /data-viewport-fit-width=\{renderedStageWidth \?\? undefined\}/);
  assert.match(shellSource, /const \[layoutPolicy, setLayoutPolicy\]/);
  assert.match(shellSource, /resolveLegacyLessonLayout\(\{/);
  assert.match(shellSource, /resizeObserver\?\.observe\(shellNode\)/);
  assert.match(shellSource, /const \[renderedStageWidth, setRenderedStageWidth\]/);
  assert.match(
    shellSource,
    /renderedStageWidth < visualSkin\.authoredStage\.width \* \.95/,
  );
  assert.match(shellSource, /data-accessible-control-fallback=/);
  assert.match(
    shellSource,
    /const legacyHitControlsInert = stageOverlayOpen \|\| modernControlPresentation;/,
  );
  assert.match(shellSource, /new ResizeObserver\(updateRenderedWidth\)/);
  assert.match(shellSource, /getBoundingClientRect\(\)\.width \* 1000/);
  assert.match(layoutSource, /measuredViewportHeight - Math\.max\(0, stageTop\) - 16/);
  assert.match(layoutSource, /const compactLandscape =/);
  assert.match(
    layoutSource,
    /measuredContainerWidth - reservedControlWidth - 20/,
  );
  assert.match(shellSource, /window\.visualViewport\?\.addEventListener\('resize'/);
  assert.match(shellSource, /data-legacy-chrome-evidence=\{visualSkin\.chromeEvidence\}/);
  assert.match(descriptorSource, /root-frames\/frame-0049\.png/);
  assert.match(descriptorSource, /header: Object\.freeze\(\{\s*height: 109,/);
  assert.match(descriptorSource, /footer: Object\.freeze\(\{height: 76\}\)/);
  assert.match(descriptorSource, /layoutId: 'help-math-course-shell-800x600-v1'/);
  assert.match(descriptorSource, /817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e/);
  assert.match(descriptorSource, /lesson-shell-mc-back-text\.svg/);
  assert.match(descriptorSource, /sourceCharacterId: 584/);
  assert.match(descriptorSource, /rootDepth: 5/);
  assert.match(descriptorSource, /pagePlaneRootDepth: 47/);
  assert.match(descriptorSource, /x: -12\.5,\s*y: 33\.3/);
  assert.match(playerSource, /backgroundCompanionVisible=\{currentPage\.xmlBackgroundText\}/);
  assert.match(playerSource, /loadedSwfHostAsset=\{currentPage\.xmlBackgroundText/);
  assert.match(
    runtimeSource,
    /compatibleLoadedSwfHostAsset && presentation === 'legacy-shell'/,
  );
  assert.match(
    runtimeSource,
    /loadedSwfHostAsset\?\.sourceProvenLanguage === playbackContext\.lang/,
  );
  assert.match(runtimeSource, /<LoadedSwfHostCanvas/);
  assert.match(
    runtimeSource,
    /data-loaded-swf-host-composite=\{compatibleLoadedSwfHostAsset/,
  );
  assert.match(
    loadedSwfHostSource,
    /ignore-loaded-child-swf-standalone-stage-background/,
  );
  assert.match(
    loadedSwfHostSource,
    /data-canvas-background-mode="transparent-over-shell-underlay"/,
  );
  assert.match(shellSource, /lesson-shell2__source-background-text/);
  assert.match(
    shellSource,
    /backgroundCompanion\.loadedSwfHostAsset\.sourceProvenLanguage === locale/,
  );
  assert.match(shellSource, /data-source-character-id=\{backgroundCompanion\.sourceCharacterId\}/);
  assert.match(
    shellSource,
    /data-source-background-companion-status=\{backgroundCompanionStatus\}/,
  );
  assert.match(
    shellSource,
    /image\.naturalWidth === visualSkin\.authoredStage\.width/,
  );
  assert.match(
    shellSource,
    /ref=\{validateBackgroundCompanionImage\}/,
  );
  assert.match(
    shellSource,
    /onError=\{\(\) => setBackgroundCompanionLoadStatus\(\{[\s\S]*?status: 'error'/,
  );
  assert.match(shellSource, /source-bound composite background failed integrity verification/);
  assert.match(shellSource, /The live page renderer remains/);
  assert.match(shellSource, /data-presentation="wide-functional-audit-candidate"/);
  assert.match(shellSource, /data-layout-contract=\{LEGACY_LESSON_LAYOUT_CONTRACT\}/);
  assert.match(shellSource, /data-layout-density=\{layoutPolicy\.workspaceDensity\}/);
  assert.match(shellSource, /data-layout-mode=\{layoutPolicy\.layoutMode\}/);
  assert.match(shellSource, /data-stage-render-mode=/);
  assert.match(shellSource, /data-map-presentation=\{layoutPolicy\.mapPresentation\}/);
  assert.match(shellSource, /data-tool-presentation=\{layoutPolicy\.toolPresentation\}/);
  assert.match(shellSource, /export interface LessonShellCourseContext/);
  assert.match(shellSource, /courseContext: LessonShellCourseContext;/);
  assert.match(
    playerSource,
    /const currentSectionLabel = getG4L3SectionLabel\([\s\S]*?progress\.language/,
  );
  assert.match(
    playerSource,
    /courseContext=\{\{[\s\S]*?G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR\.course\.labels\[[\s\S]*?progress\.language[\s\S]*?pageTitle: currentLabel,[\s\S]*?title: currentSectionLabel/,
  );
  assert.match(
    shellSource,
    /const WIDE_FUNCTIONAL_COMPANION_MEDIA = '\(min-width: 1280px\)'/,
  );
  assert.match(
    shellSource,
    /const COARSE_POINTER_MEDIA = '\(any-pointer: coarse\)'/,
  );
  assert.match(
    shellSource,
    /window\.matchMedia\(WIDE_FUNCTIONAL_COMPANION_MEDIA\)[\s\S]*?setWideViewportAvailable\(media\.matches\)[\s\S]*?addEventListener\('change'/,
  );
  assert.match(
    shellSource,
    /window\.matchMedia\(COARSE_POINTER_MEDIA\)[\s\S]*?setCoarsePointerAvailable\(media\.matches\)[\s\S]*?addEventListener\('change'/,
  );
  assert.match(
    shellSource,
    /const companionCanRemainVisible = activeTool === null \|\| toolOverlay;[\s\S]*?const wideFunctionalCompanion =[\s\S]*?wideViewportAvailable[\s\S]*?layoutPolicy\.layoutMode === 'wide-functional'[\s\S]*?companionCanRemainVisible/,
  );
  assert.match(
    shellSource,
    /const legacyHitControlMode = stageOverlayOpen[\s\S]*?'inert-session-overlay'[\s\S]*?modernControlPresentation[\s\S]*?'inert-modern-surface'[\s\S]*?'active-visible-stage'/,
  );
  assert.match(
    shellSource,
    /data-legacy-hit-control-mode=\{legacyHitControlMode\}/,
  );
  assert.match(
    shellSource,
    /const modernControlPresentation = resolveModernControlPresentation\(\{\s*accessibleControlFallback,\s*coarsePointerAvailable,\s*companionCanRemainVisible,\s*modernWidePresentation: modernWide,\s*\}\);/,
  );
  // The wide companion is a layout signal only. Electing the modern surface
  // from viewport width alone is what put a second labelled copy of every
  // control beside the live source hit regions on desktop.
  assert.doesNotMatch(
    shellSource,
    /resolveModernControlPresentation\(\{[^}]*wideFunctionalCompanion/,
  );
  // `modernWidePresentation` is admissible for the opposite reason: in that
  // presentation no chrome is drawn, so there are no source hit regions for a
  // labelled control to duplicate. It must come from the descriptor-declared
  // presentation, never from a viewport measurement.
  assert.match(
    shellSource,
    /const modernWide = visualSkin\.presentation === 'modern-wide';/,
  );
  assert.doesNotMatch(
    shellSource,
    /const modernWide =[^;]*(?:innerWidth|matchMedia|wideViewportAvailable|layoutPolicy)/,
  );
  assert.match(
    shellSource,
    /data-coarse-pointer=\{coarsePointerAvailable \? 'true' : 'false'\}/,
  );
  assert.match(
    shellSource,
    /data-modern-control-presentation=\{\s*modernControlPresentation \? 'true' : 'false'\s*\}/,
  );
  assert.match(shellSource, /data-responsive-focus-surface="legacy"/);
  assert.match(shellSource, /data-responsive-focus-surface="modern-wide"/);
  assert.match(shellSource, /data-responsive-focus-surface="persistent"/);
  assert.match(
    shellSource,
    /className="lesson-shell2__learning-actions"\s*data-responsive-focus-surface="persistent"/,
  );
  for (const key of [
    'map',
    'help',
    'exit',
    'header-back',
    'key-terms',
    'calculator',
    'previous',
    'replay',
    'rewind',
    'timeline',
    'forward',
    'pause',
    'volume',
    'mute',
    'next',
  ]) {
    assert.equal(
      shellSource.match(new RegExp(
        `data-responsive-focus-key="${key}"`,
        'g',
      ))?.length,
      2,
      `${key} keeps one source-surface and one modern-surface focus target`,
    );
  }
  assert.match(shellSource, /document\.addEventListener\('focusin'/);
  assert.match(
    shellSource,
    /previousModernControlPresentationRef[\s\S]*?findResponsiveFocusTarget[\s\S]*?focus\(\{preventScroll: true\}\)/,
  );
  assert.match(
    shellSource,
    /const toolOpened = activeTool !== null && previousActiveTool === null;[\s\S]*?const toolBecameModal =[\s\S]*?toolOverlay && !previousToolOverlay;[\s\S]*?if \(toolOpened \|\| toolBecameModal\) toolCloseRef\.current\?\.focus\(\);/,
  );
  assert.match(
    shellSource,
    /data-wide-functional-companion=\{wideFunctionalCompanion \? 'true' : 'false'\}/,
  );
  assert.match(shellSource, /const supportModalOpen = mapModalOpen \|\| toolModalOpen;/);
  assert.match(
    shellSource,
    /const backgroundUnavailable = stageOverlayOpen \|\| supportModalOpen \|\|\s*tutorPanelModal;/,
  );
  assert.match(shellSource, /\.filter\(isVisibleOverlayControl\)/);
  assert.match(shellSource, /element\.closest\('\[hidden\], \[inert\], \[aria-hidden="true"\]'\)/);
  assert.match(shellSource, /element\.tabIndex < 0/);
  assert.match(shellSource, /element\.closest\('details:not\(\[open\]\)'\)/);
  assert.match(shellSource, /element\.tagName === 'SUMMARY'/);
  assert.match(shellSource, /!activeOverlay\.contains\(document\.activeElement\)/);
  assert.equal(
    shellSource.match(/data-responsive-focus-fallback="true"/g)?.length,
    3,
  );
  assert.match(
    shellSource,
    /visibleControls\.filter\(\(element\) =>\s*element\.dataset\.responsiveFocusFallback === 'true'/,
  );
  assert.match(
    shellSource,
    /document\.activeElement !== document\.body[\s\S]*?rememberedControl[\s\S]*?findResponsiveFocusTarget[\s\S]*?target\.focus\(\{preventScroll: true\}\)/,
  );
  assert.match(shellSource, /LANGUAGE_ROUTE_FOCUS_INTENT_KEY/);
  assert.match(
    shellSource,
    /sessionStorage\.setItem\([\s\S]*?LANGUAGE_ROUTE_FOCUS_INTENT_KEY,[\s\S]*?'page-heading'/,
  );
  assert.match(
    shellSource,
    /\.lesson-shell2__page-heading h1[\s\S]*?const target = restorableTool && activeTool === restorableTool &&[\s\S]*?!toolOverlay[\s\S]*?\? toolCloseRef\.current[\s\S]*?: heading;[\s\S]*?target\.focus\(\{preventScroll: true\}\)[\s\S]*?sessionStorage\.removeItem\(LANGUAGE_ROUTE_FOCUS_INTENT_KEY\)/,
  );
  assert.match(shellSource, /aria-label=\{spanish \? 'Progreso de la lección' : 'Lesson completion'\}/);
  assert.match(layoutSource, /'wide-functional'/);
  assert.match(layoutSource, /'legacy-native'/);
  assert.match(layoutSource, /'compact'/);
  assert.match(layoutSource, /'compact-height'/);
  assert.match(layoutSource, /LEGACY_TOOL_RAIL_MIN_WIDTH = 1800/);
  assert.match(layoutSource, /LEGACY_COMPACT_HEIGHT_MAX = 880/);
  assert.match(shellSource, /data-source-transport-parity="not-established"/);
  assert.match(shellSource, /lesson-shell2__legacy-hit--rewind/);
  assert.match(shellSource, /lesson-shell2__legacy-hit--forward/);
  assert.match(shellSource, /lesson-shell2__legacy-timeline/);
  assert.doesNotMatch(shellSource, /completionPercent\}%.*source-progress/s);
  assert.doesNotMatch(shellSource, /lesson-shell2__source-progress/);
  assert.match(shellSource, /data-release-id=\{releaseBoundary\.releaseId\}/);
  assert.match(shellSource, /data-current-js-pages=\{releaseBoundary\.currentJsPageCount\}/);
  assert.match(shellSource, /data-required-release-members=\{releaseBoundary\.requiredMemberCount\}/);
  assert.match(shellSource, /data-strict-complete-members=\{releaseBoundary\.strictCompleteMemberCount\}/);
  assert.match(shellSource, /data-strict-completion=/);
  assert.match(shellSource, /data-public-release=/);
  assert.match(
    playerSource,
    /const resumeFromInspectedFrame = \(\) => \{[\s\S]*?setSeekRequest\(null\);[\s\S]*?setPaused\(false\);/,
  );
  assert.match(
    playerSource,
    /onPlaybackResumeFromInspection=\{resumeFromInspectedFrame\}/,
  );
  assert.match(
    shellSource,
    /data-frame-inspection-action=\{frameInspectionActive[\s\S]*?'resume-current-js-from-inspected-frame'/,
  );
  assert.match(shellSource, /Continue from frame/);
  assert.match(shellSource, /data-shell-layout=\{visualSkin\.layoutId\}/);
  assert.match(shellSource, /data-shell-source-animation-id=\{visualSkin\.sourceAnimationId\}/);
  assert.match(shellSource, /data-shell-source-swf-sha256=\{visualSkin\.sourceSwfSha256\}/);
  assert.match(shellSource, /data-lesson-nav="footer-previous"/);
  assert.match(shellSource, /data-lesson-nav="footer-next"/);
  assert.match(shellSource, /data-lesson-nav="action-previous"/);
  assert.match(shellSource, /data-lesson-nav="action-next"/);
  assert.match(shellSource, /data-lesson-nav="modern-header-back"/);
  assert.match(shellSource, /data-modern-language-switch="true"/);
  assert.match(shellSource, /role="group"/);
  assert.match(shellSource, /'Modern lesson controls'/);
  assert.match(shellSource, /spanish \? 'Controles modernos' : 'Modern controls'/);
  assert.doesNotMatch(shellSource, /className="lesson-shell2__modern-context"[\s\S]*?aria-live=/);
  assert.match(shellSource, /data-source-hover-frame-count=/);
  assert.match(shellSource, /navigationFreeChromeFile/);
  assert.match(shellSource, /lesson-shell2__legacy-navigation-state--over/);
  assert.match(playerSource, /if \(!nextPage && lessonFinished\) return;/);
  assert.match(playerSource, /nextDisabled=\{!nextPage && lessonFinished\}/);
  assert.match(playerSource, /Lesson finished/);
  assert.match(descriptorSource, /hasAnimationModule\(animationId\)/);
  assert.match(playerSource, /strictCompleteMemberCount === G4_L3_REQUIRED_MEMBER_COUNT/);
  assert.match(shellSource, /href=\{courseHref\}/);
  assert.doesNotMatch(shellSource, /href="\/courses\/4\/3"/);
  assert.match(shellSource, /data-tool-origin="modern-functional-equivalent"/);
  assert.match(
    shellSource,
    /data-support-tool-playback="support-tools-pause-restore-nova-independent"/,
  );
  assert.match(
    shellSource,
    /const supportPauseSessionRef = useRef<SupportPauseSession \| null>\(null\);/,
  );
  assert.match(
    shellSource,
    /reconcileSupportPauseSession\(\{\s*currentPage,\s*paused,\s*playbackInspectionActive: frameInspectionActive,\s*session: supportPauseSessionRef\.current,\s*supportOpen,\s*\}\)/,
  );
  assert.match(shellSource, /data-tutor-playback="independent"/);
  assert.match(
    shellSource,
    /onTutorEngagementChange\?\.\(tutorVisible\);/,
    'Nova open/close engagement remains available to LRS telemetry',
  );
  assert.match(
    shellSource,
    /const pauseControl = <button[\s\S]*?disabled=\{!runtimeAvailable \|\| supportOpen\}[\s\S]*?onPausedChange\(!paused\)/,
    'the wide Pause control remains operable while Nova is open',
  );
  assert.doesNotMatch(shellSource, /resolveTutorTransport|tutorHeldPausedRef|effectiveOpen/);
  assert.doesNotMatch(shellSource, /Narration paused while Nova support is open/);
  assert.doesNotMatch(shellSource, /data-tutor-pause-notice/);
  assert.doesNotMatch(shellSource, /reconcileSupportPlayback/);
  assert.match(shellSource, /toolOverlay && mapOpen && activeTool/);
  assert.match(
    playerSource,
    /paused=\{paused \|\| resumeDecision !== 'resolved'\}/,
  );
  assert.doesNotMatch(
    playerSource,
    /paused=\{paused \|\| tutorEngaged/,
    'Nova engagement is telemetry only and cannot pause the runtime or shell',
  );
  assert.match(
    playerSource,
    /support: \{\s*kind: 'nova-tutor',\s*action: engaged \? 'opened' : 'closed',\s*\}/,
    'Nova Focus, Study, and Classroom still record opened/closed support events',
  );
  assert.match(playerSource, /onTutorEngagementChange=\{handleTutorEngagementChange\}/);
  assert.match(playerSource, /data-animation-id=\{page\.animationId\}/);
  assert.match(playerSource, /data-global-page-ordinal=\{page\.globalPageOrdinal\}/);
  assert.match(playerSource, /data-section-code=\{page\.sectionCode\}/);
  assert.match(playerSource, /data-spanish-title-status=\{page\.spanishTitleStatus\}/);
  assert.match(playerSource, /data-section-code=\{section\.code\}/);
  assert.match(playerSource, /does not execute legacy URLs/);
  assert.doesNotMatch(`${playerSource}\n${shellSource}`, /HELP_KEYTERMS|fscommand|getURL/);
  assert.match(runtimeSource, /presentation\?: 'workbench' \| 'lesson' \| 'legacy-shell'/);
  assert.match(runtimeSource, /data-runtime-paused=/);
  assert.match(runtimeSource, /paused=\{paused \|\| hostAudioPaused\}/);
  assert.match(runtimeSource, /reducedMotion=\{reduced === true\}/);
  assert.match(runtimeSource, /data-runtime-transport=/);
  assert.match(runtimeSource, /data-source-transport-parity="not-established"/);
  assert.match(runtimeSource, /data-runtime-volume=/);

  // Narration has a designed home in the chrome, so the runtime no longer
  // drops an unstyled button over the artwork when autoplay is refused. It
  // reports state up and takes a play/stop command back, the same shape the
  // host already uses to drive a seek.
  assert.match(
    runtimeSource,
    /presentation === 'legacy-shell'\s*\?\s*null/,
    'the legacy shell owns narration; the runtime adds no floating control',
  );
  assert.doesNotMatch(runtimeSource, /runtime-toolbar--legacy-audio/);
  assert.doesNotMatch(globalCss, /runtime-toolbar--legacy-audio/);
  assert.match(
    runtimeSource,
    /export type AnimationRuntimeNarrationStatus =\s*'unavailable' \| 'waiting' \| 'idle' \| 'playing' \| 'blocked';/,
  );
  assert.match(
    runtimeSource,
    /readonly narration: AnimationRuntimeNarrationStatus;/,
  );
  assert.match(
    runtimeSource,
    /narrationRequest\?: AnimationRuntimeNarrationRequest \| null;/,
  );
  // Status is derived, never guessed: an unavailable page can never report
  // playing, and a refused autoplay stops presenting itself as blocked once
  // the learner has answered it.
  assert.match(
    runtimeSource,
    /const narration: AnimationRuntimeNarrationStatus = !audioAvailable\s*\?\s*'unavailable'\s*:\s*narrationSounding\s*\?\s*'playing'\s*:\s*autoplayBlockedCue && !narrationGestureGiven\s*\?\s*'blocked'\s*:\s*narrationTracks\.length > 0\s*\?\s*'idle'\s*:\s*'waiting';/,
  );
  assert.match(
    runtimeSource,
    /const narrationSounding = timelineAudioSounding \|\|\s*playingNarrationTrackId !== null;/,
    'a timeline cue and an on-demand track both count as narration sounding',
  );

  // Both copies of the control read one status and share one command path.
  assert.match(shellSource, /data-narration-status=\{narrationStatus\}/);
  assert.equal(
    shellSource.match(/className="lesson-shell2__narration"/g)?.length,
    1,
    'one control definition serves the session bar and the compact toolbar',
  );
  // Narration keeps the same two-surface guarantee as every other functional
  // control, but from one component rather than two copies of the markup, so
  // the pair is counted here instead of in the focus-key loop above.
  assert.equal(
    shellSource.match(/data-responsive-focus-key="narration"/g)?.length,
    1,
    'the focus key belongs to the shared control, not to each placement',
  );
  assert.equal(
    shellSource.match(/<LessonNarrationControl/g)?.length,
    2,
    'narration survives the compact landscape layout that hides the session bar',
  );
  assert.match(
    shellSource,
    /className="lesson-shell2__session-bar"[\s\S]*?<LessonNarrationControl[\s\S]*?surface="persistent"/,
    'the session bar placement declares its own focus surface',
  );
  assert.match(
    shellSource,
    /className="lesson-shell2__modern-toolbar"[\s\S]*?<LessonNarrationControl/,
    'the compact toolbar placement inherits the modern-wide focus surface',
  );
  assert.match(
    shellSource,
    /data-narration-announcement="true"/,
    'a refused autoplay arrives silently and has to be announced',
  );
  for (const status of [
    'unavailable',
    'waiting',
    'idle',
    'blocked',
    'playing',
  ]) {
    assert.match(
      globalCss,
      new RegExp(
        `\\.lesson-shell2__narration\\[data-narration-status='${status}'\\]`,
      ),
      `${status} needs its own treatment, or the control cannot reflect state`,
    );
  }
  assert.match(
    globalCss,
    /\.lesson-shell2__narration \{[\s\S]*?min-height: 48px;/,
  );
  assert.match(
    globalCss,
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.lesson-shell2__narration\[data-narration-status='playing'\][\s\S]*?animation: none;/,
  );

  assert.match(runtimeSource, /'--flash-stage-aspect'/);
  assert.match(globalCss, /\.lesson-shell2__stage \{\s*aspect-ratio: var\(--lesson-stage-aspect, 4 \/ 3\);/);
  assert.match(globalCss, /\.lesson-shell2__legacy-stage \{\s*aspect-ratio: var\(--lesson-stage-aspect\);/);
  assert.match(globalCss, /\.lesson-shell2__source-background-text \{[\s\S]*?z-index: 0;/);
  assert.match(
    globalCss,
    /\.lesson-shell2__host-composite-integrity-error \{[\s\S]*?z-index: 7;/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__legacy-stage > \.lesson-shell2__stage \{[\s\S]*?z-index: 1;/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__source-chrome \{[\s\S]*?z-index: 5;/,
  );
  assert.match(globalCss, /data-loaded-swf-host-composite='true'/);
  assert.match(
    globalCss,
    /\.loaded-swf-host-canvas\s+\.faithful-stage-wrap \{\s*background: transparent;/,
  );
  assert.match(globalCss, /--lesson-stage-viewport-fit-width/);
  assert.match(globalCss, /clip-path: inset\(0 0 var\(--lesson-chrome-top-clip\) 0\)/);
  assert.match(globalCss, /clip-path: inset\(var\(--lesson-chrome-bottom-clip\) 0 0 0\)/);
  assert.match(globalCss, /\.lesson-shell2__modern-toolbar \{\s*display: none;/);
  assert.match(
    globalCss,
    /data-modern-control-presentation='true'[\s\S]*?grid-template-columns: repeat\(auto-fit, minmax\(96px, 1fr\)\)/,
  );
  assert.match(
    globalCss,
    /data-modern-control-presentation='true'[\s\S]*?min-height: 48px;[\s\S]*?min-width: 48px;/,
  );
  assert.match(
    globalCss,
    /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__modern-context \{[\s\S]*?min-height: 28px;/,
  );
  assert.match(globalCss, /@keyframes lesson-shell2-navigation-hover-frame/);
  assert.match(globalCss, /--lesson-navigation-hover-duration/);
  assert.match(globalCss, /prefers-reduced-motion: reduce/);
  assert.match(
    globalCss,
    /\.lesson-shell2__legacy-hit--previous \{[\s\S]*?top: 89%;/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__legacy-hit--next \{[\s\S]*?top: 89%;/,
  );
  assert.match(globalCss, /data-tool-presentation='rail'/);
  assert.match(globalCss, /data-layout-density='compact-height'/);
  assert.match(globalCss, /padding-block: 0;/);
  assert.match(globalCss, /\.controlled-ceo-preview-boundary \{\s*line-height: 1\.2;/);
  assert.match(globalCss, /\.controlled-ceo-preview-boundary__compact-summary \{[\s\S]*?display: block;/);
  assert.match(globalCss, /\.controlled-ceo-preview-boundary__full-copy \{[\s\S]*?clip-path: inset\(50%\);/);
  assert.match(globalCss, /clip-path: inset\(50%\);/);
  assert.match(globalCss, /@media \(min-width: 1280px\) and \(max-height: 880px\)/);
  assert.doesNotMatch(
    globalCss,
    /@media \(min-width: 1180px\) and \(max-height: 880px\)/,
  );
  assert.match(
    globalCss,
    /data-tool-presentation='rail'\]\[data-tool-open='true'\][\s\S]*?grid-template-columns: minmax\(250px, 280px\) 800px minmax\(270px, 1fr\);/,
  );
  assert.match(globalCss, /@media \(max-width: 560px\)/);
  assert.match(
    globalCss,
    /orientation: landscape\) and \(max-height: 500px\)/,
  );
  assert.match(
    globalCss,
    /grid-template-columns:\s*minmax\(\s*280px,\s*min\(\s*var\(--lesson-stage-viewport-fit-width\),\s*var\(--lesson-short-landscape-css-stage-cap\)\s*\)\s*\)\s*minmax\(0, 1fr\)/,
  );
  // Exactly one Back and one Next reach the learner. The action row now holds
  // nothing but that pair, so while the authored stage hit areas are the live
  // control surface the row is a duplicate and stands down. Exactly one rule
  // is allowed to hide it, and it is that gate: the row must come back, in
  // full, once the hit areas go inert and it becomes the only navigation.
  assert.equal(
    (globalCss.match(
      /\.lesson-shell2__learning-actions \{\s*display: none;/g,
    ) ?? []).length,
    1,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2\[data-legacy-hit-control-mode='active-visible-stage'\]\s*\.lesson-shell2__learning-actions \{\s*display: none;/,
  );
  // Progress is reported by the strip, not by a control. Nothing between
  // Previous and Next renders a third button.
  assert.doesNotMatch(shellSource, /completionAction/);
  assert.match(
    shellSource,
    /data-lesson-nav="action-previous"[\s\S]{0,400}?data-lesson-nav="action-next"/,
  );
  assert.doesNotMatch(
    shellSource,
    /data-lesson-nav="action-previous"[\s\S]{0,400}?aria-pressed[\s\S]{0,400}?data-lesson-nav="action-next"/,
  );
});

test('page interaction companion stays outside the authored stage and reaches renderers', async () => {
  const [
    contractSource,
    runtimeSource,
    playerSource,
    shellSource,
    gs002Source,
    globalCss,
  ] = await Promise.all([
    readFile(
      new URL('../../../packages/demos/src/contract.ts', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/animation-runtime.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/g4-l3-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../../../packages/demos/src/modules/course-g04-l03-gs-002.tsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ]);

  assert.match(
    contractSource,
    /readonly pageInteractionCompanionTargetId\?: string;/,
  );
  assert.match(
    runtimeSource,
    /pageInteractionCompanionTargetId=\{pageInteractionCompanionTargetId\}/,
  );
  assert.match(
    playerSource,
    /G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR\.course\.domIdPrefix\}-page-interaction-companion/,
  );
  assert.equal(
    playerSource.match(
      /pageInteractionCompanionTargetId=\{\s*G4_L3_PAGE_INTERACTION_COMPANION_TARGET_ID\s*\}/g,
    )?.length,
    2,
  );
  assert.match(
    shellSource,
    /className="lesson-shell2__page-interaction-companion"[\s\S]*?data-page-interaction-companion-host="true"[\s\S]*?id=\{pageInteractionCompanionTargetId\}/,
  );
  assert.match(
    shellSource,
    /aria-hidden=\{stageOverlayOpen \? true : undefined\}[\s\S]*?inert=\{stageOverlayOpen \? true : undefined\}/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__page-interaction-companion \{\s*display: contents;/,
  );
  assert.match(gs002Source, /import \{createPortal\} from "react-dom";/);
  assert.match(
    gs002Source,
    /return target \? createPortal\(children, target\) : children;/,
  );
  assert.match(
    gs002Source,
    /data-page-interaction-companion-surface="gs002-mobile"/,
  );
});

test('short landscape keeps progress, evidence, and the focused page title', async () => {
  const [shellSource, globalCss] = await Promise.all([
    readFile(new URL(
      '../components/legacy-responsive-lesson-shell.tsx',
      import.meta.url,
    ), 'utf8'),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ]);
  const shortLandscapeStart = globalCss.indexOf(
    '@media (orientation: landscape) and (max-height: 500px) and\n' +
      '  (min-width: 681px) and (max-width: 1279px)',
  );
  const shortLandscapeEnd = globalCss.indexOf(
    '\n}\n\n.lesson-shell2__transport-boundary',
    shortLandscapeStart,
  );

  assert.notEqual(shortLandscapeStart, -1);
  assert.notEqual(shortLandscapeEnd, -1);
  const shortLandscapeCss = globalCss.slice(
    shortLandscapeStart,
    shortLandscapeEnd + 2,
  );

  assert.match(
    shellSource,
    /className="lesson-shell2__modern-completion"[\s\S]*?data-compact-landscape-completion="true"/,
  );
  assert.match(
    shellSource,
    /<progress[\s\S]*?aria-label=\{spanish[\s\S]*?'Lesson completion'[\s\S]*?aria-valuetext=\{modernWide[\s\S]*?`\$\{journeyPercent\}% · \$\{pageOrdinalLabel\} · \$\{completionLabel\}`[\s\S]*?: `\$\{completionPercent\}% · \$\{completionLabel\}`\}/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__modern-completion \{\s*display: none;/,
  );
  assert.match(
    shortLandscapeCss,
    /\.lesson-shell2__modern-completion \{[\s\S]*?display: grid;/,
  );
  assert.match(
    shortLandscapeCss,
    /\.lesson-shell2__session-bar \{\s*display: none;/,
  );
  assert.doesNotMatch(
    shortLandscapeCss,
    /\.lesson-shell2__(?:disclosure|page-heading)[^{]*\{\s*display:\s*none;/,
  );
  assert.match(
    shortLandscapeCss,
    /\.controlled-ceo-preview-boundary__compact-summary \{[\s\S]*?display: block;/,
  );
  assert.match(
    shortLandscapeCss,
    /\.controlled-ceo-preview-boundary__full-copy,[\s\S]*?clip-path: inset\(50%\);/,
  );
  assert.match(
    shortLandscapeCss,
    /\.lesson-shell2__body \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\);[\s\S]*?width: 100%;/,
  );
  assert.match(
    shortLandscapeCss,
    /--lesson-short-landscape-css-stage-cap: min\([\s\S]*?calc\(\(100vh - 39px\) \* 4 \/ 3\)[\s\S]*?clamp\(280px, 36vw, 340px\)/,
  );
  assert.match(
    shortLandscapeCss,
    /min\(\s*var\(--lesson-stage-viewport-fit-width\),\s*var\(--lesson-short-landscape-css-stage-cap\)\s*\)/,
  );
  assert.match(
    shortLandscapeCss,
    /data-accessible-control-fallback='true'[\s\S]*?grid-template-columns: repeat\(auto-fit, minmax\(96px, 1fr\)\);[\s\S]*?margin-top: 0;/,
  );
  assert.match(
    shortLandscapeCss,
    /\.lesson-shell2__page-heading \{[\s\S]*?grid-column: 2;[\s\S]*?grid-row: 1;[\s\S]*?min-height: 44px;/,
  );
  assert.match(
    shortLandscapeCss,
    /\.lesson-shell2__page-heading h1:focus \{[\s\S]*?outline: 3px solid #e08b00;/,
  );
  assert.match(
    shortLandscapeCss,
    /\.lesson-shell2__legacy-stage \{[\s\S]*?grid-row: 1 \/ span 4;/,
  );
});

test('wide contemporary displays pair the native stage with source-bound context rails', async () => {
  const [globalCss, shellSource] = await Promise.all([
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
  ]);
  const wideRailStart = globalCss.indexOf(
    '/* Contemporary 1280px-and-wider displays keep the source-native 800 × 600',
  );
  const wideRailEnd = globalCss.indexOf(
    '\n.lesson-shell2__transport-boundary {',
    wideRailStart,
  );

  assert.notEqual(wideRailStart, -1);
  assert.notEqual(wideRailEnd, -1);
  const wideRailCss = globalCss.slice(wideRailStart, wideRailEnd);

  assert.match(
    wideRailCss,
    /@media \(min-width: 1280px\) and \(max-width: 1599px\)/,
  );
  assert.match(wideRailCss, /@media \(min-width: 1280px\)/);
  assert.match(wideRailCss, /@media \(min-width: 1600px\)/);
  assert.match(wideRailCss, /@media \(min-width: 1800px\)/);
  assert.match(
    wideRailCss,
    /\.lesson-shell2:is\([\s\S]*?\[data-tool-open='false'\],[\s\S]*?\[data-tool-presentation='overlay'\][\s\S]*?\)/,
  );
  assert.doesNotMatch(wideRailCss, /data-layout-mode='wide-functional'/);
  assert.doesNotMatch(wideRailCss, /data-learning-support='none'/);
  assert.match(
    wideRailCss,
    /\.lesson-shell2:is\([\s\S]*?\.lesson-shell2__body \{[\s\S]*?grid-template-columns: minmax\(250px, 280px\) minmax\(0, 1fr\);[\s\S]*?max-width: 1920px;/,
  );
  assert.match(
    wideRailCss,
    /data-map-presentation='rail'\]\[data-map-open='true'\]:is\([\s\S]*?\.lesson-shell2__body \{\s*grid-template-columns: minmax\(250px, 280px\) minmax\(0, 1fr\);/,
  );
  assert.match(
    wideRailCss,
    /max-width: 1328px;[\s\S]*?grid-template-columns: 800px minmax\(320px, 1fr\);/,
  );
  assert.match(
    wideRailCss,
    /\.lesson-shell2__scrim--map \{\s*display: none;/,
  );
  assert.match(
    wideRailCss,
    /\.lesson-shell2__side-panel--map \{[\s\S]*?grid-column: 1;[\s\S]*?height: 600px;[\s\S]*?max-height: 600px;[\s\S]*?position: sticky;/,
  );
  assert.match(
    wideRailCss,
    /data-map-presentation='rail'\]\[data-map-open='false'\]:is\([\s\S]*?\[data-tool-open='false'\],[\s\S]*?\[data-tool-presentation='rail'\][\s\S]*?\.lesson-shell2__side-panel--map \{\s*display: block;[\s\S]*?overflow: hidden;/,
  );
  assert.match(
    wideRailCss,
    /data-map-open='false'[\s\S]*?\.lesson-shell2__side-panel--map\s*> header,[\s\S]*?\.lesson-shell2__map-content \{\s*display: none;/,
  );
  assert.match(
    wideRailCss,
    /data-map-open='false'[\s\S]*?\.lesson-shell2__map-rail-summary \{\s*display: grid;[\s\S]*?grid-template-rows: auto auto auto minmax\(0, 1fr\);/,
  );
  assert.match(
    wideRailCss,
    /\.lesson-shell2__learning-column \{[\s\S]*?grid-column: 2;[\s\S]*?grid-template-columns: 800px minmax\(360px, 1fr\);/,
  );
  assert.match(
    wideRailCss,
    /\.lesson-shell2__legacy-stage \{[\s\S]*?grid-column: 1;[\s\S]*?grid-row: 1 \/ span 4;/,
  );
  assert.match(
    wideRailCss,
    /\.lesson-shell2__modern-toolbar \{[\s\S]*?display: grid;[\s\S]*?grid-column: 2;[\s\S]*?grid-template-columns: repeat\(auto-fit, minmax\(96px, 1fr\)\);[\s\S]*?visibility: hidden;/,
  );
  assert.match(
    wideRailCss,
    /data-modern-control-presentation='true'[\s\S]*?\.lesson-shell2__modern-toolbar \{\s*visibility: visible;/,
  );
  assert.match(
    globalCss,
    /data-tool-presentation='rail'\]\[data-tool-open='true'\][\s\S]*?\.lesson-shell2__body \{[\s\S]*?grid-template-columns: minmax\(250px, 280px\) 800px minmax\(270px, 1fr\);[\s\S]*?max-width: 1920px;/,
  );
  assert.match(
    globalCss,
    /data-tool-presentation='rail'\]\[data-tool-open='true'\][\s\S]*?\.lesson-shell2__learning-column \{[\s\S]*?grid-column: 2;[\s\S]*?grid-row: 1;[\s\S]*?width: 800px;/,
  );
  assert.match(
    globalCss,
    /data-tool-presentation='rail'\]\[data-tool-open='true'\][\s\S]*?\.lesson-shell2__page-heading \{[\s\S]*?clip: rect\(0 0 0 0\);[\s\S]*?clip-path: inset\(50%\);[\s\S]*?position: absolute;[\s\S]*?width: 1px;/,
  );
  assert.match(
    globalCss,
    /data-tool-presentation='rail'\]\[data-tool-open='true'\][\s\S]*?\.lesson-shell2__side-panel--tool \{[\s\S]*?grid-column: 3;[\s\S]*?height: 600px;[\s\S]*?max-height: 600px;/,
  );
  assert.match(
    wideRailCss,
    /data-tool-presentation='rail'\]\[data-tool-open='true'\][\s\S]*?\.lesson-shell2__tool-rail-page-context \{\s*display: grid;/,
  );
  assert.match(
    shellSource,
    /aria-hidden="true"\s+className="lesson-shell2__map-rail-summary"\s+data-map-rail-summary="modern-responsive-context"/,
  );
  assert.match(
    shellSource,
    /className="lesson-shell2__map-rail-summary-header"[\s\S]*?courseContext\.courseTitle\.text[\s\S]*?courseContext\.pageTitle\.text[\s\S]*?courseContext\.section\.title\.text/,
  );
  assert.match(
    shellSource,
    /aria-hidden="true"\s+className="lesson-shell2__tool-rail-page-context"\s+data-tool-rail-page-context="modern-responsive-context"/,
  );
  assert.match(
    wideRailCss,
    /\.lesson-shell2__page-heading h1:focus \{[\s\S]*?outline: 3px solid #e08b00;/,
  );
  assert.match(
    wideRailCss,
    /\.lesson-shell2__modern-toolbar[\s\S]*?:is\(button, label, a\) \{[\s\S]*?min-height: 48px;[\s\S]*?min-width: 48px;/,
  );
  assert.match(
    wideRailCss,
    /\.lesson-shell2__learning-actions \{[\s\S]*?grid-column: 2;[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
  );
  // The row is exactly Previous and Next, so both sit on one line in the wide
  // rail. Nothing is stacked underneath them any more.
  assert.match(
    wideRailCss,
    /\.lesson-shell2__learning-actions-next \{[\s\S]*?grid-column: 2;[\s\S]*?grid-row: 1;/,
  );
  assert.doesNotMatch(wideRailCss, /> button:nth-child\(2\) \{/);
  assert.match(
    wideRailCss,
    /\.lesson-shell2__finished,[\s\S]*?\.lesson-shell2__learning-support \{[\s\S]*?grid-column: 1 \/ -1;[\s\S]*?grid-row: 5;/,
  );
  // On a wide legacy display the session bar reports progress, so the toolbar
  // strip must stay hidden or progress appears twice. The widescreen
  // presentation hides the session bar instead and is governed by its own
  // paired invariant, so its rules are excluded here rather than exempted.
  const legacyWideRules = wideRailCss
    .split('}')
    .filter((rule) => !rule.includes("[data-host-presentation='modern-wide']"))
    .join('}');
  assert.doesNotMatch(
    legacyWideRules,
    /\.lesson-shell2__modern-completion \{[\s\S]*?display: (?:grid|flex|block);/,
  );
});

test('wide coarse-pointer page interactions use a scrollable right companion slot', async () => {
  const globalCss = await readFile(
    new URL('../app/globals.css', import.meta.url),
    'utf8',
  );
  const companionContractStart = globalCss.indexOf(
    '/* Wide coarse-pointer page-interaction companion contract.',
  );
  const companionContractEnd = globalCss.indexOf(
    '\n}\n\n@media (min-width: 1600px)',
    companionContractStart,
  );

  assert.notEqual(companionContractStart, -1);
  assert.notEqual(companionContractEnd, -1);
  const companionContractCss = globalCss.slice(
    companionContractStart,
    companionContractEnd,
  );

  assert.match(
    companionContractCss,
    /\.lesson-shell2\[data-coarse-pointer='true'\]:is\([\s\S]*?\[data-tool-open='false'\],[\s\S]*?\[data-tool-presentation='overlay'\][\s\S]*?\)/,
  );
  assert.match(
    companionContractCss,
    /\.lesson-shell2__learning-column:has\([\s\S]*?> \.lesson-shell2__page-interaction-companion:not\(:empty\)[\s\S]*?\)/,
  );
  assert.match(
    companionContractCss,
    /> \.lesson-shell2__page-interaction-companion \{[\s\S]*?display: block;[\s\S]*?grid-column: 2;[\s\S]*?grid-row: 2;[\s\S]*?max-height: clamp\(220px, 34vh, 340px\);[\s\S]*?overflow: auto;[\s\S]*?overscroll-behavior: contain;[\s\S]*?scrollbar-gutter: stable;/,
  );
  assert.match(
    companionContractCss,
    /> \.lesson-shell2__legacy-stage \{\s*grid-row: 1 \/ span 5;/,
  );
  assert.match(
    companionContractCss,
    /> \.lesson-shell2__modern-toolbar \{\s*grid-row: 3;/,
  );
  assert.match(
    companionContractCss,
    /> \.lesson-shell2__transport-boundary \{\s*grid-row: 4;/,
  );
  assert.match(
    companionContractCss,
    /> \.lesson-shell2__learning-actions \{\s*grid-row: 5;/,
  );
  assert.match(
    companionContractCss,
    /> \.lesson-shell2__finished,[\s\S]*?> \.lesson-shell2__learning-support \{\s*grid-row: 6;/,
  );
  assert.doesNotMatch(
    companionContractCss,
    /\[data-tool-presentation='rail'\]\[data-tool-open='true'\]/,
  );
});

test('compact landscape and short-wide chrome preserve parity disclosure and usable controls', async () => {
  const [shellSource, globalCss] = await Promise.all([
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ]);
  const compactContractStart = globalCss.indexOf(
    '/* Short landscape and 720p-height workspaces keep the source-authored plane',
  );

  assert.notEqual(compactContractStart, -1);
  const compactContractCss = globalCss.slice(compactContractStart);

  assert.match(
    shellSource,
    /aria-hidden="true"\s+className="lesson-shell2__modern-transport-summary"\s+data-compact-transport-summary="true"/,
  );
  assert.match(shellSource, /Flash transport parity: not established/);
  assert.match(shellSource, /Paridad del transporte de Flash: no establecida/);
  assert.match(shellSource, /Frame inspection unavailable/);
  assert.match(shellSource, /Inspección de fotogramas no disponible/);
  assert.match(
    shellSource,
    /lesson-shell2__modern-transport-summary[\s\S]*?<label className="lesson-shell2__modern-timeline">/,
  );
  // The parity disclosure and the association that points at it must be gated
  // by the same flag. If they ever diverge the toolbar carries a dangling
  // aria-describedby to a paragraph that was not rendered.
  assert.match(
    shellSource,
    /aria-describedby=\{reviewerMode \? transportBoundaryId : undefined\}[\s\S]*?className="lesson-shell2__modern-toolbar"/,
  );
  assert.match(
    shellSource,
    /\{reviewerMode\s*\?\s*<p\s*className="lesson-shell2__transport-boundary"/,
  );
  assert.match(
    shellSource,
    /className="lesson-shell2__transport-boundary"[\s\S]*?id=\{transportBoundaryId\}/,
  );
  // Release status is disclosed on its own terms and must not be dragged into
  // the instrument gate: every lesson is a candidate today, so gating the
  // instruments on candidateMode showed them to every audience.
  assert.doesNotMatch(
    shellSource,
    /aria-describedby=\{candidateMode \? transportBoundaryId/,
  );

  assert.match(
    compactContractCss,
    /@media \(orientation: landscape\) and \(min-width: 681px\)[\s\S]*?\(max-width: 1279px\) and \(max-height: 500px\),[\s\S]*?\(min-width: 1280px\) and \(max-height: 880px\)/,
  );
  assert.match(
    compactContractCss,
    /:is\([\s\S]*?\.lesson-shell2,[\s\S]*?data-modern-control-presentation='true'[\s\S]*?\)[\s\S]*?\.lesson-shell2__modern-toolbar \{[\s\S]*?grid-template-columns: repeat\(4, minmax\(44px, 1fr\)\);/,
  );
  assert.match(
    compactContractCss,
    /\.lesson-shell2__modern-context \{[\s\S]*?grid-column: 1 \/ span 2;[\s\S]*?grid-row: 1;/,
  );
  assert.match(
    compactContractCss,
    /\.lesson-shell2__modern-completion \{[\s\S]*?display: grid;[\s\S]*?grid-column: 3 \/ -1;[\s\S]*?grid-row: 1;/,
  );
  assert.match(
    compactContractCss,
    /\.lesson-shell2__modern-transport-summary \{[\s\S]*?display: flex;[\s\S]*?min-height: 44px;/,
  );
  assert.match(
    compactContractCss,
    /label:has\(> input\[data-responsive-focus-key='volume'\]\) \{\s*grid-column: span 3;/,
  );
  assert.match(
    compactContractCss,
    /\.lesson-shell2__transport-boundary \{[\s\S]*?clip-path: inset\(50%\);[\s\S]*?position: absolute;/,
  );
  assert.match(
    compactContractCss,
    /\.lesson-shell2__learning-actions \{[\s\S]*?display: flex;[\s\S]*?gap: \.25rem;/,
  );
  assert.match(
    compactContractCss,
    /\.lesson-shell2__learning-column:not\([\s\S]*?:has\(> \.lesson-shell2__page-interaction-companion:not\(:empty\)\)[\s\S]*?\)[\s\S]*?> \.lesson-shell2__learning-actions \{\s*grid-row: 3;/,
  );
  assert.match(
    compactContractCss,
    /data-release-id='lesson-g05-l04-number-lines'[\s\S]*?\.lesson-shell2__audit-boundary \{[\s\S]*?line-height: 1\.1;[\s\S]*?padding-block: \.05rem;/,
  );

  assert.match(
    globalCss,
    /\.lesson-shell2__legacy-hit--exit \{[\s\S]*?left: auto;[\s\S]*?right: \.75%;/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__stage \.reduced-motion-note \{[\s\S]*?pointer-events: none;/,
  );
});

test('the lesson title is live text on the header chrome, not a painted glyph', async () => {
  const [shellSource, playerSource, globalCss] = await Promise.all([
    readFile(
      new URL(
        '../components/legacy-responsive-lesson-shell.tsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../components/g4-l3-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ]);

  // The title is rendered from the source-bound label, carrying its own `lang`
  // so the language layer and a screen reader both see the real string.
  assert.match(
    shellSource,
    /className="lesson-shell2__chrome-lesson-title"[\s\S]*?<span lang=\{courseContext\.courseTitle\.sourceLanguage\}>\s*\{courseContext\.courseTitle\.text\}/,
  );
  assert.match(
    shellSource,
    /data-chrome-title-source-field=\{chromeTitleBand\.sourceField\}/,
  );
  assert.match(
    shellSource,
    /data-chrome-title-english-fallback=\{[\s\S]*?courseContext\.courseTitle\.usesEnglishFallback/,
  );
  // No hardcoded title anywhere in the shell: the string comes from the source.
  assert.doesNotMatch(shellSource, /Counting on Numbers/);

  // The band geometry travels as a percentage of the authored plane, the same
  // mechanism the chrome clips already use.
  assert.match(shellSource, /'--lesson-chrome-title-top': `\$\{/);
  assert.match(shellSource, /'--lesson-chrome-title-size': `\$\{/);
  assert.match(shellSource, /\}cqw`/);
  assert.match(
    playerSource,
    /chromeTitleBand:\s*G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR\.visualSkin\.header\.title,/,
  );

  // The artwork stays artwork: both chrome images keep an empty alt inside an
  // aria-hidden layer, and the live text sits above them but below the source
  // hit areas so it can never swallow a control.
  assert.match(
    shellSource,
    /aria-hidden="true"\s*className="lesson-shell2__source-chrome"/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__chrome-lesson-title \{[\s\S]*?z-index: 6;/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__chrome-lesson-title \{[\s\S]*?pointer-events: none;/,
  );
  assert.match(
    globalCss,
    /\.lesson-shell2__chrome-lesson-title > span \{[\s\S]*?user-select: text;/,
  );

  // Text on the artwork has to scale with the artwork, which needs the stage to
  // be a query container.
  assert.match(
    globalCss,
    /\.lesson-shell2__legacy-stage \{[\s\S]*?container-type: inline-size;/,
  );
  assert.match(
    globalCss,
    /font-size: clamp\(\.7rem, var\(--lesson-chrome-title-size, 3\.125cqw\), 2rem\);/,
  );
});
