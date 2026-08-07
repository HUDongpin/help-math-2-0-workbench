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

export interface LessonNavigationDescriptor {
  readonly schemaVersion: 1;
  readonly releaseId: string;
  readonly grade: number;
  readonly lesson: number;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
  readonly expectedMemberCount: number;
  readonly activePageCount: number;
  readonly courseShellCount: 1;
  readonly shell: Readonly<{
    animationId: string;
    assetId: string;
    memberOrdinal: number;
  }>;
  readonly sections: readonly LessonNavigationSection[];
  readonly pages: readonly LessonNavigationPage[];
  readonly memberAnimationIds: readonly string[];
}

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
    definition.expectedMemberCount < 2) {
    return undefined;
  }

  const animationById = new Map(animations.map((animation) => [animation.animationId, animation]));
  const boundMembers = definition.members.map((member) => {
    const animation = animationById.get(member.animationId);
    return animation?.assetId === member.assetId ? {member, animation} : null;
  });
  if (boundMembers.some((member) => member === null)) return undefined;

  const pageMembers = boundMembers.slice(0, -1);
  const shellMember = boundMembers.at(-1)!;
  if (pageMembers.some((entry) => entry!.member.releaseRole !== 'active-xml-referenced-page') ||
    shellMember!.member.releaseRole !== 'course-shell' ||
    !shellMember!.animation.flags.shell ||
    shellMember!.animation.classification.collection !== 'course' ||
    shellMember!.animation.classification.grade !== definition.scope.grade ||
    shellMember!.animation.classification.lesson !== definition.scope.lesson) {
    return undefined;
  }

  const preliminaryPages = pageMembers.map((entry, index) => {
    const {animation, member} = entry!;
    const section = animation.classification.section;
    const occurrence = pageOccurrence(animation);
    const titleEnglish = nonEmpty(animation.classification.titleEnglish) ??
      nonEmpty(animation.classification.titleDisplay);
    if (animation.classification.collection !== 'course' ||
      animation.classification.grade !== definition.scope.grade ||
      animation.classification.lesson !== definition.scope.lesson ||
      animation.flags.shell ||
      !section || !nonEmpty(section.code) || !nonEmpty(section.titleEnglish) ||
      !titleEnglish || occurrence !== index + 1) {
      return null;
    }
    return {
      memberOrdinal: index + 1,
      globalPageOrdinal: index + 1,
      sectionPageOrdinal: animation.classification.page?.ordinal ?? 0,
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
    nonEmpty(shellMember!.animation.classification.lessonTitleDisplay) ??
    nonEmpty(shellMember!.animation.classification.titleEnglish);
  if (!titleEnglish) return undefined;

  return Object.freeze({
    schemaVersion: 1,
    releaseId: definition.releaseId,
    grade: definition.scope.grade,
    lesson: definition.scope.lesson,
    titleEnglish,
    titleSpanish: null,
    expectedMemberCount: definition.expectedMemberCount,
    activePageCount: pages.length,
    courseShellCount: 1,
    shell: Object.freeze({
      animationId: shellMember!.member.animationId,
      assetId: shellMember!.member.assetId,
      memberOrdinal: definition.expectedMemberCount,
    }),
    sections: Object.freeze(sections as LessonNavigationSection[]),
    pages: Object.freeze(pages),
    memberAnimationIds: Object.freeze(definition.members.map((member) => member.animationId)),
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
