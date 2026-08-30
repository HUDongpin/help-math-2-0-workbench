import {hasAnimationModule} from '@helpmath/demos/animation-registry';

import animationsCatalogDocument from '../../../catalog/animations.json' with {type: 'json'};
import lessonsCatalogDocument from '../../../catalog/lessons.json' with {type: 'json'};
import crossGradeAuditDocument from '../../../reports/g3-l2-cross-grade-factory-audit.json' with {type: 'json'};
import type {
  PageOnlyLessonPlayerDescriptor,
  SourceBoundLabel,
} from './whole-lesson-player-descriptor';

const RELEASE_ID =
  'lesson-g03-l02-addition-subtraction-page-only-current-js';
const SOURCE_XML_PATH = 'HELP_COURSES/ELMGR3/L2/index.xml';
const SOURCE_XML_SHA256 =
  'abc87f1335090d1ff1169f94427b4aaa927a0916a1d45565ffa5902f2bf14f27';
const CALIBRATION_ID = 'g3-l2-page-only-current-js-70-v1';
const PAGE_COUNT = 70;
const SHA256 = /^[a-f0-9]{64}$/;

type JsonRecord = Record<string, unknown>;

const record = (value: unknown): JsonRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : null;

const nonEmpty = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() === value && value.length > 0
    ? value
    : null;

function sourceBoundLabel(
  english: string,
  spanish: string | null,
  locale: 'en' | 'es',
): SourceBoundLabel {
  return locale === 'es' && spanish
    ? Object.freeze({
        text: spanish,
        sourceLanguage: 'es',
        sourceStatus: 'exact-page-title' as const,
        usesEnglishFallback: false,
      })
    : Object.freeze({
        text: english,
        sourceLanguage: 'en',
        sourceStatus: locale === 'es'
          ? 'missing-page-level-spanish-title' as const
          : 'exact-page-title' as const,
        usesEnglishFallback: locale === 'es',
      });
}

interface ParsedPage {
  readonly animationId: string;
  readonly assetId: string;
  readonly globalPageOrdinal: number;
  readonly sectionCode: string;
  readonly sectionPageOrdinal: number;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
  readonly targetObjectId: number;
}

export function parseG3L2DescriptorPages(): readonly ParsedPage[] | null {
  const catalog = record(animationsCatalogDocument);
  const audit = record(crossGradeAuditDocument);
  if (
    catalog?.schemaVersion !== 1 ||
    !Array.isArray(catalog.animations) ||
    audit?.schemaVersion !== 1 ||
    !Array.isArray(audit.members) ||
    audit.members.length !== PAGE_COUNT
  ) {
    return null;
  }
  const auditById = new Map(audit.members.map((value) => {
    const member = record(value);
    return [nonEmpty(member?.animationId), member] as const;
  }));
  const pages: ParsedPage[] = [];
  for (const value of catalog.animations) {
    const animation = record(value);
    const classification = record(animation?.classification);
    const section = record(classification?.section);
    const source = record(animation?.source);
    const references = record(animation?.references);
    const courseXml = Array.isArray(references?.courseXml)
      ? references.courseXml.map(record).filter(Boolean)
      : [];
    const matching = courseXml.filter(
      (reference) => reference?.sourceXmlPath === SOURCE_XML_PATH,
    );
    if (matching.length === 0) continue;
    const animationId = nonEmpty(animation?.animationId);
    const assetId = nonEmpty(animation?.assetId);
    const swfSha256 = nonEmpty(source?.sha256);
    const titleEnglish = nonEmpty(classification?.titleEnglish) ??
      nonEmpty(classification?.titleDisplay);
    const titleSpanish = nonEmpty(classification?.titleSpanish);
    const member = animationId ? auditById.get(animationId) : null;
    const target = record(member?.target);
    const page = record(classification?.page);
    const occurrence = matching.length === 1
      ? matching[0]?.occurrence
      : null;
    if (
      !animationId ||
      !assetId ||
      !swfSha256 ||
      !SHA256.test(swfSha256) ||
      assetId !== `swf-${swfSha256}` ||
      animation?.canonicalAnimationId !== animationId ||
      record(animation?.flags)?.referenced !== true ||
      record(animation?.flags)?.unreferenced !== false ||
      record(animation?.flags)?.variant !== false ||
      record(animation?.flags)?.shell !== false ||
      classification?.collection !== 'course' ||
      classification.grade !== 3 ||
      classification.lesson !== 2 ||
      !section ||
      !nonEmpty(section.code) ||
      !titleEnglish ||
      !Number.isSafeInteger(page?.ordinal) ||
      !Number.isSafeInteger(occurrence) ||
      !member ||
      member.ordinal !== occurrence ||
      !Number.isSafeInteger(target?.objectId) ||
      !hasAnimationModule(animationId)
    ) {
      return null;
    }
    pages.push(Object.freeze({
      animationId,
      assetId,
      globalPageOrdinal: Number(occurrence),
      sectionCode: String(section.code),
      sectionPageOrdinal: Number(page!.ordinal),
      titleEnglish,
      titleSpanish,
      targetObjectId: Number(target!.objectId),
    }));
  }
  pages.sort((left, right) =>
    left.globalPageOrdinal - right.globalPageOrdinal,
  );
  if (
    pages.length !== PAGE_COUNT ||
    pages.some((page, index) => page.globalPageOrdinal !== index + 1) ||
    new Set(pages.map(({animationId}) => animationId)).size !== PAGE_COUNT
  ) {
    return null;
  }
  return Object.freeze(pages);
}

