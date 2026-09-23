import {hasAnimationModule} from '@helpmath/demos/animation-registry';

import lessonsCatalogDocument from '../../../catalog/lessons.json' with {type: 'json'};
import sourceScopeDocument from '../../../reports/g5-l4-source-scope-freeze.json' with {type: 'json'};
import {G5_L4_EXECUTIVE_PREVIEW_SCENES} from './g5-l4-executive-preview-content';
import {
  getLessonPageLabel,
  getLessonSectionLabel,
  type LessonNavigationPage,
  type LessonNavigationSection,
} from './lesson-navigation';
import type {
  SourceBoundLabel,
  WholeLessonPlayerDescriptor,
  WholeLessonRendererAvailability,
} from './whole-lesson-player-descriptor';

const G5_L4_RELEASE_ID = 'lesson-g05-l04-number-lines';
const G5_L4_SHELL_ANIMATION_ID = 'shell-course-g05-l04-index-local';
const G5_L4_SHELL_SWF_SHA256 =
  '7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301';
const G5_L4_SOURCE_SCOPE_PATH = 'reports/g5-l4-source-scope-freeze.json';
const G5_L4_COURSE_XML_PATH = 'HELP_COURSES/ELMGR5/L4/index.xml';
const G5_L4_COURSE_XML_SHA256 =
  'b6f1718da8f5e909cb96c883902009887eb965d41e41588318b4bfb36c8f7a36';
const G5_L4_SHELL_ACTIONSCRIPT_BUNDLE_PATH =
  'migrations/shell-course-g05-l04-index-local/audit/machine/ffdec-scripts.txt.gz';
const G5_L4_SHELL_ACTIONSCRIPT_BUNDLE_SHA256 =
  'ebf3a470ac5e78ce1da9e3ac0bdfb9c5a33777f370361632fb3697bb4e523706';
const ELEMENTARY_KEY_TERMS_SOURCE_ROOT =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML';
const G5_L4_KEY_TERMS = Object.freeze({
  en: Object.freeze({
    lessonDeclaredPath: 'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml',
    masterAssetId: 'ELKTEG4.xml' as const,
    masterSourcePath: `${ELEMENTARY_KEY_TERMS_SOURCE_ROOT}/ELKTEG4.xml`,
    masterSourceSha256:
      'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
    generatedDataUrl:
      '/generated/g5-l4-elementary-keyterms-reference-en.json',
    extractedEntryCount: 761,
  }),
  es: Object.freeze({
    lessonDeclaredPath: 'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml',
    masterAssetId: 'ELKTSG4.xml' as const,
    masterSourcePath: `${ELEMENTARY_KEY_TERMS_SOURCE_ROOT}/ELKTSG4.xml`,
    masterSourceSha256:
      '7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00',
    generatedDataUrl:
      '/generated/g5-l4-elementary-keyterms-reference-es.json',
    extractedEntryCount: 753,
  }),
});
const SHA256 = /^[a-f0-9]{64}$/;

type JsonRecord = Record<string, unknown>;

interface SourcePage {
  readonly ordinal: number;
  readonly animationId: string;
  readonly assetId: string;
  readonly shardId: string;
  readonly sectionCode: string;
  readonly sectionPageOrdinal: number;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
}

interface SourceShell {
  readonly animationId: string;
  readonly assetId: string;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
}

interface ParsedSourceScope {
  readonly pages: readonly SourcePage[];
  readonly shell: SourceShell;
}

interface SourceLesson {
  readonly titleEnglish: string;
  readonly sections: readonly LessonNavigationSection[];
}

export interface G5L4WholeLessonDescriptorDocuments {
  readonly sourceScope: unknown;
  readonly lessonsCatalog: unknown;
}

const record = (value: unknown): JsonRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : null;

const nonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() === value && value.length > 0
    ? value
    : null;

const positiveInteger = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 1
    ? value
    : null;

