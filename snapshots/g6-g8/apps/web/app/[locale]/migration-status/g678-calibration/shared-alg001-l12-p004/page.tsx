import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {algL12P004Descriptor} from
  '@/lib/g678-alg-l12-p004.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {AlgL12P004Player} from './player';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Page 3 — private Current-JS candidate',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function AlgL12P004Page({params}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' ||
    (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try { descriptor = algL12P004Descriptor(); } catch { notFound(); }
  return <main id="main-content">
    <AlgL12P004Player descriptor={descriptor} locale={locale}/>
  </main>;
}
