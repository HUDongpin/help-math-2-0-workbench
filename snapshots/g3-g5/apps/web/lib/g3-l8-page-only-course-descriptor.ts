import {G3_L8_PAGE_ONLY_CURRENT_JS} from './g3-l8-page-only-current-js.generated';
import type {
  PageOnlyLessonPlayerDescriptor,
  SourceBoundLabel,
  WholeLessonPlayerPage,
} from './whole-lesson-player-descriptor';

const MODERN_CONTROL_REASON =
  'The retained modern My Lesson host owns navigation and playback controls; the excluded legacy Flash course-shell is not a page-only member.';

const acceptanceEffects = Object.freeze({
  authoritativeOriginalRuntime: false,
  fidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  published: false,
});

function sourceBoundLabel(english: string, spanish: string | null, locale: 'en' | 'es'): SourceBoundLabel {
  if (locale === 'es' && spanish) return Object.freeze({text: spanish, sourceLanguage: 'es', sourceStatus: 'exact-page-title', usesEnglishFallback: false});
  return Object.freeze({text: english, sourceLanguage: 'en', sourceStatus: locale === 'es' ? 'missing-page-level-spanish-title' : 'exact-page-title', usesEnglishFallback: locale === 'es'});
}

const sections = Object.freeze(G3_L8_PAGE_ONLY_CURRENT_JS.sections.map((section) => Object.freeze({
  order: section.order,
  code: section.code,
  activePageCount: section.activePageCount,
  firstActiveAnimationId: section.firstActiveAnimationId,
  labels: Object.freeze({
    en: Object.freeze({text: section.titleEnglish, sourceLanguage: 'en' as const, sourceStatus: 'exact-course-xml' as const, usesEnglishFallback: false}),
    es: Object.freeze({text: section.titleSpanish, sourceLanguage: 'es' as const, sourceStatus: 'exact-course-xml' as const, usesEnglishFallback: false}),
  }),
})));

const pages = Object.freeze(G3_L8_PAGE_ONLY_CURRENT_JS.pages.map((page, index): WholeLessonPlayerPage => Object.freeze({
  placementId: `g03-l08-placement-${String(page.ordinal).padStart(3, '0')}`,
  previousPlacementId: index === 0 ? null : `g03-l08-placement-${String(page.ordinal - 1).padStart(3, '0')}`,
  nextPlacementId: index === G3_L8_PAGE_ONLY_CURRENT_JS.pages.length - 1 ? null : `g03-l08-placement-${String(page.ordinal + 1).padStart(3, '0')}`,
  globalPageOrdinal: page.ordinal,
  sectionPageOrdinal: page.sectionPageOrdinal,
  sectionCode: page.sectionCode,
  animationId: page.animationId,
  previousAnimationId: G3_L8_PAGE_ONLY_CURRENT_JS.pages[index - 1]?.animationId ?? null,
  nextAnimationId: G3_L8_PAGE_ONLY_CURRENT_JS.pages[index + 1]?.animationId ?? null,
  labels: Object.freeze({en: sourceBoundLabel(page.titleEnglish, page.titleSpanish, 'en'), es: sourceBoundLabel(page.titleEnglish, page.titleSpanish, 'es')}),
  rendererAvailability: Object.freeze({
    kind: 'registered' as const,
    moduleKey: page.animationId,
    runtimeQuery: Object.freeze({frameDomain: page.frameDomain, language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'}),
  }),
  runtimeEvidenceBoundary: Object.freeze({runtimeKind: 'source-static-current-js-candidate' as const, actionScriptExecution: 'not-executed' as const, naturalTraceValidation: 'not-established' as const, audioAcceptance: 'not-established' as const, replaySemantics: 'renderer-restart-only-source-behavior-not-established' as const}),
  source: Object.freeze({assetId: page.assetId, sourceOccurrence: page.sourceOccurrence, spanishTitleStatus: page.titleSpanish ? 'exact-subpage-anchor-label' as const : 'missing-page-level-spanish-title' as const}),
})));

export const G3_L8_PAGE_ONLY_COURSE_DESCRIPTOR: PageOnlyLessonPlayerDescriptor = Object.freeze({
  schemaVersion: 2,
  descriptorKind: 'formal-page-only-course',
  descriptorId: 'g3-l8-formal-page-only-course-v1',
  calibrationId: G3_L8_PAGE_ONLY_CURRENT_JS.calibrationId,
  releaseId: G3_L8_PAGE_ONLY_CURRENT_JS.releaseId,
  course: Object.freeze({
    grade: 3,
    lesson: 8,
    href: '/courses/3/8',
    domIdPrefix: 'g3-l8-page-only',
    activePageCount: G3_L8_PAGE_ONLY_CURRENT_JS.course.activePageCount,
    courseShellCount: 0,
    expectedReleaseMemberCount: G3_L8_PAGE_ONLY_CURRENT_JS.course.activePageCount,
    labels: Object.freeze({
      en: Object.freeze({text: G3_L8_PAGE_ONLY_CURRENT_JS.course.title, sourceLanguage: 'en' as const, sourceStatus: 'exact-course-xml' as const, usesEnglishFallback: false}),
      es: Object.freeze({text: G3_L8_PAGE_ONLY_CURRENT_JS.course.title, sourceLanguage: 'en' as const, sourceStatus: 'missing-lesson-level-spanish-title' as const, usesEnglishFallback: true}),
    }),
  }),
  source: Object.freeze({navigationContractPath: 'catalog/page-only-current-js-product-releases.json', sourceXmlPath: G3_L8_PAGE_ONLY_CURRENT_JS.course.sourceXmlPath, sourceXmlSha256: G3_L8_PAGE_ONLY_CURRENT_JS.course.sourceXmlSha256, sequenceAuthority: 'course-xml-occurrence' as const, candidateFreezeManifestPath: G3_L8_PAGE_ONLY_CURRENT_JS.freeze.path, candidateFreezeManifestSha256: G3_L8_PAGE_ONLY_CURRENT_JS.freeze.sha256}),
  persistence: Object.freeze({schemaVersion: 1, storageKey: 'helpmath:g3-l8:page-only-current-js:v1', scope: 'local-device-only' as const, legacyCompatible: false}),
  stage: Object.freeze({width: 800, height: 600}),
  support: Object.freeze({locales: Object.freeze(['en', 'es'] as const), rendererRegistrySnapshot: 'current-javascript-module-registry' as const, lessonHostCapabilities: Object.freeze(['audio'] as const)}),
  visualSkin: Object.freeze({
    kind: 'modern-my-lesson-page-only' as const,
    layoutId: 'help-math-modern-my-lesson-page-only-v1' as const,
    presentations: Object.freeze(['modern-wide'] as const),
    chromeAsset: '' as const,
    header: Object.freeze({height: 0 as const}),
    footer: Object.freeze({height: 0 as const}),
    controls: Object.freeze({kind: 'unresolved-modern-functional-equivalent' as const, reason: MODERN_CONTROL_REASON}),
    evidence: Object.freeze({kind: 'product-owned-modern-my-lesson' as const, calibrationId: G3_L8_PAGE_ONLY_CURRENT_JS.calibrationId}),
  }),
  glossary: Object.freeze([]),
  productBridge: Object.freeze({selectedAnimationIds: Object.freeze(pages.map((page) => page.animationId)), registeredAnimationCount: pages.length, pageOnlyDescriptorMemberCount: pages.length, acceptanceEffects}),
  sections,
  pages,
});