function parseSpanishTitle(value: unknown): string | null | undefined {
  if (value === null) return null;
  return nonEmptyString(value) ?? undefined;
}

function hasExactStage(source: JsonRecord): boolean {
  const swf = record(source.swf);
  const metadata = record(source.swfMetadata);
  const stage = record(metadata?.stage);
  return Boolean(
    swf &&
    nonEmptyString(swf.path) &&
    typeof swf.sha256 === 'string' &&
    SHA256.test(swf.sha256) &&
    stage?.width === 800 &&
    stage.height === 600,
  );
}

function parseSourceScope(value: unknown): ParsedSourceScope | null {
  const document = record(value);
  const summary = record(document?.summary);
  const lesson = record(document?.lesson);
  const nativeStage = record(lesson?.nativeStage);
  const inputs = record(document?.inputs);
  const courseXml = record(inputs?.courseXml);
  const acceptance = record(document?.acceptanceEffects);
  const conflicts = Array.isArray(document?.conflicts)
    ? document.conflicts
    : [];
  const activeSequenceConflict = conflicts.find((entry) =>
    record(entry)?.conflictId ===
      'active-course-xml-versus-legacy-main-script-page-set'
  );
  const activeSequenceConflictRecord = record(activeSequenceConflict);

  if (
    document?.schemaVersion !== 1 ||
    document.reportType !== 'g5-l4-source-scope-freeze' ||
    document.releaseId !== G5_L4_RELEASE_ID ||
    document.evidenceState !==
      'catalog-and-physical-source-scope-candidate-fail-closed' ||
    summary?.pageCount !== 54 ||
    summary.shellCount !== 1 ||
    summary.memberCount !== 55 ||
    summary.strictCompleteCount !== 0 ||
    summary.publishedCount !== 0 ||
    lesson?.grade !== 5 ||
    lesson.lesson !== 4 ||
    lesson.title !== 'Number Lines' ||
    nativeStage?.width !== 800 ||
    nativeStage.height !== 600 ||
    courseXml?.path !== G5_L4_COURSE_XML_PATH ||
    courseXml.sha256 !== G5_L4_COURSE_XML_SHA256 ||
    acceptance?.currentJavaScriptCandidate !== false ||
    acceptance.strictComplete !== false ||
    acceptance.published !== false ||
    activeSequenceConflictRecord?.status !== 'unresolved' ||
    activeSequenceConflictRecord.strictBlocker !== true ||
    !Array.isArray(document.members) ||
    document.members.length !== 55
  ) {
    return null;
  }

  const pages: SourcePage[] = [];
  const memberIds = new Set<string>();
  const assetIds = new Set<string>();

  for (const [index, value] of document.members.entries()) {
    const member = record(value);
    const title = record(member?.title);
    const source = record(member?.source);
    const animationId = nonEmptyString(member?.animationId);
    const assetId = nonEmptyString(member?.assetId);
    const titleEnglish = nonEmptyString(title?.english);
    const titleSpanish = parseSpanishTitle(title?.spanish);
    if (
      !member ||
      member.ordinal !== index + 1 ||
      !animationId ||
      !assetId ||
      memberIds.has(animationId) ||
      assetIds.has(assetId) ||
      !titleEnglish ||
      titleSpanish === undefined ||
      member.strictComplete !== false ||
      !source ||
      !hasExactStage(source)
    ) {
      return null;
    }
    const swf = record(source.swf)!;
    if (assetId !== `swf-${swf.sha256}`) return null;
    memberIds.add(animationId);
    assetIds.add(assetId);

    if (index === 54) {
      if (
        member.role !== 'lesson-shell' ||
        animationId !== G5_L4_SHELL_ANIMATION_ID ||
        swf.sha256 !== G5_L4_SHELL_SWF_SHA256 ||
        titleEnglish !== 'Number Lines' ||
        titleSpanish !== null
      ) {
        return null;
      }
      continue;
    }

    const sectionCode = nonEmptyString(member.section);
    const sectionPageOrdinal = positiveInteger(member.sectionPageOrdinal);
    const shardId = nonEmptyString(member.shardId);
    if (
      member.role !== 'lesson-page' ||
      !sectionCode ||
      !sectionPageOrdinal ||
      !shardId
    ) {
      return null;
    }
    pages.push(Object.freeze({
      ordinal: index + 1,
      animationId,
      assetId,
      shardId,
      sectionCode,
      sectionPageOrdinal,
      titleEnglish,
      titleSpanish,
    }));
  }

  const shellValue = record(document.members[54])!;
  const shellTitle = record(shellValue.title)!;
  const shell = Object.freeze({
    animationId: String(shellValue.animationId),
    assetId: String(shellValue.assetId),
    titleEnglish: String(shellTitle.english),
    titleSpanish: null,
  });

  return Object.freeze({
    pages: Object.freeze(pages),
    shell,
  });
}

