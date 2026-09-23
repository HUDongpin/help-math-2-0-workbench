import {readAuthSession} from '@/lib/clerk-auth-session.server';
import {readNovaClassAccess} from '@/lib/nova-class-policy.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  {params}: {params: Promise<{classId: string}>},
) {
  const {classId} = await params;
  try {
    const session = await readAuthSession();
    const access = await readNovaClassAccess(classId, session);
    return Response.json({allowed: access?.allowed ?? false}, {
      headers: {'cache-control': 'private, no-store, max-age=0'},
    });
  } catch {
    return Response.json({allowed: false}, {
      status: 503,
      headers: {'cache-control': 'private, no-store, max-age=0'},
    });
  }
}
