import type {WholeLessonHostPresentation} from './whole-lesson-host-presentation';

export type WholeLessonPlayerLocale = 'en' | 'es';

export interface SourceBoundLabel {
  readonly text: string;
  readonly sourceLanguage: WholeLessonPlayerLocale;
  readonly sourceStatus:
    | 'exact-course-xml'
    | 'exact-page-title'
    | 'exact-page-title-attribute'
    | 'exact-subpage-anchor-label'
    | 'missing-lesson-level-spanish-title'
    | 'missing-page-level-spanish-title'
    | 'missing-spanish-source-label';
  readonly usesEnglishFallback: boolean;
}

export type WholeLessonRendererAvailability =
  | Readonly<{
      kind: 'registered';
      moduleKey: string;
      runtimeQuery?: Readonly<{
        frameDomain?: string;
        language: 'route-locale' | 'fixed-en';
        /**
         * Advance the deterministic runtime seed on Replay and wrap after the
         * declared number of source branches. Omit this unless the source
         * itself proves a finite random branch set that Replay must expose.
         */
        replaySeedCycle?: number;
        scenario?: string;
        seed: string;
      }>;
    }>
  | Readonly<{
      kind: 'unavailable';
      reason: string;
    }>;

export function resolveWholeLessonRuntimeSeed(
  renderer: WholeLessonRendererAvailability,
  replayCount: number,
): string {
  if (renderer.kind !== 'registered' || !renderer.runtimeQuery) return '0';
  const {replaySeedCycle, seed} = renderer.runtimeQuery;
  if (replaySeedCycle === undefined) return seed;
  if (!Number.isSafeInteger(replaySeedCycle) || replaySeedCycle < 2) {
    throw new Error('replaySeedCycle must be a safe integer of at least two');
  }
  if (!/^-?\d+$/.test(seed)) {
    throw new Error('A replay seed cycle requires an integer base seed');
  }
  const baseSeed = Number(seed);
  if (!Number.isSafeInteger(baseSeed)) {
    throw new Error('A replay seed cycle requires a safe integer base seed');
  }
  const normalizedReplayCount = Number.isFinite(replayCount)
    ? Math.max(0, Math.trunc(replayCount))
    : 0;
  return String(baseSeed + (normalizedReplayCount % replaySeedCycle));
}

export interface WholeLessonPlayerSection {
  readonly order: number;
  readonly code: string;
  readonly activePageCount: number;
  readonly firstActiveAnimationId: string;
  readonly labels: Readonly<Record<WholeLessonPlayerLocale, SourceBoundLabel>>;
}

export interface WholeLessonPlayerPage {
  readonly globalPageOrdinal: number;
  readonly sectionPageOrdinal: number;
  readonly sectionCode: string;
  readonly animationId: string;
  readonly previousAnimationId: string | null;
  readonly nextAnimationId: string | null;
  readonly labels: Readonly<Record<WholeLessonPlayerLocale, SourceBoundLabel>>;
  readonly rendererAvailability: WholeLessonRendererAvailability;
  readonly presentation?: Readonly<{
    pageInteractionCompanionTargetIdSuffix: string;
    pageInteractionStageTargetIdSuffix?: string;
  }>;
  /**
   * Reading support this page offers in the widescreen gutter.
   *
   * Declared per page rather than decided by the player comparing animation
   * ids, so a second lesson can offer the same support without editing a
   * component. The crops, transcripts and provenance hashes stay in the
   * lesson's own readable-view specification; this only records that the page
   * has one and which specification it is.
   *
   * Declaring it creates no content: a page without source-bound readable
   * evidence simply omits the field, and nothing is invented to fill it.
   */
  readonly readableView?: Readonly<{
    kind: 'source-bound-readable-view';
    specId: string;
  }>;
  readonly source: Readonly<{
    assetId?: string;
    batchId?: string;
    shardId?: string;
    sourceOccurrence?: number;
    xmlBackgroundText?: boolean;
    spanishTitleStatus?:
      | 'exact-subpage-anchor-label'
      | 'missing-page-level-spanish-title';
    xmlNavigation?: string | null;
  }>;
}

