import {hasPageInteraction, pageInteractionFor, stageTargetId} from '@helpmath/demos/page-interaction';

export const CITED_INTERACTIVE_LESSONS = [
  {grade: 3, lesson: 2},
  {grade: 4, lesson: 3},
  {grade: 5, lesson: 5}
] as const;

export const LESSON_PLAYER_ID = 'workbench-catalog-interaction-bridge' as const;

const SECTION_ORDER = ['IR', 'RW', 'VB', 'IN', 'TI', 'GS', 'TS', 'FQ'] as const;
export type LessonSectionCode = (typeof SECTION_ORDER)[number];

export type LessonPageSource = {
  animationId: string;
  isCanonical: boolean;
  flags: {referenced: boolean; shell: boolean};
  classification: {
    collection: string;
    grade: number | 'elementary' | null;
    lesson: number | null;
    lessonTitleDisplay?: string;
    section: {code: string; label: string; titleEnglish?: string; titleSpanish?: string} | null;
    page: {number: number | null; ordinal: number | null} | null;
    titleDisplay: string;
    titleEnglish?: string;
    titleSpanish?: string | null;
  };
  source: {path: string; sha256?: string; swf?: {frameCount?: number; fps?: number}};
};

export type LessonDescriptorPage = {
  placementId: string;
  globalPageOrdinal: number;
  sectionPageOrdinal: number;
  sectionCode: LessonSectionCode;
  animationId: string;
  title: {en: string; es: string};
  frameCount: number;
  sourcePath: string;
  sourceSha256?: string;
  presentation?: {pageInteractionStageTargetIdSuffix: string};
};

export type LessonDescriptorSection = {
  code: LessonSectionCode;
  order: number;
  label: {en: string; es: string};
  firstAnimationId: string;
  activePageCount: number;
};

export type LessonDescriptor = {
  schemaVersion: 1;
  descriptorKind: 'workbench-catalog-interaction-bridge';
  playerId: typeof LESSON_PLAYER_ID;
  descriptorId: string;
  course: {
    grade: number;
    lesson: number;
    href: string;
    domIdPrefix: string;
    title: {en: string; es: string};
    activePageCount: number;
  };
  stage: {width: 800; height: 600};
  sections: LessonDescriptorSection[];
  pages: LessonDescriptorPage[];
};

export function isCitedInteractiveLesson(grade: number, lesson: number): boolean {
  return CITED_INTERACTIVE_LESSONS.some((item) => item.grade === grade && item.lesson === lesson);
}

function isSectionCode(value: string | undefined): value is LessonSectionCode {
  return Boolean(value && (SECTION_ORDER as readonly string[]).includes(value));
}

function sectionIndex(code: LessonSectionCode): number {
  return SECTION_ORDER.indexOf(code);
}

function pad(value: number, size: number): string {
  return String(value).padStart(size, '0');
}

function defaultSectionLabel(code: LessonSectionCode): {en: string; es: string} {
  switch (code) {
    case 'IR':
      return {en: 'Introduction', es: 'Introducción'};
    case 'RW':
      return {en: 'Your World', es: 'Tu mundo'};
    case 'VB':
      return {en: 'Important Words', es: 'Palabras importantes'};
    case 'IN':
      return {en: 'Learn It', es: 'Apréndelo'};
    case 'TI':
      return {en: 'Try It', es: 'Inténtalo!'};
    case 'GS':
      return {en: 'Play It', es: 'Juégalo'};
    case 'TS':
      return {en: 'Practice Test', es: 'Plan de los cuatro pasos'};
    case 'FQ':
      return {en: 'Final Quiz', es: 'Examen Final'};
    default:
      return ((exhaustive: never) => {
        throw new Error(`Unhandled section: ${String(exhaustive)}`);
      })(code);
  }
}

const LESSON_TITLE_ES: Readonly<Record<string, string>> = Object.freeze({
  'Addition and Subtraction': 'Adición y sustracción',
  'Negative Numbers': 'Números negativos',
  'Add & Subtract Negative Numbers': 'Sumar y restar números negativos'
});

const PAGE_TITLE_ES: Readonly<Record<string, string>> = Object.freeze({
  Introduction: 'Introducción'
});

function spanishNumberedTitle(kind: string, n: string): string | undefined {
  switch (kind.toLowerCase()) {
    case 'question':
      return `Pregunta ${n}`;
    case 'game':
      return `Juego ${n}`;
    case 'page':
      return `Página ${n}`;
    default:
      return undefined;
  }
}

