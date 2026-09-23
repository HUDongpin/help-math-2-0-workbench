export type G4L3Locale = 'en' | 'es';
export type G4L3SectionCode = 'IR' | 'RW' | 'VB' | 'IN' | 'TI' | 'GS' | 'TS' | 'FQ';
export type G4L3BatchId = 'batch-001' | 'batch-002';
export type G4L3XmlNavigation = 'ON' | 'OFF' | null;

export interface G4L3Section {
  order: number;
  code: G4L3SectionCode;
  titleEnglish: string;
  titleSpanish: string;
  firstActiveAnimationId: string;
  activePageCount: number;
}

export interface G4L3Page {
  globalPageOrdinal: number;
  sectionPageOrdinal: number;
  sectionCode: G4L3SectionCode;
  animationId: string;
  titleEnglish: string;
  titleSpanish: string | null;
  spanishTitleStatus: 'exact-subpage-anchor-label' | 'missing-page-level-spanish-title';
  batchId: G4L3BatchId;
  xmlNavigation: G4L3XmlNavigation;
  xmlBackgroundText: boolean;
  previousAnimationId: string | null;
  nextAnimationId: string | null;
}

export interface G4L3DisplayLabel {
  text: string;
  sourceLanguage: G4L3Locale;
  sourceStatus: 'exact-course-xml' | 'exact-page-title-attribute' | 'exact-subpage-anchor-label' | 'missing-page-level-spanish-title';
  usesEnglishFallback: boolean;
}

type PageRow = readonly [
  sectionCode: G4L3SectionCode,
  sectionPageOrdinal: number,
  animationId: string,
  titleEnglish: string,
  titleSpanish: string | null,
  batchId: G4L3BatchId,
  xmlNavigation?: Exclude<G4L3XmlNavigation, null>,
  xmlBackgroundText?: boolean,
];

const SECTION_ROWS = [
  ['IR', 'Introduction', 'Introduction'],
  ['RW', 'Your World', 'Tu mundo'],
  ['VB', 'Important Words', 'Palabras importantes'],
  ['IN', 'Learn It', 'Apréndelo'],
  ['TI', 'Try It', 'Inténtalo!'],
  ['GS', 'Play It', 'Juégalo'],
  ['TS', 'Practice Test', 'Plan de los cuatro pasos'],
  ['FQ', 'Final Quiz', 'Examen Final'],
] as const satisfies readonly (readonly [G4L3SectionCode, string, string])[];

