import type {Metadata} from 'next';
import {notFound, redirect} from 'next/navigation';

import {ClerkSignOutControl} from '@/components/auth/clerk-auth-ui';
import {LocalAccountPage} from '@/components/auth/local-auth-page';
import {SupabaseAccountControls} from '@/components/auth/supabase-account-controls';
import {isLocale} from '@/content';
import {localizedFamilyAuthPath} from '@/lib/family/auth-flow';
import {
  isFamilyAuthEnabled,
  readFamilyAuthProviderMode,
} from '@/lib/family/auth-provider-config';
import {readFamilyAuthSession} from '@/lib/family/family-auth-session.server';
import {localizedAuthPath} from '@/lib/local-auth-access';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  return {
    robots: {follow: false, index: false},
    title: locale === 'es'
      ? 'Cuenta de aprendizaje local'
      : 'Local learning account',
  };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const provider = readFamilyAuthProviderMode();
  if (!isLocale(locale) || !isFamilyAuthEnabled()) notFound();

  const session = await readFamilyAuthSession();
  if (session.status !== 'signed-in') {
    const target = new URLSearchParams({
      redirect_url: localizedAuthPath(locale, '/account'),
    });
    redirect(`${localizedFamilyAuthPath(locale, '/sign-in')}?${target.toString()}`);
  }

  return <LocalAccountPage
    locale={locale}
    provider={provider === 'supabase' ? 'supabase' : 'clerk'}
  >
    {provider === 'supabase'
      ? <SupabaseAccountControls locale={locale} />
      : <ClerkSignOutControl locale={locale} />}
  </LocalAccountPage>;
}
