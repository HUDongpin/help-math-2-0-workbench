import {p001AudioResponse} from '@/lib/g678-alg-l06-p001-audio-response.server';

export const dynamic = 'force-dynamic';
export async function GET(request: Request): Promise<Response> {
  return p001AudioResponse(request);
}