const PAGE_ROWS = [
  ['IR', 1, 'course-g04-l03-ir-001-341242cc', 'Introduction', null, 'batch-001', undefined, true],
  ['RW', 1, 'course-g04-l03-rw-002', 'Page 1', null, 'batch-001'],
  ['RW', 2, 'course-g04-l03-rw-003', 'Page 2', null, 'batch-001'],
  ['RW', 3, 'course-g04-l03-rw-004', 'Page 3', null, 'batch-001'],
  ['VB', 1, 'course-g04-l03-vb-002', 'Number Line', 'Recta numérica', 'batch-001'],
  ['VB', 2, 'course-g04-l03-vb-003', 'Number Line Practice', 'Práctica de la recta numérica', 'batch-001'],
  ['VB', 3, 'course-g04-l03-vb-004', 'Positive Numbers', 'Números positivos', 'batch-001'],
  ['VB', 4, 'course-g04-l03-vb-005', 'Negative Numbers', 'Números negativos', 'batch-001'],
  ['VB', 5, 'course-g04-l03-vb-006', 'Zero', 'Cero', 'batch-001'],
  ['VB', 6, 'course-g04-l03-vb-007', 'Positive Numbers Practice', 'Práctica de números positivos', 'batch-001'],
  ['VB', 7, 'course-g04-l03-vb-008', 'Negative Numbers Practice', 'Práctica de números negativos', 'batch-001'],
  ['VB', 8, 'course-g04-l03-vb-009', 'Pattern', 'Patrón', 'batch-001'],
  ['IN', 1, 'course-g04-l03-in-002', 'Numbers on the Number Line', 'Los números en la recta numérica', 'batch-001'],
  ['IN', 2, 'course-g04-l03-in-003', 'Numbers on the Number Line', null, 'batch-001'],
  ['IN', 3, 'course-g04-l03-in-004', 'Numbers on the Number Line', null, 'batch-001'],
  ['IN', 4, 'course-g04-l03-in-005', 'Numbers on the Number Line', null, 'batch-001'],
  ['IN', 5, 'course-g04-l03-in-006', 'Numbers on the Number Line', null, 'batch-001'],
  ['IN', 6, 'course-g04-l03-in-007', 'Patterns', 'Patrones', 'batch-001'],
  ['IN', 7, 'course-g04-l03-in-008', 'Patterns', null, 'batch-001'],
  ['IN', 8, 'course-g04-l03-in-009', 'Situations with Negative Numbers: Temperature', 'Situaciones con números negativos Temperature:Temperatura', 'batch-001'],
  ['IN', 9, 'course-g04-l03-in-010', 'Situations with Negative Numbers: Temperature', null, 'batch-001'],
  ['IN', 10, 'course-g04-l03-in-011', 'Situations with Negative Numbers: Owing', 'Situaciones con números negativos : Deber', 'batch-001'],
  ['IN', 11, 'course-g04-l03-in-012', 'Situations with Negative Numbers: Owing', null, 'batch-001'],
  ['TI', 1, 'course-g04-l03-ti-002', 'Question 1', null, 'batch-001'],
  ['TI', 2, 'course-g04-l03-ti-003', 'Question 2', null, 'batch-001'],
  ['TI', 3, 'course-g04-l03-ti-004', 'Question 3', null, 'batch-002'],
  ['TI', 4, 'course-g04-l03-ti-005', 'Question 4', null, 'batch-002'],
  ['TI', 5, 'course-g04-l03-ti-006', 'Question 5', null, 'batch-002'],
  ['GS', 1, 'course-g04-l03-gs-002', 'Game 1', null, 'batch-002'],
  ['TS', 1, 'course-g04-l03-ts-002', '4 - Step Plan', 'Plan de 4 Pasos', 'batch-002'],
  ['TS', 2, 'course-g04-l03-ts-003', '4 - Step Plan', null, 'batch-002'],
  ['TS', 3, 'course-g04-l03-ts-004', '4 - Step Plan', null, 'batch-002'],
  ['TS', 4, 'course-g04-l03-ts-005', '4 - Step Plan', null, 'batch-002'],
  ['TS', 5, 'course-g04-l03-ts-006', '4 - Step Plan', null, 'batch-002'],
  ['TS', 6, 'course-g04-l03-ts-007', 'Question 1', 'Pregunta 1', 'batch-002'],
  ['TS', 7, 'course-g04-l03-ts-008', 'Question 2', 'Pregunta 2', 'batch-002'],
  ['FQ', 1, 'course-g04-l03-fq-001', 'Introduction', null, 'batch-002', 'ON'],
  ['FQ', 2, 'course-g04-l03-fq-002', 'Page 1', null, 'batch-002', 'OFF'],
  ['FQ', 3, 'course-g04-l03-fq-003', 'Page 2', null, 'batch-002', 'ON'],
] as const satisfies readonly PageRow[];

const pages = PAGE_ROWS.map((row, index): G4L3Page => Object.freeze({
  globalPageOrdinal: index + 1,
  sectionPageOrdinal: row[1],
  sectionCode: row[0],
  animationId: row[2],
  titleEnglish: row[3],
  titleSpanish: row[4],
  spanishTitleStatus: row[4] === null ? 'missing-page-level-spanish-title' : 'exact-subpage-anchor-label',
  batchId: row[5],
  xmlNavigation: row[6] ?? null,
  xmlBackgroundText: row[7] ?? false,
  previousAnimationId: PAGE_ROWS[index - 1]?.[2] ?? null,
  nextAnimationId: PAGE_ROWS[index + 1]?.[2] ?? null,
}));

const sections = SECTION_ROWS.map((row, index): G4L3Section => {
  const sectionPages = pages.filter((page) => page.sectionCode === row[0]);
  return Object.freeze({
    order: index + 1,
    code: row[0],
    titleEnglish: row[1],
    titleSpanish: row[2],
    firstActiveAnimationId: sectionPages[0]!.animationId,
    activePageCount: sectionPages.length,
  });
});