export type WholeLessonControlAssets =
  | Readonly<{
      kind: 'source-derived-diagnostic-candidate';
      root: string;
      sourceAnimationId: string;
      sourceSwfSha256: string;
      navigation?: Readonly<{
        kind: 'source-derived-ffdec-vector-states';
        authoredHitAreaSize: number;
        renderedSize: number;
        navigationFreeChromeFile: string;
        hoverFps: number;
        sourceButtonCharacterIds: readonly number[];
        files: Readonly<{
          up: string;
          down: string;
          overFrames: readonly string[];
        }>;
        next: Readonly<{
          sourceSpriteCharacterId: number;
          mirrorX: false;
          scaleX: number;
          scaleY: number;
        }>;
        previous: Readonly<{
          sourceSpriteCharacterId: number;
          mirrorX: true;
          scaleX: number;
          scaleY: number;
        }>;
      }>;
    }>
  | Readonly<{
      kind: 'unresolved-modern-functional-equivalent';
      reason: string;
    }>;

export interface WholeLessonBackgroundCompanion {
  readonly kind: 'source-derived-ffdec-vector-static-host-companion';
  readonly asset: string;
  readonly assetSha256: string;
  readonly manifestPath: string;
  readonly sourceAnimationId: string;
  readonly sourceSwfSha256: string;
  readonly sourceCharacterId: number;
  readonly sourceInstanceName: string;
  readonly rootFrame: number;
  readonly rootDepth: number;
  readonly pagePlaneRootDepth: number;
  readonly pagePlaneRootPlacementPixels: Readonly<{
    x: number;
    y: number;
  }>;
  readonly visibility: 'source-page-xml-background-text';
  readonly loadedSwfHostRequired: true;
  readonly loadedSwfHostAsset: Readonly<{
    registryKey: string;
    assetSource: string;
    assetSha256: string;
    sourceProvenLanguage: WholeLessonPlayerLocale;
    backgroundDisposition:
      'ignore-loaded-child-swf-standalone-stage-background';
  }>;
}

export interface WholeLessonResumePromptVisualEvidence {
  readonly kind: 'source-derived-ffdec-static-nested-timeline';
  readonly asset: string;
  readonly assetSha256: string;
  readonly manifestPath: string;
  readonly manifestSha256: string;
  readonly sourceAnimationId: string;
  readonly sourceSwfSha256: string;
  readonly sourceCharacterId: number;
  readonly sourceInstanceName: string;
  readonly rootFrame: number;
  readonly localFrame: number;
  readonly exporterCanvas: Readonly<{
    width: number;
    height: number;
  }>;
  readonly rootCompositionOffset: Readonly<{
    x: number;
    y: number;
  }>;
  readonly sourceEnglishText: string;
  readonly spanishTranslationSupplied: false;
  readonly runtimeAuthority:
    'static-structural-candidate-original-runtime-not-established';
}

export interface WholeLessonExitPromptVisualEvidence {
  readonly kind: 'source-derived-ffdec-static-nested-timeline';
  readonly asset: string;
  readonly assetSha256: string;
  readonly manifestPath: string;
  readonly manifestSha256: string;
  readonly sourceAnimationId: string;
  readonly sourceSwfSha256: string;
  readonly sourceCharacterId: number;
  readonly sourceInstanceName: string;
  readonly rootFrame: number;
  readonly rootDepth: number;
  readonly localFrame: number;
  readonly exporterCanvas: Readonly<{
    width: number;
    height: number;
  }>;
  readonly rootCompositionOffset: Readonly<{
    x: number;
    y: number;
  }>;
  readonly sourceButtonCharacterIds: Readonly<{
    yes: number;
    no: number;
  }>;
  readonly hitTargets: Readonly<{
    yes: Readonly<{x: number; y: number; width: number; height: number}>;
    no: Readonly<{x: number; y: number; width: number; height: number}>;
  }>;
  readonly sourceEnglishText: string;
  readonly spanishTranslationSupplied: false;
  readonly runtimeAuthority:
    'static-structural-candidate-original-runtime-not-established';
}

