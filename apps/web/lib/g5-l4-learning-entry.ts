export interface G5L4LearningEntryAvailabilityInput {
  readonly descriptorBound: boolean;
  readonly developmentAudit: boolean;
  readonly showcaseEnabled: boolean;
}

/**
 * The learner-facing G5 L4 card follows the descriptor-bound local-audit or
 * exact current-JavaScript showcase gates. Strict publication remains a
 * separate authority even when every current-JavaScript page is registered.
 */
export function resolveG5L4LearningEntryAvailability(
  input: G5L4LearningEntryAvailabilityInput,
) {
  return input.descriptorBound
    && (input.developmentAudit || input.showcaseEnabled);
}
