import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {FamilyInvitationAcceptDemo} from '@/components/family/family-companion-surfaces';
import {isLocale} from '@/content';
import {getFamilyInvitationAcceptDemoData} from '@/lib/family/family-demo-data';
import {getAuthorizedFamilyInvitationAcceptData} from '@/lib/family/family-ui-data';
import {acceptGuardianInvitation} from '@/lib/family/actions';
import {declineGuardianInvitation} from '@/lib/family/governance-actions';
import {readFamilyAuthSession} from '@/lib/family/family-auth-session.server';
import {readFamilyFeatureFlags} from '@/lib/family/feature-flags';
import {requireFamilyPageFeature} from '@/lib/family/page-access.server';
import {createPageMetadata} from '@/lib/metadata';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const page = locale === 'es'
    ? {title: 'Invitación familiar', description: 'Acepta de forma segura una invitación familiar de HELP Math.'}
    : {title: 'Family invitation', description: 'Safely accept a HELP Math family invitation.'};
  return {...createPageMetadata(locale, page, '/family/invitations/accept'), robots: {index: false, follow: false}};
}

export default async function FamilyInvitationAcceptPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  requireFamilyPageFeature();
  const flags = readFamilyFeatureFlags();
  const session = flags.syntheticDemoEnabled
    ? {status: 'signed-in'} as const
    : await readFamilyAuthSession();

  async function acceptFromInvitationGateway(
    token: string,
    clientMutationId: string,
  ) {
    'use server';
    return acceptGuardianInvitation({
      clientMutationId,
      token,
    });
  }

  async function declineFromInvitationGateway(
    token: string,
    clientMutationId: string,
  ) {
    'use server';
    return declineGuardianInvitation({clientMutationId, token});
  }

  return <FamilyInvitationAcceptDemo
    data={flags.syntheticDemoEnabled
      ? getFamilyInvitationAcceptDemoData(locale)
      : getAuthorizedFamilyInvitationAcceptData(locale)}
    onAcceptAction={acceptFromInvitationGateway}
    onDeclineAction={declineFromInvitationGateway}
    signedIn={session.status === 'signed-in'}
  />;
}
