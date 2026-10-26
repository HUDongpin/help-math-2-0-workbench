import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {loadGeoL07P003CandidateAssets} from '@/lib/g678-geo-l07-p003-candidate.server';
import {GeoL07P003CandidateViewer} from './viewer';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'GEO001 L7 P003 — local visual candidate, not admitted',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let assetHrefs;
  try {assetHrefs = loadGeoL07P003CandidateAssets();} catch {notFound();}
  return <main id="main-content"><GeoL07P003CandidateViewer locale={locale} assetHrefs={assetHrefs}/></main>;
}
