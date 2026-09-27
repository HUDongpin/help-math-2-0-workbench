import type {AnimationLanguage, MovieMetadata, RuntimeContext} from '../contract';

export const COURSE_SHELL_G04_L01_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: 50,
  durationMs: (50 * 1_000) / 12
});

export const COURSE_SHELL_G04_L01_SOURCE = Object.freeze({
  animationId: 'shell-course-g04-l01-index-local',
  swfSha256: 'ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e',
  courseXmlSha256: 'b14d31c2f2c7cd83cc1e2de8bfe5463734b64572756b2677c09e851c46c670b2',
  courseName: 'Counting on Numbers',
  lessonTitleEnglish: 'Place Value',
  lessonTitleSpanish: 'Valor posicional',
  lessonTitleSpanishEvidence:
    'index.xml does not contain a lesson-level Spanish title; this exact term is reused from the VB Place Value SubPageTitle in the same XML.',
  rootStopFrame: 50,
  rootDefaultSection: 'IR' as const,
  rootDefaultPage: 2
});

export const COURSE_SHELL_SECTION_CODES = Object.freeze([
  'IR',
  'RW',
  'VB',
  'IN',
  'TI',
  'GS',
  'TS',
  'FQ'
] as const);

export type CourseShellSectionCode = (typeof COURSE_SHELL_SECTION_CODES)[number];
export type CourseShellPhase = 'loading-content' | 'loading-layout' | 'loading-page' | 'ready';
export type CourseShellView = 'menu' | 'section' | 'quit-confirmation';

export interface CourseShellPage {
  readonly ordinal: number;
  readonly number: number;
  readonly titleEnglish: string;
  readonly titleSpanish?: string;
  readonly sourcePath: string;
  readonly animationId: string | null;
  readonly sourceDisposition: 'present-pending-acceptance' | 'missing-source';
  /** A route is admitted only after the completion ledger contains the target. */
  readonly strictRoute: string | null;
}

export interface CourseShellSection {
  readonly code: CourseShellSectionCode;
  readonly number: number;
  readonly titleEnglish: string;
  readonly titleSpanish: string;
  readonly sourceButtonLocation: Readonly<{x: number; y: number}> | null;
  readonly pages: readonly CourseShellPage[];
}

const PRESENT_PAGE_IDS: Readonly<Record<string, string>> = Object.freeze({
  'FQ/L1FQ01.swf': 'course-g04-l01-fq-001',
  'FQ/L1FQ02.swf': 'course-g04-l01-fq-002',
  'FQ/L1FQ03.swf': 'course-g04-l01-fq-003',
  'IN/L1IN08.swf': 'course-g04-l01-in-008',
  'IN/L1IN13.swf': 'course-g04-l01-in-013',
  'IN/L1IN14.swf': 'course-g04-l01-in-014',
  'IN/L1IN23.swf': 'course-g04-l01-in-023',
  'IN/L1IN29.swf': 'course-g04-l01-in-029',
  'IN/L1IN30.swf': 'course-g04-l01-in-030',
  'IN/L1IN32.swf': 'course-g04-l01-in-032',
  'IN/L1IN34.swf': 'course-g04-l01-in-034',
  'IR/L1RW01.swf': 'course-g04-l01-ir-001',
  'TS/L1TS04.swf': 'course-g04-l01-ts-004',
  'TS/L1TS05.swf': 'course-g04-l01-ts-005',
  'TS/L1TS06.swf': 'course-g04-l01-ts-006',
  'TS/L1TS07.swf': 'course-g04-l01-ts-007',
  'VB/L1VB06.swf': 'course-g04-l01-vb-006',
  'VB/L1VB09.swf': 'course-g04-l01-vb-009',
  'VB/L1VB10.swf': 'course-g04-l01-vb-010',
  'VB/L1VB11.swf': 'course-g04-l01-vb-011',
  'VB/L1VB17.swf': 'course-g04-l01-vb-017'
});

