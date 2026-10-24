'use client';

import {SignIn, SignOutButton, SignUp} from '@clerk/nextjs';

import type {AppLocale} from '@/i18n/routing';
import {localizedAuthPath} from '@/lib/local-auth-access';

import styles from './local-auth.module.css';

const appearance = {
  variables: {
    borderRadius: '18px',
    colorBackground: '#ffffff',
    colorForeground: '#14213d',
    colorInputBackground: '#ffffff',
    colorInputForeground: '#14213d',
    colorPrimary: '#1768d4',
    colorText: '#14213d',
    colorTextSecondary: '#52657d',
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
    fontSize: '16px',
  },
} as const;

export function ClerkSignUpFlow({locale}: {locale: AppLocale}) {
  return <SignUp
    appearance={appearance}
    fallbackRedirectUrl={localizedAuthPath(locale, '/account')}
    path={localizedAuthPath(locale, '/sign-up')}
    routing="path"
    signInUrl={localizedAuthPath(locale, '/sign-in')}
  />;
}

export function ClerkSignInFlow({locale}: {locale: AppLocale}) {
  return <SignIn
    appearance={appearance}
    fallbackRedirectUrl={localizedAuthPath(locale, '/')}
    path={localizedAuthPath(locale, '/sign-in')}
    routing="path"
    signUpUrl={localizedAuthPath(locale, '/sign-up')}
  />;
}

export function ClerkSignOutControl({locale}: {locale: AppLocale}) {
  return <SignOutButton redirectUrl={localizedAuthPath(locale, '/')}>
    <button className={styles.signOutButton} type="button">
      {locale === 'es' ? 'Cerrar sesión' : 'Sign out'}
    </button>
  </SignOutButton>;
}
