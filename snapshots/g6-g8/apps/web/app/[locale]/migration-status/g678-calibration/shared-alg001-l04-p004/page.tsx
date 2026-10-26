import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678AlgL4P004Lesson} from '@/components/g678-alg-l04-p004-lesson';
import {ALG_L4_P004_ID, algL4P004Descriptor} from '@/lib/g678-alg-l04-p004.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
export const metadata: Metadata = {title: 'Relationships — private Current-JS', robots: {follow: false, index: false, noarchive: true}};
export const dynamic = 'force-dynamic';
export default async function AlgL4P004Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || !isG678LocalPreviewRequestHeaders(await headers()) || (locale !== 'en' && locale !== 'es')) notFound();
  let descriptor;
  try {descriptor = algL4P004Descriptor();} catch {notFound();}
  return <main id="main-content"><G678AlgL4P004Lesson audioEnabled={false} candidateMode descriptor={descriptor}
    hostPresentation="modern-wide" initialPlacementId={ALG_L4_P004_ID} locale={locale} releasePublished={false}
    reviewerMode strictCompleteMemberCount={0}/></main>;
}
