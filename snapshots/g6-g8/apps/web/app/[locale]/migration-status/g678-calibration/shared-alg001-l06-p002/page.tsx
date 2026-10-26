import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678AlgL6P002Lesson} from '@/components/g678-alg-l06-p002-lesson';
import {ALG_L6_P002_ID, algL6P002Descriptor} from '@/lib/g678-alg-l06-p002.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
export const metadata: Metadata = {title: 'Understanding Functions — private Current-JS', robots: {follow: false, index: false, noarchive: true}};
export const dynamic = 'force-dynamic';
export default async function AlgL6P002Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || !isG678LocalPreviewRequestHeaders(await headers()) || (locale !== 'en' && locale !== 'es')) notFound();
  let descriptor;
  try {descriptor = algL6P002Descriptor();} catch {notFound();}
  return <main id="main-content"><G678AlgL6P002Lesson audioEnabled={false} candidateMode descriptor={descriptor}
    hostPresentation="modern-wide" initialPlacementId={ALG_L6_P002_ID} locale={locale} releasePublished={false}
    reviewerMode strictCompleteMemberCount={0}/></main>;
}
