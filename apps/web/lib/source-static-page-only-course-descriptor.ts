import type {
  PageOnlyLessonPlayerDescriptor,
  SourceBoundLabel,
  WholeLessonPlayerPage,
} from './whole-lesson-player-descriptor';

type SourceStaticCurrentJsData = Readonly<{
  calibrationId: string;
  releaseId: string;
  course: Readonly<{
    activePageCount: number;
    courseShellCount: number;
    grade: number;
    lesson: number;
    sourceXmlPath: string;
    sourceXmlSha256: string;
    title: string;
  }>;
  freeze: Readonly<{path: string; sha256: string}>;
  pages: readonly Readonly<{
    animationId: string;
    assetId: string;
    frameDomain: string;
    ordinal: number;
    sectionCode: string;
    sectionPageOrdinal: number;
    sourceOccurrence: number;
    titleEnglish: string;
    titleSpanish: string | null;
  }>[];
  sections: readonly Readonly<{
    activePageCount: number;
    code: string;
    firstActiveAnimationId: string;
    order: number;
    titleEnglish: string;
    titleSpanish: string;
  }>[];
}>;

const MODERN_CONTROL_REASON =
  'The retained modern My Lesson host owns navigation and playback controls; the excluded legacy Flash course-shell is not a page-only member.';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sourceBoundLabel(
  english: string,
  spanish: string | null,
  locale: 'en' | 'es',
): SourceBoundLabel {
  if (locale === 'es' && spanish) {
    return Object.freeze({
      text: spanish,
      sourceLanguage: 'es',
      sourceStatus: 'exact-page-title',
      usesEnglishFallback: false,
    });
  }
  return Object.freeze({
    text: english,
    sourceLanguage: 'en',
    sourceStatus: locale === 'es'
      ? 'missing-page-level-spanish-title'
      : 'exact-page-title',
    usesEnglishFallback: locale === 'es',
  });
}

