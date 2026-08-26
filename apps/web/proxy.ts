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
  isPageOnlyCurrentJsShowcaseAssetAuthorized,
  isPageOnlyCurrentJsShowcaseAssetSegments,
} from './lib/page-only-current-js-showcase-asset-policy';
import {
  isKnownPublicRoutePath,
  isPublicLessonDeploymentRouteAuthorized,
  isPublicRoutePathAuthorized,
  publicFeatureEnabled,
  publicRouteForEnglishPath,
} from './lib/public-launch-manifest.server';
import {
  classifyG5L4PreviewAsset,
  hasExactG5L4AudioDigest,
  hasExactG5L4RuntimeDigest,
  isG5L4ShowcaseAudioAuthorized,
  isG5L4ShowcaseAssetAuthorized,
  isG5L4ShowcaseAssetSegments,
} from './lib/g5-l4-preview-asset-policy';

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);

const LOCAL_GENERATED_CANDIDATE_PATHS = new Set([
  '/generated/g4-grade-wide-keyterms-en.json',
  '/generated/g4-grade-wide-keyterms-es.json',
  '/generated/g5-l4-elementary-keyterms-reference-en.json',
  '/generated/g5-l4-elementary-keyterms-reference-es.json',
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
  if (
    pathname === '/migration-status/g4-l5-product-bridge' ||
    pathname === '/migration-status/g4-l9-product-bridge' ||
    pathname === '/migration-status/g4-l10-product-bridge' ||
    pathname === '/migration-status/g4-l11-migration-factory'
  ) {
    return process.env.NODE_ENV !== 'production';
  }
  if (pathname === '/migration-status') {
    return isMigrationStatusAvailable()
      && isMigrationStatusDesignerViewRequested(
        request.nextUrl.searchParams.getAll('view'),
      );
  }
  const courseMatch = /^\/courses\/([3-5])\/(\d{1,2})$/u.exec(pathname);
  if (courseMatch) {
    return process.env.NODE_ENV !== 'production'
      || isPublicLessonDeploymentRouteAuthorized(
        Number(courseMatch[1]),
        Number(courseMatch[2]),
      );
  }
  if (process.env.NODE_ENV === 'production') return false;
  if (pathname === '/library') return true;
  if (/^\/animations\/[a-z0-9-]+$/u.test(pathname)) return true;
  return false;
}

function isPublicAuthEnabled() {
  return isLocalAuthEnabled()
    && (process.env.NODE_ENV !== 'production' || publicFeatureEnabled('auth'));
}

function normalizePath(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/$/u, '') : pathname;
}

function requestUrlForSameOriginRewrite(request: NextRequest): URL {
  const rewritten = new URL(request.nextUrl.href);
  if (
    rewritten.protocol !== 'http:'
    || !loopbackHosts.has(rewritten.hostname)
  ) {
    return rewritten;
  }

  const inboundHost = request.headers.get('host');
  if (!inboundHost) return rewritten;
  try {
    const inboundOrigin = new URL(`${rewritten.protocol}//${inboundHost}`);
    if (
      loopbackHosts.has(inboundOrigin.hostname)
      && inboundOrigin.port === rewritten.port
      && inboundOrigin.username === ''
      && inboundOrigin.password === ''
      && inboundOrigin.pathname === '/'
      && inboundOrigin.search === ''
      && inboundOrigin.hash === ''
    ) {
      rewritten.host = inboundOrigin.host;
    }
  } catch {
    // Invalid or untrusted Host input cannot influence the rewrite target.
  }
  return rewritten;
}

