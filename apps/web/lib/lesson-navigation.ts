import type {AnimationCatalog, CatalogAnimation} from './catalog';
import type {LessonReleaseDefinition} from './lesson-release-publication';

export type LessonLocale = 'en' | 'es';

export interface LessonNavigationLabel {
  readonly text: string;
  readonly sourceLanguage: LessonLocale;
  readonly sourceStatus: 'exact-course-xml' | 'exact-page-title' | 'missing-spanish-source-label';
  readonly usesEnglishFallback: boolean;
}

export interface LessonNavigationPage {
  readonly placementId?: string;
  readonly memberOrdinal: number;
  readonly globalPageOrdinal: number;
  readonly sectionPageOrdinal: number;
  readonly sectionCode: string;
  readonly animationId: string;
  readonly assetId: string;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
  readonly sourceOccurrence: number;
  readonly previousAnimationId: string | null;
  readonly nextAnimationId: string | null;
}

export interface LessonNavigationSection {
  readonly order: number;
  readonly code: string;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
  readonly firstActiveAnimationId: string;
  readonly activePageCount: number;
}

interface LessonNavigationDescriptorBase {
  readonly releaseId: string;
  readonly grade: number;
  readonly lesson: number;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
  readonly expectedMemberCount: number;
  readonly activePageCount: number;
  readonly sections: readonly LessonNavigationSection[];
  readonly pages: readonly LessonNavigationPage[];
  readonly memberAnimationIds: readonly string[];
}

export interface LegacyShellLessonNavigationDescriptor
  extends LessonNavigationDescriptorBase {
  readonly schemaVersion: 1;
  readonly courseShellCount: 1;
  readonly shell: Readonly<{
    animationId: string;
    assetId: string;
    memberOrdinal: number;
  }>;
}

export interface PageOnlyLessonNavigationDescriptor
  extends LessonNavigationDescriptorBase {
  readonly schemaVersion: 2;
  readonly courseShellCount: 0;
}

export type LessonNavigationDescriptor =
  | LegacyShellLessonNavigationDescriptor
  | PageOnlyLessonNavigationDescriptor;

export interface LessonNavigationPublicationOptions {
  readonly auditPreview: boolean;
  readonly completeAnimationIds: ReadonlySet<string>;
  readonly releasePublished: boolean;
}

const nonEmpty = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

function pageOccurrence(animation: CatalogAnimation): number | null {
  const occurrences = animation.references.courseXml
    .map((reference) => reference.occurrence)
    .filter((value): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 1);
  return occurrences.length === 1 ? occurrences[0]! : null;
}

/**
 * Builds one source-ordered product navigation descriptor from an exact atomic
 * release. Invalid or stale catalog/release bindings return no descriptor so
 * callers can fail closed instead of reconstructing or guessing lesson order.
 */
