import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678NmsL2P018Lesson} from '@/components/g678-nms-l02-p018-lesson';
import {NMS_L2_P018_ID, nmsL2P018Descriptor} from '@/lib/g678-nms-l02-p018.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
export const metadata: Metadata = {title: 'Fractions, Decimals and Percents — private Fractions instruction',
  robots: {follow: false, index: false, noarchive: true}};
export const dynamic = 'force-dynamic';
export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || !isG678LocalPreviewRequestHeaders(await headers())
    || (locale !== 'en' && locale !== 'es')) notFound();
  let descriptor;
  try {descriptor = nmsL2P018Descriptor();} catch {notFound();}
  return <main id="main-content"><G678NmsL2P018Lesson audioEnabled={false} candidateMode descriptor={descriptor}
    hostPresentation="modern-wide" initialPlacementId={NMS_L2_P018_ID} locale={locale} releasePublished={false}
    reviewerMode strictCompleteMemberCount={0}/></main>;
}
