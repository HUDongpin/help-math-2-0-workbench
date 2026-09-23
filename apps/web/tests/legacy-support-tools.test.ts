import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {
  LegacyCalculator,
  type LegacyCalculatorEvidence,
} from '../components/legacy-calculator';

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
  assert.match(component, /data-source-x=\{sourceBounds\?\.x\}/);
  assert.match(component, /data-source-y=\{sourceBounds\?\.y\}/);
  assert.match(
    component,
    /className="lesson-shell2__calculator-frame"[\s\S]*role="group"[\s\S]*tabIndex=\{0\}/,
  );
});

test('modern calculator presentation keeps source evidence out of learner copy', () => {
  const evidence: LegacyCalculatorEvidence = {
    behaviorKind: 'ffdec-actionscript-static-candidate',
    panel: {
      asset: '/private-source-panel.png',
      height: 488,
      sha256: 'panel-sha',
      width: 363,
    },
    sourceAnimationId: 'course-g04-l03-shell',
    sourceSwfSha256: 'swf-sha',
  };
  const modernEnglish = renderToStaticMarkup(createElement(LegacyCalculator, {
    evidence,
    onRequestClose: () => undefined,
    presentation: 'modern-support',
    spanish: false,
  }));
  const modernSpanish = renderToStaticMarkup(createElement(LegacyCalculator, {
    evidence,
    onRequestClose: () => undefined,
    presentation: 'modern-support',
    spanish: true,
  }));
  const legacyEvidence = renderToStaticMarkup(createElement(LegacyCalculator, {
    evidence,
    onRequestClose: () => undefined,
    presentation: 'source-evidence',
    spanish: false,
  }));

  assert.match(modernEnglish, /data-calculator-presentation="modern-support"/);
  assert.match(modernEnglish, /data-behavior-authority="modern-support-only"/);
  assert.match(modernEnglish, /data-apple-basic-contract="inspired-subset-no-conformance-claim"/);
  assert.match(modernEnglish, /data-ibm-reference-kind="rpg-calculation-specification-not-calculator-ui-standard"/);
  assert.match(modernEnglish, /data-source-animation-id="course-g04-l03-shell"/);
  assert.match(modernEnglish, /aria-label="Delete last digit"/);
  assert.match(modernEnglish, /data-key-label="AC"/);
  assert.doesNotMatch(modernEnglish, /private-source-panel\.png|<img/);
  assert.doesNotMatch(
    modernEnglish,
    /Functional candidate|original-runtime validation|Keyboard input is|>Memory:/,
  );
  assert.match(modernSpanish, /aria-label="Borrar el último dígito"/);
  assert.doesNotMatch(
    modernSpanish,
    /Candidato funcional|ejecución original|El teclado es|>Memoria:/,
  );

  assert.match(legacyEvidence, /private-source-panel\.png/);
  assert.match(legacyEvidence, /Functional candidate/);
  assert.match(legacyEvidence, />Memory:/);
});

