import 'server-only';

import {cache} from 'react';
import {cookies} from 'next/headers';
import {z} from 'zod';

import type {
  AppRole,
  AuthorizationContext,
  FamilyPermission,
} from './types';
import {APP_ROLES} from './types';
import {readFamilyFeatureFlags} from './feature-flags';
import {readFamilyProviderSession} from './provider-session.server';
import {createFamilyRequestClient} from './supabase.server';
import {isSyntheticFamilyUserRevoked} from './synthetic-family-state.server';

export const FAMILY_SYNTHETIC_PERSONA_COOKIE =
  'help_math_family_demo_persona';
export const FAMILY_TENANT_COOKIE = 'help_math_family_tenant';

const SYNTHETIC_TENANT_ID = '10000000-0000-4000-8000-000000000001';

interface SyntheticPersona {
  appUserId: string;
  roles: readonly AppRole[];
}

const SYNTHETIC_PERSONAS = Object.freeze({
  'district-admin': {
    appUserId: '10000000-0000-4000-8000-000000000014',
    roles: ['district_admin'],
  },
  'guardian-a': {
    appUserId: '10000000-0000-4000-8000-000000000010',
    roles: ['guardian'],
  },
  'guardian-b': {
    appUserId: '10000000-0000-4000-8000-000000000011',
    roles: ['guardian'],
  },
  'school-admin': {
    appUserId: '10000000-0000-4000-8000-000000000013',
    roles: ['school_admin'],
  },
  'teacher-a': {
    appUserId: '10000000-0000-4000-8000-000000000012',
    roles: ['teacher'],
  },
} satisfies Record<string, SyntheticPersona>);

export type SyntheticFamilyPersona = keyof typeof SYNTHETIC_PERSONAS;

const permissionsByRole = Object.freeze({
  district_admin: [
    'family:manage-access',
    'family:announce',
  ],
  guardian: [
    'family:read',
    'family:message',
    'family:relinquish',
  ],
  learner: [],
  school_admin: [
    'family:manage-access',
    'family:announce',
  ],
  teacher: [
    'family:teacher-message',
    'family:announce',
  ],
} satisfies Record<AppRole, readonly FamilyPermission[]>);

export type FamilyAccessErrorCode =
  | 'AUTH_REQUIRED'
  | 'FEATURE_DISABLED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RETRY_LATER';

export class FamilyAccessError extends Error {
  constructor(public readonly code: FamilyAccessErrorCode) {
    super(code);
    this.name = 'FamilyAccessError';
  }
}

function permissionsFor(roles: readonly AppRole[]) {
  return [...new Set(roles.flatMap((role) => permissionsByRole[role]))];
}

async function syntheticAuthorizationContext(): Promise<AuthorizationContext> {
  const cookieStore = await cookies();
  const requested = cookieStore.get(FAMILY_SYNTHETIC_PERSONA_COOKIE)?.value;
  const personaName = requested && requested in SYNTHETIC_PERSONAS
    ? requested as SyntheticFamilyPersona
    : 'guardian-a';
  const persona: SyntheticPersona = SYNTHETIC_PERSONAS[personaName];
  if (
    persona.roles.includes('guardian')
    && isSyntheticFamilyUserRevoked(persona.appUserId)
  ) throw new FamilyAccessError('NOT_FOUND');

  return {
    appUserId: persona.appUserId,
    currentTenantId: SYNTHETIC_TENANT_ID,
    dataMode: 'synthetic',
    messagingEnabled: true,
    permissions: permissionsFor(persona.roles),
    provider: 'synthetic',
    providerIssuer: 'urn:help-math:synthetic',
    providerSubject: personaName,
    roles: persona.roles,
    sessionId: `synthetic-${personaName}`,
    synthetic: true,
  };
}

const databaseAuthorizationSchema = z.object({
  appUserId: z.uuid(),
  tenants: z.array(z.object({
    dataMode: z.enum(['synthetic', 'production']),
    displayName: z.string().min(1).max(200),
    environmentId: z.string().min(1).max(80),
    id: z.uuid(),
    messagingEnabled: z.boolean(),
    roles: z.array(z.enum(APP_ROLES)).min(1),
  }).strict()).max(100),
}).strict();

