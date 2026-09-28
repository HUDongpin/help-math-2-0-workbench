// Shared by TS007 and TS008. This preserves their Current-JS policy; it does
// not emulate Flash random() or establish original-runtime random parity.
export const normalizePracticeQuestionSeed = (seed: number): number =>
  Number.isSafeInteger(seed) ? seed >>> 0 : 0;

export const selectPracticeQuestionFeedback = <
  Choice extends Readonly<{id: string; correct: boolean}>,
  Window,
>(
  choices: readonly Choice[],
  choiceId: string,
  seed: number,
  rightWindows: readonly Window[],
  wrongWindows: readonly Window[],
) => {
  const choice = choices.find(({id}) => id === choiceId);
  if (!choice) return null;
  const windows = choice.correct ? rightWindows : wrongWindows;
  const branch = (seed % windows.length) + 1;
  const sourceWindow = windows[branch - 1];
  if (!sourceWindow) return null;
  return Object.freeze({choice, branch, sourceWindow});
};

// The caller owns frame numbers, focus, and whether terminal state retains or
// resets the wrong-try counter. Only pages with this exact policy may reuse it.
export const twoAttemptFeedbackDestination = (
  kind: "right" | "wrong",
  wrongTryCount: 0 | 1,
): "terminal" | "quiz" =>
  kind === "right" || wrongTryCount === 1 ? "terminal" : "quiz";
