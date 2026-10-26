import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {DescriptorDrivenWholeLessonPlayer} from
  '@/components/descriptor-driven-whole-lesson-player';
import {ALG_L12_P001_ID, algL12P001Descriptor} from
  '@/lib/g678-alg-l12-p001.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Graphing in the Coordinate Plane — private Current-JS',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function AlgL12P001Page({params}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' ||
    (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try { descriptor = algL12P001Descriptor(); } catch { notFound(); }
  return <main id="main-content">
    <DescriptorDrivenWholeLessonPlayer audioEnabled={false} candidateMode
      descriptor={descriptor} hostPresentation="modern-wide"
      initialPlacementId={ALG_L12_P001_ID} locale={locale}
      releasePublished={false} reviewerMode strictCompleteMemberCount={0}/>
  </main>;
}
