import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678NmsL3P002Lesson} from '@/components/g678-nms-l03-p002-lesson';
import {NMS_L3_P002_ID, nmsL3P002Descriptor} from '@/lib/g678-nms-l03-p002.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
export const metadata: Metadata = {title: 'Add and Subtract Fractions — private Current-JS', robots: {follow: false, index: false, noarchive: true}};
export const dynamic = 'force-dynamic';
export default async function NmsL3P002Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || !isG678LocalPreviewRequestHeaders(await headers()) || (locale !== 'en' && locale !== 'es')) notFound();
  let descriptor;
  try {descriptor = nmsL3P002Descriptor();} catch {notFound();}
  return <main id="main-content"><G678NmsL3P002Lesson audioEnabled={false} candidateMode descriptor={descriptor}
    hostPresentation="modern-wide" initialPlacementId={NMS_L3_P002_ID} locale={locale} releasePublished={false}
    reviewerMode strictCompleteMemberCount={0}/></main>;
}
