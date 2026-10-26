import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678MultiPageLessonPlayer} from '@/components/g678-multi-page-lesson-player-v3.generated';
import {GEO_L06_P001_ID, geoL06P001Descriptor} from '@/lib/g678-geo-l06-p001.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'Circles — local Current-JS introduction',
  robots: {index: false, follow: false, noarchive: true}};

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try {descriptor = geoL06P001Descriptor();} catch {notFound();}
  return <main id="main-content"><G678MultiPageLessonPlayer descriptor={descriptor}
    initialPlacementId={GEO_L06_P001_ID} locale={locale} audioEnabled={false}
    candidateMode hostPresentation="modern-wide" reviewerMode
    releasePublished={false} strictCompleteMemberCount={0}/></main>;
}
