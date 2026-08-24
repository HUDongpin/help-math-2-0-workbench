import {ShieldCheck} from 'lucide-react';
import type {ReactNode} from 'react';

import {Link} from '@/i18n/navigation';
import type {AppLocale} from '@/i18n/routing';

import styles from './local-auth.module.css';

export function LocalAuthFlowPage({
  children,
  family = false,
  locale,
  mode,
}: Readonly<{
  children: ReactNode;
  family?: boolean;
  locale: AppLocale;
  mode: 'recover' | 'sign-in' | 'sign-up' | 'update-password';
}>) {
  const spanish = locale === 'es';
  const signUp = mode === 'sign-up';
  return <main
    className={`${styles.page} ${signUp ? styles.signUpPage : ''}`}
    id="main-content"
    tabIndex={-1}
  >
    <div className={styles.flow}>
      <header className={styles.intro}>
        <Link href="/">← {spanish ? 'Volver al espacio de aprendizaje' : 'Back to learning home'}</Link>
        {!signUp
          ? <h1>{spanish
              ? 'Vuelve a tu aprendizaje'
              : 'Return to your learning'}</h1>
          : null}
        {!signUp ? <p>{spanish
          ? (family
              ? 'Usa únicamente tu cuenta actual de Familia. Nunca uses credenciales históricas de HELP Math.'
              : 'Inicia sesión en la instancia local de desarrollo. No uses credenciales históricas de HELP Math.')
          : (family
              ? 'Use only your current Family account. Never use historical HELP Math credentials.'
              : 'Sign in to the local development instance. Never use historical HELP Math credentials.')}</p> : null}
      </header>
      {children}
    </div>
  </main>;
}

export function LocalAccountPage({
  children,
  locale,
  provider = 'clerk',
}: Readonly<{
  children: ReactNode;
  locale: AppLocale;
  provider?: 'clerk' | 'supabase';
}>) {
  const spanish = locale === 'es';
  return <main className={styles.page} id="main-content" tabIndex={-1}>
    <section className={styles.accountCard}>
      <ShieldCheck aria-hidden="true" />
      <h1>{provider === 'supabase'
        ? (spanish ? 'Cuenta de Familia activa' : 'Family account active')
        : (spanish ? 'Sesión local activa' : 'Local session active')}</h1>
      <p>{provider === 'supabase'
        ? (spanish
            ? 'Supabase Auth verificó esta sesión. HELP Math vuelve a comprobar el tenant, el rol y cada relación familiar en el servidor.'
            : 'Supabase Auth verified this session. HELP Math rechecks the tenant, role, and every family relationship on the server.')
        : (spanish
            ? 'Clerk verificó esta sesión en el servidor. HELP Math no muestra ni guarda aquí datos personales del proveedor.'
            : 'Clerk verified this session on the server. HELP Math does not display or store provider personal data here.')}</p>
      <div className={styles.accountActions}>
        <Link href="/">{spanish ? 'Ir al aprendizaje' : 'Go to learning home'}</Link>
        {children}
      </div>
    </section>
  </main>;
}
