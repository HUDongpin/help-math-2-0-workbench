import 'server-only';

import {familyChildSelectionSchema} from './schemas';
import {familyWorkspaceDtoSchema} from './dto-schemas';
import {FamilyAccessError, requireFamilyAuthorization} from './authorization.server';
import {createFamilyRequestClient} from './supabase.server';
import type {FamilyWorkspace} from './types';

export async function readFamilyWorkspace(
  selectedChildId?: string,
): Promise<FamilyWorkspace> {
  const context = await requireFamilyAuthorization({
    permissions: ['family:read'],
    roles: ['guardian'],
  });
  if (context.synthetic) {
    throw new FamilyAccessError('RETRY_LATER');
  }

  let childId: string | null = null;
  if (selectedChildId !== undefined) {
    const parsed = familyChildSelectionSchema.safeParse({childId: selectedChildId});
    if (!parsed.success) throw new FamilyAccessError('NOT_FOUND');
    childId = parsed.data.childId;
  }

  const database = await createFamilyRequestClient();
  const result = await database.rpc('family_workspace_for_tenant_v1', {
    p_child_id: childId,
    p_tenant_id: context.currentTenantId,
  });
  if (result.error) {
    if (result.error.code === '42501') throw new FamilyAccessError('FORBIDDEN');
    if (result.error.code === 'P0002') throw new FamilyAccessError('NOT_FOUND');
    throw new FamilyAccessError('RETRY_LATER');
  }
  const parsed = familyWorkspaceDtoSchema.safeParse(result.data);
  if (!parsed.success) throw new FamilyAccessError('RETRY_LATER');
  if (parsed.data.tenant.id !== context.currentTenantId) {
    throw new FamilyAccessError('FORBIDDEN');
  }
  return parsed.data;
}
