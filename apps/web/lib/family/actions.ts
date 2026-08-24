'use server';

import {randomUUID} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';

import {
  FamilyAccessError,
  requireFamilyAuthorization,
} from './authorization.server';
import {readFamilyAuthProviderMode} from './auth-provider-config';
import {resolveFamilyEmailTransport} from './family-email-transport';
import {readFamilyFeatureFlags} from './feature-flags';
import {
  createGuardianInvitationToken,
  digestGuardianInvitationEmail,
  digestGuardianInvitationToken,
  encryptFamilyEmailForStorage,
  encryptInvitationTokenForOutbox,
} from './invitation-secret.server';
import {
  issueGuardianInvitation,
  reissueGuardianInvitation,
} from './invitation-issuer.server';
import {
  isAllowedFamilyInvitationRecipient,
  isFamilyInvitationRecipientPolicyEnabled,
} from './invitation-recipient-policy.server';
import {
  readFamilyProviderSession,
  readVerifiedFamilyProviderEmail,
} from './provider-session.server';
import {
  acceptGuardianInvitationSchema,
  closeFamilyThreadSchema,
  createGuardianInvitationSchema,
  markFamilyThreadReadSchema,
  publishSchoolAnnouncementSchema,
  relinquishGuardianChildAccessSchema,
  relinquishGuardianLinkSchema,
  resendGuardianInvitationSchema,
  revokeGuardianInvitationSchema,
  revokeGuardianLinkSchema,
  selectFamilyChildSchema,
  sendFamilyMessageSchema,
  updateFamilyNotificationPreferencesSchema,
} from './schemas';
import {familyWorkspaceDtoSchema} from './dto-schemas';
import {storeSelectedFamilyChildId} from './selection.server';
import {createFamilyRequestClient} from './supabase.server';
import {
  closeSyntheticFamilyThread,
  markSyntheticFamilyThreadRead,
  registerSyntheticGuardianInvitation,
  relinquishSyntheticGuardianLink,
  revokeSyntheticGuardianInvitation,
  revokeSyntheticGuardianLink,
  sendSyntheticFamilyMessage,
  setSyntheticFamilyNotificationPreference,
  isSyntheticFamilyChildAuthorized,
  syntheticGuardianLinkIdForChild,
  syntheticFamilyThreadIsClosed,
} from './synthetic-family-state.server';
import type {
  AuthorizationContext,
  FamilyActionErrorCode,
  FamilyActionResult,
  FamilyAnnouncementReceipt,
  FamilyInvitationReceipt,
  FamilyMessageReceipt,
} from './types';

function familyInvitationIssuanceEnabled(
  context: Pick<AuthorizationContext, 'dataMode'>,
) {
  if (!isFamilyInvitationRecipientPolicyEnabled(context.dataMode)) {
    return false;
  }
  try {
    const transport = resolveFamilyEmailTransport(process.env);
    if (context.dataMode === 'production') {
      return readFamilyAuthProviderMode() === 'supabase'
        && transport === 'resend';
    }
    return transport === 'mailpit-local';
  } catch {
    return false;
  }
}

function familyPaths() {
  for (const path of ['/family', '/es/family', '/teacher/messages',
    '/es/teacher/messages', '/admin/family-access',
    '/es/admin/family-access']) revalidatePath(path);
}

function failure(error: FamilyActionErrorCode): {
  error: FamilyActionErrorCode;
  ok: false;
} {
  return {error, ok: false};
}