/**
 * The lesson's own name, rendered as live text inside the header chrome.
 *
 * The header artwork paints `<CourseName>` — the product wordmark, byte
 * identical in every lesson's chrome because every lesson XML declares the
 * same "Counting on Numbers". The lesson's own name lives in `<NewTitle1>`
 * and is not painted anywhere, so rendering it as text adds the missing
 * string instead of masking an existing one: the artwork stays artwork.
 *
 * `fontFamily`, `fontSize`, and `color` are the `NewTitle1` attributes as
 * authored. `bounds` is the measured clear region of the header band, in
 * authored stage pixels, so the shell can express it as a percentage of
 * whatever size the stage is actually rendered at.
 */
export interface WholeLessonChromeTitleBand {
  readonly kind: 'source-declared-lesson-title';
  readonly sourceField: 'NewTitle1';
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly color: string;
  readonly bounds: Readonly<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
  readonly boundsEvidence: string;
}

export interface WholeLessonKeyTermsMasterSource {
  readonly assetId: 'ELKTEG4.xml' | 'ELKTSG4.xml';
  readonly sourcePath: string;
  readonly sourceSha256: string;
  readonly generatedDataUrl: string;
  readonly extractedEntryCount: number;
  readonly staticTargetStatus: 'exact-actionscript-string';
}

export interface WholeLessonKeyTermsReferenceDirective {
  readonly evidenceClass: 'owner-relayed-content-manager-email';
  readonly contentManager: 'Venky';
  readonly relayedByOwner: 'Dr. Peter Hu';
  readonly recordedDate: '2026-07-30';
  readonly scope: 'combined-elementary-keyterms-product-reference-only';
  readonly messageHeadersVerified: false;
}

/**
 * A deliberately narrow shell implementation contract.
 *
 * It binds a current-JavaScript support surface to exact static SWF and XML
 * evidence. It does not represent the legacy shell root timeline, execute
 * ActionScript, or satisfy any runtime, fidelity, review, or release gate.
 */
export interface WholeLessonShellImplementationCandidate {
  readonly kind: 'source-static-functional-current-javascript-candidate';
  readonly component: 'descriptor-driven-whole-lesson-player';
  readonly sourceAnimationId: string;
  readonly sourceSwfSha256: string;
  readonly actionScript: Readonly<{
    bundlePath: string;
    bundleSha256: string;
    rootFrame: 35;
    englishInitializationFunction: 'doInitKeyTerms';
    spanishSwitchFunction: 'doSwitchSpanGloss';
    actionScriptExecuted: false;
  }>;
  readonly keyTerms: Readonly<{
    kind: 'shell-actionscript-static-master-glossary-candidate';
    lessonDeclaredSources: Readonly<Record<
      WholeLessonPlayerLocale,
      Readonly<{path: string; present: false}>
    >>;
    masterSources: Readonly<Record<
      WholeLessonPlayerLocale,
      WholeLessonKeyTermsMasterSource
    >>;
    generatedDataScope:
      'shared-hash-bound-master-source-extraction-not-lesson-runtime-evidence';
    referenceUseAuthorized: true;
    referenceDirective: WholeLessonKeyTermsReferenceDirective;
    declaredLessonSourcesRecovered: false;
    runtimeLoadVerified: false;
    runtimeParseVerified: false;
    runtimeByteVariantVerified: false;
    lessonSpecificSubstitutionAuthorized: false;
    productDispositionAccepted: true;
  }>;
  readonly keyTermsStaticVisualReference: Readonly<{
    kind: 'ffdec-static-root-frame-structural-reference';
    asset: string;
    rootFrame: 50;
    width: 800;
    height: 600;
  }>;
  readonly blockedSourceSemantics: readonly (
    | 'original-host-entry-and-global-defaults'
    | 'root-and-nested-timeline-playback'
    | 'bookmark-and-shared-object-parity'
    | 'external-reporting-and-host-commands'
    | 'audio-timing-and-language-selection'
    | 'terminal-and-replay-state'
  )[];
  readonly acceptanceEffects: Readonly<{
    authoritativeOriginalRuntime: false;
    audioAccepted: false;
    humanVisualAccepted: false;
    ownerAccepted: false;
    strictComplete: false;
    published: false;
  }>;
}