export function parseG3L2DescriptorSections(pages: readonly ParsedPage[]) {
  const catalog = record(lessonsCatalogDocument);
  if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.lessons)) {
    return null;
  }
  const matches = catalog.lessons.map(record).filter(
    (lesson) => lesson?.grade === 3 && lesson.lesson === 2,
  );
  if (matches.length !== 1) return null;
  const lesson = matches[0]!;
  if (
    lesson.path !== SOURCE_XML_PATH ||
    lesson.sha256 !== SOURCE_XML_SHA256 ||
    lesson.titleDisplay !== 'Addition and Subtraction' ||
    lesson.pageReferenceCount !== PAGE_COUNT ||
    lesson.sectionCount !== 8 ||
    !Array.isArray(lesson.sections) ||
    lesson.sections.length !== 8
  ) {
    return null;
  }
  const sections = lesson.sections.map((value, index) => {
    const sourceSection = record(value);
    const code = nonEmpty(sourceSection?.code);
    const titleEnglish = nonEmpty(sourceSection?.titleEnglish);
    const titleSpanish = nonEmpty(sourceSection?.titleSpanish);
    const sectionPages = code
      ? pages.filter((page) => page.sectionCode === code)
      : [];
    if (
      sourceSection?.number !== index + 1 ||
      !code ||
      !titleEnglish ||
      !titleSpanish ||
      sourceSection.pageReferenceCount !== sectionPages.length ||
      sectionPages.length === 0 ||
      sectionPages.some(
        (page, pageIndex) => page.sectionPageOrdinal !== pageIndex + 1,
      )
    ) {
      return null;
    }
    return Object.freeze({
      order: index + 1,
      code,
      activePageCount: sectionPages.length,
      firstActiveAnimationId: sectionPages[0]!.animationId,
      labels: Object.freeze({
        en: Object.freeze({
          text: titleEnglish,
          sourceLanguage: 'en' as const,
          sourceStatus: 'exact-course-xml' as const,
          usesEnglishFallback: false,
        }),
        es: Object.freeze({
          text: titleSpanish,
          sourceLanguage: 'es' as const,
          sourceStatus: 'exact-course-xml' as const,
          usesEnglishFallback: false,
        }),
      }),
    });
  });
  return sections.some((section) => section === null)
    ? null
    : Object.freeze(sections as NonNullable<(typeof sections)[number]>[]);
}

/**
 * Builds a page-only, development-audit My Lesson descriptor. The preserved
 * shell identity is provenance only: it is neither implemented nor counted.
 */
