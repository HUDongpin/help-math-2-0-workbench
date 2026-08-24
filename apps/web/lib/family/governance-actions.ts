'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';

import {FamilyAccessError, requireFamilyAuthorization} from './authorization.server';
import {readFamilyFeatureFlags} from './feature-flags';
import {
  digestGuardianInvitationEmail,
  digestGuardianInvitationToken,
} from './invitation-secret.server';
import {
  readFamilyProviderSession,
  readVerifiedFamilyProviderEmail,
} from './provider-session.server';
import {
  createFamilyInvitationSuggestionSchema,
  createFamilyRightsRequestSchema,
  createFamilySupportAccessRequestSchema,
  decideFamilySupportAccessRequestSchema,
  declineGuardianInvitationSchema,
  redactFamilyMessageSchema,
  reviewFamilyInvitationSuggestionSchema,
  reviewFamilyRightsRequestSchema,
} from './schemas';
import {createFamilyRequestClient} from './supabase.server';
import type {
  FamilyActionErrorCode,
  FamilyActionResult,
  FamilyGovernanceMutationReceipt,
  FamilySuggestionMutationReceipt,
  FamilySupportDecisionReceipt,
} from './types';

const requestReceiptSchema = z.object({
  requestId: z.uuid(),
  submittedAt: z.iso.datetime({offset: true}),
}).strict();
const supportRequestReceiptSchema = z.object({
  requestId: z.uuid(),
  requestedAt: z.iso.datetime({offset: true}),
}).strict();
const suggestionReceiptSchema = z.object({
  submittedAt: z.iso.datetime({offset: true}),
  suggestionId: z.uuid(),
}).strict();
const supportDecisionReceiptSchema = z.object({
  accessExpiresAt: z.iso.datetime({offset: true}).nullable(),
  requestId: z.uuid(),
  status: z.enum(['approved', 'denied']),
}).strict();

function governancePaths() {
  for (const path of [
    '/family', '/es/family', '/family/requests', '/es/family/requests',
    '/teacher/messages', '/es/teacher/messages',
    '/teacher/family-access', '/es/teacher/family-access',
    '/admin/family-access', '/es/admin/family-access',
    '/admin/family-operations', '/es/admin/family-operations',
  ]) revalidatePath(path);
}

function failure(error: FamilyActionErrorCode): FamilyActionResult<never> {
  return {error, ok: false};
}

function mapError(error: unknown): FamilyActionResult<never> {
  if (error instanceof FamilyAccessError) {
    if (error.code === 'AUTH_REQUIRED') return failure('AUTH_REQUIRED');
    if (error.code === 'FEATURE_DISABLED') return failure('FEATURE_DISABLED');
    if (error.code === 'FORBIDDEN') return failure('FORBIDDEN');
    if (error.code === 'NOT_FOUND') return failure('NOT_FOUND');
  }
  return failure('RETRY_LATER');
}

function rpcFailure(error: {code?: string} | null): FamilyActionResult<never> | null {
  if (!error) return null;
  if (error.code === '42501') return failure('FORBIDDEN');
  if (error.code === 'P0002') return failure('NOT_FOUND');
  if (error.code === '22023') return failure('INVALID_INPUT');
  return failure('RETRY_LATER');
}

export async function createFamilyRightsRequest(
  input: unknown,
): Promise<FamilyActionResult<FamilyGovernanceMutationReceipt>> {
  const parsed = createFamilyRightsRequestSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:read'], roles: ['guardian'],
    });
    if (context.synthetic) {
      return {data: {requestId: crypto.randomUUID(), submittedAt: new Date().toISOString()}, ok: true};
    }
    const database = await createFamilyRequestClient();
    const result = await database.rpc('create_family_rights_request_v1', {
      p_client_mutation_id: parsed.data.clientMutationId,
      p_details: parsed.data.details || null,
      p_request_kind: parsed.data.kind,
      p_student_id: parsed.data.studentId,
      p_tenant_id: context.currentTenantId,
    });
    const rpcError = rpcFailure(result.error);
    if (rpcError) return rpcError;
    const receipt = requestReceiptSchema.safeParse(result.data);
    if (!receipt.success) return failure('RETRY_LATER');
    governancePaths();
    return {data: receipt.data, ok: true};
  } catch (error) {
    return mapError(error);
  }
}

export async function reviewFamilyRightsRequest(input: unknown): Promise<FamilyActionResult> {
  const parsed = reviewFamilyRightsRequestSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:manage-access'], roles: ['school_admin', 'district_admin'],
    });
    if (context.synthetic) return {ok: true};
    const database = await createFamilyRequestClient();
    const result = await database.rpc('review_family_rights_request_v1', {
      p_client_mutation_id: parsed.data.clientMutationId,
      p_request_id: parsed.data.requestId,
      p_status: parsed.data.status,
      p_tenant_id: context.currentTenantId,
    });
    const rpcError = rpcFailure(result.error);
    if (rpcError) return rpcError;
    governancePaths();
    return {ok: true};
  } catch (error) {
    return mapError(error);
  }
}