export interface WholeLessonPlayerDescriptor {
  readonly schemaVersion: 1;
  readonly descriptorId: string;
  readonly releaseId: string;
  readonly course: Readonly<{
    grade: number;
    lesson: number;
    href: string;
    domIdPrefix: string;
    activePageCount: number;
    courseShellCount: 1;
    expectedReleaseMemberCount: number;
    shellAnimationId: string;
    labels: Readonly<Record<WholeLessonPlayerLocale, SourceBoundLabel>>;
  }>;
  readonly source: Readonly<{
    navigationContractPath: string;
    sourceXmlPath: string;
    sourceXmlSha256: string;
    sequenceAuthority: string;
    shippedShellSequenceConflictResolved: boolean;
  }>;
  readonly persistence: Readonly<{
    schemaVersion: 1;
    storageKey: string;
    scope: 'local-device-only';
    legacyCompatible: boolean;
  }>;
  readonly stage: Readonly<{
    width: number;
    height: number;
  }>;
  readonly support: Readonly<{
    locales: readonly WholeLessonPlayerLocale[];
    rendererRegistrySnapshot: 'current-javascript-module-registry';
  }>;
  readonly shellImplementation?: WholeLessonShellImplementationCandidate;
  readonly visualSkin: Readonly<{
    kind: 'legacy-composite';
    layoutId: 'help-math-course-shell-800x600-v1';
    /**
     * Host presentations this lesson is declared to support. Omitted means
     * legacy composite only. Declaring `modern-wide` authorizes rendering the
     * authored content band without the source chrome; it is a host
     * presentation statement and confers no Flash fidelity, audio, human
     * visual, original-runtime, Owner, strict-completion, or release
     * acceptance. The band geometry is derived from `stage`, `header.height`
     * and `footer.height` rather than restated here.
     */
    presentations?: readonly WholeLessonHostPresentation[];
    chromeAsset: string;
    header: Readonly<{height: number; title?: WholeLessonChromeTitleBand}>;
    footer: Readonly<{height: number}>;
    controls: WholeLessonControlAssets;
    backgroundCompanion?: WholeLessonBackgroundCompanion;
    resumePrompt?: WholeLessonResumePromptVisualEvidence;
    exitPrompt?: WholeLessonExitPromptVisualEvidence;
    evidence: Readonly<{
      kind: 'ffdec-static-structural-candidate';
      sourceAnimationId: string;
      sourceSwfSha256: string;
    }>;
  }>;
  readonly sections: readonly WholeLessonPlayerSection[];
  readonly pages: readonly WholeLessonPlayerPage[];
}

export interface PageOnlyLessonGlossaryEntry {
  readonly id: string;
  readonly sourceKeyAttribute: string;
  readonly labels: Readonly<Record<WholeLessonPlayerLocale, string>>;
  readonly definitions: Readonly<Record<WholeLessonPlayerLocale, string>>;
  readonly source: Readonly<Record<WholeLessonPlayerLocale, Readonly<{
    assetId: 'ELKTEG4.xml' | 'ELKTSG4.xml';
    path: string;
    sha256: string;
  }>>>;
}

/**
 * Page-only descriptor for active lesson-page animations only.
 *
 * Unlike the historical whole-lesson release descriptor above, this contract
 * has no legacy course-shell member. It may drive the retained modern My
 * Lesson host in a local calibration route. A separately reviewed descriptor
 * may declare the formal course kind, but registration still grants no release
 * or strict-completion authority; server navigation and release authorities
 * remain mandatory independent gates.
 */
