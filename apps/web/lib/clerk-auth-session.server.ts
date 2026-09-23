import 'server-only';

import {auth} from '@clerk/nextjs/server';

import type {AuthSession} from './auth-session';
import {isAuthEnabled, isProductionSsoAuthEnabled} from './local-auth-access';

export async function readAuthSession(): Promise<AuthSession> {
  if (!isAuthEnabled()) return {status: 'disabled'};

  let session: Awaited<ReturnType<typeof auth>>;
  try {
    session = await auth();
  } catch {
    // Ordinary lessons stay available if identity cannot be checked; Nova
    // receives no enterprise identity and therefore remains closed.
    return {status: 'signed-out'};
  }
  if (!session.userId || !session.sessionId) return {status: 'signed-out'};

  let enterpriseIdentity: {
    connectionId: string;
    subject: string;
  } | undefined;
  if (isProductionSsoAuthEnabled()) {
    try {
      const {currentUser} = await import('@clerk/nextjs/server');
      const user = await currentUser();
      const identities = user?.enterpriseAccounts.filter((account) =>
        account.active && account.enterpriseConnection?.active &&
        account.providerUserId
      ) ?? [];
      // Multiple live enterprise identities are ambiguous until a district
      // explicitly maps the account. They do not grant classroom access.
      if (identities.length === 1) {
        enterpriseIdentity = {
          connectionId: identities[0]!.enterpriseConnection!.id,
          subject: identities[0]!.providerUserId!,
        };
      }
    } catch {
      // The signed-in account remains usable for ordinary site pages, while
      // every Nova class policy check fails closed without SSO proof.
    }
  }

  return {
    provider: 'clerk',
    providerSubject: session.userId,
    sessionId: session.sessionId,
    status: 'signed-in',
    ...(enterpriseIdentity ? {enterpriseIdentity} : {}),
  };
}
