import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {FamilyPortal} from '@/components/family/family-portal';
import {ClerkSignOutControl} from '@/components/auth/clerk-auth-ui';
import {SupabaseSignOutControl} from '@/components/auth/supabase-account-controls';
import {isLocale} from '@/content';
import {
  closeFamilyThread,
  markFamilyThreadRead,
  relinquishGuardianChildAccess,
  selectFamilyChild,
  sendFamilyMessage,
  updateFamilyNotificationPreferences,
} from '@/lib/family/actions';
import {
  requireFamilyAuthorization,
  readFamilyAuthorizedTenantOptions,
} from '@/lib/family/authorization.server';
import {getFamilyDemoData, isFamilyPortalView} from '@/lib/family/family-demo-data';
import {readFamilyWorkspace} from '@/lib/family/family-repository.server';
import {getAuthorizedFamilyPortalData} from '@/lib/family/family-ui-data';
import {
  handleFamilyPageAccessError,
  requireFamilyPageFeature,
} from '@/lib/family/page-access.server';
import {readSelectedFamilyChildId} from '@/lib/family/selection.server';
import {selectGuardianFamilyTenant} from '@/lib/family/tenant-selection.server';
import type {FamilyMessageTopic} from '@/lib/family/types';
import {
  syntheticFamilyChildIds,
} from '@/lib/family/synthetic-family-state.server';
import {createPageMetadata} from '@/lib/metadata';

type FamilySearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function selectChildFromFamilyPortal(childId: string) {
  'use server';
  return selectFamilyChild({
    childId,
    clientMutationId: `family-select:${crypto.randomUUID()}`,
  });
}

async function selectTenantFromFamilyPortal(tenantId: string) {
  'use server';
  return selectGuardianFamilyTenant({
    clientMutationId: `family-tenant-select:${crypto.randomUUID()}`,
    tenantId,
  });
}

async function sendMessageFromFamilyPortal(
  threadId: string,
  body: string,
  clientMutationId: string,
) {
  'use server';
  return sendFamilyMessage({body, clientMutationId, threadId});
}

async function createThreadFromFamilyPortal(
  childId: string,
  enrollmentId: string,
  staffUserId: string,
  topic: FamilyMessageTopic,
  body: string,
  clientMutationId: string,
) {
  'use server';
  return sendFamilyMessage({
    body,
    childId,
    clientMutationId,
    enrollmentId,
    staffUserId,
    topic,
  });
}

async function markThreadReadFromFamilyPortal(
  threadId: string,
  clientMutationId: string,
) {
  'use server';
  return markFamilyThreadRead({clientMutationId, threadId});
}

async function closeThreadFromFamilyPortal(
  threadId: string,
  clientMutationId: string,
) {
  'use server';
  return closeFamilyThread({clientMutationId, status: 'closed', threadId});
}

async function relinquishAccessFromFamilyPortal(
  childId: string,
  clientMutationId: string,
) {
  'use server';
  return relinquishGuardianChildAccess({childId, clientMutationId});
}

async function updatePreferencesFromFamilyPortal(
  weeklyDigestEnabled: boolean,
  messageEmailEnabled: boolean,
  clientMutationId: string,
) {
  'use server';
  return updateFamilyNotificationPreferences({
    clientMutationId,
    messageEmailEnabled,
    weeklyDigestEnabled,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();

  const page = locale === 'es'
    ? {
        title: 'Espacio para familias',
        description: 'Espacio protegido de HELP Math para familias autorizadas.',
      }
    : {
        title: 'Family workspace',
        description: 'Protected HELP Math workspace for authorized families.',
      };

  return {
    ...createPageMetadata(locale, page, '/family'),
    robots: {index: false, follow: false},
  };
}

export default async function FamilyPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<FamilySearchParams>;
}) {
  const [{locale}, query, selectedChildId] = await Promise.all([
    params,
    searchParams,
    readSelectedFamilyChildId(),
  ]);
  if (!isLocale(locale)) notFound();
  const flags = requireFamilyPageFeature();

  let context;
  let data;
  let tenantOptions;
  try {
    context = await requireFamilyAuthorization({
      permissions: ['family:read'],
      roles: ['guardian'],
    });
    data = context.synthetic
      ? getFamilyDemoData(
          locale,
          selectedChildId,
          syntheticFamilyChildIds(context.appUserId),
        )
      : getAuthorizedFamilyPortalData(
          locale,
          await readFamilyWorkspace(selectedChildId),
        );
    tenantOptions = context.synthetic
      ? [data.tenant]
      : await readFamilyAuthorizedTenantOptions('guardian');
  } catch (error) {
    handleFamilyPageAccessError(error, locale, '/family');
  }

  const requestedView = first(query.view);
  const initialView = isFamilyPortalView(requestedView) ? requestedView : 'overview';
  const messagingEnabled = flags.messagingEnabled && context.messagingEnabled;

  return (
    <FamilyPortal
      accountControl={context.provider === 'clerk'
        ? <ClerkSignOutControl locale={locale} />
        : context.provider === 'supabase'
          ? <SupabaseSignOutControl locale={locale} />
          : undefined}
      data={data}
      initialView={initialView}
      key={`${locale}:${data.tenant.id}:${data.selectedChild.id}`}
      onCloseThreadAction={messagingEnabled
        ? closeThreadFromFamilyPortal
        : undefined}
      onCreateThreadAction={messagingEnabled
        ? createThreadFromFamilyPortal
        : undefined}
      onMarkThreadReadAction={messagingEnabled
        ? markThreadReadFromFamilyPortal
        : undefined}
      onRelinquishAccessAction={relinquishAccessFromFamilyPortal}
      onSelectChildAction={selectChildFromFamilyPortal}
      onSelectTenantAction={!context.synthetic && tenantOptions.length > 1
        ? selectTenantFromFamilyPortal
        : undefined}
      onSendMessageAction={messagingEnabled
        ? sendMessageFromFamilyPortal
        : undefined}
      onUpdatePreferencesAction={flags.emailNotificationsEnabled
        && context.messagingEnabled
        ? updatePreferencesFromFamilyPortal
        : undefined}
      tenantOptions={tenantOptions}
    />
  );
}
