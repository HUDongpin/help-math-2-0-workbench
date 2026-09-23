import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {ClerkSignInFlow} from '@/components/auth/clerk-auth-ui';
import {LocalAuthFlowPage} from '@/components/auth/local-auth-page';
import {isLocale} from '@/content';
import {isAuthEnabled, isLocalAuthEnabled} from '@/lib/local-auth-access';

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
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!isLocale(locale) || !isAuthEnabled()) notFound();
  return <LocalAuthFlowPage locale={locale} mode="sign-in">
    <ClerkSignInFlow allowSignUp={isLocalAuthEnabled()} locale={locale} />
  </LocalAuthFlowPage>;
}