// The repository currently has zero strict-complete Grade 4 Lesson 1 child pages.
// Keeping this snapshot empty makes the candidate fail closed: no child route is emitted.
const STRICT_COMPLETE_PAGE_IDS = new Set<string>();

const VB_TITLES = Object.freeze([
  'Digit',
  'Place Value',
  'Place Value',
  'Place Value',
  'Periods',
  'Periods',
  'Base 10 Number System',
  'Standard Form',
  'Word Form',
  'Expanded Form',
  'Which form?',
  'Which form?',
  'Decimal',
  'Decimal Point',
  'Decimal Point',
  'Tenth',
  'Hundredth',
  'Tenth Practice',
  'Hundredth Practice',
  'Number Line',
  'Compare Numbers',
  'Order Numbers',
  'Order Numbers',
  'Round'
]);

const IN_TITLES = Object.freeze([
  'Base 10 Blocks',
  'Base 10 Blocks',
  'Read Numbers',
  'Write Numbers',
  'Write Numbers',
  'Write Numbers',
  'Value of Digits',
  'Value of Digits/Expanded Form',
  'Value of Digits Practice',
  'Compare Numbers',
  'Compare Numbers',
  'Order Numbers',
  'Order Numbers',
  'Round Numbers',
  'Round Numbers',
  'Round Numbers',
  'Round Numbers',
  'Solve Problems with Rounding',
  'Base 10 Blocks/Decimals',
  'Base 10 Blocks/Decimals',
  'Read Decimals',
  'Write Decimals',
  'Write Decimals',
  'Write Decimals',
  'Value of Digits/Decimals',
  'Compare Decimals',
  'Compare Decimals',
  'Order Decimals',
  'Order Decimals',
  'Round Decimals',
  'Round Decimals',
  'Round Decimals',
  'Round Decimals',
  'Round Decimals',
  'Solve problems with rounding'
]);

const VB_SPANISH_START_TITLES: Readonly<Record<number, string>> = Object.freeze({
  2: 'Dígito',
  3: 'Valor posicional',
  6: 'Períodos',
  8: 'Sistema numérico base diez',
  9: 'Forma estándar',
  10: 'Forma escrita',
  11: 'Forma ampliada',
  12: '¿Cuál forma?',
  14: 'Decimal',
  15: 'Punto decimal',
  17: 'Décimo',
  18: 'Centésimo',
  19: 'Práctica de décimo',
  20: 'Práctica de centésimo',
  21: 'Recta numérica',
  22: 'Comparación de números',
  23: 'Ordenación de números',
  25: 'Redondeo'
});

const IN_SPANISH_START_TITLES: Readonly<Record<number, string>> = Object.freeze({
  2: 'Bloques de base 10',
  4: 'Lectura de números',
  5: 'Escritura de números',
  8: 'Valor de los dígitos',
  9: 'Valor de los dígitos / Forma ampliada',
  10: 'Práctica del valor de los dígitos',
  11: 'Comparación de números',
  13: 'Ordenación de números',
  15: 'Redondeo de números',
  19: 'Solución de problemas con redondeo',
  20: 'Bloques de base 10/ Decimales',
  22: 'Lectura de decimales',
  23: 'Escritura de decimales',
  26: 'Valor de los dígitos / Decimales',
  27: 'Comparación de decimales',
  29: 'Ordenación de decimales',
  31: 'Redondeo de decimales',
  36: 'Solución de problemas con redondeo'
});

function sourcePath(code: CourseShellSectionCode, pageNumber: number): string {
  if (code === 'IR') return 'IR/L1RW01.swf';
  return `${code}/L1${code}${String(pageNumber).padStart(2, '0')}.swf`;
}

