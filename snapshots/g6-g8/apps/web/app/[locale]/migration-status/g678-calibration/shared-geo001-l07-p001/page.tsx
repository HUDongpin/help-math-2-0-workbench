import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678MultiPageLessonPlayer} from '@/components/g678-multi-page-lesson-player-v3.generated';
import {GEO_L07_P001_ID, geoL07P001Descriptor} from '@/lib/g678-geo-l07-p001.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import './geo-l07-p001-host.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'Volume and Surface Area — local Current-JS introduction',
  robots: {index: false, follow: false, noarchive: true}};

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try {descriptor = geoL07P001Descriptor();} catch {notFound();}
  return <main id="main-content" className="g678-geo-l07-p001-host"><G678MultiPageLessonPlayer descriptor={descriptor}
    initialPlacementId={GEO_L07_P001_ID} locale={locale} audioEnabled={false}
    candidateMode hostPresentation="modern-wide" reviewerMode
    releasePublished={false} strictCompleteMemberCount={0}/></main>;
}