function errorResult(error: unknown): FamilyActionResult {
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

function rpcFailureCode(error: {code?: string; message?: string} | null) {
  if (!error) return null;
  const code = error.code ?? '';
  if (code === '42501') return 'FORBIDDEN' as const;
  if (code === 'P0002') return 'NOT_FOUND' as const;
  if (code === 'P0003') return 'INVITATION_INVALID' as const;
  if (code === 'P0004') return 'INVITATION_EXPIRED' as const;
  if (code === 'P0005') return 'EMAIL_MISMATCH' as const;
  if (code === 'P0006') return 'THREAD_CLOSED' as const;
  return 'RETRY_LATER' as const;
}

const invitationIssuanceAuthorizationSchema = z.object({
  alreadyIssued: z.boolean(),
  attestationId: z.uuid(),
  expiresAt: z.iso.datetime({offset: true}),
  invitationExpiresAt: z.iso.datetime({offset: true}).nullable(),
  invitationId: z.uuid(),
  tenantId: z.uuid(),
}).strict().superRefine((value, context) => {
  if (value.alreadyIssued !== (value.invitationExpiresAt !== null)) {
    context.addIssue({
      code: 'custom',
      message: 'Issued invitation receipts require their original expiry.',
      path: ['invitationExpiresAt'],
    });
  }
});

const guardianInvitationAcceptanceReceiptSchema = z.array(z.object({
  guardian_link_id: z.uuid(),
  student_id: z.uuid(),
  tenant_id: z.uuid(),
}).strict()).length(1);

const familyMessageReceiptSchema = z.object({
  message_id: z.uuid(),
  thread_id: z.uuid(),
}).strict();

const announcementPublishAuthorizationSchema = z.object({
  schoolId: z.uuid(),
  tenantId: z.uuid(),
}).strict();

const announcementPublishReceiptSchema = z.array(z.object({
  announcement_id: z.uuid(),
  expires_at: z.iso.datetime({offset: true}),
  published_at: z.iso.datetime({offset: true}),
}).strict()).length(1);

export async function createGuardianInvitation(
  input: unknown,
): Promise<FamilyActionResult<FamilyInvitationReceipt>> {
  const parsed = createGuardianInvitationSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:manage-access'],
      roles: ['school_admin', 'district_admin'],
    });
    if (!familyInvitationIssuanceEnabled(context)) {
      return failure('FEATURE_DISABLED');
    }
    if (!isAllowedFamilyInvitationRecipient(
      parsed.data.verifiedAdultEmail,
      context.dataMode,
    )) return failure('INVALID_INPUT');
    if (
      !context.synthetic
      && !readFamilyFeatureFlags().emailNotificationsEnabled
    ) return failure('FEATURE_DISABLED');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000)
      .toISOString();
    if (context.synthetic) {
      const invitationId = randomUUID();
      registerSyntheticGuardianInvitation(invitationId);
      return {
        data: {expiresAt, invitationId},
        ok: true,
      };
    }
    const emailDigest = digestGuardianInvitationEmail(
      parsed.data.verifiedAdultEmail,
    );
    const database = await createFamilyRequestClient();
    const authorization = await database.rpc(
      'authorize_guardian_invitation_creation_v1',
      {
        p_email_digest: emailDigest,
        p_idempotency_key: parsed.data.clientMutationId,
        p_student_id: parsed.data.studentId,
      },
    );
    const authorizationError = rpcFailureCode(authorization.error);
    if (authorizationError) return failure(authorizationError);
    const authorized = invitationIssuanceAuthorizationSchema.safeParse(
      authorization.data,
    );
    if (
      !authorized.success
      || authorized.data.tenantId !== context.currentTenantId
    ) return failure('FORBIDDEN');

    if (authorized.data.alreadyIssued) {
      if (!authorized.data.invitationExpiresAt) return failure('RETRY_LATER');
      familyPaths();
      return {
        data: {
          expiresAt: authorized.data.invitationExpiresAt,
          invitationId: authorized.data.invitationId,
        },
        ok: true,
      };
    }

    const token = createGuardianInvitationToken();
    const receipt = await issueGuardianInvitation({
      attestationId: authorized.data.attestationId,
      emailCiphertext: encryptFamilyEmailForStorage(
        parsed.data.verifiedAdultEmail,
        {
          recipientEmailDigest: emailDigest,
          tenantId: authorized.data.tenantId,
        },
      ),
      emailDigest,
      encryptedOutboxToken: encryptInvitationTokenForOutbox(token, {
        invitationId: authorized.data.invitationId,
        tenantId: authorized.data.tenantId,
      }),
      expiresAt,
      idempotencyKey: parsed.data.clientMutationId,
      invitationId: authorized.data.invitationId,
      studentId: parsed.data.studentId,
      tokenDigest: digestGuardianInvitationToken(token),
    });
    familyPaths();
    return {data: receipt, ok: true};
  } catch (error) {
    return errorResult(error) as FamilyActionResult<FamilyInvitationReceipt>;
  }
}

