import {hasAnimationModule} from '../../../packages/demos/src/animation-registry';

import sourceScopeDocument from '../../../reports/g5-l3-page-only-whole-lesson-source-scope.json' with {type: 'json'};
import type {
  PageOnlyLessonPlayerDescriptor,
  SourceBoundLabel,
  WholeLessonPlayerLocale,
} from './whole-lesson-player-descriptor';

export const G5_L3_PAGE_ONLY_RELEASE_ID =
  'lesson-g05-l03-exponents-prime-factorizations-page-only';
const G5_L3_CALIBRATION_ID = 'g5-l3-page-only-current-js-65-v1';

const G5_L3_SOURCE_XML_PATH = 'HELP_COURSES/ELMGR5/L3/index.xml';
const G5_L3_SOURCE_XML_SHA256 =
  '577949b297729ef79e5782ea36c6318853fb61a261bb0e72e9aa7b7443479a81';
const G5_L3_SECTION_COUNTS = Object.freeze([
  ['IR', 1],
  ['RW', 3],
  ['VB', 14],
  ['IN', 28],
  ['TI', 8],
  ['GS', 1],
  ['TS', 7],
  ['FQ', 3],
] as const);

function sourceLabel({
  english,
  kind,
  locale,
  spanish,
}: {
  english: string;
  kind: 'page' | 'section';
  locale: WholeLessonPlayerLocale;
  spanish: string | null;
}): SourceBoundLabel {
  if (locale === 'es' && spanish) {
    return Object.freeze({
      text: spanish,
      sourceLanguage: 'es',
      sourceStatus: kind === 'page'
        ? 'exact-page-title'
        : 'exact-course-xml',
      usesEnglishFallback: false,
    });
  }
  return Object.freeze({
    text: english,
    sourceLanguage: 'en',
    sourceStatus: locale === 'es'
      ? 'missing-spanish-source-label'
      : kind === 'page'
        ? 'exact-page-title'
        : 'exact-course-xml',
    usesEnglishFallback: locale === 'es',
  });
}

function exactSourceScope(
  document: typeof sourceScopeDocument,
): boolean {
  return Boolean(
    document.schemaVersion === 1 &&
    document.reportType === 'g5-l3-page-only-whole-lesson-source-scope' &&
    document.releaseId === G5_L3_PAGE_ONLY_RELEASE_ID &&
    document.evidenceState ===
      'source-ordered-current-javascript-candidate-acceptance-neutral' &&
    /^sha256:[a-f0-9]{64}$/.test(document.generatedMarker) &&
    document.sourceLesson.path === G5_L3_SOURCE_XML_PATH &&
    document.sourceLesson.sha256 === G5_L3_SOURCE_XML_SHA256 &&
    document.expectedCounts.activeXmlReferencedPages === 65 &&
    document.expectedCounts.uniquePageAnimations === 64 &&
    document.expectedCounts.courseShells === 0 &&
    document.expectedCounts.members === 65 &&
    document.scope.pageOnly === true &&
    document.scope.legacyFlashCourseShellExcluded === true &&
    document.scope.modernMyLessonHostRetained === true &&
    document.lesson.grade === 5 &&
    document.lesson.lesson === 3 &&
    document.lesson.titleEnglish === 'Exponents & Prime Factorizations' &&
    document.lesson.titleSpanish === null &&
    document.lesson.stage.width === 800 &&
    document.lesson.stage.height === 600 &&
    document.acceptanceEffects.currentJavaScriptUniqueRendererCount === 64 &&
    document.acceptanceEffects.currentJavaScriptPlacementCount === 65 &&
    document.acceptanceEffects.authoritativeOriginalRuntime === false &&
    document.acceptanceEffects.audioAccepted === false &&
    document.acceptanceEffects.humanVisualAccepted === false &&
    document.acceptanceEffects.ownerAccepted === false &&
    document.acceptanceEffects.strictComplete === false &&
    document.acceptanceEffects.published === false &&
    document.pages.length === 65 &&
    new Set(document.pages.map((page) => page.placementId)).size === 65 &&
    new Set(document.pages.map((page) => page.animationId)).size === 64 &&
    document.lesson.sections.length === G5_L3_SECTION_COUNTS.length &&
    document.lesson.sections.every((section, index) =>
      section.code === G5_L3_SECTION_COUNTS[index]?.[0] &&
      section.activePageCount === G5_L3_SECTION_COUNTS[index]?.[1]
    ) &&
    document.pages.every((page, index) =>
      page.ordinal === index + 1 &&
      page.sourceOccurrence === index + 1 &&
      page.placementId ===
        `g05-l03-placement-${String(index + 1).padStart(3, '0')}`
    ) &&
    document.pages[44]?.animationId === 'course-g05-l03-in-028' &&
    document.pages[45]?.animationId === 'course-g05-l03-in-028' &&
    document.pages[44]?.assetId === document.pages[45]?.assetId
  );
}

