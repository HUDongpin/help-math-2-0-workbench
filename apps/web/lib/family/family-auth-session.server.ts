import 'server-only';

import type {AuthSession} from '@/lib/auth-session';
import {readAuthSession as readClerkAuthSession} from '@/lib/clerk-auth-session.server';

import {readFamilyAuthProviderMode} from './auth-provider-config';
import {readFamilyProviderSession} from './provider-session.server';

export async function readFamilyAuthSession(): Promise<AuthSession> {
  const mode = readFamilyAuthProviderMode();
  if (mode === 'disabled') return {status: 'disabled'};
  if (mode === 'clerk-development') return readClerkAuthSession();

  const session = await readFamilyProviderSession();
  if (!session) return {status: 'signed-out'};
  return {
    provider: 'supabase',
    providerSubject: session.subject,
    sessionId: session.sessionId,
    status: 'signed-in',
  };
}
