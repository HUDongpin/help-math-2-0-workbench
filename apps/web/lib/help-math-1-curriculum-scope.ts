/**
 * Privacy-safe historical product scope used by the learner catalog heading.
 *
 * Evidence:
 * - `help-math-modernization-recovery-audit-ai-roadmap.md` records the main
 *   HELP Math 1.0 curriculum as Grades 3–8.
 * - `catalog/NEWHELPPROGRAM_20210203.md` records 74 active lessons in the
 *   2021 snapshot: 73 structured mathematics lessons and one Earth Science
 *   exception. The exception is not counted in the mathematics catalog.
 *
 * This is a curriculum-scope statement, not a HELP Math 2.0 availability,
 * migration-completion, strict-acceptance, release, or publication claim.
 */
export const HELP_MATH_1_CURRICULUM_SCOPE = Object.freeze({
  firstGrade: 3,
  lastGrade: 8,
  gradeCount: 6,
  structuredMathLessonCount: 73,
  sqlActiveLessonCount: 74,
  nonMathActiveLessonCount: 1,
  status: 'historical-curriculum-scope-not-current-availability',
} as const);

export const HELP_MATH_1_GRADE_FILTERS = Object.freeze([
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
] as const);

export type HelpMath1GradeFilter =
  | 'all'
  | (typeof HELP_MATH_1_GRADE_FILTERS)[number];
