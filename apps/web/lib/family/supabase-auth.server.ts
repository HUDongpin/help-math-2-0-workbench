import 'server-only';

import {createServerClient, type CookieOptions} from '@supabase/ssr';
import {cookies} from 'next/headers';
import type {NextRequest, NextResponse} from 'next/server';

import {
  expectedFamilySupabaseAudience,
  expectedFamilySupabaseIssuer,
  isFamilySupabaseAuthConfigurationReady,
} from './auth-provider-config';

export class FamilySupabaseAuthConfigurationError extends Error {
  constructor() {
    super('Family Supabase Auth is not configured.');
    this.name = 'FamilySupabaseAuthConfigurationError';
  }
}

function requireUrl() {
  if (!isFamilySupabaseAuthConfigurationReady()) {
    throw new FamilySupabaseAuthConfigurationError();
  }
  return process.env.NEXT_PUBLIC_SUPABASE_URL!.trim().replace(/\/$/u, '');
}

function requirePublishableKey() {
  if (!isFamilySupabaseAuthConfigurationReady()) {
    throw new FamilySupabaseAuthConfigurationError();
  }
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!.trim();
}

export function familySupabaseAuthContract() {
  const issuer = expectedFamilySupabaseIssuer();
  const audience = expectedFamilySupabaseAudience();
  if (!issuer || !audience) throw new FamilySupabaseAuthConfigurationError();
  return {audience, issuer};
}

export async function createFamilySupabaseAuthServerClient() {
  const cookieStore = await cookies();
  return createServerClient(requireUrl(), requirePublishableKey(), {
    auth: {flowType: 'pkce'},
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({name, options, value}) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The request proxy refreshes
          // the session before rendering; Server Actions and Route Handlers can
          // write successfully through the same adapter.
        }
      },
    },
  });
}

export async function createFamilySupabaseAuthCallbackClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(requireUrl(), requirePublishableKey(), {
    auth: {flowType: 'pkce'},
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({name, options, value}) => {
          response.cookies.set(name, value, options as CookieOptions);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });
}
