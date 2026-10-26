import {p003AudioResponse} from '@/lib/g678-nms-l09-p003-audio-response.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  return p003AudioResponse(request);
}
