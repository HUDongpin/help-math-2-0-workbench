import 'server-only';

import {requireFamilyAuthorization, FamilyAccessError} from './authorization.server';
import {adminFamilyAccessWorkspaceDtoSchema} from './dto-schemas';
import {createFamilyRequestClient} from './supabase.server';
import type {AdminFamilyAccessWorkspace} from './types';

export const ADMIN_FAMILY_ACCESS_WORKSPACE_RPC =
  'admin_family_access_workspace_for_tenant_v1' as const;

export async function readAdminFamilyAccessWorkspace(): Promise<AdminFamilyAccessWorkspace> {
  const context = await requireFamilyAuthorization({
    permissions: ['family:manage-access'],
    roles: ['school_admin', 'district_admin'],
  });
  if (context.synthetic) throw new FamilyAccessError('RETRY_LATER');

  const database = await createFamilyRequestClient();
  const result = await database.rpc(ADMIN_FAMILY_ACCESS_WORKSPACE_RPC, {
    p_tenant_id: context.currentTenantId,
  });
  if (result.error) {
    if (result.error.code === '42501') throw new FamilyAccessError('FORBIDDEN');
    if (result.error.code === 'P0002') throw new FamilyAccessError('NOT_FOUND');
    throw new FamilyAccessError('RETRY_LATER');
  }

  const parsed = adminFamilyAccessWorkspaceDtoSchema.safeParse(result.data);
  if (!parsed.success) throw new FamilyAccessError('RETRY_LATER');
  if (parsed.data.tenant.id !== context.currentTenantId) {
    throw new FamilyAccessError('FORBIDDEN');
  }
  if (parsed.data.children.length === 0) throw new FamilyAccessError('NOT_FOUND');
  return parsed.data;
}