export function buildLessonNavigationDescriptor(
  definition: LessonReleaseDefinition,
  animations: readonly CatalogAnimation[],
): LessonNavigationDescriptor | undefined {
  if (definition.publicationMode !== 'atomic' ||
    definition.scope.collection !== 'course' ||
    typeof definition.scope.grade !== 'number' ||
    definition.scope.lesson === null ||
    definition.scope.excludeNonMembers !== true ||
    definition.members.length !== definition.expectedMemberCount ||
    definition.expectedMemberCount < 1) {
    return undefined;
  }

  const animationById = new Map(animations.map((animation) => [animation.animationId, animation]));
  const boundMembers = definition.members.map((member) => {
    const animation = animationById.get(member.animationId);
    return animation?.assetId === member.assetId ? {member, animation} : null;
  });
  if (boundMembers.some((member) => member === null)) return undefined;

  const pageOnly = boundMembers.every(
    (entry) => entry!.member.releaseRole === 'active-xml-referenced-page',
  );
  const legacyShellMember = pageOnly ? null : boundMembers.at(-1)!;
  const pageMembers = pageOnly ? boundMembers : boundMembers.slice(0, -1);
  if (
    pageMembers.length === 0 ||
    pageMembers.some(
      (entry) => entry!.member.releaseRole !== 'active-xml-referenced-page',
    ) ||
    (!pageOnly && (
      legacyShellMember!.member.releaseRole !== 'course-shell' ||
      !legacyShellMember!.animation.flags.shell ||
      legacyShellMember!.animation.classification.collection !== 'course' ||
      legacyShellMember!.animation.classification.grade !==
        definition.scope.grade ||
      legacyShellMember!.animation.classification.lesson !==
        definition.scope.lesson
    ))
  ) {
    return undefined;
  }

  const sectionPlacementCounts = new Map<string, number>();
  const preliminaryPages = pageMembers.map((entry, index) => {
    const {animation, member} = entry!;
    const section = animation.classification.section;
    const occurrence = pageOnly
      ? member.sourceOccurrence ?? pageOccurrence(animation)
      : pageOccurrence(animation);
    const titleEnglish = nonEmpty(animation.classification.titleEnglish) ??
      nonEmpty(animation.classification.titleDisplay);
    if (animation.classification.collection !== 'course' ||
      animation.classification.grade !== definition.scope.grade ||
      animation.classification.lesson !== definition.scope.lesson ||
      animation.flags.shell ||
      !section || !nonEmpty(section.code) || !nonEmpty(section.titleEnglish) ||
      !titleEnglish || occurrence !== index + 1 ||
      (member.placementId !== undefined &&
        (!member.placementId ||
          member.placementId.trim() !== member.placementId))) {
      return null;
    }
    const sectionPageOrdinal =
      (sectionPlacementCounts.get(section.code) ?? 0) + 1;
    sectionPlacementCounts.set(section.code, sectionPageOrdinal);
    return {
      placementId: member.placementId,
      memberOrdinal: index + 1,
      globalPageOrdinal: index + 1,
      sectionPageOrdinal,
      sectionCode: section.code,
      animationId: member.animationId,
      assetId: member.assetId,
      titleEnglish,
      titleSpanish: nonEmpty(animation.classification.titleSpanish),
      sectionTitleEnglish: nonEmpty(section.titleEnglish)!,
      sectionTitleSpanish: nonEmpty(section.titleSpanish),
      sourceOccurrence: occurrence,
    };
  });
  if (preliminaryPages.some((page) => page === null)) return undefined;

  const pagesWithSource = preliminaryPages as Array<NonNullable<(typeof preliminaryPages)[number]>>;
  const sectionOrder: string[] = [];
  const seenClosedSections = new Set<string>();
  let previousSection: string | null = null;
  for (const page of pagesWithSource) {
    if (page.sectionCode !== previousSection) {
      if (seenClosedSections.has(page.sectionCode)) return undefined;
      if (previousSection !== null) seenClosedSections.add(previousSection);
      sectionOrder.push(page.sectionCode);
      previousSection = page.sectionCode;
    }
  }

  const sections = sectionOrder.map((code, index): LessonNavigationSection | null => {
    const sectionPages = pagesWithSource.filter((page) => page.sectionCode === code);
    const first = sectionPages[0]!;
    const labelsAgree = sectionPages.every((page) =>
      page.sectionTitleEnglish === first.sectionTitleEnglish &&
      page.sectionTitleSpanish === first.sectionTitleSpanish,
    );
    const ordinalsAreContiguous = sectionPages.every(
      (page, pageIndex) => page.sectionPageOrdinal === pageIndex + 1,
    );
    if (!labelsAgree || !ordinalsAreContiguous) return null;
    return Object.freeze({
      order: index + 1,
      code,
      titleEnglish: first.sectionTitleEnglish,
      titleSpanish: first.sectionTitleSpanish,
      firstActiveAnimationId: first.animationId,
      activePageCount: sectionPages.length,
    });
  });
  if (sections.some((section) => section === null)) return undefined;

  const pages = pagesWithSource.map((page, index): LessonNavigationPage => Object.freeze({
    placementId: page.placementId,
    memberOrdinal: page.memberOrdinal,
    globalPageOrdinal: page.globalPageOrdinal,
    sectionPageOrdinal: page.sectionPageOrdinal,
    sectionCode: page.sectionCode,
    animationId: page.animationId,
    assetId: page.assetId,
    titleEnglish: page.titleEnglish,
    titleSpanish: page.titleSpanish,
    sourceOccurrence: page.sourceOccurrence,
    previousAnimationId: pagesWithSource[index - 1]?.animationId ?? null,
    nextAnimationId: pagesWithSource[index + 1]?.animationId ?? null,
  }));
  const firstAnimation = pagesWithSource[0]
    ? animationById.get(pagesWithSource[0].animationId)
    : undefined;
  const titleEnglish = nonEmpty(firstAnimation?.classification.lessonTitleDisplay) ??
    nonEmpty(legacyShellMember?.animation.classification.lessonTitleDisplay) ??
    nonEmpty(legacyShellMember?.animation.classification.titleEnglish);
  if (!titleEnglish) return undefined;

  const common = {
    releaseId: definition.releaseId,
    grade: definition.scope.grade,
    lesson: definition.scope.lesson,
    titleEnglish,
    titleSpanish: null,
    expectedMemberCount: definition.expectedMemberCount,
    activePageCount: pages.length,
    sections: Object.freeze(sections as LessonNavigationSection[]),
    pages: Object.freeze(pages),
    memberAnimationIds: Object.freeze(
      definition.members.map((member) => member.animationId),
    ),
  } as const;

  if (pageOnly) {
    return Object.freeze({
      ...common,
      schemaVersion: 2,
      courseShellCount: 0,
    });
  }

  return Object.freeze({
    ...common,
    schemaVersion: 1,
    courseShellCount: 1,
    shell: Object.freeze({
      animationId: legacyShellMember!.member.animationId,
      assetId: legacyShellMember!.member.assetId,
      memberOrdinal: definition.expectedMemberCount,
    }),
  });
}

