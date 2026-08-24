import {isAuthorizedFamilyCronRequest} from '@/lib/family/cron-auth.server';
import {processFamilyNotificationBatch} from '@/lib/family/notification-service.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export async function GET(request: Request) {
  if (!isAuthorizedFamilyCronRequest(request.headers.get('authorization'))) {
    return Response.json({ok: false, error: 'UNAUTHORIZED'}, {
      headers: privateHeaders,
      status: 401,
    });
  }

  try {
    const result = await processFamilyNotificationBatch();
    return Response.json({ok: true, ...result}, {headers: privateHeaders});
  } catch {
    return Response.json({ok: false, error: 'RETRY_LATER'}, {
      headers: privateHeaders,
      status: 503,
    });
  }
}
