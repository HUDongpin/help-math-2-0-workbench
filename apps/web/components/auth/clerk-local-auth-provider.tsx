import {enUS, esES} from '@clerk/localizations';
import {ClerkProvider} from '@clerk/nextjs';
import type {ReactNode} from 'react';

import type {AppLocale} from '@/i18n/routing';
import {isLocalAuthEnabled, localizedAuthPath} from '@/lib/local-auth-access';

export function ClerkLocalAuthProvider({
  children,
  locale,
}: Readonly<{
  children: ReactNode;
  locale: AppLocale;
}>) {
  if (!isLocalAuthEnabled()) return children;

  return <ClerkProvider
    dynamic
    localization={locale === 'es' ? esES : enUS}
    signInFallbackRedirectUrl={localizedAuthPath(locale, '/')}
    signInUrl={localizedAuthPath(locale, '/sign-in')}
    signUpFallbackRedirectUrl={localizedAuthPath(locale, '/account')}
    signUpUrl={localizedAuthPath(locale, '/sign-up')}
  >
    {children}
  </ClerkProvider>;
}