export function buildG3L2WholeLessonPlayerDescriptor():
  PageOnlyLessonPlayerDescriptor | undefined {
  const sourcePages = parseG3L2DescriptorPages();
  if (!sourcePages) return undefined;
  const sections = parseG3L2DescriptorSections(sourcePages);
  if (!sections) return undefined;
  const pages = sourcePages.map((page, index) => Object.freeze({
    placementId:
      `g03-l02-placement-${String(index + 1).padStart(3, '0')}`,
    globalPageOrdinal: page.globalPageOrdinal,
    sectionPageOrdinal: page.sectionPageOrdinal,
    sectionCode: page.sectionCode,
    animationId: page.animationId,
    previousAnimationId: sourcePages[index - 1]?.animationId ?? null,
    nextAnimationId: sourcePages[index + 1]?.animationId ?? null,
    labels: Object.freeze({
      en: sourceBoundLabel(page.titleEnglish, page.titleSpanish, 'en'),
      es: sourceBoundLabel(page.titleEnglish, page.titleSpanish, 'es'),
    }),
    rendererAvailability: Object.freeze({
      kind: 'registered' as const,
      moduleKey: page.animationId,
      runtimeQuery: Object.freeze({
        frameDomain: `sprite-${page.targetObjectId}`,
        language: 'fixed-en' as const,
        scenario: 'source-static-frame',
        seed: '0',
      }),
    }),
    presentation: page.animationId === 'course-g03-l02-rw-002'
      ? Object.freeze({
          pageInteractionCompanionTargetIdSuffix: 'rw002-number-keyterm',
        })
      : undefined,
    source: Object.freeze({
      assetId: page.assetId,
      sourceOccurrence: page.globalPageOrdinal,
    }),
  }));

  return Object.freeze({
    schemaVersion: 2,
    descriptorKind: 'formal-page-only-course',
    descriptorId: 'whole-lesson-player-g03-l02-page-only-v1',
    calibrationId: CALIBRATION_ID,
    releaseId: RELEASE_ID,
    course: Object.freeze({
      grade: 3,
      lesson: 2,
      href: '/courses/3/2',
      domIdPrefix: 'g3-l2',
      activePageCount: PAGE_COUNT,
      courseShellCount: 0,
      expectedReleaseMemberCount: PAGE_COUNT,
      labels: Object.freeze({
        en: Object.freeze({
          text: 'Addition and Subtraction',
          sourceLanguage: 'en',
          sourceStatus: 'exact-course-xml',
          usesEnglishFallback: false,
        }),
        es: Object.freeze({
          text: 'Addition and Subtraction',
          sourceLanguage: 'en',
          sourceStatus: 'missing-lesson-level-spanish-title',
          usesEnglishFallback: true,
        }),
      }),
    }),
    source: Object.freeze({
      navigationContractPath:
        'reports/g3-l2-cross-grade-factory-audit.json',
      sourceXmlPath: `${SOURCE_PREFIX_PLACEHOLDER}${SOURCE_XML_PATH}`,
      sourceXmlSha256: SOURCE_XML_SHA256,
      sequenceAuthority: 'course-xml-occurrence',
      candidateFreezeManifestPath:
        'reports/g3-l2-cross-grade-factory-audit.json',
      candidateFreezeManifestSha256:
        'cc3f04916359227e811c6a91bb09b79b2801d853ac12bccc22851fd8071be138',
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey: 'helpmath:g3-l2:page-only-current-js-audit:v1',
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
      chromeAsset: '',
      header: Object.freeze({height: 0}),
      footer: Object.freeze({height: 0}),
      controls: Object.freeze({
        kind: 'unresolved-modern-functional-equivalent',
        reason:
          'modern My Lesson controls are product code; no legacy Flash shell renderer is required or counted',
      }),
      evidence: Object.freeze({
        kind: 'product-owned-modern-my-lesson',
        calibrationId: CALIBRATION_ID,
      }),
    }),
    glossary: Object.freeze([]),
    productBridge: Object.freeze({
      selectedAnimationIds: Object.freeze(
        pages.map((page) => page.animationId),
      ),
      registeredAnimationCount: pages.length,
      pageOnlyDescriptorMemberCount: PAGE_COUNT,
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
    sections,
    pages,
  } satisfies PageOnlyLessonPlayerDescriptor);
}

const SOURCE_PREFIX_PLACEHOLDER =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/';

export const G3_L2_WHOLE_LESSON_PLAYER_DESCRIPTOR =
  buildG3L2WholeLessonPlayerDescriptor();