export async function resendGuardianInvitation(
  input: unknown,
): Promise<FamilyActionResult<FamilyInvitationReceipt>> {
  const parsed = resendGuardianInvitationSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:manage-access'],
      roles: ['school_admin', 'district_admin'],
    });
    if (!familyInvitationIssuanceEnabled(context)) {
      return failure('FEATURE_DISABLED');
    }
    if (
      !context.synthetic
      && !readFamilyFeatureFlags().emailNotificationsEnabled
    ) return failure('FEATURE_DISABLED');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000)
      .toISOString();
    if (context.synthetic) {
      return {
        data: {expiresAt, invitationId: parsed.data.invitationId},
        ok: true,
      };
    }
    const database = await createFamilyRequestClient();
    const authorization = await database.rpc(
      'authorize_guardian_invitation_resend_v1',
      {
        p_idempotency_key: parsed.data.clientMutationId,
        p_invitation_id: parsed.data.invitationId,
      },
    );
    const authorizationError = rpcFailureCode(authorization.error);
    if (authorizationError) return failure(authorizationError);
    const authorized = invitationIssuanceAuthorizationSchema.safeParse(
      authorization.data,
    );
    if (
      !authorized.success
      || authorized.data.invitationId !== parsed.data.invitationId
      || authorized.data.tenantId !== context.currentTenantId
    ) return failure('FORBIDDEN');

    if (authorized.data.alreadyIssued) {
      if (!authorized.data.invitationExpiresAt) return failure('RETRY_LATER');
      familyPaths();
      return {
        data: {
          expiresAt: authorized.data.invitationExpiresAt,
          invitationId: authorized.data.invitationId,
        },
        ok: true,
      };
    }

    const token = createGuardianInvitationToken();
    const receipt = await reissueGuardianInvitation({
      attestationId: authorized.data.attestationId,
      encryptedOutboxToken: encryptInvitationTokenForOutbox(token, {
        invitationId: authorized.data.invitationId,
        tenantId: authorized.data.tenantId,
      }),
      expiresAt,
      idempotencyKey: parsed.data.clientMutationId,
      invitationId: authorized.data.invitationId,
      tokenDigest: digestGuardianInvitationToken(token),
    });
    familyPaths();
    return {data: receipt, ok: true};
  } catch (error) {
    return errorResult(error) as FamilyActionResult<FamilyInvitationReceipt>;
  }
}

export async function acceptGuardianInvitation(
  input: unknown,
): Promise<FamilyActionResult> {
  const parsed = acceptGuardianInvitationSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const flags = readFamilyFeatureFlags();
    if (!flags.portalEnabled) return failure('FEATURE_DISABLED');
    if (flags.syntheticDemoEnabled) {
      familyPaths();
      return {ok: true};
    }
    if (!await readFamilyProviderSession()) return failure('AUTH_REQUIRED');
    const verifiedEmail = await readVerifiedFamilyProviderEmail();
    if (!verifiedEmail) return failure('EMAIL_MISMATCH');
    const database = await createFamilyRequestClient();
    const result = await database.rpc('accept_guardian_invitation_v1', {
      p_idempotency_key: parsed.data.clientMutationId,
      p_token_digest: digestGuardianInvitationToken(parsed.data.token),
      p_verified_email_digest: digestGuardianInvitationEmail(verifiedEmail),
    });
    const rpcError = rpcFailureCode(result.error);
    if (rpcError) return failure(rpcError);
    const accepted = guardianInvitationAcceptanceReceiptSchema.safeParse(
      result.data,
    );
    if (!accepted.success) return failure('INVITATION_INVALID');
    familyPaths();
    return {ok: true};
  } catch (error) {
    return errorResult(error);
  }
}

export async function revokeGuardianLink(input: unknown): Promise<FamilyActionResult> {
  const parsed = revokeGuardianLinkSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:manage-access'],
      roles: ['school_admin', 'district_admin'],
    });
    if (context.synthetic) {
      if (!revokeSyntheticGuardianLink(parsed.data.guardianLinkId)) {
        return failure('NOT_FOUND');
      }
      familyPaths();
      return {ok: true};
    }
    const database = await createFamilyRequestClient();
    const result = await database.rpc('revoke_guardian_link_v1', {
      p_guardian_link_id: parsed.data.guardianLinkId,
      p_idempotency_key: parsed.data.clientMutationId,
      p_reason: parsed.data.reason,
    });
    const rpcError = rpcFailureCode(result.error);
    if (rpcError) return failure(rpcError);
    familyPaths();
    return {ok: true};
  } catch (error) {
    return errorResult(error);
  }
}