function isPrivateDeploymentPath(pathname: string) {
  return pathname === '/pkcs11.txt'
    || pathname === '/.env'
    || pathname.startsWith('/.env.')
    || pathname.startsWith('/source-assets/')
    || pathname.startsWith('/candidate-assets/');
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
    isPublicAuthEnabled()
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
    || LOCAL_GENERATED_CANDIDATE_PATHS.has(pathname)
    || pathname === '/demos/conversion-1-2'
    || pathname === '/demos/conversion-1-4';
  const assetSegments = pathname.startsWith('/flash-assets/')
    ? pathname.slice('/flash-assets/'.length).split('/')
    : [];
  const g4HostCompositePolicy =
    classifyG4L3HostCompositeAsset(assetSegments);
  const g5L4ShowcasePolicy = classifyG5L4PreviewAsset(assetSegments);
  // Generated audio is independently gated even in local development. This
  // check must run before the local-audit fallback below, or a showcase-only
  // deployment would advertise audio whose route is not publication-safe.
  if (
    g5L4ShowcasePolicy.kind === 'audio'
    && !isG5L4ShowcaseAudioAuthorized()
  ) {
    return false;
  }
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
    && (
      (
        g5L4ShowcasePolicy.kind === 'runtime'
        && !hasExactG5L4RuntimeDigest(
          request.nextUrl,
          g5L4ShowcasePolicy.expectedSha256 as string,
        )
      )
      || (
        g5L4ShowcasePolicy.kind === 'audio'
        && !hasExactG5L4AudioDigest(
          request.nextUrl,
          g5L4ShowcasePolicy.expectedSha256 as string,
        )
      )
    )
  ) {
    return false;
  }
  const publicShowcaseAsset = isG4L3ShowcaseAssetPath(pathname)
    && isG4L3ShowcaseAssetAuthorized();
  const publicG5L4ShowcaseAsset = isG5L4ShowcaseAssetSegments(assetSegments)
    && (
      g5L4ShowcasePolicy.kind === 'audio'
        ? isG5L4ShowcaseAudioAuthorized()
        : isG5L4ShowcaseAssetAuthorized()
    );
  const publicPageOnlyCurrentJsShowcaseAsset =
    isPageOnlyCurrentJsShowcaseAssetSegments(assetSegments)
    && isPageOnlyCurrentJsShowcaseAssetAuthorized(assetSegments);
  const publicRouteAllowed = process.env.NODE_ENV === 'production'
    ? isPublicRoutePathAuthorized(pathname)
    : isKnownPublicRoutePath(pathname);
  return publicRouteAllowed
    || isArchivePath(pathname, request)
    || publicShowcaseAsset
    || publicG5L4ShowcaseAsset
    || publicPageOnlyCurrentJsShowcaseAsset
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
  if (isPrivateDeploymentPath(originalPath)) return notFoundResponse();
  const normalizedLocaleFree = normalizePath(localeFreePath(originalPath));
  if (
    process.env.NODE_ENV === 'production'
    && normalizedLocaleFree === '/'
    && request.nextUrl.searchParams.get('screen') === 'lessons'
    && !isPublicRoutePathAuthorized('/lessons')
  ) return notFoundResponse();
  if (!isAllowed(normalizedLocaleFree, request)) return notFoundResponse();
  // The flash-asset route is intentionally locale-free. Rewriting it through
  // the default locale turns `/flash-assets/<x>` into `/en/flash-assets/<x>`,
  // where no route exists, so source-bound images and Canvas runtimes fail as
  // 404s before their own integrity policy can evaluate them.
  const localeFreeAsset = originalPath.startsWith('/flash-assets/');
  const localeFreeGeneratedCandidate = originalPath.startsWith('/generated/');
  const localeFreeAuthApi = isLocalAuthSessionApiPath(originalPath);
  const localePrefixed = originalPath === '/en'
    || originalPath.startsWith('/en/')
    || originalPath === '/es'
    || originalPath.startsWith('/es/');
  const publicRoute = publicRouteForEnglishPath(normalizedLocaleFree);
  const allLessonsRoute = publicRoute?.routeId === 'all-lessons';
  const localeFreeMachineRoute = publicRoute?.kind === 'machine-route';
  const response = allLessonsRoute
    ? (() => {
        const rewritten = requestUrlForSameOriginRewrite(request);
        const locale = originalPath === '/es' || originalPath.startsWith('/es/')
          ? 'es'
          : routing.defaultLocale;
        rewritten.pathname = `/${locale}`;
        rewritten.searchParams.set('screen', 'lessons');
        return NextResponse.rewrite(rewritten);
      })()
    : localePrefixed || localeFreeAsset || localeFreeGeneratedCandidate
        || localeFreeAuthApi
        || localeFreeMachineRoute
      ? NextResponse.next()
      : (() => {
        const rewritten = requestUrlForSameOriginRewrite(request);
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
    if (!isPublicAuthEnabled()) return proxyForRequest(request);
    if (!event) return NextResponse.next();
    const response = await clerkAwareProxy(request, event) ?? NextResponse.next();
    return normalizeLocalClerkMiddlewareResponse(response, request.nextUrl);
  }
  if (!isPublicAuthEnabled() || !event) return proxyForRequest(request);
  const response = await clerkAwareProxy(request, event) ?? NextResponse.next();
  return normalizeLocalClerkMiddlewareResponse(response, request.nextUrl);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/flash-assets/:path*',
    '/generated/:path*',
    '/source-assets/:path*',
    '/candidate-assets/:path*',
    '/((?:\\.env(?:\\..*)?|pkcs11\\.txt))',
    '/api/auth/session',
    '/robots.txt',
    '/sitemap.xml',
  ],
};
