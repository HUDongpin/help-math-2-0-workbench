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
        scenario?: string;
        seed: string;
      }>;
    }>
  | Readonly<{
      kind: 'unavailable';
      reason: string;
    }>;

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
    chromeAsset: string;
    header: Readonly<{height: number}>;
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

export interface WholeLessonReleaseAuthority {
  readonly releaseId: string;
  readonly releasePublished: boolean;
  readonly strictCompleteAnimationIds: ReadonlySet<string>;
}

export interface WholeLessonNavigationBinding {
  readonly releaseId: string;
  readonly grade: number;
  readonly lesson: number;
  readonly expectedMemberCount: number;
  readonly activePageCount: number;
  readonly courseShellCount: 1;
  readonly shell: Readonly<{
    animationId: string;
  }>;
  readonly pages: readonly Readonly<{
    animationId: string;
    assetId: string;
    globalPageOrdinal: number;
    sectionCode: string;
    sectionPageOrdinal: number;
    sourceOccurrence: number;
  }>[];
}

/**
 * Cross-binds a client-facing player descriptor to the server-derived atomic
 * release/navigation descriptor. A stale report, reordered XML sequence, or
 * mismatched asset identity therefore fails before the player can mount.
 */
export function wholeLessonDescriptorMatchesNavigation(
  descriptor: WholeLessonPlayerDescriptor,
  navigation: WholeLessonNavigationBinding,
): boolean {
  if (
    descriptor.releaseId !== navigation.releaseId ||
    descriptor.course.grade !== navigation.grade ||
    descriptor.course.lesson !== navigation.lesson ||
    descriptor.course.expectedReleaseMemberCount !==
      navigation.expectedMemberCount ||
    descriptor.course.activePageCount !== navigation.activePageCount ||
    descriptor.course.courseShellCount !== navigation.courseShellCount ||
    descriptor.course.shellAnimationId !== navigation.shell.animationId ||
    descriptor.pages.length !== navigation.pages.length
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
      (page.source.assetId === undefined ||
        page.source.assetId === sourcePage.assetId) &&
      (page.source.sourceOccurrence === undefined ||
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
 * unique page plus the course shell is independently strict-complete.
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
  descriptor: WholeLessonPlayerDescriptor,
  authority: WholeLessonReleaseAuthority,
): WholeLessonReleaseView {
  const pageAnimationIds = descriptor.pages.map((page) => page.animationId);
  const requiredAnimationIds = [
    ...pageAnimationIds,
    descriptor.course.shellAnimationId,
  ];
  const uniqueRequiredAnimationIds = new Set(requiredAnimationIds);
  const descriptorMembershipIsValid =
    authority.releaseId === descriptor.releaseId &&
    descriptor.course.activePageCount === descriptor.pages.length &&
    descriptor.course.courseShellCount === 1 &&
    descriptor.course.expectedReleaseMemberCount ===
      descriptor.pages.length + descriptor.course.courseShellCount &&
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
