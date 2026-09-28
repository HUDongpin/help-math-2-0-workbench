import {GET as serveFlashAsset} from '@/app/flash-assets/[...asset]/route';
import {CURRENT_JS_CANDIDATE_ASSET_VERSION} from '@/lib/current-js-asset-profile';

export async function GET(
  request: Request,
  context: {params: Promise<{asset: string[]}>},
) {
  const headers = new Headers(request.headers);
  headers.set(
    'x-help-math-current-js-candidate-route',
    CURRENT_JS_CANDIDATE_ASSET_VERSION,
  );
  return serveFlashAsset(new Request(request.url, {
    headers,
    method: 'GET',
    signal: request.signal,
  }), context);
}
