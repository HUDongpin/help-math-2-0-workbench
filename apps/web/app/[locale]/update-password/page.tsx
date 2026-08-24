import type {Metadata} from 'next';
import {notFound, redirect} from 'next/navigation';

import {LocalAuthFlowPage} from '@/components/auth/local-auth-page';
import {SupabaseAuthFlow} from '@/components/auth/supabase-auth-ui';
import {isLocale} from '@/content';
import {localizedFamilyAuthPath} from '@/lib/family/auth-flow';
import {readFamilyAuthProviderMode} from '@/lib/family/auth-provider-config';
import {readFamilyAuthSession} from '@/lib/family/family-auth-session.server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  return {
    robots: {follow: false, index: false},
    title: locale === 'es' ? 'Actualiza tu contraseña' : 'Update your password',
  };
}

export default async function UpdatePasswordPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!isLocale(locale) || readFamilyAuthProviderMode() !== 'supabase') {
    notFound();
  }
  const session = await readFamilyAuthSession();
  if (session.status !== 'signed-in') {
    redirect(localizedFamilyAuthPath(locale, '/sign-in'));
  }
  return <LocalAuthFlowPage family locale={locale} mode="update-password">
    <SupabaseAuthFlow locale={locale} mode="update-password" />
  </LocalAuthFlowPage>;
}
