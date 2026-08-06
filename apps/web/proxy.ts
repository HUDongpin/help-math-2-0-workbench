import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';

import {routing} from './i18n/routing';

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
  '/demos/conversion-1-4'
]);

function notFoundResponse() {
  return new NextResponse('Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}

function isArchivePath(pathname: string) {
  if (pathname === '/library') return true;
  if (/^\/courses\/[3-5]\/\d{1,2}$/.test(pathname)) return true;
  if (/^\/animations\/[a-z0-9-]+$/.test(pathname)) return true;
  if (pathname === '/migration-status') {
    return process.env.NODE_ENV !== 'production' || process.env.MIGRATION_STATUS_ENABLED === '1';
  }
  if (/^\/reference\/[a-z0-9-]+$/.test(pathname)) return process.env.NODE_ENV !== 'production';
  return false;
}

function isAllowed(pathname: string) {
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  return publicPaths.has(normalized) || isArchivePath(normalized);
}

export default function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // Locale-prefixed paths are also the target of the internal English rewrite.
  // Let them through here; page metadata still points /en URLs at the
  // unprefixed English canonical URL.
  if (
    pathname === '/en' ||
    pathname.startsWith('/en/') ||
    pathname === '/es' ||
    pathname.startsWith('/es/')
  ) {
    const localeFree = pathname.slice(3) || '/';
    return isAllowed(localeFree) ? NextResponse.next() : notFoundResponse();
  }

  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  if (!isAllowed(normalizedPath)) return notFoundResponse();

  const rewritten = request.nextUrl.clone();
  rewritten.pathname = `/${routing.defaultLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(rewritten);
}

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)'
};