export interface PageOnlyLessonPlayerDescriptor {
  readonly schemaVersion: 2;
  readonly descriptorKind:
    | 'private-page-only-product-bridge'
    | 'formal-page-only-course';
  readonly descriptorId: string;
  readonly calibrationId: string;
  readonly releaseId: string;
  readonly course: Readonly<{
    grade: number;
    lesson: number;
    href: string;
    domIdPrefix: string;
    activePageCount: number;
    courseShellCount: 0;
    expectedReleaseMemberCount: number;
    labels: Readonly<Record<WholeLessonPlayerLocale, SourceBoundLabel>>;
  }>;
  readonly source: Readonly<{
    navigationContractPath: string;
    sourceXmlPath: string;
    sourceXmlSha256: string;
    sequenceAuthority: 'course-xml-occurrence';
    candidateFreezeManifestPath: string;
    candidateFreezeManifestSha256: string;
  }>;
  readonly persistence: Readonly<{
    schemaVersion: 1;
    storageKey: string;
    scope: 'local-device-only';
    legacyCompatible: false;
  }>;
  readonly stage: Readonly<{width: number; height: number}>;
  readonly support: Readonly<{
    locales: readonly WholeLessonPlayerLocale[];
    rendererRegistrySnapshot: 'current-javascript-module-registry';
    lessonHostCapabilities: readonly (
      | 'audio'
      | 'glossary'
      | 'practice-feedback'
    )[];
  }>;
  readonly visualSkin: Readonly<{
    kind: 'modern-my-lesson-page-only';
    layoutId: 'help-math-modern-my-lesson-page-only-v1';
    presentations: readonly ['modern-wide'];
    chromeAsset: '';
    header: Readonly<{height: 0}>;
    footer: Readonly<{height: 0}>;
    controls: Readonly<{
      kind: 'unresolved-modern-functional-equivalent';
      reason: string;
    }>;
    evidence: Readonly<{
      kind: 'product-owned-modern-my-lesson';
      calibrationId: string;
    }>;
  }>;
  readonly glossary: readonly PageOnlyLessonGlossaryEntry[];
  readonly productBridge: Readonly<{
    selectedAnimationIds: readonly string[];
    registeredAnimationCount: number;
    pageOnlyDescriptorMemberCount: number;
    acceptanceEffects: Readonly<{
      authoritativeOriginalRuntime: false;
      fidelityAccepted: false;
      audioAccepted: false;
      humanVisualAccepted: false;
      ownerAccepted: false;
      strictComplete: false;
      published: false;
    }>;
  }>;
  readonly sections: readonly WholeLessonPlayerSection[];
  readonly pages: readonly WholeLessonPlayerPage[];
}

export type DescriptorDrivenLessonPlayerDescriptor =
  | WholeLessonPlayerDescriptor
  | PageOnlyLessonPlayerDescriptor;

export interface WholeLessonReleaseAuthority {
  readonly releaseId: string;
  readonly releasePublished: boolean;
  readonly strictCompleteAnimationIds: ReadonlySet<string>;
}

interface WholeLessonNavigationBindingBase {
  readonly releaseId: string;
  readonly grade: number;
  readonly lesson: number;
  readonly expectedMemberCount: number;
  readonly activePageCount: number;
  readonly pages: readonly Readonly<{
    animationId: string;
    assetId: string;
    globalPageOrdinal: number;
    sectionCode: string;
    sectionPageOrdinal: number;
    sourceOccurrence: number;
  }>[];
}

export interface LegacyShellLessonNavigationBinding
  extends WholeLessonNavigationBindingBase {
  readonly schemaVersion: 1;
  readonly courseShellCount: 1;
  readonly shell: Readonly<{
    animationId: string;
  }>;
}

export interface PageOnlyLessonNavigationBinding
  extends WholeLessonNavigationBindingBase {
  readonly schemaVersion: 2;
  readonly courseShellCount: 0;
}

export type WholeLessonNavigationBinding =
  | LegacyShellLessonNavigationBinding
  | PageOnlyLessonNavigationBinding;

/**
 * Cross-binds a client-facing player descriptor to the server-derived atomic
 * release/navigation descriptor. A stale report, reordered XML sequence, or
 * mismatched asset identity therefore fails before the player can mount.
 */