export function lessonNavigationDescriptors(catalog: AnimationCatalog): readonly LessonNavigationDescriptor[] {
  return Object.freeze(catalog.publication.definitions.flatMap((definition) => {
    const descriptor = buildLessonNavigationDescriptor(definition, catalog.animations);
    return descriptor ? [descriptor] : [];
  }));
}

export function findLessonNavigationForRoute(
  catalog: AnimationCatalog,
  grade: string | number,
  lesson: string | number,
): LessonNavigationDescriptor | undefined {
  const matches = lessonNavigationDescriptors(catalog).filter(
    (descriptor) => String(descriptor.grade) === String(Number(grade)) &&
      String(descriptor.lesson) === String(Number(lesson)),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function findLessonNavigationForAnimation(
  catalog: AnimationCatalog,
  animationId: string,
): LessonNavigationDescriptor | undefined {
  const matches = lessonNavigationDescriptors(catalog).filter(
    (descriptor) => descriptor.memberAnimationIds.includes(animationId),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function findLessonPage(
  descriptor: LessonNavigationDescriptor,
  animationId: string,
): LessonNavigationPage | undefined {
  return descriptor.pages.find((page) => page.animationId === animationId);
}

export function findLessonSection(
  descriptor: LessonNavigationDescriptor,
  code: string,
): LessonNavigationSection | undefined {
  return descriptor.sections.find((section) => section.code === code);
}

export function getLessonPageLabel(
  page: LessonNavigationPage,
  locale: LessonLocale,
): LessonNavigationLabel {
  if (locale === 'es' && page.titleSpanish) {
    return {
      text: page.titleSpanish,
      sourceLanguage: 'es',
      sourceStatus: 'exact-page-title',
      usesEnglishFallback: false,
    };
  }
  return {
    text: page.titleEnglish,
    sourceLanguage: 'en',
    sourceStatus: locale === 'es' ? 'missing-spanish-source-label' : 'exact-page-title',
    usesEnglishFallback: locale === 'es',
  };
}

export function getLessonSectionLabel(
  section: LessonNavigationSection,
  locale: LessonLocale,
): LessonNavigationLabel {
  if (locale === 'es' && section.titleSpanish) {
    return {
      text: section.titleSpanish,
      sourceLanguage: 'es',
      sourceStatus: 'exact-course-xml',
      usesEnglishFallback: false,
    };
  }
  return {
    text: section.titleEnglish,
    sourceLanguage: 'en',
    sourceStatus: locale === 'es' ? 'missing-spanish-source-label' : 'exact-course-xml',
    usesEnglishFallback: locale === 'es',
  };
}

export function isLessonReleaseOpen(
  descriptor: LessonNavigationDescriptor,
  options: LessonNavigationPublicationOptions,
): boolean {
  return options.releasePublished &&
    descriptor.memberAnimationIds.length === descriptor.expectedMemberCount &&
    descriptor.memberAnimationIds.every((animationId) => options.completeAnimationIds.has(animationId));
}

export function getVisibleLessonPages(
  descriptor: LessonNavigationDescriptor,
  options: LessonNavigationPublicationOptions,
): readonly LessonNavigationPage[] {
  return options.auditPreview || isLessonReleaseOpen(descriptor, options)
    ? descriptor.pages
    : [];
}

export function canNavigateToLessonAnimation(
  descriptor: LessonNavigationDescriptor,
  animationId: string | null,
  options: LessonNavigationPublicationOptions,
): boolean {
  return animationId !== null &&
    descriptor.memberAnimationIds.includes(animationId) &&
    (options.auditPreview || isLessonReleaseOpen(descriptor, options));
}