export async function revokeGuardianInvitation(
  input: unknown,
): Promise<FamilyActionResult> {
  const parsed = revokeGuardianInvitationSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:manage-access'],
      roles: ['school_admin', 'district_admin'],
    });
    if (context.synthetic) {
      if (!revokeSyntheticGuardianInvitation(parsed.data.invitationId)) {
        return failure('NOT_FOUND');
      }
      familyPaths();
      return {ok: true};
    }
    const database = await createFamilyRequestClient();
    const result = await database.rpc('revoke_guardian_invitation_v1', {
      p_idempotency_key: parsed.data.clientMutationId,
      p_invitation_id: parsed.data.invitationId,
      p_reason: parsed.data.reason,
    });
    const rpcError = rpcFailureCode(result.error);
    if (rpcError) return failure(rpcError);
    familyPaths();
    return {ok: true};
  } catch (error) {
    return errorResult(error);
  }
}

export async function relinquishGuardianLink(
  input: unknown,
): Promise<FamilyActionResult> {
  const parsed = relinquishGuardianLinkSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:relinquish'],
      roles: ['guardian'],
    });
    if (context.synthetic) {
      if (!relinquishSyntheticGuardianLink(
        context,
        parsed.data.guardianLinkId,
      )) return failure('NOT_FOUND');
      familyPaths();
      return {ok: true};
    }
    const database = await createFamilyRequestClient();
    const result = await database.rpc('relinquish_guardian_link_v1', {
      p_guardian_link_id: parsed.data.guardianLinkId,
      p_idempotency_key: parsed.data.clientMutationId,
    });
    const rpcError = rpcFailureCode(result.error);
    if (rpcError) return failure(rpcError);
    familyPaths();
    return {ok: true};
  } catch (error) {
    return errorResult(error);
  }
}

/**
 * Family UI works with an opaque child DTO and never receives the relationship
 * row id. The database resolves the one current link from the signed actor and
 * fails closed on ambiguity, expiry, revocation, or tenant drift.
 */
export async function relinquishGuardianChildAccess(
  input: unknown,
): Promise<FamilyActionResult> {
  const parsed = relinquishGuardianChildAccessSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:relinquish'],
      roles: ['guardian'],
    });
    if (context.synthetic) {
      const guardianLinkId = syntheticGuardianLinkIdForChild(
        context.appUserId,
        parsed.data.childId,
      );
      if (
        !guardianLinkId
        || !relinquishSyntheticGuardianLink(context, guardianLinkId)
      ) return failure('NOT_FOUND');
      familyPaths();
      return {ok: true};
    }
    const database = await createFamilyRequestClient();
    const workspace = await database.rpc('family_workspace_for_tenant_v1', {
      p_child_id: parsed.data.childId,
      p_tenant_id: context.currentTenantId,
    });
    const workspaceError = rpcFailureCode(workspace.error);
    if (workspaceError) return failure(workspaceError);
    const authorizedWorkspace = familyWorkspaceDtoSchema.safeParse(
      workspace.data,
    );
    if (
      !authorizedWorkspace.success
      || authorizedWorkspace.data.tenant.id !== context.currentTenantId
      || authorizedWorkspace.data.selectedChildId !== parsed.data.childId
    ) return failure('FORBIDDEN');
    const result = await database.rpc('relinquish_guardian_child_access_v1', {
      p_child_id: parsed.data.childId,
      p_idempotency_key: parsed.data.clientMutationId,
    });
    const rpcError = rpcFailureCode(result.error);
    if (rpcError) return failure(rpcError);
    familyPaths();
    return {ok: true};
  } catch (error) {
    return errorResult(error);
  }
}

