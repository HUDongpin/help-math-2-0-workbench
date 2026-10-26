import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {GeoL06P002LocalCandidate} from '@helpmath/demos/geo-l06-p002-local-candidate';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'GEO001 L6 P002 — local source candidate',
  robots: {index: false, follow: false, noarchive: true}};

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || (locale !== 'en' && locale !== 'es') ||
      process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot ||
      !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  return <main id="main-content"><GeoL06P002LocalCandidate locale={locale}/></main>;
}
