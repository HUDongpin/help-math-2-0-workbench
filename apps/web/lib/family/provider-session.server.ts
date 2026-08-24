import 'server-only';

import {auth, currentUser} from '@clerk/nextjs/server';
import {parsePublishableKey} from '@clerk/shared/keys';
import {cache} from 'react';
import {z} from 'zod';

import {readAuthSession as readClerkAuthSession} from '@/lib/clerk-auth-session.server';

import {readFamilyAuthProviderMode} from './auth-provider-config';
import {
  createFamilySupabaseAuthServerClient,
  familySupabaseAuthContract,
} from './supabase-auth.server';

export interface FamilyProviderSession {
  provider: 'clerk' | 'supabase';
  issuer: string;
  sessionId: string;
  subject: string;
}

const supabaseClaimsSchema = z.object({
  aud: z.union([z.string(), z.array(z.string()).min(1).max(10)]),
  exp: z.number().int().positive(),
  is_anonymous: z.boolean().optional(),
  iss: z.string().min(1).max(500),
  role: z.literal('authenticated'),
  session_id: z.uuid(),
  sub: z.uuid(),
}).passthrough();

function expectedClerkIssuer() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) return null;
  try {
    const parsed = parsePublishableKey(publishableKey, {fatal: true});
    const frontendApi = parsed.frontendApi.includes('://')
      ? parsed.frontendApi
      : `https://${parsed.frontendApi}`;
    const url = new URL(frontendApi);
    if (
      parsed.instanceType !== 'development'
      || url.protocol !== 'https:'
      || url.pathname !== '/'
      || url.search
      || url.hash
      || url.username
      || url.password
      || url.port
      || !/^[a-z0-9-]+(?:-[a-z0-9-]+)+\.clerk\.accounts\.dev$/u.test(
        url.hostname.toLowerCase(),
      )
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function readFamilyProviderSession(): Promise<
  FamilyProviderSession | null
> {
  const mode = readFamilyAuthProviderMode();
  if (mode === 'supabase') {
    const snapshot = await readSupabaseSnapshot();
    return snapshot?.session ?? null;
  }
  if (mode !== 'clerk-development') return null;

  const session = await readClerkAuthSession();
  if (session.status !== 'signed-in') return null;
  const clerk = await auth();
  const claimIssuer = (clerk.sessionClaims as {iss?: unknown} | null)?.iss;
  const issuer = typeof claimIssuer === 'string'
    ? claimIssuer.replace(/\/$/u, '')
    : null;
  if (!issuer || issuer !== expectedClerkIssuer()) return null;

  return {
    issuer,
    provider: 'clerk',
    sessionId: session.sessionId,
    subject: session.providerSubject,
  };
}

export async function readFamilyProviderAccessToken() {
  const mode = readFamilyAuthProviderMode();
  if (mode === 'supabase') {
    const snapshot = await readSupabaseSnapshot();
    return snapshot?.accessToken ?? null;
  }
  if (mode !== 'clerk-development') return null;
  const session = await auth();
  if (!session.userId || !session.sessionId) return null;
  return session.getToken();
}

export async function readVerifiedFamilyProviderEmail() {
  const mode = readFamilyAuthProviderMode();
  if (mode === 'supabase') {
    const snapshot = await readSupabaseSnapshot();
    if (!snapshot) return null;
    const client = await createFamilySupabaseAuthServerClient();
    const result = await client.auth.getUser();
    const user = result.data.user;
    if (
      result.error
      || !user
      || user.id !== snapshot.session.subject
      || !user.email
      || !user.email_confirmed_at
      || user.is_anonymous
    ) return null;
    return user.email.trim().toLowerCase();
  }
  if (mode !== 'clerk-development') return null;
  const user = await currentUser();
  const email = user?.primaryEmailAddress;
  if (!email || email.verification?.status !== 'verified') return null;
  return email.emailAddress.trim().toLowerCase();
}

const readSupabaseSnapshot = cache(async () => {
  const client = await createFamilySupabaseAuthServerClient();
  const claimsResult = await client.auth.getClaims();
  if (claimsResult.error || !claimsResult.data) return null;
  const claims = supabaseClaimsSchema.safeParse(claimsResult.data.claims);
  if (!claims.success || claims.data.is_anonymous === true) return null;

  const {audience, issuer} = familySupabaseAuthContract();
  const audiences = Array.isArray(claims.data.aud)
    ? claims.data.aud
    : [claims.data.aud];
  if (
    claims.data.iss.replace(/\/$/u, '') !== issuer
    || !audiences.includes(audience)
  ) return null;

  const sessionResult = await client.auth.getSession();
  const session = sessionResult.data.session;
  if (sessionResult.error || !session?.access_token) return null;

  return {
    accessToken: session.access_token,
    session: {
      issuer,
      provider: 'supabase' as const,
      sessionId: claims.data.session_id,
      subject: claims.data.sub,
    },
  };
});
