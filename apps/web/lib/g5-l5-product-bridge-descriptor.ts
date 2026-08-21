import {hasAnimationModule} from '@helpmath/demos/animation-registry';

import {G5_L5_PRODUCT_BRIDGE_DATA} from './g5-l5-product-bridge-data.generated';
import type {
  PageOnlyLessonPlayerDescriptor,
  SourceBoundLabel,
  WholeLessonPlayerPage,
} from './whole-lesson-player-descriptor';

function courseLabel(locale: 'en' | 'es'): SourceBoundLabel {
  return locale === 'en'
    ? Object.freeze({
        text: G5_L5_PRODUCT_BRIDGE_DATA.course.title,
        sourceLanguage: 'en',
        sourceStatus: 'exact-course-xml',
        usesEnglishFallback: false,
      })
    : Object.freeze({
        text: G5_L5_PRODUCT_BRIDGE_DATA.course.title,
        sourceLanguage: 'en',
        sourceStatus: 'missing-lesson-level-spanish-title',
        usesEnglishFallback: true,
      });
}

function assertCurrentJsRegistration(animationId: string): void {
  if (!hasAnimationModule(animationId)) {
    throw new Error(
      `${animationId} is not bound to the generated Current-JS registry`,
    );
  }
}

export function buildG5L5ProductBridgeDescriptor(): PageOnlyLessonPlayerDescriptor {
  const registeredPages = G5_L5_PRODUCT_BRIDGE_DATA.pages.filter(
    (page) => page.registered,
  );
  registeredPages.forEach((page) =>
    assertCurrentJsRegistration(page.animationId)
  );

  const pages = G5_L5_PRODUCT_BRIDGE_DATA.pages.map(
    (page, index): WholeLessonPlayerPage => Object.freeze({
      placementId:
        `g05-l05-placement-${String(index + 1).padStart(3, '0')}`,
      globalPageOrdinal: page.ordinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      animationId: page.animationId,
      previousAnimationId: index > 0
        ? G5_L5_PRODUCT_BRIDGE_DATA.pages[index - 1]!.animationId
        : null,
      nextAnimationId: index < G5_L5_PRODUCT_BRIDGE_DATA.pages.length - 1
        ? G5_L5_PRODUCT_BRIDGE_DATA.pages[index + 1]!.animationId
        : null,
      labels: Object.freeze({
        en: Object.freeze({
          text: page.titleEnglish,
          sourceLanguage: 'en' as const,
          sourceStatus: 'exact-page-title' as const,
          usesEnglishFallback: false,
        }),
        es: Object.freeze({
          text: page.titleEnglish,
          sourceLanguage: 'en' as const,
          sourceStatus: 'missing-page-level-spanish-title' as const,
          usesEnglishFallback: true,
        }),
      }),
      rendererAvailability: page.registered
        ? Object.freeze({
            kind: 'registered' as const,
            moduleKey: page.animationId,
            runtimeQuery: Object.freeze({
              frameDomain: page.frameDomain,
              language: 'fixed-en' as const,
              scenario: 'source-static-frame',
              seed: '0',
            }),
          })
        : Object.freeze({
            kind: 'unavailable' as const,
            reason: 'outside-current-private-product-bridge-freeze',
          }),
      source: Object.freeze({
        assetId: page.assetId,
        sourceOccurrence: page.sourceOccurrence,
        spanishTitleStatus: 'missing-page-level-spanish-title' as const,
      }),
    }),
  );

  if (pages.length !== 56 || pages.some((page, index) =>
    page.globalPageOrdinal !== index + 1)) {
    throw new Error('G5 L5 page-only descriptor lost its exact 56-page order');
  }

  return Object.freeze({
    schemaVersion: 2,
    descriptorKind: 'formal-page-only-course',
    descriptorId: 'whole-lesson-player-g05-l05-page-only-v1',
    calibrationId: G5_L5_PRODUCT_BRIDGE_DATA.calibrationId,
    releaseId: G5_L5_PRODUCT_BRIDGE_DATA.releaseId,
    course: Object.freeze({
      grade: 5,
      lesson: 5,
      href: '/courses/5/5',
      domIdPrefix: 'g5-l5',
      activePageCount: 56,
      courseShellCount: 0,
      expectedReleaseMemberCount: 56,
      labels: Object.freeze({en: courseLabel('en'), es: courseLabel('es')}),
    }),
    source: Object.freeze({
      navigationContractPath:
        'apps/web/lib/g5-l5-product-bridge-data.generated.ts',
      sourceXmlPath: G5_L5_PRODUCT_BRIDGE_DATA.course.sourceXmlPath,
      sourceXmlSha256: G5_L5_PRODUCT_BRIDGE_DATA.course.sourceXmlSha256,
      sequenceAuthority: 'course-xml-occurrence',
      candidateFreezeManifestPath: G5_L5_PRODUCT_BRIDGE_DATA.freeze.path,
      candidateFreezeManifestSha256: G5_L5_PRODUCT_BRIDGE_DATA.freeze.sha256,
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey: 'helpmath:g5-l5:page-only-current-js:v1',
      scope: 'local-device-only',
      legacyCompatible: false,
    }),
    stage: Object.freeze({width: 800, height: 600}),
    support: Object.freeze({
      locales: Object.freeze(['en', 'es'] as const),
      rendererRegistrySnapshot: 'current-javascript-module-registry',
      lessonHostCapabilities: Object.freeze(['audio'] as const),
    }),
    visualSkin: Object.freeze({
      kind: 'modern-my-lesson-page-only',
      layoutId: 'help-math-modern-my-lesson-page-only-v1',
      presentations: Object.freeze(['modern-wide'] as const),
      chromeAsset: '' as const,
      header: Object.freeze({height: 0 as const}),
      footer: Object.freeze({height: 0 as const}),
      controls: Object.freeze({
        kind: 'unresolved-modern-functional-equivalent',
        reason: 'The retained modern My Lesson host owns navigation and playback controls; the excluded legacy Flash course shell is not a migration member.',
      }),
      evidence: Object.freeze({
        kind: 'product-owned-modern-my-lesson',
        calibrationId: G5_L5_PRODUCT_BRIDGE_DATA.calibrationId,
      }),
    }),
    glossary: Object.freeze([]),
    productBridge: Object.freeze({
      selectedAnimationIds: Object.freeze(
        registeredPages.map((page) => page.animationId),
      ),
      registeredAnimationCount: registeredPages.length,
      pageOnlyDescriptorMemberCount: 56,
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
    sections: G5_L5_PRODUCT_BRIDGE_DATA.sections,
    pages: Object.freeze(pages),
  });
}

export const G5_L5_PRODUCT_BRIDGE_DESCRIPTOR =
  buildG5L5ProductBridgeDescriptor();
