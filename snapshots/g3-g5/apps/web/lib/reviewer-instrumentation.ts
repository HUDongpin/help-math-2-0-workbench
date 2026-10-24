/**
 * Reviewer instrumentation gate.
 *
 * `candidateMode` means "this lesson is a current-JavaScript candidate, not a
 * strict-complete public release". That is a release-status fact and it must
 * keep being disclosed.
 *
 * It had also come to mean "render the engineering instruments": the frame
 * inspector, the +/- frame stepper, the inspect-frame slider, and the
 * transport-parity notice. Those are audit tools. Because every lesson is a
 * candidate today, they render for every audience including the executive
 * preview, which is the one build where scaffolding is least wanted.
 *
 * This splits the two. Instruments now require an explicit opt-in; release
 * status keeps disclosing itself exactly as before.
 *
 * Enabling instrumentation confers no acceptance of any kind and changes no
 * page content. It only decides whether audit affordances are rendered.
 */

export type ReviewerInstrumentationEnvironment =
  Readonly<Record<string, string | undefined>>;

export function isReviewerInstrumentationEnabled(
  env: ReviewerInstrumentationEnvironment = process.env,
) {
  return env.REVIEWER_INSTRUMENTATION_ENABLED === 'true';
}
