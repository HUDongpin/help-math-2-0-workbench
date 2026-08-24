import 'server-only';

export interface FamilyLearningEventsV2Environment {
  FAMILY_LEARNING_EVENTS_V2_ENABLED?: string;
  FAMILY_PORTAL_ENABLED?: string;
  NODE_ENV?: string;
}

/**
 * Phase 1 is deliberately unavailable in production even if a deployment
 * accidentally carries the feature variable. The database independently
 * requires an enabled synthetic tenant.
 */
export function isFamilyLearningEventsV2Enabled(
  environment: FamilyLearningEventsV2Environment = process.env,
): boolean {
  return environment.NODE_ENV !== 'production'
    && environment.FAMILY_PORTAL_ENABLED === 'true'
    && environment.FAMILY_LEARNING_EVENTS_V2_ENABLED === 'true';
}
