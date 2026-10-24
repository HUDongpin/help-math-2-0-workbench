import 'server-only';

import {auth} from '@clerk/nextjs/server';

import type {AuthSession} from './auth-session';
import {isLocalAuthEnabled} from './local-auth-access';

export async function readAuthSession(): Promise<AuthSession> {
  if (!isLocalAuthEnabled()) return {status: 'disabled'};

  const session = await auth();
  if (!session.userId || !session.sessionId) return {status: 'signed-out'};

  return {
    provider: 'clerk',
    providerSubject: session.userId,
    sessionId: session.sessionId,
    status: 'signed-in',
  };
}
