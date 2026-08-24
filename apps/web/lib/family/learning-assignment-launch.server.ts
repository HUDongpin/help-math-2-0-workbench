import 'server-only';

import {
  FamilyAccessError,
  requireFamilyAuthorization,
} from './authorization.server';
import {
  type LearningAssignmentLaunch,
  learningAssignmentLocatorSchema,
  parseLearningAssignmentLaunchEnvelope,
} from './learning-events-v2-contract';
import {isFamilyLearningEventsV2Enabled} from
  './learning-events-v2-feature.server';
import {createFamilyRequestClient} from './supabase.server';

function throwRpcAccessError(error: {code?: string} | null): never {
  if (error?.code === '42501') throw new FamilyAccessError('FORBIDDEN');
  if (error?.code === 'P0002') throw new FamilyAccessError('NOT_FOUND');
  throw new FamilyAccessError('RETRY_LATER');
}

export async function readLearningAssignmentLaunch(
  assignmentId: string,
): Promise<LearningAssignmentLaunch> {
  if (!isFamilyLearningEventsV2Enabled()) {
    throw new FamilyAccessError('FEATURE_DISABLED');
  }
  const parsedId = learningAssignmentLocatorSchema.safeParse(assignmentId);
  if (!parsedId.success) throw new FamilyAccessError('NOT_FOUND');

  const context = await requireFamilyAuthorization({roles: ['learner']});
  // The cookie-backed UI demo has no signed database identity. Treating its
  // no-op state as a recorded learner event would be misleading.
  if (context.synthetic) throw new FamilyAccessError('FEATURE_DISABLED');

  const database = await createFamilyRequestClient();
  const result = await database.rpc('learning_assignment_launch_v1', {
    p_assignment_id: parsedId.data,
  });
  if (result.error) throwRpcAccessError(result.error);

  const parsed = parseLearningAssignmentLaunchEnvelope(
    result.data,
    context.currentTenantId,
  );
  if (!parsed.ok && parsed.reason === 'tenant-mismatch') {
    throw new FamilyAccessError('FORBIDDEN');
  }
  if (!parsed.ok) throw new FamilyAccessError('RETRY_LATER');
  return parsed.data;
}
