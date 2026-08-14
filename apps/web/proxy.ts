import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';

import {routing} from './i18n/routing';
import {
  isG4L3ShowcaseAssetAuthorized,
  isG4L3ShowcaseAssetPath,
} from './lib/g4-l3-showcase-asset-policy';
import {
  classifyG4L3HostCompositeAsset,
  hasExactG4L3HostCompositeDigest,
} from './lib/g4-l3-host-composite-asset-policy';
import {
  isLocalReferenceDiagnosticRequestAllowed,
  LOCAL_REFERENCE_DIAGNOSTIC_CONTENT_SECURITY_POLICY,
} from './lib/local-reference-diagnostic-access';

const publicPaths = new Set([
  '/',
  '/about',
  '/approach',
  '/curriculum',
  '/research',
  '/resources',
  '/support',
  '/login',
  '/contact',
  '/privacy',
  '/terms',
  '/demos',
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

function isArchivePath(pathname: string) {
  if (pathname === '/library') return true;
  if (/^\/courses\/[3-5]\/\d{1,2}$/u.test(pathname)) return true;
  if (/^\/animations\/[a-z0-9-]+$/u.test(pathname)) return true;
  if (pathname === '/migration-status') {
    return process.env.NODE_ENV !== 'production'
      || process.env.MIGRATION_STATUS_ENABLED === '1';
  }
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
  if (
    g4HostCompositePolicy.controlled
    && !hasExactG4L3HostCompositeDigest(
      request.nextUrl,
      g4HostCompositePolicy.expectedSha256 as string,
    )
  ) {
    return false;
  }
  const publicShowcaseAsset = isG4L3ShowcaseAssetPath(pathname)
    && isG4L3ShowcaseAssetAuthorized();
  return publicPaths.has(pathname)
    || isArchivePath(pathname)
    || publicShowcaseAsset
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
  // the default locale turns `/flash-assets/...` into `/en/flash-assets/...`,
  // where no route exists, so source-bound images and Canvas runtimes fail as
  // 404s before their own integrity policy can evaluate them.
  const localeFreeAsset = originalPath.startsWith('/flash-assets/');
  const localePrefixed = originalPath === '/en'
    || originalPath.startsWith('/en/')
    || originalPath === '/es'
    || originalPath.startsWith('/es/');
  const response = localePrefixed || localeFreeAsset
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

export default function proxy(request: NextRequest) {
  return proxyForRequest(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/flash-assets/:path*',
  ],
};
