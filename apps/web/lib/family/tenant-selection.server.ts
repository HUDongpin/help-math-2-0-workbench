'use server';

import {revalidatePath} from 'next/cache';
import {cookies} from 'next/headers';
import {z} from 'zod';

import {
  FAMILY_TENANT_COOKIE,
  FamilyAccessError,
  readFamilyAuthorizedTenantOptions,
} from './authorization.server';
import {clearSelectedFamilyChildId} from './selection.server';
import type {FamilyActionErrorCode, FamilyActionResult} from './types';

const selectGuardianTenantSchema = z.object({
  clientMutationId: z.string().trim().min(8).max(128).regex(
    /^[A-Za-z0-9._:-]+$/u,
  ),
  tenantId: z.uuid(),
}).strict();

function failure(error: FamilyActionErrorCode): FamilyActionResult {
  return {error, ok: false};
}
function familyPaths() {
  for (const path of [
    '/family',
    '/es/family',
    '/teacher/messages',
    '/es/teacher/messages',
    '/admin/family-access',
    '/es/admin/family-access',
  ]) revalidatePath(path);
}

/**
 * Selects one already-authorized guardian tenant. The UUID is only a locator:
 * the signed provider session and application role bindings remain the source
 * of authority. Child selection is cleared so an opaque ID from the previous
 * tenant is never carried into the next workspace request.
 */
export async function selectGuardianFamilyTenant(
  input: unknown,
): Promise<FamilyActionResult> {
  const parsed = selectGuardianTenantSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');

  try {
    const tenants = await readFamilyAuthorizedTenantOptions('guardian');
    if (!tenants.some((tenant) => tenant.id === parsed.data.tenantId)) {
      return failure('NOT_FOUND');
    }

    (await cookies()).set(FAMILY_TENANT_COOKIE, parsed.data.tenantId, {
      httpOnly: true,
      maxAge: 8 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    await clearSelectedFamilyChildId();
    familyPaths();
    return {ok: true};
  } catch (error) {
    if (error instanceof FamilyAccessError) {
      const mapped: Partial<Record<typeof error.code, FamilyActionErrorCode>> = {
        AUTH_REQUIRED: 'AUTH_REQUIRED',
        FEATURE_DISABLED: 'FEATURE_DISABLED',
        FORBIDDEN: 'FORBIDDEN',
        NOT_FOUND: 'NOT_FOUND',
        RETRY_LATER: 'RETRY_LATER',
      };
      return failure(mapped[error.code] ?? 'RETRY_LATER');
    }
    return failure('RETRY_LATER');
  }
}
