import type {Metadata} from 'next';
import {notFound, redirect} from 'next/navigation';

import {ClerkSignOutControl} from '@/components/auth/clerk-auth-ui';
import {LocalAccountPage} from '@/components/auth/local-auth-page';
import {isLocale} from '@/content';
import {readAuthSession} from '@/lib/clerk-auth-session.server';
import {isLocalAuthEnabled, localizedAuthPath} from '@/lib/local-auth-access';

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
  if (!isLocale(locale) || !isLocalAuthEnabled()) notFound();

  const session = await readAuthSession();
  if (session.status !== 'signed-in') {
    const target = new URLSearchParams({
      redirect_url: localizedAuthPath(locale, '/account'),
    });
    redirect(`${localizedAuthPath(locale, '/sign-in')}?${target.toString()}`);
  }

  return <LocalAccountPage locale={locale}>
    <ClerkSignOutControl locale={locale} />
  </LocalAccountPage>;
}
