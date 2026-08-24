import 'server-only';

import {requireFamilyAuthorization, FamilyAccessError} from './authorization.server';
import {teacherFamilyInboxDtoSchema} from './dto-schemas';
import {createFamilyRequestClient} from './supabase.server';
import type {TeacherFamilyInbox} from './types';

export const TEACHER_FAMILY_INBOX_RPC =
  'teacher_family_inbox_for_tenant_v1' as const;

export async function readTeacherFamilyInbox(): Promise<TeacherFamilyInbox> {
  const context = await requireFamilyAuthorization({
    permissions: ['family:teacher-message'],
    roles: ['teacher'],
  });
  if (context.synthetic) throw new FamilyAccessError('RETRY_LATER');
  if (!context.messagingEnabled) throw new FamilyAccessError('FEATURE_DISABLED');

  const database = await createFamilyRequestClient();
  const result = await database.rpc(TEACHER_FAMILY_INBOX_RPC, {
    p_tenant_id: context.currentTenantId,
  });
  if (result.error) {
    if (result.error.code === '42501') throw new FamilyAccessError('FORBIDDEN');
    if (result.error.code === 'P0002') throw new FamilyAccessError('NOT_FOUND');
    throw new FamilyAccessError('RETRY_LATER');
  }

  const parsed = teacherFamilyInboxDtoSchema.safeParse(result.data);
  if (!parsed.success) throw new FamilyAccessError('RETRY_LATER');
  if (parsed.data.tenant.id !== context.currentTenantId) {
    throw new FamilyAccessError('FORBIDDEN');
  }
  return parsed.data;
}
