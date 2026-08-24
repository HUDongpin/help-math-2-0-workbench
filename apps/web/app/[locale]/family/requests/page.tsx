import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {FamilyRequestsWorkspace} from '@/components/family/family-governance-workspaces';
import {isLocale} from '@/content';
import {requireFamilyAuthorization} from '@/lib/family/authorization.server';
import {getFamilyDemoData} from '@/lib/family/family-demo-data';
import {readFamilyWorkspace} from '@/lib/family/family-repository.server';
import {createFamilyRightsRequest} from '@/lib/family/governance-actions';
import {readFamilyGovernanceWorkspace} from '@/lib/family/governance-repository.server';
import {handleFamilyPageAccessError, requireFamilyPageFeature} from '@/lib/family/page-access.server';
import {FAMILY_RIGHTS_REQUEST_KINDS, type FamilyRightsRequestKind} from '@/lib/family/types';
import {createPageMetadata} from '@/lib/metadata';

async function createRequest(
  childId: string,
  kind: FamilyRightsRequestKind,
  details: string,
  clientMutationId: string,
) {
  'use server';
  return createFamilyRightsRequest({
    clientMutationId, details, kind, studentId: childId,
  });
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  return {
    ...createPageMetadata(locale, locale === 'es'
      ? {title: 'Solicitudes familiares', description: 'Flujo protegido de solicitudes y actividad familiar.'}
      : {title: 'Family requests', description: 'Protected family request and activity workflow.'}, '/family/requests'),
    robots: {index: false, follow: false},
  };
}

export default async function FamilyRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{kind?: string | string[]}>;
}) {
  const [{locale}, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  requireFamilyPageFeature();
  let context;
  let children;
  let workspace;
  try {
    context = await requireFamilyAuthorization({permissions: ['family:read'], roles: ['guardian']});
    if (context.synthetic) {
      const demo = getFamilyDemoData(locale);
      children = demo.children.map((child) => ({displayName: child.displayName, id: child.id}));
      workspace = {accountActivity: [], rightsRequests: [], tenant: demo.tenant};
    } else {
      const [family, governance] = await Promise.all([
        readFamilyWorkspace(), readFamilyGovernanceWorkspace(),
      ]);
      children = family.children.map((child) => ({displayName: child.displayName, id: child.id}));
      workspace = governance;
    }
  } catch (error) {
    handleFamilyPageAccessError(error, locale, '/family/requests');
  }
  const rawKind = Array.isArray(query.kind) ? query.kind[0] : query.kind;
  const initialKind = FAMILY_RIGHTS_REQUEST_KINDS.includes(rawKind as FamilyRightsRequestKind)
    ? rawKind as FamilyRightsRequestKind
    : 'access';
  return <FamilyRequestsWorkspace
    linkedChildren={children}
    initialKind={initialKind}
    locale={locale}
    onCreateAction={createRequest}
    workspace={workspace}
  />;
}
