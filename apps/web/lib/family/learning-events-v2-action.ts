'use server';

import {
  FamilyAccessError,
  requireFamilyAuthorization,
} from './authorization.server';
import {
  type LearningEventV2Receipt,
  parseLearningEventV2ReceiptEnvelope,
} from './learning-events-v2-contract';
import {isFamilyLearningEventsV2Enabled} from
  './learning-events-v2-feature.server';
import {learningEventV2BatchSchema} from './schemas';
import {createFamilyRequestClient} from './supabase.server';
import type {
  FamilyActionErrorCode,
  FamilyActionResult,
} from './types';

function failure(error: FamilyActionErrorCode): FamilyActionResult<never> {
  return {error, ok: false};
}

function accessFailure(error: unknown): FamilyActionResult<never> {
  if (!(error instanceof FamilyAccessError)) return failure('RETRY_LATER');
  const mapped: Partial<Record<typeof error.code, FamilyActionErrorCode>> = {
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    FEATURE_DISABLED: 'FEATURE_DISABLED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    RETRY_LATER: 'RETRY_LATER',
  };
  return failure(mapped[error.code] ?? 'RETRY_LATER');
}

function rpcFailure(error: {code?: string}): FamilyActionErrorCode {
  if (error.code === '42501') return 'FORBIDDEN';
  if (error.code === 'P0002') return 'NOT_FOUND';
  if (error.code === '22023' || error.code === '23514') return 'INVALID_INPUT';
  return 'RETRY_LATER';
}

export async function recordAssignmentLearningEventsV2(
  input: unknown,
): Promise<FamilyActionResult<LearningEventV2Receipt>> {
  if (!isFamilyLearningEventsV2Enabled()) return failure('FEATURE_DISABLED');
  const parsed = learningEventV2BatchSchema.safeParse(input);
  if (
    !parsed.success
    || parsed.data.events.some(({eventType, outcome}) => (
      eventType === 'practice_evaluated'
      || (eventType === 'page_reviewed' && outcome !== 'completed')
      || (eventType !== 'page_reviewed' && outcome !== 'none')
    ))
  ) return failure('INVALID_INPUT');

  try {
    const context = await requireFamilyAuthorization({roles: ['learner']});
    if (context.synthetic) return failure('FEATURE_DISABLED');

    const database = await createFamilyRequestClient();
    const result = await database.rpc('record_assignment_learning_events_v2', {
      p_events: parsed.data.events.map((event) => ({
        ...event,
        schemaVersion: 2,
      })),
    });
    if (result.error) return failure(rpcFailure(result.error));

    const receipt = parseLearningEventV2ReceiptEnvelope(
      result.data,
      context.currentTenantId,
    );
    if (!receipt.ok) {
      return failure(
        receipt.reason === 'tenant-mismatch' ? 'FORBIDDEN' : 'RETRY_LATER',
      );
    }
    if (
      receipt.data.inserted + receipt.data.ignored !==
        parsed.data.events.length
    ) return failure('RETRY_LATER');
    return {data: receipt.data, ok: true};
  } catch (error) {
    return accessFailure(error);
  }
}
