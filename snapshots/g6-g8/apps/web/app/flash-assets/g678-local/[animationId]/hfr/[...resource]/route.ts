import {hfrAssetRequest, hfrAssetResponse} from '@/lib/hfr-local-access';

const loadSource = () => (process.env.NODE_ENV === 'development' || process.env.HELP_MATH_G678_COMPILED_LOCAL_QA === '1')
  ? import('@/lib/hfr-local-pages.server') : Promise.resolve(null);
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const closed = () => new Response(null, {status: 404, headers: {'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive'}});
async function respond(request: Request) {
  const binding = hfrAssetRequest(new URL(request.url), request.headers, request.method);
  if (!binding) return closed();
  try {
    const source = await loadSource();
    if (!source) return closed();
    const asset = await source.readHfrLocalAsset(binding.animationId, binding.resource);
    return asset ? hfrAssetResponse(asset.bytes, binding, request.method as 'GET' | 'HEAD') : closed();
  } catch {return closed();}
}
export const GET = respond;
export const HEAD = respond;
