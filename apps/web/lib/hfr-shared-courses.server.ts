import {animationModuleRegistration} from '@helpmath/demos/animation-registry-metadata';

import {
  HFR_NMS002_L07_COURSE,
  HFR_NMS002_L07_RELEASE_NAVIGATION,
} from './hfr/nms002-l07.generated';
import {
  descriptorPagesAreRunnable,
  type WholeLessonCourseRegistration,
} from './whole-lesson-course-registry';
import type {
  PageOnlyLessonNavigationBinding,
  PageOnlyLessonPlayerDescriptor,
  SourceBoundLabel,
  WholeLessonPlayerPage,
} from './whole-lesson-player-descriptor';

/**
 * Local-preview registrations for shared middle-school lessons converted by
 * HFR (pages translated from ActionScript into generated TypeScript). These
 * never join the G3–G5 registrations, carry no release or acceptance
 * authority, and are reachable only through the HFR preview gate.
 *
 * The course grade mapping is pending, so routes and labels use the shared
 * scope (`/courses/shared/<module>/<lesson>`) instead of claiming a grade.
 */

type HfrCourseFacts = typeof HFR_NMS002_L07_COURSE;
type HfrReleaseNavigation = typeof HFR_NMS002_L07_RELEASE_NAVIGATION;

const SCOPE_FLOOR_GRADE = 6;
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
} as const);

function englishLabel(text: string, locale: 'en' | 'es', missing: SourceBoundLabel['sourceStatus']): SourceBoundLabel {
  return Object.freeze({
    text,
    sourceLanguage: 'en' as const,
    sourceStatus: locale === 'es' ? missing : 'exact-course-xml',
    usesEnglishFallback: locale === 'es',
  });
}

function hfrCourseDescriptor(course: HfrCourseFacts): PageOnlyLessonPlayerDescriptor {
  const moduleSlug = course.moduleCode.toLowerCase();
  const prefix = `shared-${moduleSlug}-l${String(course.lesson).padStart(2, '0')}`;
  const pages = course.pages.map((page, index): WholeLessonPlayerPage => Object.freeze({
    placementId: page.placementId,
    previousPlacementId: course.pages[index - 1]?.placementId ?? null,
    nextPlacementId: course.pages[index + 1]?.placementId ?? null,
    globalPageOrdinal: index + 1,
    sectionPageOrdinal: page.sectionPageOrdinal,
    sectionCode: page.sectionCode,
    animationId: page.animationId,
    previousAnimationId: course.pages[index - 1]?.animationId ?? null,
    nextAnimationId: course.pages[index + 1]?.animationId ?? null,
    labels: Object.freeze({
      en: Object.freeze({
        text: page.titleEnglish,
        sourceLanguage: 'en' as const,
        sourceStatus: 'exact-page-title-attribute' as const,
        usesEnglishFallback: false,
      }),
      es: Object.freeze({
        text: page.titleEnglish,
        sourceLanguage: 'en' as const,
        sourceStatus: 'missing-page-level-spanish-title' as const,
        usesEnglishFallback: true,
      }),
    }),
    rendererAvailability: Object.freeze({
      kind: 'registered' as const,
      moduleKey: page.animationId,
      runtimeQuery: Object.freeze({
        language: 'fixed-en' as const,
        scenario: 'hfr',
        seed: '0',
      }),
    }),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind: 'hfr-translated-actionscript' as const,
      actionScriptExecution: 'translated-typescript' as const,
      naturalTraceValidation: 'hfr-t0b-equivalent-to-source-bytecode' as const,
      audioAcceptance: 'not-established' as const,
      replaySemantics: 'page-reload-fresh-state-original-runtime-parity-not-established' as const,
    }),
    source: Object.freeze({
      assetId: page.assetId,
      sourceOccurrence: page.sourceOccurrence,
      spanishTitleStatus: 'missing-page-level-spanish-title' as const,
    }),
  }));
  const sections = course.sections.map((section) => {
    // Generated data is `as const`; widen so a lesson without Spanish titles still type-checks.
    const titleSpanish: string | null = section.titleSpanish;
    return Object.freeze({
    order: section.order,
    code: section.code,
    activePageCount: section.activePageCount,
    firstActiveAnimationId: section.firstActiveAnimationId,
    labels: Object.freeze({
      en: Object.freeze({
        text: section.titleEnglish,
        sourceLanguage: 'en' as const,
        sourceStatus: 'exact-course-xml' as const,
        usesEnglishFallback: false,
      }),
      es: titleSpanish
        ? Object.freeze({
            text: titleSpanish,
            sourceLanguage: 'es' as const,
            sourceStatus: 'exact-course-xml' as const,
            usesEnglishFallback: false,
          })
        : englishLabel(section.titleEnglish, 'es', 'missing-spanish-source-label'),
    }),
    });
  });
  return Object.freeze({
    schemaVersion: 2,
    descriptorKind: 'private-page-only-product-bridge',
    descriptorId: `${prefix}-hfr-local-preview-v1`,
    calibrationId: course.calibrationId,
    releaseId: course.releaseId,
    course: Object.freeze({
      grade: SCOPE_FLOOR_GRADE,
      lesson: course.lesson,
      href: `/courses/shared/${moduleSlug}/${course.lesson}`,
      domIdPrefix: `${prefix}-hfr`,
      activePageCount: pages.length,
      courseShellCount: 0,
      expectedReleaseMemberCount: pages.length,
      labels: Object.freeze({
        en: englishLabel(course.title, 'en', 'missing-lesson-level-spanish-title'),
        es: englishLabel(course.title, 'es', 'missing-lesson-level-spanish-title'),
      }),
      moduleCode: course.moduleCode,
      courseKey: course.courseKey,
      gradeScope: 'G6-G8-shared',
    }),
    source: Object.freeze({
      navigationContractPath: 'catalog/g678-page-only-release-manifest.v1.json',
      sourceXmlPath: course.sourceXmlPath,
      sourceXmlSha256: course.sourceXmlSha256,
      sequenceAuthority: 'course-xml-occurrence',
      candidateFreezeManifestPath: course.freeze.path,
      candidateFreezeManifestSha256: course.freeze.sha256,
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey: `helpmath:${prefix}:hfr-local-preview:v1`,
      scope: 'local-device-only',
      legacyCompatible: false,
    }),
    stage: Object.freeze({width: 800, height: 600}),
    support: Object.freeze({
      locales: Object.freeze(['en', 'es'] as const),
      rendererRegistrySnapshot: 'current-javascript-module-registry',
      lessonHostCapabilities: Object.freeze(['audio', 'glossary', 'navigation', 'practice-feedback'] as const),
    }),
    visualSkin: Object.freeze({
      kind: 'modern-my-lesson-page-only',
      layoutId: 'help-math-modern-my-lesson-page-only-v1',
      presentations: Object.freeze(['modern-wide'] as const),
      chromeAsset: '',
      header: Object.freeze({height: 0 as const}),
      footer: Object.freeze({height: 0 as const}),
      controls: Object.freeze({
        kind: 'unresolved-modern-functional-equivalent',
        reason: MODERN_CONTROL_REASON,
      }),
      evidence: Object.freeze({
        kind: 'product-owned-modern-my-lesson',
        calibrationId: course.calibrationId,
      }),
    }),
    glossary: Object.freeze([]),
    productBridge: Object.freeze({
      selectedAnimationIds: Object.freeze(pages.map((page) => page.animationId)),
      registeredAnimationCount: pages.length,
      pageOnlyDescriptorMemberCount: pages.length,
      acceptanceEffects,
    }),
    sections: Object.freeze(sections),
    pages: Object.freeze(pages),
  });
}