export async function sendFamilyMessage(
  input: unknown,
): Promise<FamilyActionResult<FamilyMessageReceipt>> {
  const parsed = sendFamilyMessageSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const flags = readFamilyFeatureFlags();
    if (!flags.messagingEnabled) return failure('FEATURE_DISABLED');
    const context = await requireFamilyAuthorization({
      roles: ['guardian', 'teacher'],
    });
    if (!context.messagingEnabled) return failure('FEATURE_DISABLED');
    if (!(
      context.permissions.includes('family:message')
      || context.permissions.includes('family:teacher-message')
    )) return failure('FORBIDDEN');
    if (context.synthetic) {
      if (
        parsed.data.threadId
        && syntheticFamilyThreadIsClosed(context, parsed.data.threadId)
      ) return failure('THREAD_CLOSED');
      const receipt = sendSyntheticFamilyMessage({
        childId: parsed.data.childId,
        clientMutationId: parsed.data.clientMutationId,
        context,
        staffUserId: parsed.data.staffUserId,
        threadId: parsed.data.threadId,
      });
      if (!receipt) return failure('NOT_FOUND');
      return {
        data: receipt,
        ok: true,
      };
    }
    const database = await createFamilyRequestClient();
    const result = await database.rpc('send_family_message_v1', {
      p_body: parsed.data.body,
      p_child_id: parsed.data.childId ?? null,
      p_client_mutation_id: parsed.data.clientMutationId,
      p_enrollment_id: parsed.data.enrollmentId ?? null,
      p_staff_user_id: parsed.data.staffUserId ?? null,
      p_thread_id: parsed.data.threadId ?? null,
      p_topic: parsed.data.topic ?? null,
    });
    const rpcError = rpcFailureCode(result.error);
    if (rpcError) return failure(rpcError);
    const row = familyMessageReceiptSchema.safeParse(result.data);
    if (!row.success) return failure('RETRY_LATER');
    familyPaths();
    return {
      data: {
        messageId: row.data.message_id,
        threadId: row.data.thread_id,
      },
      ok: true,
    };
  } catch (error) {
    return errorResult(error) as FamilyActionResult<FamilyMessageReceipt>;
  }
}

export async function markFamilyThreadRead(input: unknown): Promise<FamilyActionResult> {
  const parsed = markFamilyThreadReadSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    if (!readFamilyFeatureFlags().messagingEnabled) {
      return failure('FEATURE_DISABLED');
    }
    const context = await requireFamilyAuthorization({
      roles: ['guardian', 'teacher'],
    });
    if (!context.messagingEnabled) return failure('FEATURE_DISABLED');
    if (!(
      context.permissions.includes('family:message')
      || context.permissions.includes('family:teacher-message')
    )) return failure('FORBIDDEN');
    if (context.synthetic) {
      if (!markSyntheticFamilyThreadRead(context, parsed.data.threadId)) {
        return failure('NOT_FOUND');
      }
      return {ok: true};
    }
    const database = await createFamilyRequestClient();
    const result = await database.rpc('mark_family_thread_read_v1', {
      p_client_mutation_id: parsed.data.clientMutationId,
      p_thread_id: parsed.data.threadId,
    });
    const rpcError = rpcFailureCode(result.error);
    if (rpcError) return failure(rpcError);
    familyPaths();
    return {ok: true};
  } catch (error) {
    return errorResult(error);
  }
}

export async function closeFamilyThread(input: unknown): Promise<FamilyActionResult> {
  const parsed = closeFamilyThreadSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    if (!readFamilyFeatureFlags().messagingEnabled) {
      return failure('FEATURE_DISABLED');
    }
    const context = await requireFamilyAuthorization({
      roles: ['guardian', 'teacher'],
    });
    if (!context.messagingEnabled) return failure('FEATURE_DISABLED');
    if (!(
      context.permissions.includes('family:message')
      || context.permissions.includes('family:teacher-message')
    )) return failure('FORBIDDEN');
    if (context.synthetic) {
      if (!closeSyntheticFamilyThread(context, parsed.data.threadId)) {
        return failure('NOT_FOUND');
      }
      return {ok: true};
    }
    const database = await createFamilyRequestClient();
    const result = await database.rpc('close_family_thread_v1', {
      p_client_mutation_id: parsed.data.clientMutationId,
      p_thread_id: parsed.data.threadId,
    });
    const rpcError = rpcFailureCode(result.error);
    if (rpcError) return failure(rpcError);
    familyPaths();
    return {ok: true};
  } catch (error) {
    return errorResult(error);
  }
}

