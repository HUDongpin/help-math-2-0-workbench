import {NextResponse} from 'next/server';

import {readAuthSession} from '@/lib/clerk-auth-session.server';
import {isLocalAuthEnabled} from '@/lib/local-auth-access';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
};

export async function GET() {
  if (!isLocalAuthEnabled()) {
    return new NextResponse('Not Found', {headers: privateHeaders, status: 404});
  }

  const session = await readAuthSession();
  if (session.status !== 'signed-in') {
    return NextResponse.json(
      {ok: false, status: 'signed-out'},
      {headers: privateHeaders, status: 401},
    );
  }

  return NextResponse.json(
    {ok: true, provider: session.provider, status: session.status},
    {headers: privateHeaders},
  );
}
