import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  reconcileSupportPauseSession,
  resolveModernControlPresentation,
  type SupportPauseSession,
} from '../components/legacy-responsive-lesson-shell';

import {
  createKeyTermTitleIndex,
  isSameOriginResponseUrl,
  type KeyTermEntry,
  validateKeyTermsDocument,
  validateKeyTermsShellCandidate,
} from '../components/legacy-key-terms-browser';
import {G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR} from '../lib/g5-l4-whole-lesson-player-descriptor';
import {
  appendLegacyLessonHistory,
  rememberLegacyAudibleVolume,
  takeLegacyLessonHistory,
  toggleLegacyMute,
} from '../lib/legacy-shell-controls';

test('calculator UI exposes the source-derived keypad without locale rounding', async () => {
  const [component, reducer, styles] = await Promise.all([
    readFile(
      new URL('../components/legacy-calculator.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../lib/legacy-calculator.ts', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../app/globals.css', import.meta.url),
      'utf8',
    ),
  ]);
  for (const label of [
    'M+',
    'MRC',
    'C',
    'CE',
    'square-root',
    'percent',
    'memory-recall-clear',
  ]) {
    assert.match(`${component}\n${reducer}`, new RegExp(label.replace('+', '\\+')));
  }
  assert.match(component, /ffdec-actionscript-static-candidate/);
  assert.match(component, /data-panel-authority=/);
  assert.doesNotMatch(`${component}\n${reducer}`, /Intl\.NumberFormat|toFixed/);
  assert.ok(component.indexOf("digit: '1'") < component.indexOf("digit: '4'"));
  assert.ok(component.indexOf("digit: '4'") < component.indexOf("digit: '7'"));
  assert.ok(component.indexOf("digit: '7'") < component.indexOf("digit: '0'"));
  assert.ok(component.indexOf("type: 'percent'") < component.indexOf("type: 'square-root'"));
  assert.match(
    styles,
    /\.lesson-shell2__calculator--source-panel \.lesson-shell2__calculator-display \{[\s\S]*left: 11\.55%;[\s\S]*top: 21\.9%;[\s\S]*width: 76\.85%;/,
  );
  assert.match(
    styles,
    /\.lesson-shell2__calculator--source-panel \.lesson-shell2__calculator-keys \{[\s\S]*display: block;[\s\S]*height: 100%;[\s\S]*inset: 0;[\s\S]*width: 100%;/,
  );
  assert.match(component, /data-source-x=\{sourceBounds\.x\}/);
  assert.match(component, /data-source-y=\{sourceBounds\.y\}/);
  assert.match(
    component,
    /className="lesson-shell2__calculator-frame"[\s\S]*role="group"[\s\S]*tabIndex=\{0\}/,
  );
});

test('calculator stays mounted while hidden so close and reopen preserve state', async () => {
  const shell = await readFile(
    new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
    'utf8',
  );
  assert.match(shell, /<div hidden=\{activeTool !== 'calculator'\}>[\s\S]*<LegacyCalculator/);
  assert.match(
    shell,
    /activeTool === 'calculator'[\s\S]*\? null[\s\S]*: helpPanel/,
  );
  assert.doesNotMatch(
    shell,
    /activeTool === 'calculator'[\s\S]*\? <LegacyCalculator/,
  );
});

test('G4 and G5 Key Terms stay same-origin candidates without widening authority', async () => {
  const [
    browser,
    g4Player,
    g5Player,
    spanishData,
    g5EnglishData,
    g5SpanishData,
  ] = await Promise.all([
    readFile(
      new URL('../components/legacy-key-terms-browser.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/g4-l3-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/descriptor-driven-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../public/generated/g4-grade-wide-keyterms-es.json', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../public/generated/g5-l4-elementary-keyterms-reference-en.json',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../public/generated/g5-l4-elementary-keyterms-reference-es.json',
        import.meta.url,
      ),
      'utf8',
    ),
  ]);
  assert.match(browser, /unresolved-lesson-vs-grade-wide/);
  assert.match(browser, /credentials: 'same-origin'/);
  assert.match(
    browser,
    /new URL\(responseUrl\)\.origin === new URL\(pageOrigin\)\.origin/,
  );
  assert.match(browser, /document\.authority\.originalRuntimeAccepted === false/);
  assert.match(browser, /data-legacy-urls-executed="false"/);
  assert.match(browser, /data-diagram-assets-executed="false"/);
  assert.match(browser, /data-modern-enhancement="free-text-search"/);
  assert.match(g4Player, /<LegacyKeyTermsBrowser key=\{progress\.language\} locale=\{progress\.language\}/);
  assert.match(
    g5Player,
    /<LegacyKeyTermsBrowser[\s\S]*shellCandidate=\{shellImplementation\}/,
  );
  assert.match(
    g5Player,
    /data-key-terms-shell-candidate="source-static-master-dependency"/,
  );
  assert.match(
    browser,
    /shared-hash-bound-master-source-extraction-not-lesson-runtime-evidence/,
  );
  assert.match(browser, /data-shell-actionscript-executed=/);
  assert.match(browser, /data-runtime-load-verified=/);
  assert.match(browser, /data-reference-use-authorized=/);
  assert.match(browser, /data-runtime-byte-variant-verified=/);
  assert.match(
    browser,
    /content-manager-authorized-combined-elementary-reference-candidate/,
  );
  assert.match(
    browser,
    /content-manager-authorized-reference-lesson-source-gap-open/,
  );
  assert.doesNotMatch(
    `${browser}\n${g4Player}\n${g5Player}`,
    /fscommand|getURL|asfunction:|https?:\/\//,
  );

  assert.equal(
    isSameOriginResponseUrl(
      'https://lesson.example/generated/keyterms.json',
      'https://lesson.example',
    ),
    true,
  );
  assert.equal(
    isSameOriginResponseUrl(
      'https://lesson.example.evil.test/generated/keyterms.json',
      'https://lesson.example',
    ),
    false,
  );
  assert.equal(isSameOriginResponseUrl('not a URL', 'https://lesson.example'), false);

  const spanishDocument = JSON.parse(spanishData) as {
    entries: KeyTermEntry[];
  };
  const promotedDocument = structuredClone(JSON.parse(spanishData)) as {
    authority: {originalRuntimeAccepted: boolean};
  };
  promotedDocument.authority.originalRuntimeAccepted = true;
  assert.throws(
    () => validateKeyTermsDocument(promotedDocument, 'es'),
    /Key Terms authority was promoted/,
  );
  const spanishTitleIndex = createKeyTermTitleIndex(
    spanishDocument.entries,
    'es',
  );
  const absoluteValue = spanishDocument.entries.find(
    ({titles}) => titles.en === 'Absolute Value',
  );
  const valorTarget = absoluteValue?.sublinks.es.find(
    ({sourceText}) => sourceText === 'valor',
  )?.targetTitle;
  assert.equal(valorTarget, 'Valor');
  assert.equal(
    spanishTitleIndex.get('valor')?.length,
    1,
    'Spanish sublinks resolve against Spanish titles',
  );
  assert.ok(
    [...spanishTitleIndex.values()].some((ids) => ids.length > 1),
    'duplicate localized titles remain ambiguous for fail-closed resolution',
  );
  assert.match(browser, /disabled=\{matches\.length !== 1\}/);

  const g5EnglishDocument = JSON.parse(g5EnglishData) as {
    terms: KeyTermEntry[];
    lessonBinding: {
      referenceUseAuthorized: boolean;
      productDispositionAccepted: boolean;
    };
    variantDisposition: {runtimeByteVariantVerified: boolean};
    authority: {
      missingLessonSourcesRecovered: boolean;
      exactRuntimeByteVariantVerified: boolean;
    };
  };
  const g5SpanishDocument = JSON.parse(g5SpanishData) as typeof g5EnglishDocument;
  assert.equal(
    validateKeyTermsDocument(g5EnglishDocument, 'en'),
    g5EnglishDocument,
  );
  assert.equal(
    validateKeyTermsDocument(g5SpanishDocument, 'es'),
    g5SpanishDocument,
  );
  for (const document of [g5EnglishDocument, g5SpanishDocument]) {
    const englishTitles = new Set(document.terms.map(({titles}) => titles.en));
    for (const title of [
      'Positive integers',
      'Integers',
      'Greater than',
      'Zero',
      'Negative integers',
      'Less than',
      'Decimal',
    ]) {
      assert.equal(englishTitles.has(title), true, `${title} remains available`);
    }
    assert.equal(document.lessonBinding.referenceUseAuthorized, true);
    assert.equal(document.lessonBinding.productDispositionAccepted, true);
    assert.equal(document.variantDisposition.runtimeByteVariantVerified, false);
    assert.equal(document.authority.missingLessonSourcesRecovered, false);
    assert.equal(document.authority.exactRuntimeByteVariantVerified, false);
  }
  const recoveredG5Document = structuredClone(g5SpanishDocument);
  recoveredG5Document.authority.missingLessonSourcesRecovered = true;
  assert.throws(
    () => validateKeyTermsDocument(recoveredG5Document, 'es'),
    /Key Terms authority was promoted/,
  );
  const runtimePromotedG5Document = structuredClone(g5SpanishDocument);
  runtimePromotedG5Document.variantDisposition.runtimeByteVariantVerified = true;
  assert.throws(
    () => validateKeyTermsDocument(runtimePromotedG5Document, 'es'),
    /Key Terms byte-variant boundary drifted/,
  );
  const rejectedDispositionG5Document = structuredClone(g5SpanishDocument);
  rejectedDispositionG5Document.lessonBinding.productDispositionAccepted = false;
  assert.throws(
    () => validateKeyTermsDocument(rejectedDispositionG5Document, 'es'),
    /Key Terms lesson-binding boundary drifted/,
  );

  const shellCandidate =
    G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR?.shellImplementation;
  assert.ok(shellCandidate);
  assert.equal(
    shellCandidate.keyTerms.lessonDeclaredSources.en.path,
    'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml',
  );
  assert.equal(
    shellCandidate.keyTerms.lessonDeclaredSources.es.path,
    'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml',
  );
  assert.equal(validateKeyTermsShellCandidate(shellCandidate), shellCandidate);
  const promotedShellCandidate = structuredClone(shellCandidate) as unknown as {
    keyTerms: {runtimeLoadVerified: boolean};
  };
  promotedShellCandidate.keyTerms.runtimeLoadVerified = true;
  assert.throws(
    () => validateKeyTermsShellCandidate(promotedShellCandidate),
    /Key Terms shell authority was promoted/,
  );
  const byteVariantPromotedShellCandidate = structuredClone(
    shellCandidate,
  ) as unknown as {keyTerms: {runtimeByteVariantVerified: boolean}};
  byteVariantPromotedShellCandidate.keyTerms.runtimeByteVariantVerified = true;
  assert.throws(
    () => validateKeyTermsShellCandidate(byteVariantPromotedShellCandidate),
    /Key Terms shell authority was promoted/,
  );
  const rejectedShellDisposition = structuredClone(shellCandidate) as unknown as {
    keyTerms: {productDispositionAccepted: boolean};
  };
  rejectedShellDisposition.keyTerms.productDispositionAccepted = false;
  assert.throws(
    () => validateKeyTermsShellCandidate(rejectedShellDisposition),
    /Key Terms shell authority was promoted/,
  );
  const driftedShellCandidate = structuredClone(shellCandidate) as unknown as {
    sourceSwfSha256: string;
  };
  driftedShellCandidate.sourceSwfSha256 = '0'.repeat(64);
  assert.throws(
    () => validateKeyTermsShellCandidate(driftedShellCandidate),
    /Key Terms shell source identity drifted/,
  );
});

test('G4 shell controls are product-path bound to the G4 shell, not TS006', async () => {
  const descriptor = await readFile(
    new URL('../lib/g4-l3-whole-lesson-player-descriptor.ts', import.meta.url),
    'utf8',
  );
  assert.match(
    descriptor,
    /shell-course-g04-l03-index-local\/control-assets/,
  );
  assert.match(
    descriptor,
    /sourceAnimationId: G4_L3_LESSON\.shellAnimationId/,
  );
  assert.match(descriptor, /sourceSwfSha256: G4_L3_SHELL_SWF_SHA256/);
  assert.doesNotMatch(
    descriptor,
    /course-g04-l03-ts-006\/diagnostic-composite-assets/,
  );
});

test('support tools collapse the persistent map when their panel becomes an overlay', async () => {
  const shell = await readFile(
    new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
    'utf8',
  );
  assert.match(shell, /data-course-map-trigger="legacy-source-hit-area"/);
  assert.match(shell, /data-course-map-trigger="modern-accessible-control"/);
  assert.match(shell, /data-course-map-close-control="true"/);
  assert.match(shell, /if \(toolOverlay && mapOpen && activeTool\)/);
  assert.match(
    shell,
    /\[activeTool, mapOpen, onMapOpenChange, toolOverlay\]/,
  );
  assert.match(shell, /role=\{mapOverlay \? 'dialog' : 'complementary'\}/);
  assert.match(shell, /role=\{toolOverlay \? 'dialog' : 'complementary'\}/);
  assert.match(shell, /ref=\{legacyStageRef\}\s+role="region"/);
});

test('support pause session preserves the pre-open state across map and tool switches', () => {
  let session: SupportPauseSession | null = null;
  let transition = reconcileSupportPauseSession({
    currentPage: 7,
    paused: false,
    playbackInspectionActive: false,
    session,
    supportOpen: true,
  });
  assert.equal(transition.requestedPaused, true);
  assert.deepEqual(transition.session, {
    page: 7,
    pausedBeforeOpen: false,
  });

  session = transition.session;
  transition = reconcileSupportPauseSession({
    currentPage: 7,
    paused: true,
    playbackInspectionActive: false,
    session,
    supportOpen: true,
  });
  assert.equal(transition.requestedPaused, null);
  assert.equal(transition.session, session);

  transition = reconcileSupportPauseSession({
    currentPage: 7,
    paused: true,
    playbackInspectionActive: false,
    session: transition.session,
    supportOpen: false,
  });
  assert.equal(transition.requestedPaused, false);
  assert.equal(transition.session, null);
});

test('support pause session restores manual pause and keeps frame inspection paused', () => {
  const manuallyPaused = reconcileSupportPauseSession({
    currentPage: 3,
    paused: true,
    playbackInspectionActive: false,
    session: null,
    supportOpen: true,
  });
  assert.equal(manuallyPaused.requestedPaused, null);
  assert.equal(manuallyPaused.session?.pausedBeforeOpen, true);
  assert.equal(reconcileSupportPauseSession({
    currentPage: 3,
    paused: true,
    playbackInspectionActive: false,
    session: manuallyPaused.session,
    supportOpen: false,
  }).requestedPaused, true);

  const playing = reconcileSupportPauseSession({
    currentPage: 3,
    paused: false,
    playbackInspectionActive: false,
    session: null,
    supportOpen: true,
  });
  assert.equal(reconcileSupportPauseSession({
    currentPage: 3,
    paused: true,
    playbackInspectionActive: true,
    session: playing.session,
    supportOpen: false,
  }).requestedPaused, true);
});

test('legacy mute candidate restores the last non-zero volume', () => {
  const muted = toggleLegacyMute({
    lastAudibleVolume: .6,
    volume: .35,
  });
  assert.deepEqual(muted, {
    lastAudibleVolume: .35,
    volume: 0,
  });
  assert.deepEqual(toggleLegacyMute(muted), {
    lastAudibleVolume: .35,
    volume: .35,
  });
  assert.equal(rememberLegacyAudibleVolume({
    lastAudibleVolume: .35,
    volume: .9,
  }), .9);
  assert.equal(rememberLegacyAudibleVolume({
    lastAudibleVolume: .35,
    volume: 0,
  }), .35);
  assert.equal(toggleLegacyMute({
    fallbackVolume: 0,
    lastAudibleVolume: 0,
    volume: 0,
  }).volume, .8);
});

test('legacy lesson Back history preserves visit order and duplicates', () => {
  let history = appendLegacyLessonHistory([], 'A', 'B');
  history = appendLegacyLessonHistory(history, 'B', 'A');
  history = appendLegacyLessonHistory(history, 'A', 'C');
  assert.deepEqual(history, ['A', 'B', 'A']);

  let transition = takeLegacyLessonHistory(history);
  assert.equal(transition.previousAnimationId, 'A');
  transition = takeLegacyLessonHistory(transition.history);
  assert.equal(transition.previousAnimationId, 'B');
  transition = takeLegacyLessonHistory(transition.history);
  assert.equal(transition.previousAnimationId, 'A');
  assert.deepEqual(takeLegacyLessonHistory(transition.history), {
    history: [],
    previousAnimationId: null,
  });
  assert.deepEqual(appendLegacyLessonHistory([], 'A', 'A'), []);
});

test('all support close paths share the reversible pause reconciler', async () => {
  const shell = await readFile(
    new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
    'utf8',
  );
  assert.match(shell, /const closeMap = useCallback\(\(\) => \{\s*reconcileSupportPlayback\(activeTool !== null\)/);
  assert.match(
    shell,
    /const closeTool = useCallback\(\(\) => \{\s*const closingTool = activeTool;\s*const rememberedTrigger = lastToolTriggerRef\.current;\s*reconcileSupportPlayback\(mapOpen && mapOverlay\)/,
  );
  assert.match(shell, /if \(activeTool\) \{\s*closeTool\(\);\s*\} else if \(mapOpen\) \{\s*closeMap\(\);/);
  assert.match(shell, /lesson-shell2__scrim--map"[\s\S]*onClick=\{closeMap\}/);
  assert.match(shell, /lesson-shell2__scrim--tool"[\s\S]*onClick=\{closeTool\}/);
  assert.match(shell, /onRequestClose=\{closeTool\}/);
  assert.match(
    shell,
    /data-support-tool-playback="modern-support-open-forces-pause-restores-prior-state"/,
  );
});

test('course-map close restores focus to the visible responsive Map control', async () => {
  const shell = await readFile(
    new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
    'utf8',
  );
  assert.match(
    shell,
    /const closeMap = useCallback\(\(\) => \{[\s\S]*?onMapOpenChange\(false\);[\s\S]*?window\.requestAnimationFrame\(\(\) => \{[\s\S]*?findResponsiveFocusTarget\(\{[\s\S]*?key: 'map',[\s\S]*?modernPresentation: modernControlPresentation,[\s\S]*?target\.focus\(\{preventScroll: true\}\)/,
  );
  assert.match(
    shell,
    /rememberedTrigger && isVisibleOverlayControl\(rememberedTrigger\)[\s\S]*?rememberedTrigger\.focus\(\{preventScroll: true\}\)/,
  );
});

test('tool close restores focus to the visible control in the current responsive presentation', async () => {
  const shell = await readFile(
    new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
    'utf8',
  );
  const closeToolStart = shell.indexOf('const closeTool = useCallback');
  const closeToolEnd = shell.indexOf('\n\n  const requestExit', closeToolStart);

  assert.notEqual(closeToolStart, -1);
  assert.notEqual(closeToolEnd, -1);
  const closeTool = shell.slice(closeToolStart, closeToolEnd);
  assert.match(closeTool, /const closingTool = activeTool;/);
  assert.match(closeTool, /const rememberedTrigger = lastToolTriggerRef\.current;/);
  assert.match(closeTool, /window\.requestAnimationFrame\(\(\) => \{/);
  assert.match(
    closeTool,
    /rememberedTrigger &&\s*isVisibleOverlayControl\(rememberedTrigger\)[\s\S]*?rememberedTrigger\.focus\(\{preventScroll: true\}\)/,
  );
  assert.match(
    closeTool,
    /findResponsiveFocusTarget\(\{[\s\S]*?key: closingTool,[\s\S]*?root\.dataset\.modernControlPresentation === 'true',[\s\S]*?target\?\.focus\(\{preventScroll: true\}\)/,
  );
  assert.doesNotMatch(closeTool, /queueMicrotask/);
});

test('support overlays lock page scroll without making support rails modal', async () => {
  const [shell, styles] = await Promise.all([
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ]);

  assert.match(
    shell,
    /const supportModalOpen = mapModalOpen \|\| toolModalOpen;/,
  );
  assert.match(
    shell,
    /data-support-modal-open=\{supportModalOpen \? 'true' : 'false'\}/,
  );
  assert.match(
    styles,
    /html:has\(\.lesson-shell2\) \{\s*scrollbar-gutter: stable;/,
  );
  assert.match(
    styles,
    /html:has\(\.lesson-shell2\[data-support-modal-open='true'\]\),\s*body:has\(\.lesson-shell2\[data-support-modal-open='true'\]\) \{\s*overflow: hidden;\s*overscroll-behavior: none;/,
  );
  assert.match(
    styles,
    /data-map-presentation='overlay'[\s\S]*?lesson-shell2__side-panel--map,[\s\S]*?data-tool-presentation='overlay'[\s\S]*?lesson-shell2__side-panel--tool \{\s*overscroll-behavior: contain;/,
  );
});

test('language route focus stays visible while a nonmodal tool rail remains open', async () => {
  const shell = await readFile(
    new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
    'utf8',
  );

  assert.match(
    shell,
    /activeTool !== null && !toolOverlay\s*\? `\$\{LANGUAGE_ROUTE_TOOL_INTENT_PREFIX\}\$\{activeTool\}`\s*: 'page-heading'/,
  );
  assert.match(
    shell,
    /if \(restorableTool && !toolOverlay && activeTool !== restorableTool\) \{\s*onToolChange\(restorableTool\);\s*return;/,
  );
  assert.match(
    shell,
    /const target = restorableTool && activeTool === restorableTool &&\s*!toolOverlay\s*\? toolCloseRef\.current\s*: heading;/,
  );
  assert.match(shell, /if \(!target\) return;\s*target\.focus\(\{preventScroll: true\}\)/);
  assert.match(
    shell,
    /\}, \[activeTool, onToolChange, stageOverlayOpen, toolOverlay\]\);/,
  );
});

test('closed wide Map context stays visual-only and cannot add focus targets', async () => {
  const shell = await readFile(
    new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
    'utf8',
  );
  const summaryStart = shell.indexOf(
    'className="lesson-shell2__map-rail-summary"',
  );
  const summaryEnd = shell.indexOf('\n        <header>', summaryStart);

  assert.notEqual(summaryStart, -1);
  assert.notEqual(summaryEnd, -1);
  const summary = shell.slice(summaryStart, summaryEnd);
  assert.match(summary, /data-map-rail-summary="modern-responsive-context"/);
  assert.doesNotMatch(
    summary,
    /<(?:a|button|input|select|textarea)\b|tabIndex=|role=|aria-live=/,
  );
  assert.doesNotMatch(summary, /<h[1-6]\b|<progress\b/);
  assert.equal(
    shell.match(/data-responsive-focus-key="map"/g)?.length,
    2,
    'the visual context does not introduce a third Map control',
  );
});

test('exactly one control surface is live once the modern fallback takes over', async () => {
  const shell = await readFile(
    new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
    'utf8',
  );

  assert.match(
    shell,
    /const legacyHitControlsInert = stageOverlayOpen \|\| modernControlPresentation;/,
  );
  assert.match(
    shell,
    /data-legacy-hit-control-mode=\{legacyHitControlMode\}/,
  );
  assert.match(
    shell,
    /legacyHitControlMode = stageOverlayOpen[\s\S]*?'inert-session-overlay'[\s\S]*?modernControlPresentation[\s\S]*?'inert-modern-surface'[\s\S]*?'active-visible-stage'/,
  );
});

test('the modern surface answers scaled stages and coarse pointers, not wide viewports', () => {
  const nativeFinePointer = {
    accessibleControlFallback: false,
    coarsePointerAvailable: false,
    companionCanRemainVisible: true,
  } as const;

  // A wide viewport renders the authored plane at native size for a mouse.
  // That is the case the source hit regions were drawn for, so the labelled
  // toolbar stays out of the way instead of duplicating every control.
  assert.equal(resolveModernControlPresentation(nativeFinePointer), false);
  assert.equal(resolveModernControlPresentation({
    ...nativeFinePointer,
    coarsePointerAvailable: true,
  }), true);
  assert.equal(resolveModernControlPresentation({
    ...nativeFinePointer,
    accessibleControlFallback: true,
  }), true);
  // A displaced companion returns the coarse pointer to the source hit
  // regions rather than leaving the page with no live surface at all.
  assert.equal(resolveModernControlPresentation({
    ...nativeFinePointer,
    coarsePointerAvailable: true,
    companionCanRemainVisible: false,
  }), false);
  // A scaled stage shrinks every hotspot with it, so the fallback holds even
  // when the companion cannot stay beside an open tool.
  assert.equal(resolveModernControlPresentation({
    ...nativeFinePointer,
    accessibleControlFallback: true,
    companionCanRemainVisible: false,
  }), true);
});

test('header Back uses lesson visit history before browser fallback and stays distinct from Previous', async () => {
  const [shell, g4Player, descriptorPlayer] = await Promise.all([
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/g4-l3-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../components/descriptor-driven-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    ),
  ]);
  assert.match(shell, /lesson-shell2__legacy-hit--header-previous"[\s\S]*onClick=\{onHeaderBack\}/);
  assert.match(shell, /lesson-shell2__legacy-hit--previous"[\s\S]*onClick=\{onPrevious\}/);
  assert.match(
    shell,
    /lesson-shell2__legacy-hit--exit"[\s\S]*data-exit-trigger="legacy-source-hit-area"[\s\S]*requestExit\(event\.currentTarget\)/,
  );
  for (const player of [g4Player, descriptorPlayer]) {
    assert.match(player, /takeLegacyLessonHistory\(\s*lessonNavigationHistoryRef\.current/);
    assert.match(player, /navigateToPage\(transition\.previousAnimationId, false\)/);
    assert.match(player, /if \(window\.history\.length > 1\) \{\s*window\.history\.back\(\);/);
    assert.match(player, /window\.location\.assign\(libraryHref\)/);
    assert.match(player, /const exitToLibrary = \(\) => window\.location\.assign\(libraryHref\)/);
    assert.match(player, /onExit=\{exitToLibrary\}/);
    assert.doesNotMatch(player, /Exit this lesson and return to the library\?/);
    assert.doesNotMatch(player, /¿Salir de esta lección y volver a la biblioteca\?/);
  }
});

test('legacy volume exposes separate source-derived mute and slider controls', async () => {
  const [shell, styles] = await Promise.all([
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../app/globals.css', import.meta.url),
      'utf8',
    ),
  ]);
  assert.match(shell, /data-control-origin="ffdec-actionscript-static-candidate"/);
  assert.match(shell, /data-mute-restore-parity="original-runtime-not-established"/);
  assert.match(shell, /className="lesson-shell2__legacy-mute"/);
  assert.match(shell, /className="lesson-shell2__legacy-volume-slider"/);
  assert.match(shell, /lesson-shell-volume-icon-up\.png/);
  assert.match(shell, /lesson-shell-volume-muted-icon-up\.png/);
  assert.match(styles, /\.lesson-shell2__legacy-volume-slider \{[\s\S]*height: 45\.454545%;[\s\S]*top: 27\.272727%;/);
  assert.match(styles, /\.lesson-shell2__legacy-volume \{[\s\S]*pointer-events: none;/);
});

test('legacy footer transport hit regions separate the stacked button rows', async () => {
  const styles = await readFile(
    new URL('../app/globals.css', import.meta.url),
    'utf8',
  );
  assert.match(
    styles,
    /\.lesson-shell2__legacy-hit--rewind \{[\s\S]*height: 4\.15%;[\s\S]*top: 87\.666667%;[\s\S]*z-index: 2;/,
  );
  assert.match(
    styles,
    /\.lesson-shell2__legacy-hit--replay \{[\s\S]*height: 7%;[\s\S]*top: 91\.833333%;[\s\S]*z-index: 2;/,
  );
  assert.match(
    styles,
    /\.lesson-shell2__legacy-timeline \{[\s\S]*height: 2\.75%;[\s\S]*left: 74\.875%;[\s\S]*top: 88\.666667%;[\s\S]*width: 13\.75%;[\s\S]*z-index: 1;/,
  );
});

test('the forensic Ruffle player stays contained by its reference-stage host', async () => {
  const styles = await readFile(
    new URL('../app/globals.css', import.meta.url),
    'utf8',
  );

  assert.match(
    styles,
    /\.reference-player-host\{height:100%;overflow:hidden;position:relative;width:100%\}/,
  );
  assert.match(
    styles,
    /\.reference-player-host>ruffle-player\{display:block;height:100%;inset:0;position:absolute;width:100%\}/,
  );
});
