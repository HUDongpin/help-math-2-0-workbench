/** Static SWF/ActionScript findings, not observed original-runtime behavior. */
export const P064_SOURCE_REVIEW_LOOKUP_MISSES = [
  {questionId: 10, option: 4, clickedInstanceName: 'A10Opt4 ', computedReviewName: 'R10Opt4 '},
  {questionId: 21, option: 3, clickedInstanceName: 'A21Opt3', computedReviewName: 'R21Opt3'},
  {questionId: 23, option: 3, clickedInstanceName: 'A231Opt3', computedReviewName: 'R231Opt3'},
] as const;

export function p064ReviewLookupMiss(questionId: number, option: number) {
  return P064_SOURCE_REVIEW_LOOKUP_MISSES.find(item => item.questionId === questionId && item.option === option);
}

// Every source review frame places these four text fields. Keep the clicked
// instance's exact suffix: Q10 D includes a trailing space that the source
// ActionScript does not trim before building its feedback-field lookup.
const P064_SOURCE_REVIEW_FEEDBACK_FIELDS = ['TxtFeed1', 'TxtFeed2', 'TxtFeed3', 'TxtFeed4'] as const;

export function p064ReviewTargetMiss(questionId: number, option: number) {
  const miss = p064ReviewLookupMiss(questionId, option);
  if (!miss) return undefined;
  const optMarker = miss.clickedInstanceName.indexOf('Opt');
  if (optMarker < 0) throw new Error('P064 clicked instance has no Opt suffix');
  const computedFeedbackName = `TxtFeed${miss.clickedInstanceName.slice(optMarker + 3)}`;
  return {
    ...miss,
    computedFeedbackName,
    feedbackFieldLookupMiss: !P064_SOURCE_REVIEW_FEEDBACK_FIELDS.some(name => name === computedFeedbackName),
  };
}

export const P064_Q5_DYNAMIC_FIELD_DEFAULTS = [
  'Txt1', 'Txt2', 'Txt3', 'Txt4', 'Txt5', 'Txt6', 'Txt7', 'Txt8', 'Txt9', 'Txt10',
] as const;
