import {createServerClient, type CookieOptions} from '@supabase/ssr';
import type {NextRequest, NextResponse} from 'next/server';

import {isFamilySupabaseAuthConfigurationReady} from './auth-provider-config';

function configuration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/u, '');
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!isFamilySupabaseAuthConfigurationReady() || !url || !key) {
    throw new Error('Family Supabase Auth is not configured.');
  }
  return {key, url};
}

export async function refreshFamilySupabaseAuthSession({
  request,
  response,
}: Readonly<{request: NextRequest; response: NextResponse}>) {
  const {key, url} = configuration();
  const client = createServerClient(url, key, {
    auth: {flowType: 'pkce'},
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({name, options, value}) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options as CookieOptions);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });
  // getClaims verifies the access token and refreshes an expiring session. No
  // provider claim is copied into client-visible application state.
  await client.auth.getClaims();
  return response;
}