test('modern-wide uses one localized calculator trigger at the spine bottom', async () => {
  const [shell, styles] = await Promise.all([
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ]);

  assert.match(shell, /const calculatorLabel = spanish \? 'Calculadora' : 'Calculator';/);
  assert.match(
    shell,
    /const calculatorControl = <button[\s\S]*aria-controls=\{sectionSpineAvailable[\s\S]*spineCalculatorPanelId[\s\S]*toolPanelId\}[\s\S]*aria-expanded=\{activeTool === 'calculator'\}[\s\S]*aria-label=\{calculatorLabel\}[\s\S]*aria-pressed=\{activeTool === 'calculator'\}/,
  );
  assert.match(
    shell,
    /className="lesson-shell2__spine-calculator-icon"[\s\S]*>🧮<\/span>[\s\S]*className="lesson-shell2__spine-calculator-label"/,
  );
  assert.match(
    shell,
    /className="lesson-shell2__spine-directory"[\s\S]*hidden=\{calculatorInSpine\}[\s\S]*<\/ol>[\s\S]*className="lesson-shell2__spine-tools"[\s\S]*role="group"[\s\S]*\{calculatorControl\}/,
  );
  assert.match(
    shell,
    /className="lesson-shell2__spine-calculator-panel"[\s\S]*hidden=\{!calculatorInSpine\}[\s\S]*id=\{spineCalculatorPanelId\}[\s\S]*presentation="modern-support"/,
  );
  assert.match(
    shell,
    /\{sectionSpineAvailable[\s\S]*\? null[\s\S]*: <div hidden=\{activeTool !== 'calculator'\}>/,
  );
  assert.equal(
    shell.match(/data-responsive-focus-key="calculator"/g)?.length,
    2,
    'one legacy trigger and one shared modern trigger remain in source',
  );
  assert.match(
    shell,
    /presentation=\{modernWide\s*\? 'modern-support'\s*: 'source-evidence'\}/,
  );

  assert.match(
    styles,
    /\.lesson-shell2__spine-tools \{[\s\S]*margin-top: auto;/,
  );
  assert.match(
    styles,
    /\.lesson-shell2__spine button\.lesson-shell2__spine-calculator \{[\s\S]*color: #fff;/,
  );
  assert.match(
    styles,
    /data-spine-state='collapsed'[\s\S]*\.lesson-shell2__spine-calculator-label[\s\S]*clip-path: inset\(50%\)/,
  );
  assert.match(
    styles,
    /@media \(max-width: 680px\)[\s\S]*\.lesson-shell2__spine-tools \{[\s\S]*justify-content: flex-start;/,
  );
  assert.match(
    styles,
    /\.lesson-shell2__spine-calculator-panel[\s\S]*\.lesson-shell2__calculator-keys[\s\S]*grid-template-columns: repeat\(4, minmax\(44px, 1fr\)\);[\s\S]*\.lesson-shell2__calculator-keys[\s\S]*button \{[\s\S]*min-height: 48px;/,
  );
  assert.match(
    styles,
    /\.lesson-shell2__spine-directory\[hidden\],[\s\S]*\.lesson-shell2__spine-calculator-panel\[hidden\] \{\s*display: none;/,
  );
  assert.match(
    styles,
    /data-spine-calculator-open='true'[\s\S]*--lesson-spine-track: clamp\(16rem, 22vw, 18rem\);/,
  );
});

test('calculator stays mounted while hidden so close and reopen preserve state', async () => {
  const shell = await readFile(
    new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
    'utf8',
  );
  assert.match(
    shell,
    /className="lesson-shell2__spine-calculator-panel"[\s\S]*hidden=\{!calculatorInSpine\}[\s\S]*<LegacyCalculator[\s\S]*presentation="modern-support"/,
  );
  assert.match(
    shell,
    /sectionSpineAvailable[\s\S]*\? null[\s\S]*: <div hidden=\{activeTool !== 'calculator'\}>[\s\S]*<LegacyCalculator/,
  );
  assert.match(
    shell,
    /activeTool === 'calculator'[\s\S]*\? null[\s\S]*: helpPanel/,
  );
  assert.match(
    shell,
    /const toolModalOpen = sidePanelToolOpen && toolOverlay;[\s\S]*data-tool-open=\{sidePanelToolOpen \? 'true' : 'false'\}/,
  );
  assert.match(shell, /role=\{toolModalOpen \? 'dialog' : 'complementary'\}/);
  assert.match(
    shell,
    /activeTool === 'calculator'[\s\S]*\? null[\s\S]*: <div[\s\S]*data-tool-rail-page-context/,
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
  assert.match(shell, /role=\{toolModalOpen \? 'dialog' : 'complementary'\}/);
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

test('support tools keep a reversible pause lease while Nova remains transport-independent', async () => {
  const shell = await readFile(
    new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
    'utf8',
  );
  assert.match(
    shell,
    /const supportPauseSessionRef = useRef<SupportPauseSession \| null>\(null\);/,
  );
  assert.match(
    shell,
    /reconcileSupportPauseSession\(\{\s*currentPage,\s*paused,\s*playbackInspectionActive: frameInspectionActive,\s*session: supportPauseSessionRef\.current,\s*supportOpen,\s*\}\)/,
  );
  const pauseLeaseStart = shell.indexOf(
    'const decision = reconcileSupportPauseSession({',
  );
  const pauseLeaseEnd = shell.indexOf(
    'onTutorEngagementChange?.(tutorVisible)',
    pauseLeaseStart,
  );
  assert.ok(pauseLeaseStart >= 0 && pauseLeaseEnd > pauseLeaseStart);
  const pauseLeaseSource = shell.slice(pauseLeaseStart, pauseLeaseEnd);
  assert.match(pauseLeaseSource, /supportOpen/);
  assert.doesNotMatch(
    pauseLeaseSource,
    /tutorVisible|tutorOpen|studySupportOpen|novaTutorMode/,
    'Focus, Study, and Classroom tutor visibility cannot enter the pause lease',
  );

  const tutorHandlersStart = shell.indexOf('const dismissTutor = useCallback');
  const tutorHandlersEnd = shell.indexOf(
    'const toggleMap = useCallback',
    tutorHandlersStart,
  );
  assert.ok(tutorHandlersStart >= 0 && tutorHandlersEnd > tutorHandlersStart);
  const tutorHandlersSource = shell.slice(tutorHandlersStart, tutorHandlersEnd);
  assert.match(tutorHandlersSource, /novaTutorMode === 'study'/);
  assert.match(tutorHandlersSource, /novaTutorMode === 'focus'/);
  assert.match(
    tutorHandlersSource,
    /else \{\s*setTutorOpenMode\(opening \? 'classroom' : null\);\s*setTutorOpen\(opening\);\s*\}/,
  );
  assert.doesNotMatch(
    tutorHandlersSource,
    /onPausedChange|setPaused|reconcileSupportPauseSession/,
    'opening or closing any Nova placement leaves paused unchanged',
  );

  const pauseControlStart = shell.indexOf('const pauseControl = <button');
  const pauseControlEnd = shell.indexOf(
    'const muteControl = <button',
    pauseControlStart,
  );
  assert.ok(pauseControlStart >= 0 && pauseControlEnd > pauseControlStart);
  const pauseControlSource = shell.slice(pauseControlStart, pauseControlEnd);
  assert.match(
    pauseControlSource,
    /disabled=\{!runtimeAvailable \|\| supportOpen\}/,
  );
  assert.doesNotMatch(
    pauseControlSource,
    /tutorVisible|tutorOpen|studySupportOpen/,
    'wide Nova does not disable the learner-owned Pause control',
  );

  assert.match(shell, /data-tutor-playback="independent"/);
  assert.match(shell, /onTutorEngagementChange\?\.\(tutorVisible\);/);
  assert.doesNotMatch(shell, /resolveTutorTransport|tutorHeldPausedRef|effectiveOpen/);
  assert.doesNotMatch(shell, /Narration paused while Nova support is open/);
  assert.doesNotMatch(shell, /data-tutor-pause-notice/);
  assert.doesNotMatch(shell, /reconcileSupportPlayback/);
  assert.match(shell, /if \(activeTool\) \{\s*closeTool\(\);\s*\} else if \(mapOpen\) \{\s*closeMap\(\);/);
  assert.match(shell, /lesson-shell2__scrim--map"[\s\S]*onClick=\{closeMap\}/);
  assert.match(shell, /lesson-shell2__scrim--tool"[\s\S]*onClick=\{closeTool\}/);
  assert.match(shell, /onRequestClose=\{closeTool\}/);
  assert.match(
    shell,
    /data-support-tool-playback="support-tools-pause-restore-nova-independent"/,
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
    /activeTool !== null && \(!toolOverlay \|\| calculatorInSpine\)\s*\? `\$\{LANGUAGE_ROUTE_TOOL_INTENT_PREFIX\}\$\{activeTool\}`\s*: 'page-heading'/,
  );
  assert.match(
    shell,
    /const restorableToolInSpine = restorableTool === 'calculator' &&\s*sectionSpineAvailable;[\s\S]*?if \(\s*restorableTool &&\s*\(!toolOverlay \|\| restorableToolInSpine\) &&\s*activeTool !== restorableTool\s*\) \{\s*onToolChange\(restorableTool\);\s*return;/,
  );
  assert.match(
    shell,
    /const target = restorableTool && activeTool === restorableTool &&\s*\(!toolOverlay \|\| restorableToolInSpine\)[\s\S]*?\? restorableToolInSpine[\s\S]*?spineCalculatorCloseRef\.current[\s\S]*?toolCloseRef\.current[\s\S]*?: heading;/,
  );
  assert.match(shell, /if \(!target\) return;\s*target\.focus\(\{preventScroll: true\}\)/);
  assert.match(
    shell,
    /\}, \[[\s\S]*?activeTool,[\s\S]*?onToolChange,[\s\S]*?sectionSpineAvailable,[\s\S]*?stageOverlayOpen,[\s\S]*?toolOverlay,[\s\S]*?\]\);/,
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
    assert.match(player, /const learningHomeHref = spanish \? '\/es' : '\/'/);
    assert.match(player, /window\.location\.assign\(learningHomeHref\)/);
    assert.match(player, /const exitToLearningHome = \(\) => window\.location\.assign\(learningHomeHref\)/);
    assert.match(player, /onExit=\{exitToLearningHome\}/);
    assert.doesNotMatch(player, /libraryHref|exitToLibrary/);
  }
});

test('volume keeps source controls and uses a vertical modern disclosure', async () => {
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
  assert.doesNotMatch(shell, /className="lesson-shell2__modern-volume"/);
  assert.match(shell, /className="lesson-shell2__volume-control"/);
  assert.match(shell, /className="lesson-shell2__volume-trigger"/);
  assert.match(shell, /aria-expanded=\{volumeControlOpen\}/);
  assert.match(shell, /className="lesson-shell2__volume-popover"/);
  assert.match(shell, /aria-orientation="vertical"/);
  assert.match(shell, /className="lesson-shell2__vertical-volume"/);
  assert.match(shell, /className="lesson-shell2__volume-mute-action"/);
  assert.match(
    shell,
    /aria-label=\{volume === 0[\s\S]*?'Restaurar volumen' : 'Restore volume'[\s\S]*?'Restaurar' : 'Restore'/,
  );
  assert.match(styles, /\.lesson-shell2__legacy-volume-slider \{[\s\S]*height: 45\.454545%;[\s\S]*top: 27\.272727%;/);
  assert.match(styles, /\.lesson-shell2__legacy-volume \{[\s\S]*pointer-events: none;/);
  assert.match(
    styles,
    /\.lesson-shell2__volume-popover \{[\s\S]*?position: absolute;[\s\S]*?width: 116px;/,
  );
  assert.match(
    styles,
    /\.lesson-shell2__volume-popover \{[\s\S]*?--lesson-volume-track-length: 256px;/,
  );
  assert.match(styles, /\.lesson-shell2__modern-toolbar[\s\S]*?> \.lesson-shell2__volume-control[\s\S]*?\.lesson-shell2__vertical-volume[\s\S]*?> input \{[\s\S]*?rotate\(-90deg\)[\s\S]*?width: var\(--lesson-volume-track-length\);/);
  assert.match(styles, /@media \(max-width: 680px\) \{[\s\S]*?--lesson-volume-track-length: 224px;/);
  assert.match(styles, /@media \(orientation: landscape\) and \(max-height: 500px\) \{[\s\S]*?--lesson-volume-track-length: clamp\(144px, calc\(100dvh - 174px\), 216px\);[\s\S]*?position: fixed;[\s\S]*?top: 50dvh;/);
  assert.match(shell, /if \(volumeControlOpen\) \{[\s\S]*?closeVolumeControl\(true\);/);
});

test('Focus modern-wide omits the separate Read it destination', async () => {
  const [shell, styles] = await Promise.all([
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ]);
  assert.doesNotMatch(shell, /spanish \? 'Léelo' : 'Read it'/);
  assert.doesNotMatch(shell, /Open read support|Abrir apoyo de lectura/);
  assert.match(
    shell,
    /const modernSupportControl = novaTutorMode === 'classroom'[\s\S]*?: novaTutorMode === 'study'[\s\S]*?: null;/,
    'the reusable support destination remains gated to non-Focus presentations',
  );
  assert.match(shell, /className="lesson-shell2__read-support-icon"/);
  assert.match(shell, /spanish \? 'Apoyo de estudio' : 'Study support'/);
  assert.match(styles, /\.lesson-shell2__read-support-icon \{[\s\S]*?mask-image:/);
  assert.doesNotMatch(styles, /M4%205h7v14H4zm9%200h7v14h-7z/);
});

test('Focus toolbar keeps Replay, Volume, and the MAIS-derived Nova brand in DOM order', async () => {
  const [shell, tutor, styles] = await Promise.all([
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../components/lesson-nova-tutor.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ]);
  const replayIndex = shell.indexOf('{modernWide ? replayControl : null}');
  const volumeIndex = shell.indexOf('{volumeControl}', replayIndex);
  const novaIndex = shell.indexOf('data-tutor-brand-origin="mais-mvp-orbit-adaptation"');
  assert.ok(replayIndex >= 0);
  assert.ok(volumeIndex > replayIndex);
  assert.ok(novaIndex > volumeIndex);
  assert.match(shell, /aria-label=\{spanish \? 'Preguntar a Nova' : 'Ask Nova'\}/);
  assert.match(shell, /<NovaTutorBrand \/>/);
  assert.match(tutor, /export function NovaTutorBrand\(\)/);
  assert.match(tutor, /lesson-shell2__nova-orbit-halo/);
  assert.match(tutor, /lesson-shell2__nova-brand-name">Nova Tutor/);
  assert.match(
    styles,
    /modern-toolbar > \[data-responsive-focus-key='replay'\] \{\s*order: 5;/,
  );
  assert.match(
    styles,
    /modern-toolbar > \.lesson-shell2__volume-control \{\s*order: 6;/,
  );
  assert.match(
    styles,
    /modern-toolbar > \.lesson-shell2__ask-nova \{\s*order: 7;/,
  );
});

test('playback control exposes matching Play and Pause actions and icons', async () => {
  const [shell, styles] = await Promise.all([
    readFile(
      new URL('../components/legacy-responsive-lesson-shell.tsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ]);
  assert.equal(
    (shell.match(/data-playback-action=\{paused \? 'play' : 'pause'\}/g) ?? [])
      .length,
    2,
    'modern and legacy playback buttons must expose the same state',
  );
  assert.match(shell, /spanish \? 'Reproducir animación' : 'Play animation'/);
  assert.match(shell, /spanish \? 'Pausar animación' : 'Pause animation'/);
  assert.match(
    styles,
    /data-playback-action='pause'\]::before \{[\s\S]*?M8%205h3v14H8zm5%200h3v14h-3z/,
  );
  assert.match(
    styles,
    /data-playback-action='play'\]::before \{[\s\S]*?M8%205v14l11-7z/,
  );
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
