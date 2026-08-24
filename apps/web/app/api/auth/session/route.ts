import {NextResponse} from 'next/server';

import {isFamilyAuthEnabled} from '@/lib/family/auth-provider-config';
import {readFamilyAuthSession} from '@/lib/family/family-auth-session.server';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
};

export async function GET() {
  if (!isFamilyAuthEnabled()) {
    return new NextResponse('Not Found', {headers: privateHeaders, status: 404});
  }

  const session = await readFamilyAuthSession();
  if (session.status !== 'signed-in') {
    return NextResponse.json(
      {ok: false, status: 'signed-out'},
      {headers: privateHeaders, status: 401},
    );
  }

  return NextResponse.json(
    {ok: true, status: session.status},
    {headers: privateHeaders},
  );
}