export async function updateFamilyNotificationPreferences(
  input: unknown,
): Promise<FamilyActionResult> {
  const parsed = updateFamilyNotificationPreferencesSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const flags = readFamilyFeatureFlags();
    if (
      (parsed.data.messageEmailEnabled || parsed.data.weeklyDigestEnabled)
      && !flags.emailNotificationsEnabled
    ) return failure('FEATURE_DISABLED');
    const context = await requireFamilyAuthorization({roles: ['guardian']});
    if (
      (parsed.data.messageEmailEnabled || parsed.data.weeklyDigestEnabled)
      && !context.messagingEnabled
    ) return failure('FEATURE_DISABLED');
    if (context.synthetic) {
      setSyntheticFamilyNotificationPreference(context.appUserId, {
        messageEmailEnabled: parsed.data.messageEmailEnabled,
        weeklyDigestEnabled: parsed.data.weeklyDigestEnabled,
      });
      return {ok: true};
    }
    const database = await createFamilyRequestClient();
    const result = await database.rpc(
      'update_family_notification_preferences_for_tenant_v1',
      {
        p_client_mutation_id: parsed.data.clientMutationId,
        p_message_email_enabled: parsed.data.messageEmailEnabled,
        p_tenant_id: context.currentTenantId,
        p_weekly_digest_enabled: parsed.data.weeklyDigestEnabled,
      },
    );
    const rpcError = rpcFailureCode(result.error);
    if (rpcError) return failure(rpcError);
    familyPaths();
    return {ok: true};
  } catch (error) {
    return errorResult(error);
  }
}

export async function publishSchoolAnnouncement(
  input: unknown,
): Promise<FamilyActionResult<FamilyAnnouncementReceipt>> {
  const parsed = publishSchoolAnnouncementSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    if (!readFamilyFeatureFlags().messagingEnabled) {
      return failure('FEATURE_DISABLED');
    }
    const context = await requireFamilyAuthorization({
      permissions: ['family:announce'],
      roles: ['teacher', 'school_admin', 'district_admin'],
    });
    if (!context.messagingEnabled) return failure('FEATURE_DISABLED');
    // Synthetic announcement composition is intentionally browser-local. A
    // direct synthetic action call never creates a database row or delivery.
    if (context.synthetic) return failure('FEATURE_DISABLED');

    const database = await createFamilyRequestClient();
    const authorization = await database.rpc(
      'authorize_school_announcement_publish_v1',
      {p_school_id: parsed.data.schoolId},
    );
    const authorizationError = rpcFailureCode(authorization.error);
    if (authorizationError) return failure(authorizationError);
    const authorized = announcementPublishAuthorizationSchema.safeParse(
      authorization.data,
    );
    if (
      !authorized.success
      || authorized.data.schoolId !== parsed.data.schoolId
      || authorized.data.tenantId !== context.currentTenantId
    ) return failure('FORBIDDEN');

    const result = await database.rpc('publish_school_announcement_v1', {
      p_body: parsed.data.body,
      p_expires_at: null,
      p_idempotency_key: parsed.data.clientMutationId,
      p_school_id: parsed.data.schoolId,
      p_title: parsed.data.title,
    });
    const rpcError = rpcFailureCode(result.error);
    if (rpcError) return failure(rpcError);
    const receipt = announcementPublishReceiptSchema.safeParse(result.data);
    if (!receipt.success) return failure('RETRY_LATER');
    const row = receipt.data[0]!;
    familyPaths();
    return {
      data: {
        announcementId: row.announcement_id,
        expiresAt: row.expires_at,
        publishedAt: row.published_at,
      },
      ok: true,
    };
  } catch (error) {
    return errorResult(error) as FamilyActionResult<FamilyAnnouncementReceipt>;
  }
}

export async function selectFamilyChild(input: unknown): Promise<FamilyActionResult> {
  const parsed = selectFamilyChildSchema.safeParse(input);
  if (!parsed.success) return failure('INVALID_INPUT');
  try {
    const context = await requireFamilyAuthorization({
      permissions: ['family:read'],
      roles: ['guardian'],
    });
    if (context.synthetic) {
      if (!isSyntheticFamilyChildAuthorized(
        context.appUserId,
        parsed.data.childId,
      )) return failure('NOT_FOUND');
    } else {
      const database = await createFamilyRequestClient();
      const result = await database.rpc('family_workspace_for_tenant_v1', {
        p_child_id: parsed.data.childId,
        p_tenant_id: context.currentTenantId,
      });
      const rpcError = rpcFailureCode(result.error);
      if (rpcError) return failure(rpcError);
      if (!familyWorkspaceDtoSchema.safeParse(result.data).success) {
        return failure('RETRY_LATER');
      }
    }
    await storeSelectedFamilyChildId(parsed.data.childId);
    familyPaths();
    return {ok: true};
  } catch (error) {
    return errorResult(error);
  }
}
