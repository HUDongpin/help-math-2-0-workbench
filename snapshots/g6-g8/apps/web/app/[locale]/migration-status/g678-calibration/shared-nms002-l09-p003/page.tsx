import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {DescriptorDrivenWholeLessonPlayer} from '@/components/descriptor-driven-whole-lesson-player';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {NMS_L09_P003_ID, nmsL09P003Descriptor} from '@/lib/g678-nms-l09-p003.server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Lesson 9 — private P003 Current-JS candidate',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function Page({params}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' ||
      (locale !== 'en' && locale !== 'es') ||
      !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try {descriptor = nmsL09P003Descriptor();} catch {notFound();}
  return <main id="main-content">
    <DescriptorDrivenWholeLessonPlayer audioEnabled={false} candidateMode
      descriptor={descriptor} hostPresentation="modern-wide"
      initialPlacementId={NMS_L09_P003_ID} locale={locale}
      releasePublished={false} reviewerMode strictCompleteMemberCount={0}/>
  </main>;
}