type DatabaseAuthorization = z.infer<typeof databaseAuthorizationSchema>;

const readDatabaseAuthorization = cache(
  async (): Promise<DatabaseAuthorization> => {
    const provider = await readFamilyProviderSession();
    if (!provider) throw new FamilyAccessError('AUTH_REQUIRED');

    const database = await createFamilyRequestClient();
    const result = await database.rpc('family_authorization_context_v1');
    if (result.error) {
      throw new FamilyAccessError(
        result.error.code === '42501' ? 'FORBIDDEN' : 'RETRY_LATER',
      );
    }
    const parsed = databaseAuthorizationSchema.safeParse(result.data);
    if (!parsed.success) throw new FamilyAccessError('RETRY_LATER');
    if (parsed.data.tenants.length === 0) {
      throw new FamilyAccessError('FORBIDDEN');
    }

    return parsed.data;
  },
);

async function databaseAuthorizationContext(): Promise<AuthorizationContext> {
  const provider = await readFamilyProviderSession();
  if (!provider) throw new FamilyAccessError('AUTH_REQUIRED');
  const authorization = await readDatabaseAuthorization();

  const requestedTenant = (await cookies()).get(FAMILY_TENANT_COOKIE)?.value;
  const selected = authorization.tenants.find((tenant) => (
    tenant.id === requestedTenant
  )) ?? authorization.tenants[0];
  if (!selected) throw new FamilyAccessError('FORBIDDEN');
  const roles: readonly AppRole[] = selected.roles;

  return {
    appUserId: authorization.appUserId,
    currentTenantId: selected.id,
    dataMode: selected.dataMode,
    messagingEnabled: selected.messagingEnabled,
    permissions: permissionsFor(roles),
    provider: provider.provider,
    providerIssuer: provider.issuer,
    providerSubject: provider.subject,
    roles,
    sessionId: provider.sessionId,
    synthetic: false,
  };
}

/**
 * Minimal tenant choices for an explicit, role-scoped switch. The caller gets
 * no provider identifiers, environment names, data-mode values, or roles.
 * Selecting one of these IDs never grants access: every destination page and
 * mutation re-runs its normal tenant/resource authorization after the cookie
 * changes.
 */
export async function readFamilyAuthorizedTenantOptions(role: AppRole) {
  const flags = readFamilyFeatureFlags();
  if (!flags.portalEnabled) throw new FamilyAccessError('FEATURE_DISABLED');
  if (flags.syntheticDemoEnabled) return [];

  const authorization = await readDatabaseAuthorization();
  return authorization.tenants
    .filter((tenant) => tenant.roles.includes(role))
    .map((tenant) => ({
      displayName: tenant.displayName,
      id: tenant.id,
    }));
}

export const readFamilyAuthorizationContext = cache(
  async (): Promise<AuthorizationContext> => {
    const flags = readFamilyFeatureFlags();
    if (!flags.portalEnabled) throw new FamilyAccessError('FEATURE_DISABLED');
    if (flags.syntheticDemoEnabled) return syntheticAuthorizationContext();
    return databaseAuthorizationContext();
  },
);

export async function requireFamilyAuthorization(
  options: Readonly<{
    permissions?: readonly FamilyPermission[];
    roles?: readonly AppRole[];
  }> = {},
) {
  const context = await readFamilyAuthorizationContext();
  if (
    options.roles
    && !options.roles.some((role) => context.roles.includes(role))
  ) throw new FamilyAccessError('FORBIDDEN');
  if (
    options.permissions
    && !options.permissions.every((permission) => (
      context.permissions.includes(permission)
    ))
  ) throw new FamilyAccessError('FORBIDDEN');
  return context;
}

export function isSyntheticFamilyPersona(
  value: string,
): value is SyntheticFamilyPersona {
  return value in SYNTHETIC_PERSONAS;
}
