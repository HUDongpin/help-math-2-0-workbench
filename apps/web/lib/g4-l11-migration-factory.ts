import {
  animationModuleRegistration,
  hasAnimationModule,
} from '@helpmath/demos/animation-registry';

import type {
  Grade4CourseCatalogCoverage,
  Grade4CourseCoverageLesson,
} from './g4-course-catalog-coverage';
import type {
  SourceBoundLabel,
  WholeLessonPlayerPage,
  WholeLessonPlayerSection,
} from './whole-lesson-player-descriptor';
import {G4_L11_PAGE_ONLY_CURRENT_JS} from './g4-l11-page-only-current-js.generated';

export const G4_L11_MIGRATION_FACTORY_CALIBRATION_ID =
  G4_L11_PAGE_ONLY_CURRENT_JS.calibrationId;
export const G4_L11_MIGRATION_FACTORY_FREEZE_PATH =
  G4_L11_PAGE_ONLY_CURRENT_JS.freeze.path;
export const G4_L11_MIGRATION_FACTORY_FREEZE_SHA256 =
  G4_L11_PAGE_ONLY_CURRENT_JS.freeze.sha256;
export const G4_L11_MIGRATION_FACTORY_SELECTED_ANIMATION_IDS = Object.freeze(
  G4_L11_PAGE_ONLY_CURRENT_JS.pages.map((page) => page.animationId),
);

const currentJsPages = new Map(
  G4_L11_PAGE_ONLY_CURRENT_JS.pages.map((page) => [page.animationId, page]),
);

export interface G4L11MigrationFactoryDescriptor {
  readonly schemaVersion: 2;
  readonly descriptorKind: 'private-page-only-migration-factory';
  readonly descriptorId: 'g4-l11-private-page-only-current-js-v2';
  readonly calibrationId: typeof G4_L11_MIGRATION_FACTORY_CALIBRATION_ID;
  readonly course: Readonly<{
    grade: 4;
    lesson: 11;
    title: string;
    href: '/migration-status/g4-l11-migration-factory';
    activePageCount: 43;
    courseShellCount: 0;
    labels: Readonly<Record<'en' | 'es', SourceBoundLabel>>;
  }>;
  readonly source: Readonly<{
    sourceXmlPath: string;
    sourceXmlSha256: string;
    sequenceAuthority: 'course-xml-occurrence';
    candidateFreezeManifestPath: typeof G4_L11_MIGRATION_FACTORY_FREEZE_PATH;
    candidateFreezeManifestSha256: typeof G4_L11_MIGRATION_FACTORY_FREEZE_SHA256;
  }>;
  readonly factory: Readonly<{
    sourceLockedPageCount: 43;
    sourceStaticPageCount: 42;
    exactCandidateModulePageCount: 43;
    privateProductBridgePageCount: 43;
    scaleOutDecision: 'PAGE_ONLY_CURRENT_JS_COMPLETE';
    scaleOutBlockers: readonly string[];
  }>;
  readonly sections: readonly WholeLessonPlayerSection[];
  readonly pages: readonly WholeLessonPlayerPage[];
  readonly acceptanceEffects: Readonly<{
    authoritativeOriginalRuntime: false;
    visualFidelityAccepted: false;
    behaviorParityAccepted: false;
    audioAccepted: false;
    humanVisualAccepted: false;
    ownerAccepted: false;
    strictComplete: false;
    releaseAuthorized: false;
    published: false;
  }>;
}

function courseLabel(text: string, locale: 'en' | 'es'): SourceBoundLabel {
  return locale === 'en'
    ? Object.freeze({
        text,
        sourceLanguage: 'en',
        sourceStatus: 'exact-course-xml',
        usesEnglishFallback: false,
      })
    : Object.freeze({
        text,
        sourceLanguage: 'en',
        sourceStatus: 'missing-lesson-level-spanish-title',
        usesEnglishFallback: true,
      });
}

function lessonEleven(
  coverage: Grade4CourseCatalogCoverage,
): Grade4CourseCoverageLesson {
  if (coverage.status !== 'valid') {
    throw new Error(
      `Cannot build the G4 L11 factory from invalid catalog coverage: ${coverage.diagnostics.join('; ')}`,
    );
  }
  const lesson = coverage.lessons.find((candidate) => candidate.lesson === 11);
  if (!lesson) throw new Error('Grade 4 Lesson 11 is absent from catalog coverage');
  if (
    lesson.counts.activePages !== 43 ||
    lesson.pages.length !== 43 ||
    !lesson.readiness.sourceCoverageComplete ||
    lesson.counts.catalogResolvedPages !== 43
  ) {
    throw new Error('G4 L11 page-only source coverage must remain exactly 43/43');
  }
  return lesson;
}

