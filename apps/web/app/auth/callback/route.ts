import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';

import {safeFamilyAuthReturnPath} from '@/lib/family/auth-flow';
import {readFamilyAuthProviderMode} from '@/lib/family/auth-provider-config';
import {createFamilySupabaseAuthCallbackClient} from '@/lib/family/supabase-auth.server';
import {getSiteUrl} from '@/lib/site';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export async function GET(request: NextRequest) {
  if (readFamilyAuthProviderMode() !== 'supabase') {
    return new NextResponse('Not Found', {headers: privateHeaders, status: 404});
  }

  const code = request.nextUrl.searchParams.get('code');
  const next = safeFamilyAuthReturnPath(
    request.nextUrl.searchParams.get('next'),
    '/family',
  );
  const redirectUrl = new URL(next, getSiteUrl());
  const response = NextResponse.redirect(redirectUrl, {headers: privateHeaders});
  if (!code || code.length > 2_048) {
    return NextResponse.redirect(new URL('/sign-in?auth_error=1', getSiteUrl()), {
      headers: privateHeaders,
    });
  }

  const client = await createFamilySupabaseAuthCallbackClient(request, response);
  const result = await client.auth.exchangeCodeForSession(code);
  if (result.error || !result.data.session) {
    return NextResponse.redirect(new URL('/sign-in?auth_error=1', getSiteUrl()), {
      headers: privateHeaders,
    });
  }
  return response;
}
