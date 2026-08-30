import {loadCurrentGrade4CourseCatalogCoverage} from
  './g4-course-catalog-coverage.server';
import {
  G4_L5_PAGE_ONLY_RELEASE_ID,
  G4_L10_PAGE_ONLY_RELEASE_ID,
  G4_L11_PAGE_ONLY_RELEASE_ID,
} from './g4-page-only-release-metadata.generated';
import {
  buildG4L5ProductBridgeDescriptor,
  G4_L5_PRODUCT_FACTORY_SELECTED_ANIMATION_IDS,
} from './g4-l5-product-bridge-descriptor';
import {
  buildG4L10ProductBridgeDescriptor,
  G4_L10_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS,
} from './g4-l10-product-bridge-descriptor';
import {
  buildG4L11MigrationFactoryDescriptor,
  G4_L11_MIGRATION_FACTORY_SELECTED_ANIMATION_IDS,
} from './g4-l11-migration-factory';
import type {
  PageOnlyLessonGlossaryEntry,
  PageOnlyLessonPlayerDescriptor,
  SourceBoundLabel,
  WholeLessonPlayerPage,
} from './whole-lesson-player-descriptor';

export {
  G4_L5_PAGE_ONLY_RELEASE_ID,
  G4_L10_PAGE_ONLY_RELEASE_ID,
  G4_L11_PAGE_ONLY_RELEASE_ID,
};

const NAVIGATION_CONTRACT_PATH =
  'catalog/page-only-current-js-product-releases.json';
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