export function wholeLessonDescriptorMatchesNavigation(
  descriptor: DescriptorDrivenLessonPlayerDescriptor,
  navigation: WholeLessonNavigationBinding,
): boolean {
  if (
    descriptor.schemaVersion !== navigation.schemaVersion ||
    descriptor.releaseId !== navigation.releaseId ||
    descriptor.course.grade !== navigation.grade ||
    descriptor.course.lesson !== navigation.lesson ||
    descriptor.course.expectedReleaseMemberCount !==
      navigation.expectedMemberCount ||
    descriptor.course.activePageCount !== navigation.activePageCount ||
    descriptor.course.courseShellCount !== navigation.courseShellCount ||
    descriptor.pages.length !== navigation.pages.length
  ) {
    return false;
  }

  if (descriptor.schemaVersion === 1) {
    if (
      navigation.schemaVersion !== 1 ||
      descriptor.course.courseShellCount !== 1 ||
      descriptor.course.expectedReleaseMemberCount !==
        descriptor.pages.length + 1 ||
      descriptor.course.shellAnimationId !== navigation.shell.animationId
    ) {
      return false;
    }
  } else if (
    navigation.schemaVersion !== 2 ||
    descriptor.course.courseShellCount !== 0 ||
    descriptor.course.expectedReleaseMemberCount !== descriptor.pages.length
  ) {
    return false;
  }

  return descriptor.pages.every((page, index) => {
    const sourcePage = navigation.pages[index];
    return Boolean(
      sourcePage &&
      page.animationId === sourcePage.animationId &&
      page.globalPageOrdinal === sourcePage.globalPageOrdinal &&
      page.sectionCode === sourcePage.sectionCode &&
      page.sectionPageOrdinal === sourcePage.sectionPageOrdinal &&
      (descriptor.schemaVersion === 2
        ? page.source.assetId === sourcePage.assetId
        : page.source.assetId === undefined ||
          page.source.assetId === sourcePage.assetId) &&
      (descriptor.schemaVersion === 2
        ? page.source.sourceOccurrence === sourcePage.sourceOccurrence
        : page.source.sourceOccurrence === undefined ||
          page.source.sourceOccurrence === sourcePage.sourceOccurrence),
    );
  });
}

/**
 * A product-facing release view whose independent authorities stay separate.
 *
 * A registered JavaScript renderer describes implementation availability only.
 * It never supplies strict-completion or publication authority. Public release
 * opens only when an explicit publication authority is present and every
 * required release member is independently strict-complete. Schema 2 release
 * membership is page-only; the retained modern My Lesson host is product code,
 * not a recreated legacy course-shell member.
 */
export interface WholeLessonReleaseView {
  readonly releaseId: string;
  readonly currentJsCandidate: boolean;
  readonly currentJsPageCount: number;
  readonly requiredMemberCount: number;
  readonly strictCompleteMemberCount: number;
  readonly strictCompletion: boolean;
  readonly publicRelease: boolean;
}

export function resolveWholeLessonReleaseView(
  descriptor: DescriptorDrivenLessonPlayerDescriptor,
  authority: WholeLessonReleaseAuthority,
): WholeLessonReleaseView {
  const pageAnimationIds = descriptor.pages.map((page) => page.animationId);
  const requiredAnimationIds = descriptor.schemaVersion === 1
    ? [...pageAnimationIds, descriptor.course.shellAnimationId]
    : pageAnimationIds;
  const uniqueRequiredAnimationIds = new Set(requiredAnimationIds);
  const expectedCourseShellCount = descriptor.schemaVersion === 1 ? 1 : 0;
  const descriptorKindCanEnterRelease = descriptor.schemaVersion === 1 ||
    descriptor.descriptorKind === 'formal-page-only-course';
  const descriptorMembershipIsValid =
    descriptorKindCanEnterRelease &&
    authority.releaseId === descriptor.releaseId &&
    descriptor.course.activePageCount === descriptor.pages.length &&
    descriptor.course.courseShellCount === expectedCourseShellCount &&
    descriptor.course.expectedReleaseMemberCount ===
      requiredAnimationIds.length &&
    uniqueRequiredAnimationIds.size === requiredAnimationIds.length;
  const currentJsPageCount = descriptor.pages.filter(
    (page) => page.rendererAvailability.kind === 'registered',
  ).length;
  const strictCompleteMemberCount = descriptorMembershipIsValid
    ? requiredAnimationIds.filter((animationId) =>
        authority.strictCompleteAnimationIds.has(animationId)
      ).length
    : 0;
  const strictCompletion =
    descriptorMembershipIsValid &&
    strictCompleteMemberCount === requiredAnimationIds.length;

  return Object.freeze({
    releaseId: descriptor.releaseId,
    currentJsCandidate:
      descriptorMembershipIsValid &&
      currentJsPageCount === descriptor.pages.length,
    currentJsPageCount,
    requiredMemberCount: requiredAnimationIds.length,
    strictCompleteMemberCount,
    strictCompletion,
    publicRelease: authority.releasePublished && strictCompletion,
  });
}
