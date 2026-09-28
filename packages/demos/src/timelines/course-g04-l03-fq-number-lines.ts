import type {CourseG04L03Fq002OptionId} from "./course-g04-l03-fq-002-quiz-interaction";

/**
 * Maintained semantic reconstruction of FQ002/FQ003 Q7–Q12. Animation04
 * authoring geometry and the SWF question/option shapes bind A square, B circle,
 * C triangle, D heart. The three diagrams use unit ticks, with labelled steps
 * of five. See work/g4-l3-modern-product-review/20260908-final-quiz for the
 * source hashes, coordinate audit, and the source scoring cross-check.
 * FQ003 Q8 retains its separately declared Owner-directed TS007 presentation.
 */
export const FQ_SYMBOL_NAMES = Object.freeze({
  A: "Square", B: "Circle", C: "Triangle", D: "Heart",
} satisfies Record<CourseG04L03Fq002OptionId, string>);

export interface FinalQuizNumberLine {
  readonly min: number;
  readonly max: number;
  readonly positions: Readonly<Record<CourseG04L03Fq002OptionId, number>>;
}

const FIVE = Object.freeze({
  min: -5, max: 5,
  positions: Object.freeze({A: -4, B: -2, C: 2, D: 4}),
});
const TEN = Object.freeze({
  min: -10, max: 10,
  positions: Object.freeze({A: -8, B: -1, C: 4, D: 8}),
});
const FIFTEEN = Object.freeze({
  min: -15, max: 15,
  positions: Object.freeze({A: -11, B: -6, C: 6, D: 11}),
});

export const FQ_NUMBER_LINES: Readonly<Record<number, FinalQuizNumberLine>> =
  Object.freeze({7: FIVE, 8: FIVE, 9: TEN, 10: TEN, 11: FIFTEEN, 12: FIFTEEN});
