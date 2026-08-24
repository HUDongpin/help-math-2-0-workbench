'use client';

import {useActionState} from 'react';
import {useFormStatus} from 'react-dom';

import type {AppLocale} from '@/i18n/routing';
import {
  INITIAL_FAMILY_AUTH_ACTION_STATE,
  localizedFamilyAuthPath,
} from '@/lib/family/auth-flow';
import {
  requestFamilyPasswordRecovery,
  signInWithFamilySupabase,
  signUpWithFamilySupabase,
  updateFamilySupabasePassword,
} from '@/lib/family/supabase-auth-actions';

import styles from './local-auth.module.css';

type FlowMode = 'recover' | 'sign-in' | 'sign-up' | 'update-password';

function SubmitButton({label, pendingLabel}: {label: string; pendingLabel: string}) {
  const {pending} = useFormStatus();
  return <button disabled={pending} type="submit">
    {pending ? pendingLabel : label}
  </button>;
}

export function SupabaseAuthFlow({
  locale,
  mode,
  returnPath,
}: Readonly<{
  locale: AppLocale;
  mode: FlowMode;
  returnPath?: string;
}>) {
  const action = mode === 'sign-in'
    ? signInWithFamilySupabase
    : mode === 'sign-up'
      ? signUpWithFamilySupabase
      : mode === 'recover'
        ? requestFamilyPasswordRecovery
        : updateFamilySupabasePassword;
  const [state, formAction] = useActionState(
    action,
    INITIAL_FAMILY_AUTH_ACTION_STATE,
  );
  const spanish = locale === 'es';
  const copy = authCopy(locale, mode);
  const message = state.code ? messageFor(locale, state.code) : null;

  return <section className={styles.supabaseCard}>
    <div className={styles.supabaseHeading}>
      <span>{spanish ? 'Acceso familiar seguro' : 'Secure family access'}</span>
      <h1>{copy.title}</h1>
      <p>{copy.body}</p>
    </div>
    <form action={formAction} className={styles.authForm}>
      <input name="locale" type="hidden" value={locale} />
      <input
        name="returnPath"
        type="hidden"
        value={returnPath ?? localizedFamilyAuthPath(locale, '/family')}
      />
      {mode !== 'update-password' ? <label>
        <span>{spanish ? 'Correo electrónico verificado' : 'Verified email address'}</span>
        <input
          autoComplete="email"
          inputMode="email"
          maxLength={320}
          name="email"
          required
          type="email"
        />
      </label> : null}
      {mode !== 'recover' ? <label>
        <span>{mode === 'update-password'
          ? (spanish ? 'Nueva contraseña' : 'New password')
          : (spanish ? 'Contraseña' : 'Password')}</span>
        <input
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          maxLength={128}
          minLength={12}
          name="password"
          required
          type="password"
        />
        <small>{spanish ? 'Usa al menos 12 caracteres.' : 'Use at least 12 characters.'}</small>
      </label> : null}
      {mode === 'update-password' ? <label>
        <span>{spanish ? 'Confirma la nueva contraseña' : 'Confirm new password'}</span>
        <input
          autoComplete="new-password"
          maxLength={128}
          minLength={12}
          name="passwordConfirmation"
          required
          type="password"
        />
      </label> : null}
      {message ? <p aria-live="polite" className={styles.authMessage} data-status={state.status}>
        {message}
      </p> : null}
      <SubmitButton label={copy.submit} pendingLabel={copy.pending} />
    </form>
    <nav aria-label={spanish ? 'Opciones de cuenta' : 'Account options'} className={styles.authLinks}>
      {mode !== 'sign-in' ? <a href={localizedFamilyAuthPath(locale, '/sign-in')}>
        {spanish ? 'Ya tengo una cuenta' : 'I already have an account'}
      </a> : null}
      {mode === 'sign-in' ? <>
        <a href={`${localizedFamilyAuthPath(locale, '/sign-up')}?redirect_url=${encodeURIComponent(returnPath ?? localizedFamilyAuthPath(locale, '/family'))}`}>
          {spanish ? 'Crear una cuenta invitada' : 'Create an invited account'}
        </a>
        <a href={localizedFamilyAuthPath(locale, '/recover')}>
          {spanish ? 'Restablecer contraseña' : 'Reset password'}
        </a>
      </> : null}
    </nav>
    <p className={styles.authBoundary}>{spanish
      ? 'Una cuenta no otorga acceso a un estudiante. La escuela debe mantener un vínculo familiar activo.'
      : 'An account does not grant access to a learner. The school must maintain an active family link.'}</p>
  </section>;
}

function authCopy(locale: AppLocale, mode: FlowMode) {
  const spanish = locale === 'es';
  if (mode === 'sign-up') return {
    body: spanish
      ? 'Usa exactamente el correo adulto que recibió la invitación de la escuela.'
      : 'Use exactly the adult email address that received the school invitation.',
    pending: spanish ? 'Creando…' : 'Creating…',
    submit: spanish ? 'Crear cuenta' : 'Create account',
    title: spanish ? 'Crea tu cuenta de Familia' : 'Create your Family account',
  };
  if (mode === 'recover') return {
    body: spanish
      ? 'Si existe una cuenta, enviaremos un enlace seguro. La respuesta no confirma si el correo está registrado.'
      : 'If an account exists, we will send a secure link. The response does not confirm whether the address is registered.',
    pending: spanish ? 'Solicitando…' : 'Requesting…',
    submit: spanish ? 'Solicitar enlace' : 'Request link',
    title: spanish ? 'Restablece tu contraseña' : 'Reset your password',
  };
  if (mode === 'update-password') return {
    body: spanish
      ? 'El enlace de recuperación debe haber verificado esta sesión antes de cambiar la contraseña.'
      : 'The recovery link must verify this session before the password is changed.',
    pending: spanish ? 'Actualizando…' : 'Updating…',
    submit: spanish ? 'Actualizar contraseña' : 'Update password',
    title: spanish ? 'Elige una contraseña nueva' : 'Choose a new password',
  };
  return {
    body: spanish
      ? 'Inicia sesión con el correo adulto verificado. Las funciones y relaciones se vuelven a comprobar en el servidor.'
      : 'Sign in with the verified adult email. Roles and relationships are rechecked on the server.',
    pending: spanish ? 'Iniciando sesión…' : 'Signing in…',
    submit: spanish ? 'Iniciar sesión' : 'Sign in',
    title: spanish ? 'Entra al espacio de Familia' : 'Enter the Family workspace',
  };
}

function messageFor(locale: AppLocale, code: string) {
  const spanish = locale === 'es';
  switch (code) {
    case 'CHECK_EMAIL':
      return spanish
        ? 'Revisa tu correo para verificar la cuenta y continuar.'
        : 'Check your email to verify the account and continue.';
    case 'PASSWORD_UPDATED':
      return spanish ? 'La contraseña se actualizó.' : 'Your password was updated.';
    case 'REQUEST_ACCEPTED':
      return spanish
        ? 'Si existe una cuenta, recibirás un enlace de recuperación.'
        : 'If an account exists, you will receive a recovery link.';
    case 'INVALID_CREDENTIALS':
      return spanish
        ? 'No pudimos completar la solicitud. Revisa los datos e inténtalo otra vez.'
        : 'We could not complete that request. Check the fields and try again.';
    default:
      return spanish
        ? 'El servicio de cuenta no está disponible temporalmente.'
        : 'The account service is temporarily unavailable.';
  }
}
