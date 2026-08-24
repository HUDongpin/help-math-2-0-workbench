'use client';

import {Analytics} from '@vercel/analytics/next';

const protectedPrefixes = [
  '/family',
  '/teacher/messages',
  '/admin/family-access',
] as const;

function localeFreePathname(value: string) {
  try {
    const pathname = new URL(value, window.location.origin).pathname;
    return pathname.replace(/^\/(?:en|es)(?=\/|$)/u, '') || '/';
  } catch {
    return '/';
  }
}

export function PrivacySafeAnalytics() {
  return <Analytics beforeSend={(event) => {
    const pathname = localeFreePathname(event.url);
    return protectedPrefixes.some((prefix) => (
      pathname === prefix || pathname.startsWith(`${prefix}/`)
    )) ? null : event;
  }} />;
}
