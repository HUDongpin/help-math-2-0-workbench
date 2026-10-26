import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {algL12P002Descriptor} from
  '@/lib/g678-alg-l12-p002.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {AlgL12P002Player} from './player';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Graphing in the Coordinate Plane: Real World Activity — private Current-JS',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function AlgL12P002Page({params}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' ||
    (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try { descriptor = algL12P002Descriptor(); } catch { notFound(); }
  return <main id="main-content">
    <AlgL12P002Player descriptor={descriptor} locale={locale}/>
  </main>;
}
