import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';

import {routing} from './i18n/routing';
import {
  EXECUTIVE_PREVIEW_COOKIE_NAME,
  getExecutivePreviewConfig,
  isExecutivePreviewAssetPath,
  isExecutivePreviewProtectedPath,
  verifyExecutivePreviewSession,
} from './lib/executive-preview-access';
import {
  isG4L3ControlledCeoPreviewMember,
} from './lib/g4-l3-controlled-ceo-preview';
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
  '/demos/conversion-1-2',
  '/demos/conversion-1-4',
  '/executive-preview',
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

function isG4L3ControlledCeoPreviewPath(pathname: string) {
  if (pathname === '/courses/4/3') return true;
  const animationMatch = pathname.match(/^\/animations\/([a-z0-9-]+)$/u);
  return animationMatch
    ? isG4L3ControlledCeoPreviewMember(animationMatch[1]!)
    : false;
}

function isAllowed(pathname: string, request: NextRequest) {
  if (isReferencePath(pathname)) {
    return isLocalReferenceDiagnosticRequestAllowed({
      headers: request.headers,
      url: request.nextUrl,
    });
  }
  return publicPaths.has(pathname) || isArchivePath(pathname);
}

async function hasValidExecutivePreviewSession(request: NextRequest) {
  const config = getExecutivePreviewConfig();
  if (!config) return false;
  return verifyExecutivePreviewSession(
    request.cookies.get(EXECUTIVE_PREVIEW_COOKIE_NAME)?.value,
    config,
  );
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

function protectExecutivePreviewResponse(
  response: NextResponse,
  previewId = 'executive-preview',
) {
  response.headers.set(
    'X-Robots-Tag',
    'noindex, nofollow, noarchive, noimageindex',
  );
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Vary', 'Cookie');
  response.headers.set('X-Helpmath-Controlled-Preview', previewId);
  return response;
}

function executivePreviewEntry(request: NextRequest, pathname: string) {
  const target = request.nextUrl.clone();
  target.pathname = pathname.startsWith('/es/')
    ? '/es/executive-preview'
    : '/executive-preview';
  target.search = '';
  return protectExecutivePreviewResponse(NextResponse.redirect(target));
}

export default async function proxy(request: NextRequest) {
  const originalPath = normalizePath(request.nextUrl.pathname);
  const normalizedLocaleFree = normalizePath(localeFreePath(originalPath));
  const assetPath = isExecutivePreviewAssetPath(originalPath);
  const protectedPath = isExecutivePreviewProtectedPath(originalPath)
    || isExecutivePreviewProtectedPath(normalizedLocaleFree)
    || isG4L3ControlledCeoPreviewPath(normalizedLocaleFree);

  if (protectedPath && !(await hasValidExecutivePreviewSession(request))) {
    return assetPath
      ? notFoundResponse()
      : executivePreviewEntry(request, originalPath);
  }

  if (assetPath) {
    return protectExecutivePreviewResponse(
      NextResponse.next(),
      'private-runtime-asset',
    );
  }

  if (!isAllowed(normalizedLocaleFree, request)) return notFoundResponse();
  const localePrefixed = originalPath === '/en'
    || originalPath.startsWith('/en/')
    || originalPath === '/es'
    || originalPath.startsWith('/es/');
  const response = localePrefixed
    ? NextResponse.next()
    : (() => {
        const rewritten = request.nextUrl.clone();
        rewritten.pathname = `/${routing.defaultLocale}${originalPath === '/' ? '' : originalPath}`;
        return NextResponse.rewrite(rewritten);
      })();

  if (isReferencePath(normalizedLocaleFree)) {
    return protectLocalReferenceDiagnosticResponse(response);
  }
  if (protectedPath || normalizedLocaleFree === '/executive-preview') {
    return protectExecutivePreviewResponse(response);
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/flash-assets/:path*',
  ],
};