function makePage(
  code: CourseShellSectionCode,
  pageNumber: number,
  titleEnglish: string,
  ordinal: number,
  titleSpanish?: string
): CourseShellPage {
  const path = sourcePath(code, pageNumber);
  const animationId = PRESENT_PAGE_IDS[path] ?? null;
  const strictRoute = animationId && STRICT_COMPLETE_PAGE_IDS.has(animationId)
    ? `/animations/${animationId}`
    : null;
  return Object.freeze({
    ordinal,
    number: pageNumber,
    titleEnglish,
    ...(titleSpanish ? {titleSpanish} : {}),
    sourcePath: path,
    animationId,
    sourceDisposition: animationId ? 'present-pending-acceptance' : 'missing-source',
    strictRoute
  });
}

function numberedPages(
  code: CourseShellSectionCode,
  firstPageNumber: number,
  titles: readonly string[],
  spanishTitles: Readonly<Record<number, string>> = {}
): readonly CourseShellPage[] {
  return Object.freeze(
    titles.map((title, index) => {
      const pageNumber = firstPageNumber + index;
      return makePage(code, pageNumber, title, index + 1, spanishTitles[pageNumber]);
    })
  );
}

export const COURSE_SHELL_G04_L01_SECTIONS: readonly CourseShellSection[] = Object.freeze([
  Object.freeze({
    code: 'IR',
    number: 1,
    titleEnglish: 'Introduction',
    titleSpanish: 'Introduction',
    sourceButtonLocation: null,
    pages: Object.freeze([makePage('IR', 1, 'Introduction', 1)])
  }),
  Object.freeze({
    code: 'RW',
    number: 2,
    titleEnglish: 'Your World',
    titleSpanish: 'Tu mundo',
    sourceButtonLocation: Object.freeze({x: -155.05, y: -278.25}),
    pages: numberedPages('RW', 2, ['Page 1', 'Page 2', 'Page 3', 'Page 4'])
  }),
  Object.freeze({
    code: 'VB',
    number: 3,
    titleEnglish: 'Important Words',
    titleSpanish: 'Palabras importantes',
    sourceButtonLocation: Object.freeze({x: -155.05, y: -238.8}),
    pages: numberedPages('VB', 2, VB_TITLES, VB_SPANISH_START_TITLES)
  }),
  Object.freeze({
    code: 'IN',
    number: 4,
    titleEnglish: 'Learn It',
    titleSpanish: 'Apréndelo',
    sourceButtonLocation: Object.freeze({x: -155.05, y: -199.35}),
    pages: numberedPages('IN', 2, IN_TITLES, IN_SPANISH_START_TITLES)
  }),
  Object.freeze({
    code: 'TI',
    number: 5,
    titleEnglish: 'Try It',
    titleSpanish: 'Inténtalo!',
    sourceButtonLocation: Object.freeze({x: -155.05, y: -159.9}),
    pages: numberedPages('TI', 2, ['Question 1', 'Question 2', 'Question 3', 'Question 4', 'Question 5'])
  }),
  Object.freeze({
    code: 'GS',
    number: 6,
    titleEnglish: 'Play It',
    titleSpanish: 'Juégalo',
    sourceButtonLocation: Object.freeze({x: -155.05, y: -120.45}),
    pages: numberedPages('GS', 2, ['Game 1'])
  }),
  Object.freeze({
    code: 'TS',
    number: 7,
    titleEnglish: 'Practice Test',
    titleSpanish: 'Plan de los cuatro pasos',
    sourceButtonLocation: Object.freeze({x: -155.05, y: -81}),
    pages: numberedPages(
      'TS',
      2,
      ['4 - Step Plan', '4 - Step Plan', '4 - Step Plan', '4 - Step Plan', '4 - Step Plan', 'Question 1', 'Question 2'],
      {2: 'Plan de 4 Pasos', 7: 'Pregunta 1', 8: 'Pregunta 2'}
    )
  }),
  Object.freeze({
    code: 'FQ',
    number: 8,
    titleEnglish: 'Final Quiz',
    titleSpanish: 'Examen Final',
    sourceButtonLocation: Object.freeze({x: -155.05, y: -41.55}),
    pages: numberedPages('FQ', 1, ['Introduction', 'Page 1', 'Page 2'])
  })
]);