function assertPrivateRegistration(animationId: string): void {
  const registration = animationModuleRegistration(animationId);
  if (
    !hasAnimationModule(animationId) ||
    registration?.scope !== 'private-engineering' ||
    registration.maturity !== 'private-current-js' ||
    registration.calibrationId !== G4_L11_MIGRATION_FACTORY_CALIBRATION_ID
  ) {
    throw new Error(
      `${animationId} is not bound to the frozen G4 L11 private factory registry`,
    );
  }
}

export function buildG4L11MigrationFactoryDescriptor(
  coverage: Grade4CourseCatalogCoverage,
): G4L11MigrationFactoryDescriptor {
  const lesson = lessonEleven(coverage);
  G4_L11_MIGRATION_FACTORY_SELECTED_ANIMATION_IDS.forEach(
    assertPrivateRegistration,
  );
  const pages = lesson.pages.map((page, index): WholeLessonPlayerPage => {
    const animationId = page.source.animationId;
    if (!animationId || !page.source.assetId || !page.source.swfSha256) {
      throw new Error(
        `G4 L11 page ${page.globalPageOrdinal} lost canonical source identity`,
      );
    }
    const selected = currentJsPages.get(
      animationId as (typeof G4_L11_PAGE_ONLY_CURRENT_JS.pages)[number]['animationId'],
    );
    if (!selected) {
      throw new Error(`${animationId} is outside the frozen 43-page Current-JS set`);
    }
    return Object.freeze({
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      animationId,
      previousAnimationId: index > 0
        ? lesson.pages[index - 1]!.source.animationId
        : null,
      nextAnimationId: index < lesson.pages.length - 1
        ? lesson.pages[index + 1]!.source.animationId
        : null,
      labels: page.labels,
      rendererAvailability: Object.freeze({
        kind: 'registered' as const,
        moduleKey: animationId,
        runtimeQuery: Object.freeze({
          frameDomain: selected.frameDomain,
          language: [
            'course-g04-l11-in-010',
            'course-g04-l11-ts-002',
          ].includes(animationId)
            ? 'route-locale' as const
            : 'fixed-en' as const,
          seed: '0',
        }),
      }),
      presentation: animationId === 'course-g04-l11-in-010'
        ? Object.freeze({
            pageInteractionCompanionTargetIdSuffix: 'in010-point-choice',
          })
        : undefined,
      source: Object.freeze({
        assetId: page.source.assetId,
        sourceOccurrence: page.source.sourceOccurrence,
      }),
    });
  });
  const selectedInSourceOrder = pages.filter(
    (page) => page.rendererAvailability.kind === 'registered',
  );
  if (
    selectedInSourceOrder.length !== 43 ||
    selectedInSourceOrder.map(({animationId}) => animationId).join('\n') !==
      G4_L11_MIGRATION_FACTORY_SELECTED_ANIMATION_IDS.join('\n')
  ) {
    throw new Error('The frozen G4 L11 pages no longer follow the exact 43-page XML order');
  }

  return Object.freeze({
    schemaVersion: 2,
    descriptorKind: 'private-page-only-migration-factory',
    descriptorId: 'g4-l11-private-page-only-current-js-v2',
    calibrationId: G4_L11_MIGRATION_FACTORY_CALIBRATION_ID,
    course: Object.freeze({
      grade: 4,
      lesson: 11,
      title: lesson.titleEnglish,
      href: '/migration-status/g4-l11-migration-factory',
      activePageCount: 43,
      courseShellCount: 0,
      labels: Object.freeze({
        en: courseLabel(lesson.titleEnglish, 'en'),
        es: courseLabel(lesson.titleEnglish, 'es'),
      }),
    }),
    source: Object.freeze({
      sourceXmlPath: lesson.source.lessonXmlPath,
      sourceXmlSha256: lesson.source.lessonXmlSha256,
      sequenceAuthority: 'course-xml-occurrence',
      candidateFreezeManifestPath: G4_L11_MIGRATION_FACTORY_FREEZE_PATH,
      candidateFreezeManifestSha256: G4_L11_MIGRATION_FACTORY_FREEZE_SHA256,
    }),
    factory: Object.freeze({
      sourceLockedPageCount: 43,
      sourceStaticPageCount: 42,
      exactCandidateModulePageCount: 43,
      privateProductBridgePageCount: 43,
      scaleOutDecision: 'PAGE_ONLY_CURRENT_JS_COMPLETE',
      scaleOutBlockers: Object.freeze([]),
    }),
    sections: Object.freeze(lesson.sections.map((section) => Object.freeze({
      order: section.order,
      code: section.code,
      activePageCount: section.activePageCount,
      firstActiveAnimationId: lesson.pages.find(
        (page) => page.sectionCode === section.code,
      )!.source.animationId!,
      labels: section.labels,
    }))),
    pages: Object.freeze(pages),
    acceptanceEffects: Object.freeze({
      authoritativeOriginalRuntime: false,
      visualFidelityAccepted: false,
      behaviorParityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      releaseAuthorized: false,
      published: false,
    }),
  });
}
