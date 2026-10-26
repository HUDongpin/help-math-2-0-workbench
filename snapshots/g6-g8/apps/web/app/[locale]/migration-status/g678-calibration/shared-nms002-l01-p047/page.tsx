import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678NmsL1P047Lesson} from '@/components/g678-nms-l01-p047-lesson';
import {nmsL1P047Descriptor} from '@/lib/g678-nms-l01-p047.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
export const metadata: Metadata = {title: 'Positive and Negative Numbers: Final Quiz — private Current-JS', robots: {follow: false, index: false, noarchive: true}};
export const dynamic = 'force-dynamic';
export default async function NmsL1P047Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || !isG678LocalPreviewRequestHeaders(await headers()) || (locale !== 'en' && locale !== 'es')) notFound();
  let descriptor;
  try {descriptor = nmsL1P047Descriptor();} catch {notFound();}
  return <main id="main-content"><G678NmsL1P047Lesson audioEnabled={false} candidateMode descriptor={descriptor}
    hostPresentation="modern-wide" initialPlacementId="shared-nms002-l01-p047" locale={locale} releasePublished={false}
    reviewerMode strictCompleteMemberCount={0}/></main>;
}
