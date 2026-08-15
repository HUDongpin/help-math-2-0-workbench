import {clerkMiddleware} from '@clerk/nextjs/server';
import type {NextRequest} from 'next/server';
import type {NextFetchEvent} from 'next/server';
import {NextResponse} from 'next/server';

import {routing} from './i18n/routing';
import {
  isG4L3ShowcaseAssetAuthorized,
  isG4L3ShowcaseAssetPath,
} from './lib/g4-l3-showcase-asset-policy';
import {
  currentJsShowcasePublication,
  G5_L4_SHOWCASE_RELEASE_ID,
} from './lib/current-js-showcase-publication';
import {
  classifyG4L3HostCompositeAsset,
  hasExactG4L3HostCompositeDigest,
} from './lib/g4-l3-host-composite-asset-policy';
import {
  isLocalReferenceDiagnosticRequestAllowed,
  LOCAL_REFERENCE_DIAGNOSTIC_CONTENT_SECURITY_POLICY,
} from './lib/local-reference-diagnostic-access';
import {
  isMigrationStatusAvailable,
  isMigrationStatusDesignerViewRequested,
} from './lib/migration-status-access';
import {
  isLocalAuthEnabled,
  isLocalAuthPath,
  isLocalAuthSessionApiPath,
} from './lib/local-auth-access';
import {
  classifyG5L4PreviewAsset,
  hasExactG5L4RuntimeDigest,
  isG5L4ShowcaseAssetAuthorized,
  isG5L4ShowcaseAssetSegments,
} from './lib/g5-l4-preview-asset-policy';

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);

const publicPaths = new Set([
  '/',
  '/privacy',
  '/terms',
]);

function notFoundResponse() {
  return new NextResponse('Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function isReferencePath(pathname: string) {
  return /^\/reference\/[a-z0-9-]+$/u.test(pathname);
}

function isArchivePath(pathname: string, request: NextRequest) {
  if (pathname === '/migration-status') {
    return isMigrationStatusAvailable()
      && isMigrationStatusDesignerViewRequested(
        request.nextUrl.searchParams.getAll('view'),
      );
  }
  if (pathname === '/courses/4/3') return true;
  if (pathname === '/courses/5/4') {
    return currentJsShowcasePublication(
      G5_L4_SHOWCASE_RELEASE_ID,
    ).enabled;
  }
  if (process.env.NODE_ENV === 'production') return false;
  if (pathname === '/library') return true;
  if (/^\/courses\/[3-5]\/\d{1,2}$/u.test(pathname)) return true;
  if (/^\/animations\/[a-z0-9-]+$/u.test(pathname)) return true;
  return false;
}

function normalizePath(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/$/u, '') : pathname;
}

function localeFreePath(pathname: string) {
  if (
    pathname === '/en'
    || pathname.startsWith('/en/')
    || pathname === '/es'
    || pathname.startsWith('/es/')
  ) {
    return pathname.slice(3) || '/';
  }
  return pathname;
}

function isAllowed(pathname: string, request: NextRequest) {
  if (
    isLocalAuthEnabled()
    && (isLocalAuthPath(pathname) || isLocalAuthSessionApiPath(pathname))
  ) return true;
  if (isReferencePath(pathname)) {
    return isLocalReferenceDiagnosticRequestAllowed({
      headers: request.headers,
      url: request.nextUrl,
    });
  }
  const localAuditPath =
    pathname.startsWith('/flash-assets/')
    || pathname === '/demos/conversion-1-2'
    || pathname === '/demos/conversion-1-4';
  const assetSegments = pathname.startsWith('/flash-assets/')
    ? pathname.slice('/flash-assets/'.length).split('/')
    : [];
  const g4HostCompositePolicy =
    classifyG4L3HostCompositeAsset(assetSegments);
  const g5L4ShowcasePolicy = classifyG5L4PreviewAsset(assetSegments);
  if (
    g4HostCompositePolicy.controlled
    && !hasExactG4L3HostCompositeDigest(
      request.nextUrl,
      g4HostCompositePolicy.expectedSha256 as string,
    )
  ) {
    return false;
  }
  if (
    g5L4ShowcasePolicy.controlled
    && g5L4ShowcasePolicy.kind === 'runtime'
    && !hasExactG5L4RuntimeDigest(
      request.nextUrl,
      g5L4ShowcasePolicy.expectedRuntimeSha256 as string,
    )
  ) {
    return false;
  }
  const publicShowcaseAsset = isG4L3ShowcaseAssetPath(pathname)
    && isG4L3ShowcaseAssetAuthorized();
  const publicG5L4ShowcaseAsset = isG5L4ShowcaseAssetSegments(assetSegments)
    && isG5L4ShowcaseAssetAuthorized();
  return publicPaths.has(pathname)
    || isArchivePath(pathname, request)
    || publicShowcaseAsset
    || publicG5L4ShowcaseAsset
    || (process.env.NODE_ENV !== 'production' && localAuditPath);
}