export async function createFamilyInvitationSuggestion(
  input: unknown,
): Promise<FamilyActionResult<FamilySuggestionMutationReceipt>> {
  const parsed = createFamilyInvitationSuggestionSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:teacher-message'], roles: ['teacher'],
    });
    if (context.synthetic) {
      return {data: {suggestionId: crypto.randomUUID(), submittedAt: new Date().toISOString()}, ok: true};
    }
    const database = await createFamilyRequestClient();
    const result = await database.rpc('create_family_invitation_suggestion_v1', {
      p_client_mutation_id: parsed.data.clientMutationId,
      p_note: parsed.data.note || null,
      p_student_id: parsed.data.studentId,
      p_tenant_id: context.currentTenantId,
    });
    const rpcError = rpcFailure(result.error);
    if (rpcError) return rpcError;
    const receipt = suggestionReceiptSchema.safeParse(result.data);
    if (!receipt.success) return failure('RETRY_LATER');
    governancePaths();
    return {data: receipt.data, ok: true};
  } catch (error) {
    return mapError(error);
  }
}

export async function reviewFamilyInvitationSuggestion(input: unknown): Promise<FamilyActionResult> {
  const parsed = reviewFamilyInvitationSuggestionSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:manage-access'], roles: ['school_admin', 'district_admin'],
    });
    if (context.synthetic) return {ok: true};
    const database = await createFamilyRequestClient();
    const result = await database.rpc('review_family_invitation_suggestion_v1', {
      p_client_mutation_id: parsed.data.clientMutationId,
      p_status: parsed.data.status,
      p_suggestion_id: parsed.data.suggestionId,
      p_tenant_id: context.currentTenantId,
    });
    const rpcError = rpcFailure(result.error);
    if (rpcError) return rpcError;
    governancePaths();
    return {ok: true};
  } catch (error) {
    return mapError(error);
  }
}

export async function createFamilySupportAccessRequest(
  input: unknown,
): Promise<FamilyActionResult<FamilyGovernanceMutationReceipt>> {
  const parsed = createFamilySupportAccessRequestSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:manage-access'], roles: ['school_admin', 'district_admin'],
    });
    if (context.synthetic) {
      return {data: {requestId: crypto.randomUUID(), requestedAt: new Date().toISOString()}, ok: true};
    }
    const database = await createFamilyRequestClient();
    const result = await database.rpc('create_family_support_access_request_v1', {
      p_client_mutation_id: parsed.data.clientMutationId,
      p_reason: parsed.data.reason,
      p_tenant_id: context.currentTenantId,
      p_thread_id: parsed.data.threadId,
    });
    const rpcError = rpcFailure(result.error);
    if (rpcError) return rpcError;
    const receipt = supportRequestReceiptSchema.safeParse(result.data);
    if (!receipt.success) return failure('RETRY_LATER');
    governancePaths();
    return {data: receipt.data, ok: true};
  } catch (error) {
    return mapError(error);
  }
}

export async function decideFamilySupportAccessRequest(
  input: unknown,
): Promise<FamilyActionResult<FamilySupportDecisionReceipt>> {
  const parsed = decideFamilySupportAccessRequestSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:manage-access'], roles: ['district_admin'],
    });
    if (context.synthetic) {
      return {data: {
        accessExpiresAt: parsed.data.approved
          ? new Date(Date.now() + 15 * 60_000).toISOString()
          : null,
        requestId: parsed.data.requestId,
        status: parsed.data.approved ? 'approved' : 'denied',
      }, ok: true};
    }
    const database = await createFamilyRequestClient();
    const result = await database.rpc('decide_family_support_access_request_v1', {
      p_approved: parsed.data.approved,
      p_client_mutation_id: parsed.data.clientMutationId,
      p_decision_note: parsed.data.decisionNote || null,
      p_request_id: parsed.data.requestId,
      p_tenant_id: context.currentTenantId,
    });
    const rpcError = rpcFailure(result.error);
    if (rpcError) return rpcError;
    const receipt = supportDecisionReceiptSchema.safeParse(result.data);
    if (!receipt.success) return failure('RETRY_LATER');
    governancePaths();
    return {data: receipt.data, ok: true};
  } catch (error) {
    return mapError(error);
  }
}

export async function redactFamilyMessage(input: unknown): Promise<FamilyActionResult> {
  const parsed = redactFamilyMessageSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:manage-access'], roles: ['school_admin', 'district_admin'],
    });
    if (context.synthetic) return {ok: true};
    const database = await createFamilyRequestClient();
    const result = await database.rpc('redact_family_message_v1', {
      p_idempotency_key: parsed.data.clientMutationId,
      p_message_id: parsed.data.messageId,
      p_reason: parsed.data.reason,
    });
    const rpcError = rpcFailure(result.error);
    if (rpcError) return rpcError;
    governancePaths();
    return {ok: true};
  } catch (error) {
    return mapError(error);
  }
}

export async function declineGuardianInvitation(input: unknown): Promise<FamilyActionResult> {
  const parsed = declineGuardianInvitationSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const flags = readFamilyFeatureFlags();
    if (!flags.portalEnabled) return failure('FEATURE_DISABLED');
    if (flags.syntheticDemoEnabled) {
      governancePaths();
      return {ok: true};
    }
    if (!await readFamilyProviderSession()) return failure('AUTH_REQUIRED');
    const email = await readVerifiedFamilyProviderEmail();
    if (!email) return failure('EMAIL_MISMATCH');
    const database = await createFamilyRequestClient();
    const result = await database.rpc('decline_guardian_invitation_v1', {
      p_idempotency_key: parsed.data.clientMutationId,
      p_token_digest: digestGuardianInvitationToken(parsed.data.token),
      p_verified_email_digest: digestGuardianInvitationEmail(email),
    });
    const rpcError = rpcFailure(result.error);
    if (rpcError) return rpcError;
    governancePaths();
    return {ok: true};
  } catch (error) {
    return mapError(error);
  }
}