export function buildG5L3WholeLessonPlayerDescriptor(
  document: typeof sourceScopeDocument = sourceScopeDocument,
): PageOnlyLessonPlayerDescriptor | undefined {
  if (!exactSourceScope(document)) return undefined;

  const pages = document.pages.map((page, index) => Object.freeze({
    placementId: page.placementId,
    globalPageOrdinal: page.ordinal,
    sectionPageOrdinal: page.sectionPageOrdinal,
    sectionCode: page.sectionCode,
    animationId: page.animationId,
    previousPlacementId: document.pages[index - 1]?.placementId ?? null,
    nextPlacementId: document.pages[index + 1]?.placementId ?? null,
    previousAnimationId: document.pages[index - 1]?.animationId ?? null,
    nextAnimationId: document.pages[index + 1]?.animationId ?? null,
    labels: Object.freeze({
      en: sourceLabel({
        english: page.titleEnglish,
        spanish: page.titleSpanish,
        locale: 'en',
        kind: 'page',
      }),
      es: sourceLabel({
        english: page.titleEnglish,
        spanish: page.titleSpanish,
        locale: 'es',
        kind: 'page',
      }),
    }),
    rendererAvailability: hasAnimationModule(page.animationId)
      ? Object.freeze({
          kind: 'registered' as const,
          moduleKey: page.animationId,
          runtimeQuery: Object.freeze({
            language: 'fixed-en' as const,
            scenario: 'source-static-frame',
            seed: '0',
          }),
        })
      : Object.freeze({
          kind: 'unavailable' as const,
          reason: 'whole-lesson-renderer-not-source-bound',
        }),
    source: Object.freeze({
      assetId: page.assetId,
      sourceOccurrence: page.sourceOccurrence,
    }),
  }));

  const sections = document.lesson.sections.map((section) => {
    const firstPage = document.pages.find(
      (page) => page.sectionCode === section.code,
    )!;
    return Object.freeze({
      order: section.order,
      code: section.code,
      activePageCount: section.activePageCount,
      firstActivePlacementId: firstPage.placementId,
      firstActiveAnimationId: firstPage.animationId,
      labels: Object.freeze({
        en: sourceLabel({
          english: section.titleEnglish,
          spanish: section.titleSpanish,
          locale: 'en',
          kind: 'section',
        }),
        es: sourceLabel({
          english: section.titleEnglish,
          spanish: section.titleSpanish,
          locale: 'es',
          kind: 'section',
        }),
      }),
    });
  });

  return Object.freeze({
    schemaVersion: 2,
    descriptorKind: 'formal-page-only-course',
    descriptorId: 'whole-lesson-player-g05-l03-page-only-v1',
    calibrationId: G5_L3_CALIBRATION_ID,
    releaseId: G5_L3_PAGE_ONLY_RELEASE_ID,
    course: Object.freeze({
      grade: 5,
      lesson: 3,
      href: '/courses/5/3',
      domIdPrefix: 'g5-l3',
      activePageCount: 65,
      courseShellCount: 0,
      expectedReleaseMemberCount: 65,
      labels: Object.freeze({
        en: Object.freeze({
          text: document.lesson.titleEnglish,
          sourceLanguage: 'en',
          sourceStatus: 'exact-course-xml',
          usesEnglishFallback: false,
        }),
        es: Object.freeze({
          text: document.lesson.titleEnglish,
          sourceLanguage: 'en',
          sourceStatus: 'missing-lesson-level-spanish-title',
          usesEnglishFallback: true,
        }),
      }),
    }),
    source: Object.freeze({
      navigationContractPath:
        'reports/g5-l3-page-only-whole-lesson-source-scope.json',
      sourceXmlPath:
        `source-assets/flash/HELP MATH_ORIGINAL FILES/${G5_L3_SOURCE_XML_PATH}`,
      sourceXmlSha256: G5_L3_SOURCE_XML_SHA256,
      sequenceAuthority: 'course-xml-occurrence',
      candidateFreezeManifestPath:
        'reports/g5-l3-page-only-whole-lesson-source-scope.json',
      candidateFreezeManifestSha256:
        '0220248e9a9a2ea735c799e120b0f93d3062b9c7e9eb503b112d160bf18c48f9',
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey:
        'helpmath:whole-lesson-session:lesson-g05-l03-exponents-prime-factorizations-page-only:v1',
      scope: 'local-device-only',
      legacyCompatible: false,
    }),
    stage: Object.freeze({width: 800, height: 600}),
    support: Object.freeze({
      locales: Object.freeze(['en', 'es'] as const),
      rendererRegistrySnapshot: 'current-javascript-module-registry',
      lessonHostCapabilities: Object.freeze([]),
    }),
    visualSkin: Object.freeze({
      kind: 'modern-my-lesson-page-only',
      layoutId: 'help-math-modern-my-lesson-page-only-v1',
      presentations: Object.freeze(['modern-wide'] as const),
      chromeAsset: '',
      header: Object.freeze({height: 0}),
      footer: Object.freeze({height: 0}),
      controls: Object.freeze({
        kind: 'unresolved-modern-functional-equivalent',
        reason:
          'The retained modern My Lesson host owns navigation and support controls; the excluded legacy Flash course shell is not a migration member.',
      }),
      evidence: Object.freeze({
        kind: 'product-owned-modern-my-lesson',
        calibrationId: G5_L3_CALIBRATION_ID,
      }),
    }),
    glossary: Object.freeze([]),
    productBridge: Object.freeze({
      selectedAnimationIds: Object.freeze(
        pages.map((page) => page.animationId),
      ),
      registeredAnimationCount: pages.length,
      pageOnlyDescriptorMemberCount: pages.length,
      acceptanceEffects: Object.freeze({
        authoritativeOriginalRuntime: false,
        fidelityAccepted: false,
        audioAccepted: false,
        humanVisualAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
        published: false,
      }),
    }),
    sections: Object.freeze(sections),
    pages: Object.freeze(pages),
  } satisfies PageOnlyLessonPlayerDescriptor);
}

export const G5_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR =
  buildG5L3WholeLessonPlayerDescriptor();