export function buildSourceStaticPageOnlyCourseDescriptor(
  data: SourceStaticCurrentJsData,
): PageOnlyLessonPlayerDescriptor {
  const {grade, lesson} = data.course;
  const prefix = `g${grade}-l${lesson}`;
  const placementPrefix =
    `g${String(grade).padStart(2, '0')}-l${String(lesson).padStart(2, '0')}`;
  invariant(Number.isSafeInteger(grade) && grade > 0, 'grade must be positive');
  invariant(Number.isSafeInteger(lesson) && lesson > 0, 'lesson must be positive');
  invariant(data.course.courseShellCount === 0, `${prefix}: legacy shell entered page-only data`);
  invariant(data.course.activePageCount === data.pages.length, `${prefix}: active-page count drifted`);
  invariant(data.sections.reduce((count, section) => count + section.activePageCount, 0) === data.pages.length, `${prefix}: section count drifted`);
  invariant(/^[a-f0-9]{64}$/u.test(data.course.sourceXmlSha256), `${prefix}: source XML SHA drifted`);
  invariant(/^[a-f0-9]{64}$/u.test(data.freeze.sha256), `${prefix}: freeze SHA drifted`);

  const sections = Object.freeze(data.sections.map((section, index) => {
    invariant(section.order === index + 1, `${prefix}: section order drifted`);
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
        es: Object.freeze({
          text: section.titleSpanish,
          sourceLanguage: 'es' as const,
          sourceStatus: 'exact-course-xml' as const,
          usesEnglishFallback: false,
        }),
      }),
    });
  }));

  const pages = Object.freeze(data.pages.map(
    (page, index): WholeLessonPlayerPage => {
      invariant(page.ordinal === index + 1, `${prefix}: page order drifted`);
      invariant(page.sourceOccurrence === index + 1, `${prefix}: source occurrence drifted`);
      invariant(/^swf-[a-f0-9]{64}$/u.test(page.assetId), `${prefix}: asset identity drifted`);
      return Object.freeze({
        placementId:
          `${placementPrefix}-placement-${String(page.ordinal).padStart(3, '0')}`,
        previousPlacementId: index === 0
          ? null
          : `${placementPrefix}-placement-${String(page.ordinal - 1).padStart(3, '0')}`,
        nextPlacementId: index === data.pages.length - 1
          ? null
          : `${placementPrefix}-placement-${String(page.ordinal + 1).padStart(3, '0')}`,
        globalPageOrdinal: page.ordinal,
        sectionPageOrdinal: page.sectionPageOrdinal,
        sectionCode: page.sectionCode,
        animationId: page.animationId,
        previousAnimationId: data.pages[index - 1]?.animationId ?? null,
        nextAnimationId: data.pages[index + 1]?.animationId ?? null,
        labels: Object.freeze({
          en: sourceBoundLabel(page.titleEnglish, page.titleSpanish, 'en'),
          es: sourceBoundLabel(page.titleEnglish, page.titleSpanish, 'es'),
        }),
        rendererAvailability: Object.freeze({
          kind: 'registered' as const,
          moduleKey: page.animationId,
          runtimeQuery: Object.freeze({
            frameDomain: page.frameDomain,
            language: 'fixed-en' as const,
            scenario: 'source-static-frame',
            seed: '0',
          }),
        }),
        runtimeEvidenceBoundary: Object.freeze({
          runtimeKind: 'source-static-current-js-candidate' as const,
          actionScriptExecution: 'not-executed' as const,
          naturalTraceValidation: 'not-established' as const,
          audioAcceptance: 'not-established' as const,
          replaySemantics:
            'renderer-restart-only-source-behavior-not-established' as const,
        }),
        source: Object.freeze({
          assetId: page.assetId,
          sourceOccurrence: page.sourceOccurrence,
          spanishTitleStatus: page.titleSpanish
            ? 'exact-subpage-anchor-label' as const
            : 'missing-page-level-spanish-title' as const,
        }),
      });
    },
  ));

  const acceptanceEffects = Object.freeze({
    authoritativeOriginalRuntime: false,
    fidelityAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    published: false,
  });

  return Object.freeze({
    schemaVersion: 2,
    descriptorKind: 'formal-page-only-course',
    descriptorId: `${prefix}-formal-page-only-course-v1`,
    calibrationId: data.calibrationId,
    releaseId: data.releaseId,
    course: Object.freeze({
      grade,
      lesson,
      href: `/courses/${grade}/${lesson}`,
      domIdPrefix: `${prefix}-page-only`,
      activePageCount: data.course.activePageCount,
      courseShellCount: 0,
      expectedReleaseMemberCount: data.course.activePageCount,
      labels: Object.freeze({
        en: Object.freeze({
          text: data.course.title,
          sourceLanguage: 'en' as const,
          sourceStatus: 'exact-course-xml' as const,
          usesEnglishFallback: false,
        }),
        es: Object.freeze({
          text: data.course.title,
          sourceLanguage: 'en' as const,
          sourceStatus: 'missing-lesson-level-spanish-title' as const,
          usesEnglishFallback: true,
        }),
      }),
    }),
    source: Object.freeze({
      navigationContractPath:
        'catalog/page-only-current-js-product-releases.json',
      sourceXmlPath: data.course.sourceXmlPath,
      sourceXmlSha256: data.course.sourceXmlSha256,
      sequenceAuthority: 'course-xml-occurrence' as const,
      candidateFreezeManifestPath: data.freeze.path,
      candidateFreezeManifestSha256: data.freeze.sha256,
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey: `helpmath:${prefix}:page-only-current-js:v1`,
      scope: 'local-device-only' as const,
      legacyCompatible: false,
    }),
    stage: Object.freeze({width: 800, height: 600}),
    support: Object.freeze({
      locales: Object.freeze(['en', 'es'] as const),
      rendererRegistrySnapshot: 'current-javascript-module-registry' as const,
      lessonHostCapabilities: Object.freeze(['audio'] as const),
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
        calibrationId: data.calibrationId,
      }),
    }),
    glossary: Object.freeze([]),
    productBridge: Object.freeze({
      selectedAnimationIds: Object.freeze(
        pages.map((page) => page.animationId),
      ),
      registeredAnimationCount: pages.length,
      pageOnlyDescriptorMemberCount: pages.length,
      acceptanceEffects,
    }),
    sections,
    pages,
  });
}
