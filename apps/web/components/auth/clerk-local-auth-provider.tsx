import {enUS, esES} from '@clerk/localizations';
import {ClerkProvider} from '@clerk/nextjs';
import type {ReactNode} from 'react';

import type {AppLocale} from '@/i18n/routing';
import {localizedAuthPath} from '@/lib/local-auth-access';

export function ClerkLocalAuthProvider({
  children,
  enabled,
  localAuth,
  locale,
}: Readonly<{
  children: ReactNode;
  enabled: boolean;
  localAuth: boolean;
  locale: AppLocale;
}>) {
  if (!enabled) return children;

  return <ClerkProvider
    dynamic
    localization={locale === 'es' ? esES : enUS}
    signInFallbackRedirectUrl={localizedAuthPath(locale, '/')}
    signInUrl={localizedAuthPath(locale, '/sign-in')}
    {...(localAuth ? {
      signUpFallbackRedirectUrl: localizedAuthPath(locale, '/account'),
      signUpUrl: localizedAuthPath(locale, '/sign-up'),
    } : {})}
  >
    {children}
  </ClerkProvider>;
}
