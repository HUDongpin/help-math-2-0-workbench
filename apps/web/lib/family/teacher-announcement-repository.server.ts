import 'server-only';

import {FamilyAccessError, requireFamilyAuthorization} from './authorization.server';
import {teacherAnnouncementSchoolsDtoSchema} from './dto-schemas';
import {createFamilyRequestClient} from './supabase.server';
import type {TeacherAnnouncementSchools} from './types';

export const TEACHER_ANNOUNCEMENT_SCHOOLS_RPC =
  'teacher_announcement_schools_for_tenant_v1' as const;

export async function readTeacherAnnouncementSchools(): Promise<
  TeacherAnnouncementSchools
> {
  const context = await requireFamilyAuthorization({
    permissions: ['family:announce'],
    roles: ['teacher'],
  });
  if (context.synthetic) throw new FamilyAccessError('RETRY_LATER');
  if (!context.messagingEnabled) throw new FamilyAccessError('FEATURE_DISABLED');

  const database = await createFamilyRequestClient();
  const result = await database.rpc(TEACHER_ANNOUNCEMENT_SCHOOLS_RPC, {
    p_tenant_id: context.currentTenantId,
  });
  if (result.error) {
    if (result.error.code === '42501') throw new FamilyAccessError('FORBIDDEN');
    if (result.error.code === 'P0002') throw new FamilyAccessError('NOT_FOUND');
    throw new FamilyAccessError('RETRY_LATER');
  }

  const parsed = teacherAnnouncementSchoolsDtoSchema.safeParse(result.data);
  if (!parsed.success) throw new FamilyAccessError('RETRY_LATER');
  if (parsed.data.tenant.id !== context.currentTenantId) {
    throw new FamilyAccessError('FORBIDDEN');
  }
  return parsed.data;
}