export interface CourseShellFrameState {
  readonly frameDomain: 'root';
  readonly frame: number;
  readonly rootFrame: number;
  readonly status: 'ready';
  readonly blocker: null;
  readonly phase: CourseShellPhase;
  readonly progress: number;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly scenario: string;
  readonly view: CourseShellView;
  readonly selectedSection: CourseShellSectionCode | null;
  readonly courseTitle: string;
  readonly lessonTitle: string;
  readonly sections: readonly CourseShellSection[];
}

export interface CourseShellInteractionState {
  readonly view: CourseShellView;
  readonly selectedSection: CourseShellSectionCode | null;
}

export type CourseShellEvent =
  | Readonly<{type: 'select-section'; section: CourseShellSectionCode}>
  | Readonly<{type: 'show-menu'}>
  | Readonly<{type: 'request-quit'}>
  | Readonly<{type: 'cancel-quit'}>
  | Readonly<{type: 'replay'}>;

export function normalizeCourseShellFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(COURSE_SHELL_G04_L01_MOVIE.frameCount, Math.max(1, Math.trunc(frame)));
}

export function courseShellPhaseAtFrame(frame: number): CourseShellPhase {
  const normalized = normalizeCourseShellFrame(frame);
  if (normalized <= 37) return 'loading-content';
  if (normalized <= 48) return 'loading-layout';
  if (normalized === 49) return 'loading-page';
  return 'ready';
}

export function courseShellInteractionForScenario(scenario: string): CourseShellInteractionState {
  if (scenario === 'quit-confirmation') {
    return Object.freeze({view: 'quit-confirmation', selectedSection: null});
  }
  if (scenario.startsWith('section-')) {
    const requested = scenario.slice('section-'.length).toUpperCase();
    const section = COURSE_SHELL_SECTION_CODES.find((code) => code === requested);
    if (section) return Object.freeze({view: 'section', selectedSection: section});
  }
  return Object.freeze({view: 'menu', selectedSection: null});
}

export function transitionCourseShell(
  state: CourseShellInteractionState,
  event: CourseShellEvent
): CourseShellInteractionState {
  switch (event.type) {
    case 'select-section':
      return Object.freeze({view: 'section', selectedSection: event.section});
    case 'request-quit':
      return Object.freeze({view: 'quit-confirmation', selectedSection: state.selectedSection});
    case 'cancel-quit':
      return Object.freeze({
        view: state.selectedSection ? 'section' : 'menu',
        selectedSection: state.selectedSection
      });
    case 'show-menu':
    case 'replay':
      return Object.freeze({view: 'menu', selectedSection: null});
  }
}

export function getCourseShellFrameState(
  frame: number,
  context: Pick<RuntimeContext, 'lang' | 'scenario' | 'seed'>
): CourseShellFrameState {
  const normalized = normalizeCourseShellFrame(frame);
  const phase = courseShellPhaseAtFrame(normalized);
  const interaction = phase === 'ready'
    ? courseShellInteractionForScenario(context.scenario)
    : Object.freeze({view: 'menu' as const, selectedSection: null});
  return Object.freeze({
    frameDomain: 'root',
    frame: normalized,
    rootFrame: normalized,
    status: 'ready',
    blocker: null,
    phase,
    progress: Math.round((normalized / COURSE_SHELL_G04_L01_MOVIE.frameCount) * 100),
    language: context.lang,
    seed: context.seed,
    scenario: context.scenario,
    view: interaction.view,
    selectedSection: interaction.selectedSection,
    courseTitle: COURSE_SHELL_G04_L01_SOURCE.courseName,
    lessonTitle:
      context.lang === 'es'
        ? COURSE_SHELL_G04_L01_SOURCE.lessonTitleSpanish
        : COURSE_SHELL_G04_L01_SOURCE.lessonTitleEnglish,
    sections: COURSE_SHELL_G04_L01_SECTIONS
  });
}
