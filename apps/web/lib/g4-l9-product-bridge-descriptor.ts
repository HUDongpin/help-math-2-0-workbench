import {
  animationModuleRegistration,
  hasAnimationModule,
} from '@helpmath/demos/animation-registry';

import type {
  Grade4CourseCatalogCoverage,
  Grade4CourseCoverageLesson,
} from './g4-course-catalog-coverage';
import {G4_L9_P4_REPRESENTATIVE_SLICE} from './g4-l9-p4-representative-slice.generated';
import {G4_L9_P5_F08_OCCURRENCE_32_STRESS} from './g4-l9-p5-f08-occurrence-32-stress.generated';
import type {
  PageOnlyLessonGlossaryEntry,
  PageOnlyLessonPlayerDescriptor,
  SourceBoundLabel,
  WholeLessonPlayerPage,
} from './whole-lesson-player-descriptor';

export const G4_L9_PRODUCT_BRIDGE_CALIBRATION_ID =
  G4_L9_P5_F08_OCCURRENCE_32_STRESS.calibrationId;
export const G4_L9_P4_PRODUCT_BRIDGE_CALIBRATION_ID =
  G4_L9_P4_REPRESENTATIVE_SLICE.calibrationId;
export const G4_L9_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS = Object.freeze(
  G4_L9_P4_REPRESENTATIVE_SLICE.pages
    .filter((page) =>
      page.registered ||
      page.sourceOccurrence ===
        G4_L9_P5_F08_OCCURRENCE_32_STRESS.page.sourceOccurrence,
    )
    .map((page) => page.animationId),
);

const glossary =
  G4_L9_P5_F08_OCCURRENCE_32_STRESS.glossary.entries as
    readonly PageOnlyLessonGlossaryEntry[];

