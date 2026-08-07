'use client';

import {useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';

import type {WholeLessonShellImplementationCandidate} from '@/lib/whole-lesson-player-descriptor';

export type IndexLanguage = 'en' | 'es';

export interface LegacyKeyTermSelectionRequest {
  readonly entryId: string;
  readonly revision: number;
  readonly sourceAnimationId: string;
}

interface KeyTermSublink {
  readonly sourceText: string;
  readonly targetTitle: string | null;
}

export interface KeyTermEntry {
  readonly id: string;
  readonly sourceOrdinal: number;
  readonly titles: Readonly<{en: string; es: string}>;
  readonly categories: Readonly<{en: string; es: string}>;
  readonly definitions: Readonly<{en: string; es: string}>;
  readonly sublinks: Readonly<{
    en: readonly KeyTermSublink[];
    es: readonly KeyTermSublink[];
  }>;
  readonly screenKeyTerm: string;
  readonly diagram: Readonly<{
    declaredFilename: string;
    webResolutionStatus: 'not-hash-bound-for-web';
  }>;
}

interface LegacyKeyTermsDocument {
  readonly schemaVersion: 1;
  readonly dataKind: 'grade-wide-shell-keyterms-static-candidate';
  readonly sourceDisposition: 'unresolved-lesson-vs-grade-wide';
  readonly indexLanguage: IndexLanguage;
  readonly source: Readonly<{
    assetId: string;
    bytes: number;
    sha256: string;
    ordering: 'source-file-order';
  }>;
  readonly lessonBinding: Readonly<{
    declaredLessonSpecificSources: readonly string[];
    declaredLessonSpecificSourcesPresent: false;
    shellGradeWideCandidatePresent: true;
    runtimeResolutionVerified: false;
    productDispositionAccepted: false;
  }>;
  readonly authority: Readonly<{
    actionScriptExecuted: false;
    originalRuntimeBaseline: false;
    lessonSpecificSubstitutionAuthorized: false;
    originalRuntimeAccepted: false;
    ownerAccepted: false;
    strictCompletion: false;
    publicRelease: false;
  }>;
  readonly extraction: Readonly<{
    entryCount: number;
    warningCount: number;
    legacyUrlsExecuted: false;
    diagramAssetsExecuted: false;
  }>;
  readonly entries: readonly KeyTermEntry[];
}

interface G5L4KeyTermsReferenceDocument {
  readonly schemaVersion: 1;
  readonly dataKind: 'g5-l4-combined-elementary-keyterms-reference';
  readonly sourceDisposition:
    'content-manager-authorized-reference-lesson-source-gap-open';
  readonly indexLanguage: IndexLanguage;
  readonly generatedAt: null;
  readonly lessonBinding: Readonly<{
    releaseId: 'lesson-g05-l04-number-lines';
    declaredLessonSpecificSources: Readonly<{en: string; es: string}>;
    declaredEnglishLessonSourcePresent: false;
    declaredSpanishLessonSourcePresent: false;
    runtimeResolutionVerified: false;
    referenceUseAuthorized: true;
    productDispositionAccepted: true;
  }>;
  readonly referenceDirective: Readonly<{
    evidenceClass: 'owner-relayed-content-manager-email';
    contentManager: 'Venky';
    relayedByOwner: 'Dr. Peter Hu';
    recordedDate: '2026-07-30';
    scope: 'combined-elementary-keyterms-product-reference-only';
    messageHeadersVerified: false;
  }>;
  readonly variantDisposition: Readonly<{
    runtimeByteVariantVerified: false;
    clientSource: 'canonical-preserved-master';
    ownerIntake2015FullImport: 'blocked-malformed-source-record';
    ownerIntake2015SelectedForClient: false;
  }>;
  readonly source: Readonly<{
    clientSelected: Readonly<{
      assetId: string;
      path: string;
      bytes: number;
      sha256: string;
      ordering: 'source-file-order';
    }>;
    ownerIntake2015Variant: Readonly<{
      assetId: string;
      path: string;
      bytes: number;
      sha256: string;
      logicalRecordCount: number;
      selectedForClient: false;
      malformedDefinitionSeparatorRecords: readonly Readonly<{
        sourceOrdinal: number;
        nodeName: string;
        sourceStartLine: number;
        definitionSeparatorCount: number;
        bodySha256: string;
      }>[];
    }>;
  }>;
  readonly counts: Readonly<{
    clientTermCount: number;
    clientExtractionWarningCount: number;
    ownerIntakeLogicalRecordCount: number;
    ownerIntakeMalformedDefinitionSeparatorRecordCount: number;
  }>;
  readonly authority: Readonly<{
    actionScriptExecuted: false;
    originalRuntimeBaseline: false;
    lessonSpecificSubstitutionAuthorized: false;
    missingLessonSourcesRecovered: false;
    exactRuntimeByteVariantVerified: false;
    originalRuntimeAccepted: false;
    audioAccepted: false;
    humanVisualAccepted: false;
    ownerAccepted: false;
    fidelityVerified: false;
    strictCompletion: false;
    publicationAuthorized: false;
    publicRelease: false;
  }>;
  readonly extraction: Readonly<{
    warnings: readonly unknown[];
    entityPolicy: 'known-named-and-numeric-text-only';
    legacyUrlsExecuted: false;
    diagramAssetsExecuted: false;
  }>;
  readonly terms: readonly KeyTermEntry[];
}

type KeyTermsDocument =
  | LegacyKeyTermsDocument
  | G5L4KeyTermsReferenceDocument;

const ALPHABET = Object.freeze('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
const EMPTY_ENTRIES: readonly KeyTermEntry[] = Object.freeze([]);
const DEFAULT_DATA_URLS: Readonly<Record<IndexLanguage, string>> = Object.freeze({
  en: '/generated/g4-grade-wide-keyterms-en.json',
  es: '/generated/g4-grade-wide-keyterms-es.json',
});
const G5_L4_REFERENCE_DATA_URLS: Readonly<Record<IndexLanguage, string>> =
  Object.freeze({
    en: '/generated/g5-l4-elementary-keyterms-reference-en.json',
    es: '/generated/g5-l4-elementary-keyterms-reference-es.json',
  });
const EXPECTED_SOURCES = Object.freeze({
  en: Object.freeze({
    assetId: 'ELKTEG4.xml',
    bytes: 378_783,
    entries: 761,
    extractionWarnings: 6,
    intakeBytes: 398_191,
    intakeEntries: 814,
    intakeMalformedDefinitionSeparators: 0,
    intakePath:
      'source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTEG4.xml',
    intakeSha256:
      'd39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c',
    lessonPath: 'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml',
    sourcePath:
      'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml',
    sha256:
      'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  }),
  es: Object.freeze({
    assetId: 'ELKTSG4.xml',
    bytes: 374_466,
    entries: 753,
    extractionWarnings: 2,
    intakeBytes: 396_776,
    intakeEntries: 812,
    intakeMalformedDefinitionSeparators: 1,
    intakePath:
      'source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTSG4.xml',
    intakeSha256:
      'a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d',
    lessonPath: 'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml',
    sourcePath:
      'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml',
    sha256:
      '7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00',
  }),
});
const EXPECTED_SHELL = Object.freeze({
  actionScriptBundlePath:
    'migrations/shell-course-g05-l04-index-local/audit/machine/ffdec-scripts.txt.gz',
  actionScriptBundleSha256:
    'ebf3a470ac5e78ce1da9e3ac0bdfb9c5a33777f370361632fb3697bb4e523706',
  animationId: 'shell-course-g05-l04-index-local',
  staticVisualAsset:
    '/flash-assets/courses/shell-course-g05-l04-index-local/root-frames/frame-0050.png',
  swfSha256:
    '7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301',
});
const EXPECTED_BLOCKED_SOURCE_SEMANTICS = Object.freeze([
  'original-host-entry-and-global-defaults',
  'root-and-nested-timeline-playback',
  'bookmark-and-shared-object-parity',
  'external-reporting-and-host-commands',
  'audio-timing-and-language-selection',
  'terminal-and-replay-state',
]);

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function validateKeyTermsShellCandidate(
  value: unknown,
): WholeLessonShellImplementationCandidate {
  invariant(value !== null && typeof value === 'object', 'Key Terms shell binding is not an object');
  const candidate = value as Partial<WholeLessonShellImplementationCandidate>;
  const keyTerms = candidate.keyTerms;
  invariant(
    candidate.kind === 'source-static-functional-current-javascript-candidate' &&
      candidate.component === 'descriptor-driven-whole-lesson-player' &&
      candidate.sourceAnimationId === EXPECTED_SHELL.animationId &&
      candidate.sourceSwfSha256 === EXPECTED_SHELL.swfSha256,
    'Key Terms shell source identity drifted',
  );
  invariant(
    candidate.actionScript?.bundlePath ===
        EXPECTED_SHELL.actionScriptBundlePath &&
      candidate.actionScript.bundleSha256 ===
        EXPECTED_SHELL.actionScriptBundleSha256 &&
      candidate.actionScript.rootFrame === 35 &&
      candidate.actionScript.englishInitializationFunction ===
        'doInitKeyTerms' &&
      candidate.actionScript.spanishSwitchFunction ===
        'doSwitchSpanGloss' &&
      candidate.actionScript.actionScriptExecuted === false,
    'Key Terms ActionScript evidence boundary drifted',
  );
  invariant(
    keyTerms?.kind ===
      'shell-actionscript-static-master-glossary-candidate' &&
      keyTerms.generatedDataScope ===
        'shared-hash-bound-master-source-extraction-not-lesson-runtime-evidence' &&
      keyTerms.referenceUseAuthorized === true &&
      keyTerms.referenceDirective?.evidenceClass ===
        'owner-relayed-content-manager-email' &&
      keyTerms.referenceDirective.contentManager === 'Venky' &&
      keyTerms.referenceDirective.relayedByOwner === 'Dr. Peter Hu' &&
      keyTerms.referenceDirective.recordedDate === '2026-07-30' &&
      keyTerms.referenceDirective.scope ===
        'combined-elementary-keyterms-product-reference-only' &&
      keyTerms.referenceDirective.messageHeadersVerified === false &&
      keyTerms.declaredLessonSourcesRecovered === false &&
      keyTerms.runtimeLoadVerified === false &&
      keyTerms.runtimeParseVerified === false &&
      keyTerms.runtimeByteVariantVerified === false &&
      keyTerms.lessonSpecificSubstitutionAuthorized === false &&
      keyTerms.productDispositionAccepted === true,
    'Key Terms shell authority was promoted',
  );
  for (const language of ['en', 'es'] as const) {
    const expected = EXPECTED_SOURCES[language];
    const master = keyTerms.masterSources[language];
    const lesson = keyTerms.lessonDeclaredSources[language];
    invariant(
      lesson.present === false &&
        lesson.path === expected.lessonPath,
      `Key Terms ${language} lesson source boundary drifted`,
    );
    invariant(
      master.assetId === expected.assetId &&
        master.sourcePath.endsWith(`/XML/${expected.assetId}`) &&
        master.sourceSha256 === expected.sha256 &&
        master.generatedDataUrl === G5_L4_REFERENCE_DATA_URLS[language] &&
        master.extractedEntryCount === expected.entries &&
        master.staticTargetStatus === 'exact-actionscript-string',
      `Key Terms ${language} master source binding drifted`,
    );
  }
  invariant(
    candidate.keyTermsStaticVisualReference?.kind ===
      'ffdec-static-root-frame-structural-reference' &&
      candidate.keyTermsStaticVisualReference.rootFrame === 50 &&
      candidate.keyTermsStaticVisualReference.width === 800 &&
      candidate.keyTermsStaticVisualReference.height === 600 &&
      candidate.keyTermsStaticVisualReference.asset ===
        EXPECTED_SHELL.staticVisualAsset,
    'Key Terms static visual reference drifted',
  );
  invariant(
    candidate.blockedSourceSemantics?.length ===
      EXPECTED_BLOCKED_SOURCE_SEMANTICS.length &&
      candidate.blockedSourceSemantics.every(
        (value, index) => value === EXPECTED_BLOCKED_SOURCE_SEMANTICS[index],
      ),
    'Key Terms shell blocked-source boundary drifted',
  );
  invariant(
    candidate.acceptanceEffects?.authoritativeOriginalRuntime === false &&
      candidate.acceptanceEffects.audioAccepted === false &&
      candidate.acceptanceEffects.humanVisualAccepted === false &&
      candidate.acceptanceEffects.ownerAccepted === false &&
      candidate.acceptanceEffects.strictComplete === false &&
      candidate.acceptanceEffects.published === false,
    'Key Terms shell acceptance boundary was promoted',
  );
  return candidate as WholeLessonShellImplementationCandidate;
}

export function validateKeyTermsDocument(
  value: unknown,
  expectedLanguage: IndexLanguage,
): KeyTermsDocument {
  invariant(value !== null && typeof value === 'object', 'Key Terms data is not an object');
  const expected = EXPECTED_SOURCES[expectedLanguage];
  const identity = value as Partial<
    Pick<KeyTermsDocument, 'schemaVersion' | 'dataKind' | 'indexLanguage'>
  >;
  invariant(identity.schemaVersion === 1, 'Key Terms schema drifted');
  invariant(identity.indexLanguage === expectedLanguage, 'Key Terms language drifted');

  const validateEntries: (
    entries: unknown,
  ) => asserts entries is readonly KeyTermEntry[] = (entries) => {
    invariant(
      Array.isArray(entries) && entries.length === expected.entries,
      'Key Terms entry closure drifted',
    );
    for (const [index, entry] of entries.entries()) {
      invariant(
        entry !== null && typeof entry === 'object',
        `Key Terms entry ${index + 1} drifted`,
      );
      const candidate = entry as Partial<KeyTermEntry>;
      invariant(
        candidate.id?.startsWith(`${expectedLanguage}-`) &&
          candidate.sourceOrdinal === index + 1 &&
          typeof candidate.titles?.en === 'string' &&
          typeof candidate.titles?.es === 'string' &&
          typeof candidate.definitions?.en === 'string' &&
          typeof candidate.definitions?.es === 'string' &&
          candidate.diagram?.webResolutionStatus === 'not-hash-bound-for-web',
        `Key Terms entry ${index + 1} drifted`,
      );
    }
  };

  if (identity.dataKind === 'g5-l4-combined-elementary-keyterms-reference') {
    const document = value as Partial<G5L4KeyTermsReferenceDocument>;
    const lesson = document.lessonBinding;
    const directive = document.referenceDirective;
    const variant = document.variantDisposition;
    const clientSource = document.source?.clientSelected;
    const intakeSource = document.source?.ownerIntake2015Variant;
    invariant(
      document.sourceDisposition ===
        'content-manager-authorized-reference-lesson-source-gap-open' &&
        document.generatedAt === null,
      'Key Terms evidence boundary drifted',
    );
    invariant(
      lesson?.releaseId === 'lesson-g05-l04-number-lines' &&
        lesson.declaredLessonSpecificSources?.en ===
          EXPECTED_SOURCES.en.lessonPath &&
        lesson.declaredLessonSpecificSources.es ===
          EXPECTED_SOURCES.es.lessonPath &&
        lesson.declaredEnglishLessonSourcePresent === false &&
        lesson.declaredSpanishLessonSourcePresent === false &&
        lesson.runtimeResolutionVerified === false &&
        lesson.referenceUseAuthorized === true &&
        lesson.productDispositionAccepted === true,
      'Key Terms lesson-binding boundary drifted',
    );
    invariant(
      directive?.evidenceClass === 'owner-relayed-content-manager-email' &&
        directive.contentManager === 'Venky' &&
        directive.relayedByOwner === 'Dr. Peter Hu' &&
        directive.recordedDate === '2026-07-30' &&
        directive.scope ===
          'combined-elementary-keyterms-product-reference-only' &&
        directive.messageHeadersVerified === false,
      'Key Terms reference directive drifted',
    );
    invariant(
      variant?.runtimeByteVariantVerified === false &&
        variant.clientSource === 'canonical-preserved-master' &&
        variant.ownerIntake2015FullImport ===
          'blocked-malformed-source-record' &&
        variant.ownerIntake2015SelectedForClient === false,
      'Key Terms byte-variant boundary drifted',
    );
    invariant(
      clientSource?.assetId === expected.assetId &&
        clientSource.path === expected.sourcePath &&
        clientSource.bytes === expected.bytes &&
        clientSource.sha256 === expected.sha256 &&
        clientSource.ordering === 'source-file-order',
      'Key Terms source identity drifted',
    );
    invariant(
      intakeSource?.assetId === expected.assetId &&
        intakeSource.path === expected.intakePath &&
        intakeSource.bytes === expected.intakeBytes &&
        intakeSource.sha256 === expected.intakeSha256 &&
        intakeSource.logicalRecordCount === expected.intakeEntries &&
        intakeSource.selectedForClient === false &&
        Array.isArray(intakeSource.malformedDefinitionSeparatorRecords) &&
        intakeSource.malformedDefinitionSeparatorRecords.length ===
          expected.intakeMalformedDefinitionSeparators,
      'Key Terms owner-intake variant identity drifted',
    );
    if (expectedLanguage === 'es') {
      const malformed = intakeSource.malformedDefinitionSeparatorRecords[0];
      invariant(
        malformed.sourceOrdinal === 413 &&
          malformed.nodeName ===
            'Side~of~an~equation~LNG~Lado~de~una~ecuación' &&
          malformed.sourceStartLine === 458 &&
          malformed.definitionSeparatorCount === 0 &&
          malformed.bodySha256 ===
            'd393f77eb9a18cc0e6505f0bc82f8f407e66443390f90007b1df00ecc465d709',
        'Key Terms malformed owner-intake record binding drifted',
      );
    }
    invariant(
      document.counts?.clientTermCount === expected.entries &&
        document.counts.clientExtractionWarningCount ===
          expected.extractionWarnings &&
        document.counts.ownerIntakeLogicalRecordCount ===
          expected.intakeEntries &&
        document.counts.ownerIntakeMalformedDefinitionSeparatorRecordCount ===
          expected.intakeMalformedDefinitionSeparators &&
        Array.isArray(document.extraction?.warnings) &&
        document.extraction.warnings.length === expected.extractionWarnings &&
        document.extraction.entityPolicy ===
          'known-named-and-numeric-text-only' &&
        document.extraction.legacyUrlsExecuted === false &&
        document.extraction.diagramAssetsExecuted === false,
      'Key Terms entry closure drifted',
    );
    invariant(
      document.authority?.actionScriptExecuted === false &&
        document.authority.originalRuntimeBaseline === false &&
        document.authority.lessonSpecificSubstitutionAuthorized === false &&
        document.authority.missingLessonSourcesRecovered === false &&
        document.authority.exactRuntimeByteVariantVerified === false &&
        document.authority.originalRuntimeAccepted === false &&
        document.authority.audioAccepted === false &&
        document.authority.humanVisualAccepted === false &&
        document.authority.ownerAccepted === false &&
        document.authority.fidelityVerified === false &&
        document.authority.strictCompletion === false &&
        document.authority.publicationAuthorized === false &&
        document.authority.publicRelease === false,
      'Key Terms authority was promoted',
    );
    validateEntries(document.terms);
    return document as G5L4KeyTermsReferenceDocument;
  }

  const document = value as Partial<LegacyKeyTermsDocument>;
  invariant(
    document.dataKind === 'grade-wide-shell-keyterms-static-candidate' &&
      document.sourceDisposition === 'unresolved-lesson-vs-grade-wide',
    'Key Terms evidence boundary drifted',
  );
  invariant(
    document.source?.assetId === expected.assetId &&
      document.source.sha256 === expected.sha256 &&
      document.source.ordering === 'source-file-order',
    'Key Terms source identity drifted',
  );
  invariant(
    document.lessonBinding?.declaredLessonSpecificSourcesPresent === false &&
      document.lessonBinding.runtimeResolutionVerified === false &&
      document.lessonBinding.productDispositionAccepted === false,
    'Key Terms lesson-binding boundary drifted',
  );
  invariant(
    document.authority?.actionScriptExecuted === false &&
      document.authority.originalRuntimeBaseline === false &&
      document.authority.lessonSpecificSubstitutionAuthorized === false &&
      document.authority.originalRuntimeAccepted === false &&
      document.authority.ownerAccepted === false &&
      document.authority.strictCompletion === false &&
      document.authority.publicRelease === false,
    'Key Terms authority was promoted',
  );
  invariant(
    document.extraction?.entryCount === expected.entries &&
      document.extraction.legacyUrlsExecuted === false &&
      document.extraction.diagramAssetsExecuted === false,
    'Key Terms entry closure drifted',
  );
  validateEntries(document.entries);
  return document as LegacyKeyTermsDocument;
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('en-US')
    .trim();
}

export function isSameOriginResponseUrl(
  responseUrl: string,
  pageOrigin: string,
) {
  try {
    return new URL(responseUrl).origin === new URL(pageOrigin).origin;
  } catch {
    return false;
  }
}

export function createKeyTermTitleIndex(
  entries: readonly Pick<KeyTermEntry, 'id' | 'titles'>[],
  language: IndexLanguage,
) {
  const index = new Map<string, string[]>();
  for (const entry of entries) {
    const key = normalizeSearch(entry.titles[language]);
    index.set(key, [...(index.get(key) ?? []), entry.id]);
  }
  return index;
}

export function LegacyKeyTermsBrowser({
  locale,
  selectionRequest,
  shellCandidate,
}: {
  locale: IndexLanguage;
  selectionRequest?: LegacyKeyTermSelectionRequest | null;
  shellCandidate?: WholeLessonShellImplementationCandidate;
}) {
  const [indexLanguage, setIndexLanguage] = useState<IndexLanguage>(locale);
  const [document, setDocument] = useState<KeyTermsDocument | null>(null);
  const [loadError, setLoadError] = useState<Readonly<{
    language: IndexLanguage;
    message: string;
  }> | null>(null);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly string[]>([]);
  const handledSelectionRequestRef = useRef('');
  const selectedHeadingRef = useRef<HTMLHeadingElement>(null);
  const spanishUi = locale === 'es';
  const shellCandidateValidation = useMemo(() => {
    if (!shellCandidate) return {candidate: null, error: ''} as const;
    try {
      return {
        candidate: validateKeyTermsShellCandidate(shellCandidate),
        error: '',
      } as const;
    } catch (error: unknown) {
      return {
        candidate: null,
        error: error instanceof Error
          ? error.message
          : 'Key Terms shell binding failed',
      } as const;
    }
  }, [shellCandidate]);
  const sourceBoundShellCandidate = shellCandidateValidation.candidate;

  useEffect(() => {
    if (shellCandidateValidation.error) return;
    const controller = new AbortController();
    const dataUrl = sourceBoundShellCandidate
      ? sourceBoundShellCandidate.keyTerms.masterSources[indexLanguage]
        .generatedDataUrl
      : DEFAULT_DATA_URLS[indexLanguage];
    fetch(dataUrl, {
      cache: 'force-cache',
      credentials: 'same-origin',
      signal: controller.signal,
    }).then(async (response) => {
      invariant(
        response.ok &&
          isSameOriginResponseUrl(response.url, window.location.origin),
        `Key Terms same-origin data request failed (${response.status})`,
      );
      const value: unknown = await response.json();
      return validateKeyTermsDocument(value, indexLanguage);
    }).then((nextDocument) => {
      setDocument(nextDocument);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setLoadError({
        language: indexLanguage,
        message: error instanceof Error ? error.message : 'Key Terms data failed',
      });
    });
    return () => controller.abort();
  }, [
    indexLanguage,
    shellCandidateValidation.error,
    sourceBoundShellCandidate,
  ]);

  useEffect(() => {
    if (selectedId) selectedHeadingRef.current?.focus();
  }, [selectedId]);

  const activeDocument = !shellCandidateValidation.error &&
      document?.indexLanguage === indexLanguage
    ? document
    : null;
  const activeLoadError = shellCandidateValidation.error ||
    (loadError?.language === indexLanguage ? loadError.message : '');
  const entries = activeDocument
    ? activeDocument.dataKind ===
        'g5-l4-combined-elementary-keyterms-reference'
      ? activeDocument.terms
      : activeDocument.entries
    : EMPTY_ENTRIES;
  const normalizedQuery = normalizeSearch(deferredQuery);
  const filteredEntries = useMemo(() => entries.filter((entry) => {
    if (
      selectedLetter &&
      entry.categories[indexLanguage] !== selectedLetter.toLocaleLowerCase('en-US')
    ) return false;
    if (!normalizedQuery) return true;
    return normalizeSearch([
      entry.titles.en,
      entry.titles.es,
      entry.definitions.en,
      entry.definitions.es,
    ].join(' ')).includes(normalizedQuery);
  }), [entries, indexLanguage, normalizedQuery, selectedLetter]);
  const selectedEntry = selectedId
    ? entries.find(({id}) => id === selectedId) ?? null
    : null;
  const idsByTitle = useMemo(
    () => createKeyTermTitleIndex(entries, indexLanguage),
    [entries, indexLanguage],
  );
  const requestedEntry = selectionRequest
    ? entries.find(({id}) => id === selectionRequest.entryId) ?? null
    : null;
  const selectionResolution = !selectionRequest
    ? 'none'
    : !activeDocument
      ? 'pending-data'
      : requestedEntry
        ? 'matched-local-entry'
        : 'blocked-entry-not-found';

  useEffect(() => {
    if (!selectionRequest || !activeDocument || !requestedEntry) return;
    const requestKey = [
      selectionRequest.sourceAnimationId,
      selectionRequest.entryId,
      selectionRequest.revision,
      indexLanguage,
    ].join(':');
    if (handledSelectionRequestRef.current === requestKey) return;
    handledSelectionRequestRef.current = requestKey;
    setSelectedLetter('');
    setQuery('');
    setHistory([]);
    setSelectedId(requestedEntry.id);
  }, [
    activeDocument,
    indexLanguage,
    requestedEntry,
    selectionRequest,
  ]);

  const changeIndexLanguage = (language: IndexLanguage) => {
    setIndexLanguage(language);
    setSelectedLetter('');
    setQuery('');
    setSelectedId(null);
    setHistory([]);
  };
  const selectFromList = (id: string) => {
    setHistory([]);
    setSelectedId(id);
  };
  const followSublink = (targetId: string) => {
    if (selectedId) setHistory((current) => [...current, selectedId]);
    setSelectedId(targetId);
  };
  const goBack = () => {
    if (history.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId(history.at(-1) ?? null);
    setHistory((current) => current.slice(0, -1));
  };
  const reset = () => {
    setIndexLanguage(locale);
    setSelectedLetter('');
    setQuery('');
    setSelectedId(null);
    setHistory([]);
  };
  const masterEnglish = sourceBoundShellCandidate?.keyTerms.masterSources.en;
  const masterSpanish = sourceBoundShellCandidate?.keyTerms.masterSources.es;
  const lessonEnglish = sourceBoundShellCandidate
    ?.keyTerms.lessonDeclaredSources.en.path.split('/').at(-1);
  const lessonSpanish = sourceBoundShellCandidate
    ?.keyTerms.lessonDeclaredSources.es.path.split('/').at(-1);
  const staticVisualReference = sourceBoundShellCandidate
    ?.keyTermsStaticVisualReference;

  return <section
    className="lesson-shell2__key-terms-browser"
    data-data-authority={sourceBoundShellCandidate
      ? 'content-manager-authorized-combined-elementary-reference-candidate'
      : 'grade-wide-shell-static-candidate'}
    data-diagram-assets-executed="false"
    data-generated-data-scope={sourceBoundShellCandidate
      ?.keyTerms.generatedDataScope}
    data-legacy-urls-executed="false"
    data-host-selection-entry-id={selectionRequest?.entryId}
    data-host-selection-resolution={selectionResolution}
    data-host-selection-source-animation-id={
      selectionRequest?.sourceAnimationId
    }
    data-lesson-specific-sources-present={sourceBoundShellCandidate
      ? 'false'
      : undefined}
    data-original-runtime-accepted="false"
    data-reference-use-authorized={sourceBoundShellCandidate ? 'true' : undefined}
    data-runtime-byte-variant-verified={sourceBoundShellCandidate
      ? 'false'
      : undefined}
    data-runtime-load-verified={sourceBoundShellCandidate ? 'false' : undefined}
    data-shell-actionscript-executed={sourceBoundShellCandidate
      ? 'false'
      : undefined}
    data-shell-source-animation-id={sourceBoundShellCandidate
      ?.sourceAnimationId}
    data-shell-source-swf-sha256={sourceBoundShellCandidate
      ?.sourceSwfSha256}
    data-shell-static-master-targets={sourceBoundShellCandidate
      ? `${masterEnglish?.assetId},${masterSpanish?.assetId}`
      : undefined}
    data-source-disposition={sourceBoundShellCandidate
      ? 'content-manager-authorized-reference-lesson-source-gap-open'
      : 'unresolved-lesson-vs-grade-wide'}
  >
    <div className="lesson-shell2__key-terms-boundary">
      <strong>{sourceBoundShellCandidate
        ? (spanishUi
            ? 'Referencia autorizada del glosario combinado de primaria'
            : 'Authorized combined Elementary glossary reference')
        : (spanishUi
            ? 'Candidato del glosario general de 4.º grado'
            : 'Grade 4 shell glossary candidate')}</strong>
      <p>{sourceBoundShellCandidate
        ? (spanishUi
            ? `El responsable de contenido autorizó usar el glosario combinado de primaria como referencia del producto. El ActionScript estático del shell apunta a ${masterEnglish?.assetId} y ${masterSpanish?.assetId}; ${lessonEnglish} y ${lessonSpanish} siguen ausentes. Esta vista no sustituye esos XML ni demuestra qué variante de bytes cargó el runtime original.`
            : `The content manager authorized the combined Elementary glossary for product reference. The shell's static ActionScript targets ${masterEnglish?.assetId} and ${masterSpanish?.assetId}; ${lessonEnglish} and ${lessonSpanish} remain missing. This view neither replaces those XML files nor proves which byte variant the original runtime loaded.`)
        : (spanishUi
            ? 'El shell enviado apunta a este glosario, pero el XML de la lección declara L3KTE01/L3KTS01, que faltan. Esta vista no los sustituye ni establece paridad de ejecución.'
            : 'The shipped shell points to this glossary, but the lesson XML declares missing L3KTE01/L3KTS01 files. This view neither substitutes for them nor establishes runtime parity.')}</p>
    </div>

    <div className="lesson-shell2__key-terms-toolbar">
      <div role="group" aria-label={spanishUi ? 'Idioma del índice' : 'Index language'}>
        <button
          aria-pressed={indexLanguage === 'en'}
          onClick={() => changeIndexLanguage('en')}
          type="button"
        >
          English index
        </button>
        <button
          aria-pressed={indexLanguage === 'es'}
          onClick={() => changeIndexLanguage('es')}
          type="button"
        >
          Índice español
        </button>
      </div>
      <button onClick={reset} type="button">{spanishUi ? 'Restablecer' : 'Reset'}</button>
    </div>

    <div className="lesson-shell2__key-terms-alphabet" role="group" aria-label={spanishUi ? 'Filtro alfabético' : 'Alphabet filter'}>
      <button
        aria-pressed={!selectedLetter}
        onClick={() => {
          setSelectedLetter('');
          setSelectedId(null);
          setHistory([]);
        }}
        type="button"
      >
        {spanishUi ? 'Todo' : 'All'}
      </button>
      {ALPHABET.map((letter) =>
        <button
          aria-pressed={selectedLetter === letter}
          key={letter}
          onClick={() => {
            setSelectedLetter(letter);
            setSelectedId(null);
            setHistory([]);
          }}
          type="button"
        >
          {letter}
        </button>
      )}
    </div>

    <label className="lesson-shell2__key-terms-search">
      <span>{spanishUi
        ? 'Buscar en definiciones (mejora de HELP Math 2.0)'
        : 'Search definitions (HELP Math 2.0 enhancement)'}</span>
      <input
        data-modern-enhancement="free-text-search"
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedId(null);
          setHistory([]);
        }}
        type="search"
        value={query}
      />
    </label>

    {activeLoadError
      ? <p role="alert">{spanishUi
          ? `El glosario se cerró de forma segura: ${activeLoadError}`
          : `Glossary failed closed: ${activeLoadError}`}</p>
      : !activeDocument
        ? <p role="status">{spanishUi ? 'Cargando datos verificados…' : 'Loading verified data…'}</p>
        : selectedEntry
          ? <article className="lesson-shell2__key-term-definition">
              <div className="lesson-shell2__key-term-definition-actions">
                <button onClick={goBack} type="button">
                  {spanishUi ? '← Atrás' : '← Back'}
                </button>
                <span>{spanishUi
                  ? `Entrada ${selectedEntry.sourceOrdinal} de ${entries.length}`
                  : `Entry ${selectedEntry.sourceOrdinal} of ${entries.length}`}</span>
              </div>
              <h3 ref={selectedHeadingRef} tabIndex={-1}>
                {selectedEntry.titles[indexLanguage]}
              </h3>
              <div className="lesson-shell2__key-term-bilingual">
                <section lang="en">
                  <span>English</span>
                  <h4>{selectedEntry.titles.en}</h4>
                  <p>{selectedEntry.definitions.en}</p>
                </section>
                <section lang="es">
                  <span>Español</span>
                  <h4>{selectedEntry.titles.es}</h4>
                  <p>{selectedEntry.definitions.es}</p>
                </section>
              </div>
              {selectedEntry.sublinks[indexLanguage].length
                ? <section className="lesson-shell2__key-term-related">
                    <h4>{spanishUi ? 'Términos relacionados' : 'Related terms'}</h4>
                    <div>
                      {selectedEntry.sublinks[indexLanguage].map((link, index) => {
                        const matches = link.targetTitle
                          ? idsByTitle.get(normalizeSearch(link.targetTitle)) ?? []
                          : [];
                        return <button
                          data-link-resolution={matches.length === 1
                            ? 'unique-local-entry'
                            : 'unresolved-source-link'}
                          disabled={matches.length !== 1}
                          key={`${link.sourceText}-${index}`}
                          onClick={() => followSublink(matches[0]!)}
                          type="button"
                        >
                          {link.sourceText}
                        </button>;
                      })}
                    </div>
                  </section>
                : null}
              <aside className="lesson-shell2__key-term-example">
                <strong>Example</strong>
                <span>{selectedEntry.diagram.declaredFilename}</span>
                <small>{spanishUi
                  ? 'Declarado por la fuente, pero sin un activo web local enlazado por hash; no se ejecuta.'
                  : 'Declared by source, but no hash-bound local web asset is available; it is not executed.'}</small>
              </aside>
            </article>
          : <>
              <p className="lesson-shell2__key-terms-count" role="status">
                {spanishUi
                  ? `${filteredEntries.length} de ${entries.length} entradas candidatas · orden del archivo fuente`
                  : `${filteredEntries.length} of ${entries.length} candidate entries · source-file order`}
              </p>
              <ol className="lesson-shell2__key-terms-list">
                {filteredEntries.map((entry) =>
                  <li key={entry.id}>
                    <button
                      data-source-ordinal={entry.sourceOrdinal}
                      onClick={() => selectFromList(entry.id)}
                      type="button"
                    >
                      <span>{entry.titles[indexLanguage]}</span>
                      <small>{entry.titles[indexLanguage === 'en' ? 'es' : 'en']}</small>
                    </button>
                  </li>
                )}
              </ol>
            </>}

    <details className="lesson-shell2__key-terms-blueprint">
      <summary>{spanishUi
        ? 'Ver referencia visual estática del shell'
        : 'View shell static visual reference'}</summary>
      {/* The image proves structure only; it is not a runtime-populated modal. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={spanishUi
          ? 'Referencia estructural estática de Key Terms'
          : 'Key Terms static structural reference'}
        height={staticVisualReference?.height ?? 488}
        src={staticVisualReference?.asset ??
          '/flash-assets/courses/shell-course-g04-l03-index-local/sprite-693/visual-001-f1bb347922d6.png'}
        width={staticVisualReference?.width ?? 1608}
      />
    </details>
  </section>;
}