function courseLabel(
  text: string,
  locale: 'en' | 'es',
): SourceBoundLabel {
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

function placementId(lesson: number, ordinal: number): string {
  return `g04-l${String(lesson).padStart(2, '0')}-placement-${String(ordinal).padStart(3, '0')}`;
}

function formalCourseParts({
  calibrationId,
  grade,
  lesson,
  pageCount,
  title,
}: {
  calibrationId: string;
  grade: number;
  lesson: number;
  pageCount: number;
  title: string;
}) {
  return Object.freeze({
    course: Object.freeze({
      grade,
      lesson,
      href: `/courses/${grade}/${lesson}`,
      domIdPrefix: `g${grade}-l${lesson}-page-only`,
      activePageCount: pageCount,
      courseShellCount: 0 as const,
      expectedReleaseMemberCount: pageCount,
      labels: Object.freeze({
        en: courseLabel(title, 'en'),
        es: courseLabel(title, 'es'),
      }),
    }),
    persistence: Object.freeze({
      schemaVersion: 1 as const,
      storageKey: `helpmath:g${grade}-l${lesson}:page-only:v1`,
      scope: 'local-device-only' as const,
      legacyCompatible: false as const,
    }),
    stage: Object.freeze({width: 800, height: 600}),
    support: Object.freeze({
      locales: Object.freeze(['en', 'es'] as const),
      rendererRegistrySnapshot:
        'current-javascript-module-registry' as const,
      lessonHostCapabilities: Object.freeze([
        'audio',
        'glossary',
        'practice-feedback',
      ] as const),
    }),
    visualSkin: Object.freeze({
      kind: 'modern-my-lesson-page-only' as const,
      layoutId: 'help-math-modern-my-lesson-page-only-v1' as const,
      presentations: Object.freeze(['modern-wide'] as const),
      chromeAsset: '' as const,
      header: Object.freeze({height: 0 as const}),
      footer: Object.freeze({height: 0 as const}),
      controls: Object.freeze({
        kind: 'unresolved-modern-functional-equivalent' as const,
        reason: MODERN_CONTROL_REASON,
      }),
      evidence: Object.freeze({
        kind: 'product-owned-modern-my-lesson' as const,
        calibrationId,
      }),
    }),
  });
}

function withPlacementIdentity(
  lesson: number,
  pages: readonly WholeLessonPlayerPage[],
): readonly WholeLessonPlayerPage[] {
  return Object.freeze(pages.map((page, index) => Object.freeze({
    ...page,
    placementId: placementId(lesson, index + 1),
    previousPlacementId: index === 0
      ? null
      : placementId(lesson, index),
    nextPlacementId: index === pages.length - 1
      ? null
      : placementId(lesson, index + 2),
  })));
}

const coverage = loadCurrentGrade4CourseCatalogCoverage();
const l5Private = buildG4L5ProductBridgeDescriptor(coverage);
const l10Private = buildG4L10ProductBridgeDescriptor(coverage);
const l11Private = buildG4L11MigrationFactoryDescriptor(coverage);

const l5Glossary: readonly PageOnlyLessonGlossaryEntry[] = Object.freeze(
  l5Private.glossary.map((entry) => Object.freeze({
    ...entry,
    source: Object.freeze({
      en: Object.freeze({...entry.source.en, assetId: 'ELKTEG4.xml' as const}),
      es: Object.freeze({...entry.source.es, assetId: 'ELKTSG4.xml' as const}),
    }),
  })),
);

const l5PreservedProductPages = new Set([
  'course-g04-l05-rw-002',
  'course-g04-l05-vb-008',
  'course-g04-l05-in-013',
  'course-g04-l05-ti-002',
  'course-g04-l05-gs-003',
  'course-g04-l05-fq-002',
]);

const l5Pages = withPlacementIdentity(
  5,
  l5Private.pages.map((page, index): WholeLessonPlayerPage => {
    if (page.candidate.status !== 'private-current-js') {
      throw new Error(`${page.animationId} is outside the frozen G4 L5 Current-JS set`);
    }
    return Object.freeze({
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      animationId: page.animationId,
      previousAnimationId: l5Private.pages[index - 1]?.animationId ?? null,
      nextAnimationId: l5Private.pages[index + 1]?.animationId ?? null,
      labels: page.labels,
      rendererAvailability: Object.freeze({
        kind: 'registered' as const,
        moduleKey: page.candidate.moduleKey,
        runtimeQuery: Object.freeze({
          frameDomain: page.candidate.frameDomain,
          language: 'route-locale' as const,
          scenario: l5PreservedProductPages.has(page.animationId)
            ? 'product-candidate'
            : 'source-static-frame',
          seed: '0',
        }),
      }),
      source: Object.freeze({
        assetId: page.source.assetId,
        sourceOccurrence: page.source.sourceOccurrence,
      }),
    });
  }),
);

const l5Common = formalCourseParts({
  calibrationId: l5Private.calibrationId,
  grade: 4,
  lesson: 5,
  pageCount: 53,
  title: l5Private.course.title,
});

export const G4_L5_PAGE_ONLY_COURSE_DESCRIPTOR:
PageOnlyLessonPlayerDescriptor = Object.freeze({
  schemaVersion: 2,
  descriptorKind: 'formal-page-only-course',
  descriptorId: 'g4-l5-formal-page-only-course-v1',
  calibrationId: l5Private.calibrationId,
  releaseId: G4_L5_PAGE_ONLY_RELEASE_ID,
  ...l5Common,
  source: Object.freeze({
    navigationContractPath: NAVIGATION_CONTRACT_PATH,
    ...l5Private.source,
  }),
  glossary: l5Glossary,
  productBridge: Object.freeze({
    selectedAnimationIds: G4_L5_PRODUCT_FACTORY_SELECTED_ANIMATION_IDS,
    registeredAnimationCount: 53,
    pageOnlyDescriptorMemberCount: 53,
    acceptanceEffects,
  }),
  sections: Object.freeze(l5Private.sections.map((section) => Object.freeze({
    ...section,
    firstActiveAnimationId: l5Private.pages.find(
      (page) => page.sectionCode === section.code,
    )!.animationId,
  }))),
  pages: l5Pages,
});

const l10Common = formalCourseParts({
  calibrationId: l10Private.calibrationId,
  grade: 4,
  lesson: 10,
  pageCount: 46,
  title: l10Private.course.labels.en.text,
});

export const G4_L10_PAGE_ONLY_COURSE_DESCRIPTOR:
PageOnlyLessonPlayerDescriptor = Object.freeze({
  ...l10Private,
  descriptorKind: 'formal-page-only-course',
  descriptorId: 'g4-l10-formal-page-only-course-v1',
  releaseId: G4_L10_PAGE_ONLY_RELEASE_ID,
  ...l10Common,
  source: Object.freeze({
    ...l10Private.source,
    navigationContractPath: NAVIGATION_CONTRACT_PATH,
  }),
  productBridge: Object.freeze({
    ...l10Private.productBridge,
    selectedAnimationIds: G4_L10_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS,
    acceptanceEffects,
  }),
  pages: withPlacementIdentity(10, l10Private.pages),
});

const l11Common = formalCourseParts({
  calibrationId: l11Private.calibrationId,
  grade: 4,
  lesson: 11,
  pageCount: 43,
  title: l11Private.course.title,
});

export const G4_L11_PAGE_ONLY_COURSE_DESCRIPTOR:
PageOnlyLessonPlayerDescriptor = Object.freeze({
  schemaVersion: 2,
  descriptorKind: 'formal-page-only-course',
  descriptorId: 'g4-l11-formal-page-only-course-v1',
  calibrationId: l11Private.calibrationId,
  releaseId: G4_L11_PAGE_ONLY_RELEASE_ID,
  ...l11Common,
  source: Object.freeze({
    navigationContractPath: NAVIGATION_CONTRACT_PATH,
    ...l11Private.source,
  }),
  glossary: Object.freeze([]),
  productBridge: Object.freeze({
    selectedAnimationIds: G4_L11_MIGRATION_FACTORY_SELECTED_ANIMATION_IDS,
    registeredAnimationCount: 43,
    pageOnlyDescriptorMemberCount: 43,
    acceptanceEffects,
  }),
  sections: l11Private.sections,
  pages: withPlacementIdentity(11, l11Private.pages),
});

export const G4_PAGE_ONLY_COURSE_DESCRIPTORS = Object.freeze([
  G4_L5_PAGE_ONLY_COURSE_DESCRIPTOR,
  G4_L10_PAGE_ONLY_COURSE_DESCRIPTOR,
  G4_L11_PAGE_ONLY_COURSE_DESCRIPTOR,
]);