export const G4_L3_LESSON = Object.freeze({
  releaseId: 'lesson-g04-l03-negative-numbers',
  grade: 4,
  lesson: 3,
  titleEnglish: 'Negative Numbers',
  titleSpanish: null,
  titleSpanishStatus: 'missing-lesson-level-spanish-title' as const,
  shellAnimationId: 'shell-course-g04-l03-index-local',
  activePageCount: 39,
  courseShellCount: 1,
  sourceContract: Object.freeze({
    path: 'reports/g4-l3-lesson-product-navigation-contract.json',
    sourceXmlPath: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index.xml',
    sourceXmlSha256: '0f1109321a5b65507c36fb8fd30380c4899cb7f381c2959aa7092d59bba990b0',
    sequenceAuthority: 'active-course-xml-global-page-order' as const,
    shippedShellSequenceConflictResolved: false,
  }),
  acceptance: Object.freeze({
    originalRuntimeComplete: false,
    navigationBehaviorComplete: false,
    fullFrameRmseComplete: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
  }),
  sections: Object.freeze(sections),
  pages: Object.freeze(pages),
});

const pageById = new Map(G4_L3_LESSON.pages.map((page) => [page.animationId, page]));
const sectionByCode = new Map(G4_L3_LESSON.sections.map((section) => [section.code, section]));
const releaseMemberIds = new Set([
  ...G4_L3_LESSON.pages.map((page) => page.animationId),
  G4_L3_LESSON.shellAnimationId,
]);

export interface G4L3PublicationOptions {
  auditPreview: boolean;
  completeAnimationIds: ReadonlySet<string>;
  releasePublished: boolean;
}

export function isG4L3Lesson(grade: string | number, lesson: string | number): boolean {
  return String(grade) === '4' && String(Number(lesson)) === '3';
}

export function findG4L3Page(animationId: string): G4L3Page | undefined {
  return pageById.get(animationId);
}

export function findG4L3Section(code: G4L3SectionCode): G4L3Section {
  return sectionByCode.get(code)!;
}

export function isG4L3Shell(animationId: string): boolean {
  return animationId === G4_L3_LESSON.shellAnimationId;
}

export function getG4L3PageLabel(page: G4L3Page, locale: G4L3Locale): G4L3DisplayLabel {
  if (locale === 'es' && page.titleSpanish !== null) {
    return {text: page.titleSpanish, sourceLanguage: 'es', sourceStatus: 'exact-subpage-anchor-label', usesEnglishFallback: false};
  }
  return {
    text: page.titleEnglish,
    sourceLanguage: 'en',
    sourceStatus: locale === 'es' ? 'missing-page-level-spanish-title' : 'exact-page-title-attribute',
    usesEnglishFallback: locale === 'es',
  };
}

export function getG4L3SectionLabel(section: G4L3Section, locale: G4L3Locale): G4L3DisplayLabel {
  return {
    text: locale === 'es' ? section.titleSpanish : section.titleEnglish,
    sourceLanguage: locale,
    sourceStatus: 'exact-course-xml',
    usesEnglishFallback: false,
  };
}

export function getVisibleG4L3Pages(options: {
  auditPreview: boolean;
  completeAnimationIds: ReadonlySet<string>;
  releasePublished: boolean;
}): readonly G4L3Page[] {
  return options.auditPreview || isG4L3ReleaseOpen(options) ? G4_L3_LESSON.pages : [];
}

export function isG4L3ReleaseOpen(options: G4L3PublicationOptions): boolean {
  return options.releasePublished &&
    releaseMemberIds.size === G4_L3_LESSON.activePageCount + G4_L3_LESSON.courseShellCount &&
    [...releaseMemberIds].every((animationId) => options.completeAnimationIds.has(animationId));
}

export function canNavigateToG4L3Animation(
  animationId: string | null,
  options: G4L3PublicationOptions,
): boolean {
  return animationId !== null &&
    releaseMemberIds.has(animationId) &&
    (options.auditPreview || isG4L3ReleaseOpen(options));
}
