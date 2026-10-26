import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678NmsL2P009Lesson} from '@/components/g678-nms-l02-p009-lesson';
import {NMS_L2_P009_ID, nmsL2P009Descriptor} from '@/lib/g678-nms-l02-p009.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
export const metadata: Metadata = {title: 'Fractions, Decimals and Percents — private Decimal-point vocabulary',
  robots: {follow: false, index: false, noarchive: true}};
export const dynamic = 'force-dynamic';
export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || !isG678LocalPreviewRequestHeaders(await headers())
    || (locale !== 'en' && locale !== 'es')) notFound();
  let descriptor;
  try {descriptor = nmsL2P009Descriptor();} catch {notFound();}
  return <main id="main-content"><G678NmsL2P009Lesson audioEnabled={false} candidateMode descriptor={descriptor}
    hostPresentation="modern-wide" initialPlacementId={NMS_L2_P009_ID} locale={locale} releasePublished={false}
    reviewerMode strictCompleteMemberCount={0}/></main>;
}
