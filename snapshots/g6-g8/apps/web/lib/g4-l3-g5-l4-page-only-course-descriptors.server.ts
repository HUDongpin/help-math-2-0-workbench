import releaseDocument from '../../../catalog/lesson-releases.json' with
  {type: 'json'};
import {G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR} from
  './g4-l3-whole-lesson-player-descriptor';
import {G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR} from
  './g5-l4-whole-lesson-player-descriptor';
import type {
  PageOnlyLessonPlayerDescriptor,
  WholeLessonPlayerDescriptor,
  WholeLessonPlayerPage,
} from './whole-lesson-player-descriptor';

const NAVIGATION_CONTRACT_PATH = 'catalog/lesson-releases.json';
const MODERN_CONTROL_REASON =
  'The retained modern My Lesson host owns navigation and playback controls; the excluded legacy Flash course-shell is preserved only as historical evidence and is not a page-only member.';

const acceptanceEffects = Object.freeze({
  authoritativeOriginalRuntime: false,
  fidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  published: false,
});

interface PageOnlyAdapterOptions {
  readonly legacy: WholeLessonPlayerDescriptor | undefined;
  readonly descriptorId: string;
  readonly calibrationId: string;
  readonly candidateFreezeManifestPath: string;
  readonly candidateFreezeManifestSha256: string;
  readonly lessonHostCapabilities: PageOnlyLessonPlayerDescriptor[
    'support'
  ]['lessonHostCapabilities'];
}

type PageOnlyRelease = (typeof releaseDocument.releases)[number];

function pageOnlyReleaseFor(
  legacy: WholeLessonPlayerDescriptor,
): PageOnlyRelease | undefined {
  if (releaseDocument.schemaVersion !== 1) return undefined;
  const matches = releaseDocument.releases.filter((release) =>
    release.releaseId === legacy.releaseId &&
    release.grade === legacy.course.grade &&
    release.lesson === legacy.course.lesson
  );
  const release = matches.length === 1 ? matches[0] : undefined;
  return release?.scope.pageOnly === true &&
    release.scope.legacyFlashCourseShellExcluded === true &&
    release.scope.modernMyLessonHostRetained === true &&
    release.expectedCounts.courseShells === 0
    ? release
    : undefined;
}

/**
 * Projects an already-runnable historical descriptor onto the Owner-approved
 * page-only release contract. The legacy shell descriptor remains readable
 * evidence for the existing player implementation, but it is neither copied
 * into this formal registration nor counted as a release member.
 */
function buildFormalPageOnlyAdapter({
  legacy,
  descriptorId,
  calibrationId,
  candidateFreezeManifestPath,
  candidateFreezeManifestSha256,
  lessonHostCapabilities,
}: PageOnlyAdapterOptions): PageOnlyLessonPlayerDescriptor | undefined {
  if (!legacy) return undefined;
  const release = pageOnlyReleaseFor(legacy);
  if (
    !release ||
    release.publicationMode !== 'atomic' ||
    release.expectedCounts.activeXmlReferencedPages !== legacy.pages.length ||
    release.expectedCounts.members !== legacy.pages.length ||
    release.members.length !== legacy.pages.length
  ) {
    return undefined;
  }

  const pages: WholeLessonPlayerPage[] = [];
  for (const [index, page] of legacy.pages.entries()) {
    const sourcePage = release.members[index];
    if (
      !sourcePage ||
      !sourcePage.placementId ||
      sourcePage.ordinal !== index + 1 ||
      sourcePage.releaseRole !== 'active-xml-referenced-page' ||
      sourcePage.xmlOccurrence !== index + 1 ||
      sourcePage.animationId !== page.animationId ||
      !/^swf-[a-f0-9]{64}$/.test(sourcePage.assetId) ||
      (page.source.assetId !== undefined &&
        page.source.assetId !== sourcePage.assetId)
    ) {
      return undefined;
    }
    pages.push(Object.freeze({
      ...page,
      placementId: sourcePage.placementId,
      previousPlacementId:
        release.members[index - 1]?.placementId ?? null,
      nextPlacementId:
        release.members[index + 1]?.placementId ?? null,
      source: Object.freeze({
        ...page.source,
        assetId: sourcePage.assetId,
        sourceOccurrence: sourcePage.xmlOccurrence,
      }),
    }));
  }

  return Object.freeze({
    schemaVersion: 2,
    descriptorKind: 'formal-page-only-course',
    descriptorId,
    calibrationId,
    releaseId: legacy.releaseId,
    course: Object.freeze({
      grade: legacy.course.grade,
      lesson: legacy.course.lesson,
      href: legacy.course.href,
      domIdPrefix: legacy.course.domIdPrefix,
      activePageCount: pages.length,
      courseShellCount: 0,
      expectedReleaseMemberCount: pages.length,
      labels: legacy.course.labels,
    }),
    source: Object.freeze({
      navigationContractPath: NAVIGATION_CONTRACT_PATH,
      sourceXmlPath: legacy.source.sourceXmlPath,
      sourceXmlSha256: legacy.source.sourceXmlSha256,
      sequenceAuthority: 'course-xml-occurrence',
      candidateFreezeManifestPath,
      candidateFreezeManifestSha256,
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey: legacy.persistence.storageKey,
      scope: 'local-device-only',
      legacyCompatible: false,
    }),
    stage: legacy.stage,
    support: Object.freeze({
      locales: legacy.support.locales,
      rendererRegistrySnapshot: 'current-javascript-module-registry',
      lessonHostCapabilities,
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
        reason: MODERN_CONTROL_REASON,
      }),
      evidence: Object.freeze({
        kind: 'product-owned-modern-my-lesson',
        calibrationId,
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
    sections: legacy.sections,
    pages: Object.freeze(pages),
  } satisfies PageOnlyLessonPlayerDescriptor);
}

export const G4_L3_PAGE_ONLY_COURSE_DESCRIPTOR =
  buildFormalPageOnlyAdapter({
    legacy: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR,
    descriptorId: 'g4-l3-formal-page-only-course-v1',
    calibrationId: 'g4-l3-page-only-current-js-39-v1',
    candidateFreezeManifestPath:
      'reports/g4-l3-lesson-product-navigation-contract.json',
    candidateFreezeManifestSha256:
      'f7df5b8266208606fd2433b223d06697bfcc83ca809f1ac9d1911be124e3c13e',
    lessonHostCapabilities: Object.freeze([
      'audio',
      'glossary',
      'practice-feedback',
    ]),
  });

export const G5_L4_PAGE_ONLY_COURSE_DESCRIPTOR =
  buildFormalPageOnlyAdapter({
    legacy: G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR,
    descriptorId: 'g5-l4-formal-page-only-course-v1',
    calibrationId: 'g5-l4-page-only-current-js-54-v1',
    candidateFreezeManifestPath: 'reports/g5-l4-source-scope-freeze.json',
    candidateFreezeManifestSha256:
      'a46a673014d1934415ed0a5327bfc1ada40e23ca3d5b6d3c58159141384b8d20',
    lessonHostCapabilities: Object.freeze([
      'audio',
      'glossary',
      'practice-feedback',
    ]),
  });
