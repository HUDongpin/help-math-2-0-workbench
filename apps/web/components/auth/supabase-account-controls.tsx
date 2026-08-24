'use client';

import {useState} from 'react';

import type {AppLocale} from '@/i18n/routing';
import {
  signOutAllFamilySupabaseSessions,
  signOutFamilySupabase,
  signOutOtherFamilySupabaseSessions,
} from '@/lib/family/supabase-auth-actions';

import styles from './local-auth.module.css';

export function SupabaseSignOutControl({locale}: {locale: AppLocale}) {
  return <form action={signOutFamilySupabase}>
    <input name="locale" type="hidden" value={locale} />
    <button className={styles.signOutButton} type="submit">
      {locale === 'es' ? 'Cerrar sesión' : 'Sign out'}
    </button>
  </form>;
}

export function SupabaseAccountControls({locale}: {locale: AppLocale}) {
  const [otherSessionsClosed, setOtherSessionsClosed] = useState(false);
  const spanish = locale === 'es';
  return <div className={styles.sessionControls}>
    <form action={signOutFamilySupabase}>
      <input name="locale" type="hidden" value={locale} />
      <button className={styles.signOutButton} type="submit">
        {spanish ? 'Cerrar esta sesión' : 'Sign out this session'}
      </button>
    </form>
    <button
      className={styles.signOutButton}
      onClick={async () => {
        await signOutOtherFamilySupabaseSessions();
        setOtherSessionsClosed(true);
      }}
      type="button"
    >
      {spanish ? 'Cerrar otras sesiones' : 'Sign out other devices'}
    </button>
    <form action={signOutAllFamilySupabaseSessions}>
      <input name="locale" type="hidden" value={locale} />
      <button className={styles.dangerButton} type="submit">
        {spanish ? 'Cerrar todas las sesiones' : 'Sign out all sessions'}
      </button>
    </form>
    {otherSessionsClosed ? <p aria-live="polite">{spanish
      ? 'Se revocaron las otras sesiones. Los tokens de acceso ya emitidos vencen según la política configurada.'
      : 'Other sessions were revoked. Already-issued access tokens expire under the configured policy.'}</p> : null}
  </div>;
}
