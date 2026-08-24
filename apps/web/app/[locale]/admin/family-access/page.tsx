import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {AdminFamilyAccessDemo} from '@/components/family/family-companion-surfaces';
import {isLocale} from '@/content';
import {getAdminFamilyAccessDemoData} from '@/lib/family/family-demo-data';
import {getAuthorizedAdminFamilyAccessData} from '@/lib/family/family-ui-data';
import {readAdminFamilyAccessWorkspace} from '@/lib/family/admin-family-access-repository.server';
import {
  createGuardianInvitation,
  resendGuardianInvitation,
  revokeGuardianInvitation,
  revokeGuardianLink,
} from '@/lib/family/actions';
import {readFamilyAuthProviderMode} from '@/lib/family/auth-provider-config';
import {requireFamilyAuthorization} from '@/lib/family/authorization.server';
import {resolveFamilyEmailTransport} from '@/lib/family/family-email-transport';
import {isFamilyInvitationIssuerConfigurationReady} from '@/lib/family/invitation-issuer.server';
import {
  isFamilyInvitationRecipientPolicyEnabled,
  readFamilyInvitationRecipientPolicy,
} from '@/lib/family/invitation-recipient-policy.server';
import {
  handleFamilyPageAccessError,
  requireFamilyPageFeature,
} from '@/lib/family/page-access.server';
import {createPageMetadata} from '@/lib/metadata';

async function createInvitationFromAdmin(
  childId: string,
  email: string,
  clientMutationId: string,
) {
  'use server';
  return createGuardianInvitation({
    clientMutationId,
    studentId: childId,
    verifiedAdultEmail: email,
  });
}

async function revokeInvitationFromAdmin(
  invitationId: string,
  clientMutationId: string,
) {
  'use server';
  return revokeGuardianInvitation({
    clientMutationId,
    invitationId,
    reason: 'School administrator revoked family access.',
  });
}

async function resendInvitationFromAdmin(
  invitationId: string,
  clientMutationId: string,
) {
  'use server';
  return resendGuardianInvitation({clientMutationId, invitationId});
}

async function revokeLinkFromAdmin(
  guardianLinkId: string,
  clientMutationId: string,
) {
  'use server';
  return revokeGuardianLink({
    clientMutationId,
    guardianLinkId,
    reason: 'School administrator revoked family access.',
  });
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const page = locale === 'es'
    ? {title: 'Acceso familiar', description: 'Vista protegida para administrar acceso familiar autorizado.'}
    : {title: 'Family access', description: 'Protected workspace for managing authorized family access.'};
  return {...createPageMetadata(locale, page, '/admin/family-access'), robots: {index: false, follow: false}};
}

export default async function AdminFamilyAccessPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const flags = requireFamilyPageFeature();
  let context;
  let data;
  let invitationCreationEnabled = false;
  let invitationRecipientPolicy:
    | 'disabled'
    | 'school-verified-production'
    | 'synthetic-invalid-only' = 'disabled';
  try {
    context = await requireFamilyAuthorization({
      permissions: ['family:manage-access'],
      roles: ['school_admin', 'district_admin'],
    });
    const configuredRecipientPolicy = readFamilyInvitationRecipientPolicy();
    let deliveryConfigurationReady = false;
    try {
      const transport = resolveFamilyEmailTransport(process.env);
      deliveryConfigurationReady = context.dataMode === 'production'
        ? readFamilyAuthProviderMode() === 'supabase' && transport === 'resend'
        : transport === 'mailpit-local';
    } catch {
      // The mutation independently repeats this fail-closed check.
    }
    invitationCreationEnabled = !context.synthetic
      && flags.emailNotificationsEnabled
      && isFamilyInvitationIssuerConfigurationReady()
      && isFamilyInvitationRecipientPolicyEnabled(context.dataMode)
      && deliveryConfigurationReady;
    if (invitationCreationEnabled) {
      invitationRecipientPolicy = configuredRecipientPolicy === 'disabled'
        ? 'disabled'
        : configuredRecipientPolicy;
    }
    data = context.synthetic
      ? getAdminFamilyAccessDemoData(locale)
      : getAuthorizedAdminFamilyAccessData(
          locale,
          await readAdminFamilyAccessWorkspace(),
          {invitationCreationEnabled, invitationRecipientPolicy},
        );
  } catch (error) {
    handleFamilyPageAccessError(error, locale, '/admin/family-access');
  }
  return <AdminFamilyAccessDemo
    data={data}
    onCreateInvitationAction={invitationCreationEnabled
      ? createInvitationFromAdmin
      : undefined}
    onResendInvitationAction={invitationCreationEnabled
      ? resendInvitationFromAdmin
      : undefined}
    onRevokeInvitationAction={revokeInvitationFromAdmin}
    onRevokeLinkAction={revokeLinkFromAdmin}
  />;
}
