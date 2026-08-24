import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {ClerkSignInFlow} from '@/components/auth/clerk-auth-ui';
import {LocalAuthFlowPage} from '@/components/auth/local-auth-page';
import {SupabaseAuthFlow} from '@/components/auth/supabase-auth-ui';
import {isLocale} from '@/content';
import {readFamilyAuthProviderMode} from '@/lib/family/auth-provider-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  return {
    robots: {follow: false, index: false},
    title: locale === 'es'
      ? 'Inicia sesión en HELP Math'
      : 'Sign in to HELP Math',
  };
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{redirect_url?: string | string[]}>;
}) {
  const {locale} = await params;
  const provider = readFamilyAuthProviderMode();
  if (!isLocale(locale) || provider === 'disabled') notFound();
  const requested = (await searchParams).redirect_url;
  const returnPath = typeof requested === 'string' ? requested : undefined;
  return <LocalAuthFlowPage
    family={provider === 'supabase'}
    locale={locale}
    mode="sign-in"
  >
    {provider === 'supabase'
      ? <SupabaseAuthFlow locale={locale} mode="sign-in" returnPath={returnPath} />
      : <ClerkSignInFlow locale={locale} />}
  </LocalAuthFlowPage>;
}
