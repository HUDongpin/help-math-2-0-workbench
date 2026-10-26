import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {AlgL12OriginPlayer} from '@/components/g678-alg-l12-origin-player';
import {algL12P011Descriptor} from
  '@/lib/g678-alg-l12-p011.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Origin — private Current-JS',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function AlgL12P011Page({params}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' ||
    (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try { descriptor = algL12P011Descriptor(); } catch { notFound(); }
  return <main id="main-content">
    <AlgL12OriginPlayer descriptor={descriptor} locale={locale}/>
  </main>;
}
