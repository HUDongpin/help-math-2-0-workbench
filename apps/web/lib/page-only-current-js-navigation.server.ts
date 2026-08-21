import productReleaseDocument from '../../../catalog/page-only-current-js-product-releases.json' with {type: 'json'};

import {G5_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR} from './g5-l3-whole-lesson-player-descriptor';
import type {PageOnlyLessonNavigationDescriptor} from './lesson-navigation';

type ProductRelease =
  (typeof productReleaseDocument.releases)[number];

function buildNavigation(
  release: ProductRelease,
): PageOnlyLessonNavigationDescriptor | undefined {
  const descriptor = G5_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  if (
    !descriptor ||
    productReleaseDocument.schemaVersion !== 1 ||
    productReleaseDocument.manifestKind !==
      'page-only-current-js-product-releases' ||
    Object.values(productReleaseDocument.acceptanceEffects).some(Boolean) ||
    release.releaseId !== descriptor.releaseId ||
    release.publicationMode !== 'atomic' ||
    release.scope.pageOnly !== true ||
    release.scope.legacyFlashCourseShellExcluded !== true ||
    release.scope.modernMyLessonHostRetained !== true ||
    release.expectedCounts.courseShells !== 0 ||
    release.expectedCounts.members !== descriptor.pages.length ||
    release.sourceLesson.sha256 !== descriptor.source.sourceXmlSha256 ||
    release.members.length !== descriptor.pages.length
  ) {
    return undefined;
  }

  const placementIds = new Set<string>();
  const pages = release.members.map((member, index) => {
    const descriptorPage = descriptor.pages[index];
    if (
      !descriptorPage ||
      member.ordinal !== index + 1 ||
      member.releaseRole !== 'active-xml-referenced-page' ||
      member.xmlOccurrence !== index + 1 ||
      member.placementId !== descriptorPage.placementId ||
      member.animationId !== descriptorPage.animationId ||
      member.assetId !== descriptorPage.source.assetId ||
      placementIds.has(member.placementId)
    ) {
      return null;
    }
    placementIds.add(member.placementId);
    return Object.freeze({
      placementId: member.placementId,
      memberOrdinal: member.ordinal,
      globalPageOrdinal: descriptorPage.globalPageOrdinal,
      sectionPageOrdinal: descriptorPage.sectionPageOrdinal,
      sectionCode: descriptorPage.sectionCode,
      animationId: descriptorPage.animationId,
      assetId: member.assetId,
      titleEnglish: descriptorPage.labels.en.text,
      titleSpanish: descriptorPage.labels.es.usesEnglishFallback
        ? null
        : descriptorPage.labels.es.text,
      sourceOccurrence: member.xmlOccurrence,
      previousAnimationId: descriptorPage.previousAnimationId,
      nextAnimationId: descriptorPage.nextAnimationId,
    });
  });
  if (pages.some((page) => page === null)) return undefined;

  return Object.freeze({
    schemaVersion: 2,
    releaseId: descriptor.releaseId,
    grade: descriptor.course.grade,
    lesson: descriptor.course.lesson,
    titleEnglish: descriptor.course.labels.en.text,
    titleSpanish: descriptor.course.labels.es.usesEnglishFallback
      ? null
      : descriptor.course.labels.es.text,
    expectedMemberCount: descriptor.course.expectedReleaseMemberCount,
    activePageCount: descriptor.course.activePageCount,
    courseShellCount: 0,
    sections: Object.freeze(descriptor.sections.map((section) =>
      Object.freeze({
        order: section.order,
        code: section.code,
        titleEnglish: section.labels.en.text,
        titleSpanish: section.labels.es.usesEnglishFallback
          ? null
          : section.labels.es.text,
        firstActiveAnimationId: section.firstActiveAnimationId,
        activePageCount: section.activePageCount,
      })
    )),
    pages: Object.freeze(
      pages as NonNullable<(typeof pages)[number]>[],
    ),
    memberAnimationIds: Object.freeze(
      release.members.map((member) => member.animationId),
    ),
  });
}

const navigations = Object.freeze(productReleaseDocument.releases.flatMap(
  (release) => {
    const navigation = buildNavigation(release);
    return navigation ? [navigation] : [];
  },
));

export function findPageOnlyCurrentJsNavigationForRoute(
  grade: string | number,
  lesson: string | number,
): PageOnlyLessonNavigationDescriptor | undefined {
  const matches = navigations.filter((navigation) =>
    navigation.grade === Number(grade) &&
    navigation.lesson === Number(lesson)
  );
  return matches.length === 1 ? matches[0] : undefined;
}