function parseLesson(
  value: unknown,
  pages: readonly SourcePage[],
): SourceLesson | null {
  const document = record(value);
  if (document?.schemaVersion !== 1 || !Array.isArray(document.lessons)) {
    return null;
  }
  const matches = document.lessons.filter((entry) => {
    const lesson = record(entry);
    return lesson?.grade === 5 && lesson.lesson === 4;
  });
  if (matches.length !== 1) return null;

  const lesson = record(matches[0])!;
  if (
    lesson.path !== G5_L4_COURSE_XML_PATH ||
    lesson.sha256 !== G5_L4_COURSE_XML_SHA256 ||
    lesson.titleDisplay !== 'Number Lines' ||
    lesson.sectionCount !== 8 ||
    lesson.pageReferenceCount !== 54 ||
    !Array.isArray(lesson.sections) ||
    lesson.sections.length !== 8
  ) {
    return null;
  }

  const sections: LessonNavigationSection[] = [];
  const seenClosedSections = new Set<string>();
  let previousSection: string | null = null;
  const sourceSectionOrder: string[] = [];
  for (const page of pages) {
    if (page.sectionCode !== previousSection) {
      if (seenClosedSections.has(page.sectionCode)) return null;
      if (previousSection !== null) seenClosedSections.add(previousSection);
      sourceSectionOrder.push(page.sectionCode);
      previousSection = page.sectionCode;
    }
  }

  for (const [index, value] of lesson.sections.entries()) {
    const sourceSection = record(value);
    const code = nonEmptyString(sourceSection?.code);
    const titleEnglish = nonEmptyString(sourceSection?.titleEnglish);
    const titleSpanish = nonEmptyString(sourceSection?.titleSpanish);
    const activePageCount = positiveInteger(sourceSection?.pageReferenceCount);
    if (
      !sourceSection ||
      sourceSection.number !== index + 1 ||
      !code ||
      !titleEnglish ||
      !titleSpanish ||
      !activePageCount ||
      sourceSectionOrder[index] !== code
    ) {
      return null;
    }
    const sectionPages = pages.filter((page) => page.sectionCode === code);
    if (
      sectionPages.length !== activePageCount ||
      sectionPages.some(
        (page, pageIndex) => page.sectionPageOrdinal !== pageIndex + 1,
      )
    ) {
      return null;
    }
    sections.push(Object.freeze({
      order: index + 1,
      code,
      titleEnglish,
      titleSpanish,
      firstActiveAnimationId: sectionPages[0]!.animationId,
      activePageCount,
    }));
  }

  return Object.freeze({
    titleEnglish: 'Number Lines',
    sections: Object.freeze(sections),
  });
}

function pageLabel(
  page: LessonNavigationPage,
  locale: 'en' | 'es',
): SourceBoundLabel {
  return Object.freeze({...getLessonPageLabel(page, locale)});
}

function sectionLabel(
  section: LessonNavigationSection,
  locale: 'en' | 'es',
): SourceBoundLabel {
  return Object.freeze({...getLessonSectionLabel(section, locale)});
}

