import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {LocalAuthFlowPage} from '@/components/auth/local-auth-page';
import {SupabaseAuthFlow} from '@/components/auth/supabase-auth-ui';
import {isLocale} from '@/content';
import {readFamilyAuthProviderMode} from '@/lib/family/auth-provider-config';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  return {
    robots: {follow: false, index: false},
    title: locale === 'es' ? 'Recupera tu cuenta' : 'Recover your account',
  };
}

export default async function RecoverPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!isLocale(locale) || readFamilyAuthProviderMode() !== 'supabase') {
    notFound();
  }
  return <LocalAuthFlowPage family locale={locale} mode="recover">
    <SupabaseAuthFlow locale={locale} mode="recover" />
  </LocalAuthFlowPage>;
}
