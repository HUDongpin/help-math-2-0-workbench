import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {ClerkSignUpFlow} from '@/components/auth/clerk-auth-ui';
import {LocalAuthFlowPage} from '@/components/auth/local-auth-page';
import {isLocale} from '@/content';
import {isLocalAuthEnabled} from '@/lib/local-auth-access';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  return {
    robots: {follow: false, index: false},
    title: locale === 'es'
      ? 'Crea una cuenta de aprendizaje local'
      : 'Create a local learning account',
  };
}

export default async function SignUpPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!isLocale(locale) || !isLocalAuthEnabled()) notFound();
  return <LocalAuthFlowPage locale={locale} mode="sign-up">
    <ClerkSignUpFlow locale={locale} />
  </LocalAuthFlowPage>;
}
