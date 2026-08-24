import 'server-only';

import {FamilyAccessError, requireFamilyAuthorization} from './authorization.server';
import {
  adminFamilyOperationsWorkspaceDtoSchema,
  familyGovernanceWorkspaceDtoSchema,
  familySupportCaseDtoSchema,
  teacherInvitationSuggestionWorkspaceDtoSchema,
} from './dto-schemas';
import {createFamilyRequestClient} from './supabase.server';
import type {
  AdminFamilyOperationsWorkspace,
  FamilyGovernanceWorkspace,
  FamilySupportCase,
  TeacherInvitationSuggestionWorkspace,
} from './types';

function mapRpcError(error: {code?: string} | null): never {
  if (error?.code === '42501') throw new FamilyAccessError('FORBIDDEN');
  if (error?.code === 'P0002') throw new FamilyAccessError('NOT_FOUND');
  throw new FamilyAccessError('RETRY_LATER');
}

export async function readFamilyGovernanceWorkspace(): Promise<FamilyGovernanceWorkspace> {
  const context = await requireFamilyAuthorization({
    permissions: ['family:read'],
    roles: ['guardian'],
  });
  if (context.synthetic) throw new FamilyAccessError('RETRY_LATER');
  const database = await createFamilyRequestClient();
  const result = await database.rpc('family_governance_workspace_v1', {
    p_tenant_id: context.currentTenantId,
  });
  if (result.error) mapRpcError(result.error);
  const parsed = familyGovernanceWorkspaceDtoSchema.safeParse(result.data);
  if (!parsed.success) throw new FamilyAccessError('RETRY_LATER');
  if (parsed.data.tenant.id !== context.currentTenantId) {
    throw new FamilyAccessError('FORBIDDEN');
  }
  return parsed.data;
}

export async function readTeacherInvitationSuggestionWorkspace(): Promise<TeacherInvitationSuggestionWorkspace> {
  const context = await requireFamilyAuthorization({
    permissions: ['family:teacher-message'],
    roles: ['teacher'],
  });
  if (context.synthetic) throw new FamilyAccessError('RETRY_LATER');
  const database = await createFamilyRequestClient();
  const result = await database.rpc(
    'teacher_invitation_suggestion_workspace_v1',
    {p_tenant_id: context.currentTenantId},
  );
  if (result.error) mapRpcError(result.error);
  const parsed = teacherInvitationSuggestionWorkspaceDtoSchema.safeParse(
    result.data,
  );
  if (!parsed.success) throw new FamilyAccessError('RETRY_LATER');
  if (parsed.data.tenant.id !== context.currentTenantId) {
    throw new FamilyAccessError('FORBIDDEN');
  }
  return parsed.data;
}

export async function readAdminFamilyOperationsWorkspace(): Promise<AdminFamilyOperationsWorkspace> {
  const context = await requireFamilyAuthorization({
    permissions: ['family:manage-access'],
    roles: ['school_admin', 'district_admin'],
  });
  if (context.synthetic) throw new FamilyAccessError('RETRY_LATER');
  const database = await createFamilyRequestClient();
  const result = await database.rpc('admin_family_operations_workspace_v1', {
    p_tenant_id: context.currentTenantId,
  });
  if (result.error) mapRpcError(result.error);
  const parsed = adminFamilyOperationsWorkspaceDtoSchema.safeParse(result.data);
  if (!parsed.success) throw new FamilyAccessError('RETRY_LATER');
  if (parsed.data.tenant.id !== context.currentTenantId) {
    throw new FamilyAccessError('FORBIDDEN');
  }
  return parsed.data;
}

export async function readFamilySupportCase(
  requestId: string,
): Promise<FamilySupportCase> {
  const context = await requireFamilyAuthorization({
    permissions: ['family:manage-access'],
    roles: ['school_admin', 'district_admin'],
  });
  if (context.synthetic) throw new FamilyAccessError('NOT_FOUND');
  const database = await createFamilyRequestClient();
  const result = await database.rpc('family_support_case_v1', {
    p_request_id: requestId,
    p_tenant_id: context.currentTenantId,
  });
  if (result.error) mapRpcError(result.error);
  const parsed = familySupportCaseDtoSchema.safeParse(result.data);
  if (!parsed.success) throw new FamilyAccessError('RETRY_LATER');
  if (parsed.data.tenantId !== context.currentTenantId) {
    throw new FamilyAccessError('FORBIDDEN');
  }
  return parsed.data;
}
