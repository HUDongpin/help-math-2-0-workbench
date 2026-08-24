'use server';

import {redirect} from 'next/navigation';
import {z} from 'zod';

import {getSiteUrl} from '@/lib/site';

import type {FamilyAuthActionState} from './auth-flow';
import {
  familyAuthLocale,
  localizedFamilyAuthPath,
  safeFamilyAuthReturnPath,
} from './auth-flow';
import {readFamilyAuthProviderMode} from './auth-provider-config';
import {createFamilySupabaseAuthServerClient} from './supabase-auth.server';

const credentialsSchema = z.object({
  email: z.email().max(320).transform((value) => value.trim().toLowerCase()),
  locale: z.enum(['en', 'es']),
  password: z.string().min(12).max(128),
  returnPath: z.string().max(300),
}).strict();

const recoverySchema = credentialsSchema.pick({email: true, locale: true});
const updatePasswordSchema = z.object({
  locale: z.enum(['en', 'es']),
  password: z.string().min(12).max(128),
  passwordConfirmation: z.string().min(12).max(128),
}).strict().refine(
  (value) => value.password === value.passwordConfirmation,
  {path: ['passwordConfirmation']},
);

function supabaseModeReady() {
  return readFamilyAuthProviderMode() === 'supabase';
}

export async function signInWithFamilySupabase(
  _previous: FamilyAuthActionState,
  formData: FormData,
): Promise<FamilyAuthActionState> {
  if (!supabaseModeReady()) return {code: 'RETRY_LATER', status: 'error'};
  const input = credentialsSchema.safeParse({
    email: formData.get('email'),
    locale: formData.get('locale'),
    password: formData.get('password'),
    returnPath: formData.get('returnPath') ?? '/family',
  });
  if (!input.success) {
    return {code: 'INVALID_CREDENTIALS', status: 'error'};
  }

  const client = await createFamilySupabaseAuthServerClient();
  const result = await client.auth.signInWithPassword({
    email: input.data.email,
    password: input.data.password,
  });
  if (result.error || !result.data.session) {
    return {code: 'INVALID_CREDENTIALS', status: 'error'};
  }
  redirect(safeFamilyAuthReturnPath(
    input.data.returnPath,
    localizedFamilyAuthPath(input.data.locale, '/family'),
  ));
}

export async function signUpWithFamilySupabase(
  _previous: FamilyAuthActionState,
  formData: FormData,
): Promise<FamilyAuthActionState> {
  if (!supabaseModeReady()) return {code: 'RETRY_LATER', status: 'error'};
  const input = credentialsSchema.safeParse({
    email: formData.get('email'),
    locale: formData.get('locale'),
    password: formData.get('password'),
    returnPath: formData.get('returnPath') ?? '/family',
  });
  if (!input.success) {
    return {code: 'INVALID_CREDENTIALS', status: 'error'};
  }

  const next = safeFamilyAuthReturnPath(
    input.data.returnPath,
    localizedFamilyAuthPath(input.data.locale, '/family'),
  );
  const callback = new URL('/auth/callback', getSiteUrl());
  callback.searchParams.set('next', next);
  const client = await createFamilySupabaseAuthServerClient();
  const result = await client.auth.signUp({
    email: input.data.email,
    options: {emailRedirectTo: callback.toString()},
    password: input.data.password,
  });
  // Supabase intentionally obscures duplicate-account state. Preserve the same
  // response for accepted and already-registered addresses.
  if (result.error && result.error.status && result.error.status >= 500) {
    return {code: 'RETRY_LATER', status: 'error'};
  }
  return {code: 'CHECK_EMAIL', status: 'success'};
}

export async function requestFamilyPasswordRecovery(
  _previous: FamilyAuthActionState,
  formData: FormData,
): Promise<FamilyAuthActionState> {
  if (!supabaseModeReady()) return {code: 'RETRY_LATER', status: 'error'};
  const input = recoverySchema.safeParse({
    email: formData.get('email'),
    locale: formData.get('locale'),
  });
  if (!input.success) return {code: 'REQUEST_ACCEPTED', status: 'success'};

  const callback = new URL('/auth/callback', getSiteUrl());
  callback.searchParams.set(
    'next',
    localizedFamilyAuthPath(input.data.locale, '/update-password'),
  );
  const client = await createFamilySupabaseAuthServerClient();
  await client.auth.resetPasswordForEmail(input.data.email, {
    redirectTo: callback.toString(),
  });
  // Enumeration-safe whether the address exists, is suppressed, or the
  // provider declines the request.
  return {code: 'REQUEST_ACCEPTED', status: 'success'};
}

export async function updateFamilySupabasePassword(
  _previous: FamilyAuthActionState,
  formData: FormData,
): Promise<FamilyAuthActionState> {
  if (!supabaseModeReady()) return {code: 'RETRY_LATER', status: 'error'};
  const input = updatePasswordSchema.safeParse({
    locale: formData.get('locale'),
    password: formData.get('password'),
    passwordConfirmation: formData.get('passwordConfirmation'),
  });
  if (!input.success) {
    return {code: 'INVALID_CREDENTIALS', status: 'error'};
  }
  const client = await createFamilySupabaseAuthServerClient();
  const claims = await client.auth.getClaims();
  if (claims.error || !claims.data) {
    return {code: 'INVALID_CREDENTIALS', status: 'error'};
  }
  const result = await client.auth.updateUser({password: input.data.password});
  if (result.error) return {code: 'RETRY_LATER', status: 'error'};
  return {code: 'PASSWORD_UPDATED', status: 'success'};
}

export async function signOutFamilySupabase(formData: FormData) {
  const locale = familyAuthLocale(formData.get('locale'));
  if (supabaseModeReady()) {
    const client = await createFamilySupabaseAuthServerClient();
    await client.auth.signOut({scope: 'local'});
  }
  redirect(localizedFamilyAuthPath(locale, '/sign-in'));
}

export async function signOutAllFamilySupabaseSessions(formData: FormData) {
  const locale = familyAuthLocale(formData.get('locale'));
  if (supabaseModeReady()) {
    const client = await createFamilySupabaseAuthServerClient();
    await client.auth.signOut({scope: 'global'});
  }
  redirect(localizedFamilyAuthPath(locale, '/sign-in'));
}

export async function signOutOtherFamilySupabaseSessions() {
  if (!supabaseModeReady()) return;
  const client = await createFamilySupabaseAuthServerClient();
  await client.auth.signOut({scope: 'others'});
}