/** Navigation from the course-XML release manifest, built independently of the HFR outline. */
function hfrReleaseNavigation(
  course: HfrCourseFacts,
  release: HfrReleaseNavigation,
): PageOnlyLessonNavigationBinding {
  const sectionCounts = new Map<string, number>();
  const pages = release.members.map((member, index) => {
    const sectionPageOrdinal = (sectionCounts.get(member.sectionCode) ?? 0) + 1;
    sectionCounts.set(member.sectionCode, sectionPageOrdinal);
    return Object.freeze({
      placementId: member.placementId,
      animationId: member.animationId,
      assetId: member.assetId,
      globalPageOrdinal: index + 1,
      sectionCode: member.sectionCode,
      sectionPageOrdinal,
      sourceOccurrence: member.sourceOccurrence,
    });
  });
  return Object.freeze({
    schemaVersion: 2,
    courseShellCount: 0,
    releaseId: course.releaseId,
    grade: SCOPE_FLOOR_GRADE,
    lesson: course.lesson,
    expectedMemberCount: pages.length,
    activePageCount: pages.length,
    pages: Object.freeze(pages),
  });
}

function hfrRegistration(
  descriptor: PageOnlyLessonPlayerDescriptor,
): WholeLessonCourseRegistration | undefined {
  const {courseKey, href, lesson, moduleCode} = descriptor.course;
  const moduleSlug = moduleCode?.toLowerCase() ?? '';
  const valid = /^(nms002|geo001|alg001|dat001)$/u.test(moduleSlug) &&
    courseKey === `shared-${moduleSlug}-l${String(lesson).padStart(2, '0')}` &&
    href === `/courses/shared/${moduleSlug}/${lesson}` &&
    descriptor.course.gradeScope === 'G6-G8-shared' &&
    /^[a-f0-9]{64}$/u.test(descriptor.source.sourceXmlSha256) &&
    /^[a-f0-9]{64}$/u.test(descriptor.source.candidateFreezeManifestSha256) &&
    descriptor.pages.every((page, index) =>
      /^swf-[a-f0-9]{64}$/u.test(page.source.assetId ?? '') &&
      page.source.sourceOccurrence === index + 1 &&
      animationModuleRegistration(page.animationId)?.clock === 'renderer') &&
    Object.values(descriptor.productBridge.acceptanceEffects).every((value) => value === false) &&
    descriptorPagesAreRunnable(descriptor);
  return valid
    ? Object.freeze({descriptor, player: Object.freeze({kind: 'descriptor-driven' as const})})
    : undefined;
}

const courses = [
  {course: HFR_NMS002_L07_COURSE, release: HFR_NMS002_L07_RELEASE_NAVIGATION},
].map(({course, release}) => {
  const descriptor = hfrCourseDescriptor(course);
  return {
    courseKey: course.courseKey,
    registration: hfrRegistration(descriptor),
    navigation: hfrReleaseNavigation(course, release),
  };
});

/** Exactly one match or nothing: duplicate course keys close the route. */
export function findHfrSharedCourse(courseKey: string) {
  const matches = courses.filter((entry) => entry.courseKey === courseKey);
  const match = matches.length === 1 ? matches[0] : undefined;
  return match?.registration
    ? {registration: match.registration, navigation: match.navigation}
    : undefined;
}