export function localizedCatalogTitle(
  english: string,
  spanish?: string | null
): {en: string; es: string} {
  if (spanish && spanish.trim()) return {en: english, es: spanish};
  const numbered = /^(Question|Game|Page)\s+(\d+)$/i.exec(english);
  if (numbered) {
    const localized = spanishNumberedTitle(numbered[1] ?? '', numbered[2] ?? '');
    if (localized) return {en: english, es: localized};
  }
  return {en: english, es: PAGE_TITLE_ES[english] ?? LESSON_TITLE_ES[english] ?? english};
}

export function buildLessonDescriptor(
  animations: readonly LessonPageSource[],
  grade: number,
  lesson: number
): LessonDescriptor | undefined {
  const pages = animations
    .filter((item) => {
      const classification = item.classification;
      return (
        item.isCanonical &&
        item.flags.referenced &&
        !item.flags.shell &&
        classification.collection === 'course' &&
        classification.grade === grade &&
        classification.lesson === lesson &&
        isSectionCode(classification.section?.code)
      );
    })
    .sort((left, right) => {
      const leftCode = left.classification.section!.code as LessonSectionCode;
      const rightCode = right.classification.section!.code as LessonSectionCode;
      const sectionDelta = sectionIndex(leftCode) - sectionIndex(rightCode);
      if (sectionDelta !== 0) return sectionDelta;
      const pageDelta =
        (left.classification.page?.number ?? 0) - (right.classification.page?.number ?? 0);
      if (pageDelta !== 0) return pageDelta;
      return left.animationId.localeCompare(right.animationId);
    });

  if (pages.length === 0) return undefined;

  const lessonKey = `g${pad(grade, 2)}-l${pad(lesson, 2)}`;
  const descriptorPages: LessonDescriptorPage[] = pages.map((item, index) => {
    const sectionCode = item.classification.section!.code as LessonSectionCode;
    const spec = pageInteractionFor(item.animationId);
    const sectionPageOrdinal =
      pages
        .slice(0, index + 1)
        .filter((candidate) => candidate.classification.section?.code === sectionCode).length;
    return {
      placementId: `${lessonKey}-placement-${pad(index + 1, 3)}`,
      globalPageOrdinal: index + 1,
      sectionPageOrdinal,
      sectionCode,
      animationId: item.animationId,
      title: localizedCatalogTitle(
        item.classification.titleDisplay,
        item.classification.titleSpanish
      ),
      frameCount: item.source.swf?.frameCount ?? spec?.frameCount ?? 10,
      sourcePath: item.source.path,
      sourceSha256: item.source.sha256,
      ...(spec
        ? {presentation: {pageInteractionStageTargetIdSuffix: spec.stageTargetIdSuffix}}
        : {})
    };
  });

  const sections: LessonDescriptorSection[] = SECTION_ORDER.flatMap((code, order) => {
    const members = descriptorPages.filter((page) => page.sectionCode === code);
    if (members.length === 0) return [];
    const sample = pages.find((item) => item.classification.section?.code === code);
    const fallback = defaultSectionLabel(code);
    return [
      {
        code,
        order: order + 1,
        label: {
          en: sample?.classification.section?.titleEnglish ?? fallback.en,
          es: sample?.classification.section?.titleSpanish ?? fallback.es
        },
        firstAnimationId: members[0]!.animationId,
        activePageCount: members.length
      }
    ];
  });

  return {
    schemaVersion: 1,
    descriptorKind: 'workbench-catalog-interaction-bridge',
    playerId: LESSON_PLAYER_ID,
    descriptorId: `whole-lesson-player-${lessonKey}-interaction-v1`,
    course: {
      grade,
      lesson,
      href: `/courses/${grade}/${lesson}`,
      domIdPrefix: `g${grade}-l${lesson}`,
      title: localizedCatalogTitle(
        pages[0]?.classification.lessonTitleDisplay ?? `Grade ${grade} Lesson ${lesson}`
      ),
      activePageCount: descriptorPages.length
    },
    stage: {width: 800, height: 600},
    sections,
    pages: descriptorPages
  };
}

export function pageStageTargetId(
  descriptor: LessonDescriptor,
  page: LessonDescriptorPage
): string | undefined {
  if (!page.presentation?.pageInteractionStageTargetIdSuffix) return undefined;
  const spec = pageInteractionFor(page.animationId);
  return spec ? stageTargetId(descriptor.course.domIdPrefix, spec) : undefined;
}

export function pageRequiresInteraction(page: LessonDescriptorPage): boolean {
  return page.sectionCode === 'TI' || page.sectionCode === 'GS';
}

export function pageHasRegisteredInteraction(page: LessonDescriptorPage): boolean {
  return hasPageInteraction(page.animationId);
}
