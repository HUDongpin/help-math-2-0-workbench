import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {z} from 'zod';

import {AdminFamilyOperationsWorkspaceView, FamilySupportCaseView} from '@/components/family/family-governance-workspaces';
import {isLocale} from '@/content';
import {requireFamilyAuthorization} from '@/lib/family/authorization.server';
import {getAdminFamilyAccessDemoData} from '@/lib/family/family-demo-data';
import {
  createFamilySupportAccessRequest,
  decideFamilySupportAccessRequest,
  redactFamilyMessage,
  reviewFamilyInvitationSuggestion,
  reviewFamilyRightsRequest,
} from '@/lib/family/governance-actions';
import {readAdminFamilyOperationsWorkspace, readFamilySupportCase} from '@/lib/family/governance-repository.server';
import {handleFamilyPageAccessError, requireFamilyPageFeature} from '@/lib/family/page-access.server';
import {createPageMetadata} from '@/lib/metadata';

async function reviewRights(requestId: string, status: 'completed' | 'declined', clientMutationId: string) {
  'use server'; return reviewFamilyRightsRequest({clientMutationId, requestId, status});
}
async function reviewSuggestion(suggestionId: string, status: 'reviewed' | 'dismissed', clientMutationId: string) {
  'use server'; return reviewFamilyInvitationSuggestion({clientMutationId, status, suggestionId});
}
async function createSupport(threadId: string, reason: string, clientMutationId: string) {
  'use server'; return createFamilySupportAccessRequest({clientMutationId, reason, threadId});
}
async function decideSupport(requestId: string, approved: boolean, decisionNote: string, clientMutationId: string) {
  'use server'; return decideFamilySupportAccessRequest({approved, clientMutationId, decisionNote, requestId});
}
async function redact(messageId: string, reason: string, clientMutationId: string) {
  'use server'; return redactFamilyMessage({clientMutationId, messageId, reason});
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  return {...createPageMetadata(locale, locale === 'es'
    ? {title: 'Operaciones familiares', description: 'Flujos escolares protegidos y auditados para familias.'}
    : {title: 'Family operations', description: 'Protected, audited school workflows for families.'}, '/admin/family-operations'), robots: {index: false, follow: false}};
}

export default async function AdminFamilyOperationsPage({params, searchParams}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{support?: string | string[]}>;
}) {
  const [{locale}, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  requireFamilyPageFeature();
  const rawSupport = Array.isArray(query.support) ? query.support[0] : query.support;
  const supportId = z.uuid().safeParse(rawSupport).success ? rawSupport : undefined;
  let context;
  let workspace;
  let supportCase;
  try {
    context = await requireFamilyAuthorization({permissions: ['family:manage-access'], roles: ['school_admin', 'district_admin']});
    if (supportId) supportCase = await readFamilySupportCase(supportId);
    if (context.synthetic) {
      const demo = getAdminFamilyAccessDemoData(locale);
      workspace = {invitationSuggestions: [], rightsRequests: [], supportRequests: [], tenant: demo.tenant};
    } else {
      workspace = await readAdminFamilyOperationsWorkspace();
    }
  } catch (error) {
    handleFamilyPageAccessError(error, locale, '/admin/family-operations');
  }
  if (supportCase) return <FamilySupportCaseView caseData={supportCase} locale={locale} onRedactAction={redact} />;
  return <AdminFamilyOperationsWorkspaceView
    canDecideSupport={context.roles.includes('district_admin')}
    locale={locale}
    onCreateSupportAction={createSupport}
    onDecideSupportAction={decideSupport}
    onReviewRightsAction={reviewRights}
    onReviewSuggestionAction={reviewSuggestion}
    workspace={workspace}
  />;
}