function rendererAvailability(
  page: SourcePage,
): WholeLessonRendererAvailability {
  const scene = G5_L4_EXECUTIVE_PREVIEW_SCENES.find(
    (candidate) => candidate.animationId === page.animationId,
  );
  const sourceBindingMatches = scene?.releaseOrdinal === page.ordinal &&
    scene.sourceSwfSha256 === page.assetId.replace(/^swf-/, '');
  return scene && sourceBindingMatches && hasAnimationModule(page.animationId)
    ? Object.freeze({
        kind: 'registered' as const,
        moduleKey: page.animationId,
        runtimeQuery: Object.freeze({
          frameDomain: scene.frameDomain,
          language: 'fixed-en' as const,
          scenario: scene.scenario,
          seed: '0',
        }),
      })
    : Object.freeze({
        kind: 'unavailable' as const,
        reason: scene
          ? 'source-static-binding-or-animation-module-unavailable'
          : 'whole-lesson-renderer-not-source-bound',
      });
}

function pagePresentation(animationId: string) {
  return animationId === 'course-g05-l04-fq-002' ||
    animationId === 'course-g05-l04-fq-003'
    ? Object.freeze({
        pageInteractionCompanionTargetIdSuffix: 'fq23-question-controls',
      })
    : undefined;
}

/**
 * Builds the G5 L4 audit descriptor only from hash-bound checked-in sources.
 *
 * Any release membership, XML order, source identity, localization, or
 * fail-closed acceptance drift returns no descriptor. Renderer registration
 * remains implementation availability only and never supplies strict or
 * publication authority.
 */