function lessonNine(
  coverage: Grade4CourseCatalogCoverage,
): Grade4CourseCoverageLesson {
  const lesson = coverage.lessons.find((item) => item.lesson === 9);
  if (
    !lesson ||
    lesson.counts.activePages !== 43 ||
    lesson.pages.length !== 43 ||
    lesson.source.lessonXmlSha256 !== G4_L9_P4_REPRESENTATIVE_SLICE.sourceXml.sha256
  ) {
    throw new Error('G4 L9 canonical 43-page schema-2 coverage drifted');
  }
  return lesson;
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

function assertPrivateRegistration(animationId: string): void {
  const registration = animationModuleRegistration(animationId);
  const expectedCalibration = animationId ===
    G4_L9_P5_F08_OCCURRENCE_32_STRESS.page.animationId
    ? G4_L9_P5_F08_OCCURRENCE_32_STRESS.calibrationId
    : G4_L9_P4_REPRESENTATIVE_SLICE.calibrationId;
  if (
    !hasAnimationModule(animationId) ||
    registration?.maturity !== 'private-current-js' ||
    registration.scope !== 'private-engineering' ||
    registration.calibrationId !== expectedCalibration
  ) {
    throw new Error(
      `${animationId} is not bound to its frozen G4 L9 private calibration`,
    );
  }
}

export function buildG4L9ProductBridgeDescriptor(
  coverage: Grade4CourseCatalogCoverage,
): PageOnlyLessonPlayerDescriptor {
  const lesson = lessonNine(coverage);
  G4_L9_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS.forEach(assertPrivateRegistration);
  const frozenByOccurrence = new Map<number, (typeof G4_L9_P4_REPRESENTATIVE_SLICE.pages)[number]>(
    G4_L9_P4_REPRESENTATIVE_SLICE.pages.map((page) => [page.sourceOccurrence, page]),
  );
  const pages = lesson.pages.map((page, index): WholeLessonPlayerPage => {
    const frozen = frozenByOccurrence.get(page.source.sourceOccurrence);
    const animationId = page.source.animationId;
    if (
      !frozen ||
      !animationId ||
      animationId !== frozen.animationId ||
      page.source.assetId !== frozen.assetId ||
      page.source.swfSha256 !== frozen.sourceSwfSha256
    ) {
      throw new Error(`G4 L9 source identity drift at occurrence ${page.source.sourceOccurrence}`);
    }
    const isP5Occurrence = frozen.sourceOccurrence ===
      G4_L9_P5_F08_OCCURRENCE_32_STRESS.page.sourceOccurrence;
    if (
      isP5Occurrence &&
      (
        animationId !== G4_L9_P5_F08_OCCURRENCE_32_STRESS.page.animationId ||
        frozen.placementId !==
          G4_L9_P5_F08_OCCURRENCE_32_STRESS.page.placementId ||
        frozen.assetId !== G4_L9_P5_F08_OCCURRENCE_32_STRESS.page.assetId ||
        frozen.sourceSwfSha256 !==
          G4_L9_P5_F08_OCCURRENCE_32_STRESS.page.sourceSwfSha256
      )
    ) {
      throw new Error('G4 L9 P5 occurrence-32 source identity drifted');
    }
    const registered = frozen.registered || isP5Occurrence;
    return Object.freeze({
      placementId: frozen.placementId,
      previousPlacementId: index > 0
        ? G4_L9_P4_REPRESENTATIVE_SLICE.pages[index - 1]!.placementId
        : null,
      nextPlacementId: index < lesson.pages.length - 1
        ? G4_L9_P4_REPRESENTATIVE_SLICE.pages[index + 1]!.placementId
        : null,
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      animationId,
      previousAnimationId: index > 0 ? lesson.pages[index - 1]!.source.animationId : null,
      nextAnimationId: index < lesson.pages.length - 1
        ? lesson.pages[index + 1]!.source.animationId
        : null,
      labels: page.labels,
      rendererAvailability: registered
        ? Object.freeze({
            kind: 'registered' as const,
            moduleKey: animationId,
            runtimeQuery: Object.freeze({
              frameDomain: isP5Occurrence
                ? G4_L9_P5_F08_OCCURRENCE_32_STRESS.page.frameDomain
                : frozen.frameDomain,
              language: 'fixed-en' as const,
              replaySeedCycle: animationId === 'course-g04-l09-gs-002' ? 10 : 7,
              scenario: isP5Occurrence
                ? G4_L9_P5_F08_OCCURRENCE_32_STRESS.page.scenario
                : animationId === 'course-g04-l09-gs-002'
                  ? 'gs002-advanced-product'
                  : 'p4-product-behavior',
              seed: '4092026',
            }),
          })
        : Object.freeze({
            kind: 'unavailable' as const,
            reason: 'outside-frozen-g4-l9-p4-plus-p5-bounded-admissions',
          }),
      runtimeEvidenceBoundary: registered
        ? Object.freeze({
            runtimeKind: 'source-script-bound-product-behavior-current-js-candidate' as const,
            actionScriptExecution: 'not-executed' as const,
            naturalTraceValidation: 'not-established' as const,
            audioAcceptance: 'not-established' as const,
            replaySemantics: 'product-complete-state-reset-original-runtime-parity-not-established' as const,
            productBehavior: 'maintained-javascript-state-machine-implemented' as const,
            productVisualBehaviorComposite: 'not-established' as const,
          })
        : undefined,
      source: Object.freeze({
        assetId: page.source.assetId,
        sourceOccurrence: page.source.sourceOccurrence,
      }),
    });
  });

  const selectedInSourceOrder = pages
    .filter((page) => page.rendererAvailability.kind === 'registered')
    .map((page) => page.animationId);
  if (
    selectedInSourceOrder.join('\n') !==
    G4_L9_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS.join('\n')
  ) {
    throw new Error('G4 L9 frozen selection no longer occupies exact course-XML source order');
  }

  return Object.freeze({
    schemaVersion: 2,
    descriptorKind: 'private-page-only-product-bridge',
    descriptorId: G4_L9_P5_F08_OCCURRENCE_32_STRESS.descriptorId,
    calibrationId: G4_L9_PRODUCT_BRIDGE_CALIBRATION_ID,
    releaseId: G4_L9_P5_F08_OCCURRENCE_32_STRESS.releaseId,
    course: Object.freeze({
      grade: 4,
      lesson: 9,
      href: '/migration-status/g4-l9-product-bridge',
      domIdPrefix: 'g4-l9-p5-product-bridge',
      activePageCount: 43,
      courseShellCount: 0,
      expectedReleaseMemberCount: 43,
      labels: Object.freeze({
        en: courseLabel(lesson.titleEnglish, 'en'),
        es: courseLabel(lesson.titleEnglish, 'es'),
      }),
    }),
    source: Object.freeze({
      navigationContractPath: 'apps/web/lib/g4-course-catalog-coverage.server.ts',
      sourceXmlPath: lesson.source.lessonXmlPath,
      sourceXmlSha256: lesson.source.lessonXmlSha256,
      sequenceAuthority: 'course-xml-occurrence',
      candidateFreezeManifestPath: G4_L9_P5_F08_OCCURRENCE_32_STRESS.freeze.path,
      candidateFreezeManifestSha256: G4_L9_P5_F08_OCCURRENCE_32_STRESS.freeze.sha256,
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey: 'helpmath:g4-l9-p5-product-bridge:v1',
      scope: 'local-device-only',
      legacyCompatible: false,
    }),
    stage: Object.freeze({width: 800, height: 600}),
    support: Object.freeze({
      locales: Object.freeze(['en', 'es'] as const),
      rendererRegistrySnapshot: 'current-javascript-module-registry',
      lessonHostCapabilities: Object.freeze([
        'audio',
        'glossary',
        'navigation',
        'fq-scoring',
        'practice-feedback',
      ] as const),
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
        reason: 'The retained modern My Lesson host owns navigation, Replay, audio, progress, and support controls; the excluded legacy Flash course shell is not a member.',
      }),
      evidence: Object.freeze({
        kind: 'product-owned-modern-my-lesson',
        calibrationId: G4_L9_PRODUCT_BRIDGE_CALIBRATION_ID,
      }),
    }),
    glossary,
    productBridge: Object.freeze({
      selectedAnimationIds: G4_L9_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS,
      registeredAnimationCount: 15,
      pageOnlyDescriptorMemberCount: 43,
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
    sections: Object.freeze(lesson.sections.map((section) => Object.freeze({
      order: section.order,
      code: section.code,
      activePageCount: section.activePageCount,
      firstActiveAnimationId: lesson.pages.find(
        (page) => page.sourceKey === section.firstActiveSourceKey,
      )?.source.animationId ?? (() => {
        throw new Error(`G4 L9 section ${section.code} lost its first active page`);
      })(),
      labels: section.labels,
    }))),
    pages: Object.freeze(pages),
  });
}
