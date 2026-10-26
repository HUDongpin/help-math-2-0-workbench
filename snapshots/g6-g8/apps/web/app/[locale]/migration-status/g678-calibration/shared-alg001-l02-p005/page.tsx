import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678AlgL2P005Lesson} from '@/components/g678-alg-l02-p005-lesson';
import {ALG_L2_P005_ID, algL2P005Descriptor} from '@/lib/g678-alg-l02-p005.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
export const metadata: Metadata = {title: 'Variables — private Current-JS', robots: {follow: false, index: false, noarchive: true}};
export const dynamic = 'force-dynamic';
export default async function AlgL2P005Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || !isG678LocalPreviewRequestHeaders(await headers()) || (locale !== 'en' && locale !== 'es')) notFound();
  let descriptor;
  try {descriptor = algL2P005Descriptor();} catch {notFound();}
  return <main id="main-content"><G678AlgL2P005Lesson audioEnabled={false} candidateMode descriptor={descriptor}
    hostPresentation="modern-wide" initialPlacementId={ALG_L2_P005_ID} locale={locale} releasePublished={false}
    reviewerMode strictCompleteMemberCount={0}/></main>;
}
