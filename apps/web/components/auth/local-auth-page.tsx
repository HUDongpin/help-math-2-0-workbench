import {ShieldCheck} from 'lucide-react';
import type {ReactNode} from 'react';

import {Link} from '@/i18n/navigation';
import type {AppLocale} from '@/i18n/routing';

import styles from './local-auth.module.css';

export function LocalAuthFlowPage({
  children,
  locale,
  mode,
}: Readonly<{
  children: ReactNode;
  locale: AppLocale;
  mode: 'sign-in' | 'sign-up';
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
          ? 'Inicia sesión en la instancia local de desarrollo. No uses credenciales históricas de HELP Math.'
          : 'Sign in to the local development instance. Never use historical HELP Math credentials.'}</p> : null}
      </header>
      {children}
    </div>
  </main>;
}

export function LocalAccountPage({
  children,
  locale,
}: Readonly<{children: ReactNode; locale: AppLocale}>) {
  const spanish = locale === 'es';
  return <main className={styles.page} id="main-content" tabIndex={-1}>
    <section className={styles.accountCard}>
      <ShieldCheck aria-hidden="true" />
      <h1>{spanish ? 'Sesión local activa' : 'Local session active'}</h1>
      <p>{spanish
        ? 'Clerk verificó esta sesión en el servidor. HELP Math no muestra ni guarda aquí datos personales del proveedor.'
        : 'Clerk verified this session on the server. HELP Math does not display or store provider personal data here.'}</p>
      <div className={styles.accountActions}>
        <Link href="/">{spanish ? 'Ir al aprendizaje' : 'Go to learning home'}</Link>
        {children}
      </div>
    </section>
  </main>;
}