export function buildG5L4WholeLessonPlayerDescriptor(
  documents: G5L4WholeLessonDescriptorDocuments = {
    sourceScope: sourceScopeDocument,
    lessonsCatalog: lessonsCatalogDocument,
  },
): WholeLessonPlayerDescriptor | undefined {
  const sourceScope = parseSourceScope(documents.sourceScope);
  if (!sourceScope) return undefined;
  const sourceLesson = parseLesson(documents.lessonsCatalog, sourceScope.pages);
  if (!sourceLesson) return undefined;

  const navigationPages: LessonNavigationPage[] = sourceScope.pages.map(
    (page, index) => Object.freeze({
      memberOrdinal: page.ordinal,
      globalPageOrdinal: page.ordinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      animationId: page.animationId,
      assetId: page.assetId,
      titleEnglish: page.titleEnglish,
      titleSpanish: page.titleSpanish,
      sourceOccurrence: page.ordinal,
      previousAnimationId:
        sourceScope.pages[index - 1]?.animationId ?? null,
      nextAnimationId: sourceScope.pages[index + 1]?.animationId ?? null,
    }),
  );

  const sections = sourceLesson.sections.map((section) => Object.freeze({
    order: section.order,
    code: section.code,
    activePageCount: section.activePageCount,
    firstActiveAnimationId: section.firstActiveAnimationId,
    labels: Object.freeze({
      en: sectionLabel(section, 'en'),
      es: sectionLabel(section, 'es'),
    }),
  }));
  const pages = navigationPages.map((page) => {
    const sourcePage = sourceScope.pages[page.globalPageOrdinal - 1]!;
    return Object.freeze({
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      animationId: page.animationId,
      previousAnimationId: page.previousAnimationId,
      nextAnimationId: page.nextAnimationId,
      labels: Object.freeze({
        en: pageLabel(page, 'en'),
        es: pageLabel(page, 'es'),
      }),
      rendererAvailability: rendererAvailability(sourcePage),
      presentation: pagePresentation(page.animationId),
      source: Object.freeze({
        assetId: page.assetId,
        shardId: sourcePage.shardId,
        sourceOccurrence: page.sourceOccurrence,
      }),
    });
  });

  return Object.freeze({
    schemaVersion: 1,
    descriptorId: 'whole-lesson-player-g05-l04-v1',
    releaseId: G5_L4_RELEASE_ID,
    course: Object.freeze({
      grade: 5,
      lesson: 4,
      href: '/courses/5/4',
      domIdPrefix: 'g5-l4',
      activePageCount: 54,
      courseShellCount: 1,
      expectedReleaseMemberCount: 55,
      shellAnimationId: sourceScope.shell.animationId,
      labels: Object.freeze({
        en: Object.freeze({
          text: sourceLesson.titleEnglish,
          sourceLanguage: 'en',
          sourceStatus: 'exact-course-xml',
          usesEnglishFallback: false,
        }),
        es: Object.freeze({
          text: sourceLesson.titleEnglish,
          sourceLanguage: 'en',
          sourceStatus: 'missing-lesson-level-spanish-title',
          usesEnglishFallback: true,
        }),
      }),
    }),
    source: Object.freeze({
      navigationContractPath: G5_L4_SOURCE_SCOPE_PATH,
      sourceXmlPath:
        `source-assets/flash/HELP MATH_ORIGINAL FILES/${G5_L4_COURSE_XML_PATH}`,
      sourceXmlSha256: G5_L4_COURSE_XML_SHA256,
      sequenceAuthority:
        'active-course-xml-global-page-order-bound-to-frozen-release-member-ordinal',
      shippedShellSequenceConflictResolved: false,
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey: 'helpmath:g5-l4:whole-lesson-audit:v1',
      scope: 'local-device-only',
      legacyCompatible: false,
    }),
    stage: Object.freeze({width: 800, height: 600}),
    support: Object.freeze({
      locales: Object.freeze(['en', 'es'] as const),
      rendererRegistrySnapshot: 'current-javascript-module-registry',
    }),
    shellImplementation: Object.freeze({
      kind: 'source-static-functional-current-javascript-candidate',
      component: 'descriptor-driven-whole-lesson-player',
      sourceAnimationId: G5_L4_SHELL_ANIMATION_ID,
      sourceSwfSha256: G5_L4_SHELL_SWF_SHA256,
      actionScript: Object.freeze({
        bundlePath: G5_L4_SHELL_ACTIONSCRIPT_BUNDLE_PATH,
        bundleSha256: G5_L4_SHELL_ACTIONSCRIPT_BUNDLE_SHA256,
        rootFrame: 35,
        englishInitializationFunction: 'doInitKeyTerms',
        spanishSwitchFunction: 'doSwitchSpanGloss',
        actionScriptExecuted: false,
      }),
      keyTerms: Object.freeze({
        kind: 'shell-actionscript-static-master-glossary-candidate',
        lessonDeclaredSources: Object.freeze({
          en: Object.freeze({
            path: G5_L4_KEY_TERMS.en.lessonDeclaredPath,
            present: false,
          }),
          es: Object.freeze({
            path: G5_L4_KEY_TERMS.es.lessonDeclaredPath,
            present: false,
          }),
        }),
        masterSources: Object.freeze({
          en: Object.freeze({
            assetId: G5_L4_KEY_TERMS.en.masterAssetId,
            sourcePath: G5_L4_KEY_TERMS.en.masterSourcePath,
            sourceSha256: G5_L4_KEY_TERMS.en.masterSourceSha256,
            generatedDataUrl: G5_L4_KEY_TERMS.en.generatedDataUrl,
            extractedEntryCount:
              G5_L4_KEY_TERMS.en.extractedEntryCount,
            staticTargetStatus: 'exact-actionscript-string',
          }),
          es: Object.freeze({
            assetId: G5_L4_KEY_TERMS.es.masterAssetId,
            sourcePath: G5_L4_KEY_TERMS.es.masterSourcePath,
            sourceSha256: G5_L4_KEY_TERMS.es.masterSourceSha256,
            generatedDataUrl: G5_L4_KEY_TERMS.es.generatedDataUrl,
            extractedEntryCount:
              G5_L4_KEY_TERMS.es.extractedEntryCount,
            staticTargetStatus: 'exact-actionscript-string',
          }),
        }),
        generatedDataScope:
          'shared-hash-bound-master-source-extraction-not-lesson-runtime-evidence',
        referenceUseAuthorized: true,
        referenceDirective: Object.freeze({
          evidenceClass: 'owner-relayed-content-manager-email',
          contentManager: 'Venky',
          relayedByOwner: 'Dr. Peter Hu',
          recordedDate: '2026-07-30',
          scope: 'combined-elementary-keyterms-product-reference-only',
          messageHeadersVerified: false,
        }),
        declaredLessonSourcesRecovered: false,
        runtimeLoadVerified: false,
        runtimeParseVerified: false,
        runtimeByteVariantVerified: false,
        lessonSpecificSubstitutionAuthorized: false,
        productDispositionAccepted: true,
      }),
      keyTermsStaticVisualReference: Object.freeze({
        kind: 'ffdec-static-root-frame-structural-reference',
        asset:
          '/flash-assets/courses/shell-course-g05-l04-index-local/root-frames/frame-0050.png',
        rootFrame: 50,
        width: 800,
        height: 600,
      }),
      blockedSourceSemantics: Object.freeze([
        'original-host-entry-and-global-defaults',
        'root-and-nested-timeline-playback',
        'bookmark-and-shared-object-parity',
        'external-reporting-and-host-commands',
        'audio-timing-and-language-selection',
        'terminal-and-replay-state',
      ] as const),
      acceptanceEffects: Object.freeze({
        authoritativeOriginalRuntime: false,
        audioAccepted: false,
        humanVisualAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
        published: false,
      }),
    }),
    visualSkin: Object.freeze({
      kind: 'legacy-composite',
      layoutId: 'help-math-course-shell-800x600-v1',
      // Grade 5 Lesson 4 uses the same responsive HELP Math 2.0 host as the
      // admitted Grade 4 lesson. This host declaration changes neither the 54
      // source-bound page renderers nor any fidelity or publication gate.
      presentations: Object.freeze([
        'legacy-composite',
        'modern-wide',
      ] as const),
      chromeAsset:
        '/flash-assets/courses/shell-course-g05-l04-index-local/root-frames/frame-0049.png',
      header: Object.freeze({
        height: 109,
        title: Object.freeze({
          kind: 'source-declared-lesson-title',
          sourceField: 'NewTitle1',
          fontFamily: 'Verdana',
          fontSize: 25,
          color: '#ffffff',
          bounds: Object.freeze({left: 82, top: 48, width: 712, height: 59}),
          boundsEvidence:
            'chrome asset rows 44-107 carry no painted glyph right of x=80, ' +
            'so the band is the clear header strip below the painted ' +
            '<CourseName> wordmark, inset to clear the HELP PROGRAM logo on ' +
            'the left and the header hit areas that end at row 47',
        }),
      }),
      footer: Object.freeze({height: 76}),
      controls: Object.freeze({
        kind: 'source-derived-diagnostic-candidate',
        root:
          '/flash-assets/courses/shell-course-g05-l04-index-local/control-assets',
        sourceAnimationId: G5_L4_SHELL_ANIMATION_ID,
        sourceSwfSha256: G5_L4_SHELL_SWF_SHA256,
      }),
      evidence: Object.freeze({
        kind: 'ffdec-static-structural-candidate',
        sourceAnimationId: G5_L4_SHELL_ANIMATION_ID,
        sourceSwfSha256: G5_L4_SHELL_SWF_SHA256,
      }),
    }),
    sections: Object.freeze(sections),
    pages: Object.freeze(pages),
  } satisfies WholeLessonPlayerDescriptor);
}

export const G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR =
  buildG5L4WholeLessonPlayerDescriptor();