function protectLocalReferenceDiagnosticResponse(response: NextResponse) {
  response.headers.set(
    'Content-Security-Policy',
    LOCAL_REFERENCE_DIAGNOSTIC_CONTENT_SECURITY_POLICY,
  );
  response.headers.set(
    'X-Robots-Tag',
    'noindex, nofollow, noarchive, noimageindex',
  );
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('X-Helpmath-Local-Reference-Diagnostic', 'forensic-only');
  return response;
}

export async function proxyForRequest(request: NextRequest) {
  const originalPath = normalizePath(request.nextUrl.pathname);
  const normalizedLocaleFree = normalizePath(localeFreePath(originalPath));
  if (!isAllowed(normalizedLocaleFree, request)) return notFoundResponse();
  // The flash-asset route is intentionally locale-free. Rewriting it through
  // the default locale turns `/flash-assets/<x>` into `/en/flash-assets/<x>`,
  // where no route exists, so source-bound images and Canvas runtimes fail as
  // 404s before their own integrity policy can evaluate them.
  const localeFreeAsset = originalPath.startsWith('/flash-assets/');
  const localeFreeAuthApi = isLocalAuthSessionApiPath(originalPath);
  const localePrefixed = originalPath === '/en'
    || originalPath.startsWith('/en/')
    || originalPath === '/es'
    || originalPath.startsWith('/es/');
  const response = localePrefixed || localeFreeAsset || localeFreeAuthApi
    ? NextResponse.next()
    : (() => {
        const rewritten = request.nextUrl.clone();
        rewritten.pathname = `/${routing.defaultLocale}${originalPath === '/' ? '' : originalPath}`;
        return NextResponse.rewrite(rewritten);
      })();

  if (isReferencePath(normalizedLocaleFree)) {
    return protectLocalReferenceDiagnosticResponse(response);
  }
  return response;
}

const clerkAwareProxy = clerkMiddleware(
  (_auth, request) => proxyForRequest(request),
);

export function normalizeLocalClerkMiddlewareResponse(
  response: Response,
  requestUrl: URL,
) {
  const rewrite = response.headers.get('x-middleware-rewrite');
  if (!rewrite) return response;
  try {
    const rewriteUrl = new URL(rewrite, requestUrl);
    const sameLoopbackContinuation = requestUrl.protocol === 'http:'
      && rewriteUrl.protocol === 'http:'
      && loopbackHosts.has(requestUrl.hostname)
      && loopbackHosts.has(rewriteUrl.hostname)
      && requestUrl.port === rewriteUrl.port
      && requestUrl.pathname === rewriteUrl.pathname
      && requestUrl.search === rewriteUrl.search;
    if (!sameLoopbackContinuation) return response;
    response.headers.delete('x-middleware-rewrite');
    response.headers.set('x-middleware-next', '1');
  } catch {
    return response;
  }
  return response;
}

export default async function proxy(
  request: NextRequest,
  event?: NextFetchEvent,
): Promise<Response> {
  if (isLocalAuthSessionApiPath(request.nextUrl.pathname)) {
    if (!isLocalAuthEnabled() || !event) return NextResponse.next();
    const response = await clerkAwareProxy(request, event) ?? NextResponse.next();
    return normalizeLocalClerkMiddlewareResponse(response, request.nextUrl);
  }
  if (!isLocalAuthEnabled() || !event) return proxyForRequest(request);
  const response = await clerkAwareProxy(request, event) ?? NextResponse.next();
  return normalizeLocalClerkMiddlewareResponse(response, request.nextUrl);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/flash-assets/:path*',
    '/api/auth/session',
  ],
};
