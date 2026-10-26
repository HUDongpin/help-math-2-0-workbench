import {p001GlyphResponse} from '@/lib/g678-alg-l06-p001-glyph-response.server';

export const dynamic = 'force-dynamic';
export async function GET(request: Request): Promise<Response> {
  return p001GlyphResponse(request);
}
