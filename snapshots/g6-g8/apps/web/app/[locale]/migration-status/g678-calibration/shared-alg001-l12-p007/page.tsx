import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {G678AlgL12P006HostLesson} from '@/components/g678-alg-l12-p006-host-lesson';
import {algL12P006CurrentJsDescriptor} from '@/lib/g678-alg-l12-p006-current-js.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {registeredLocalOnlyAnimationKeys} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import styles from '../shared-alg001-l12-p006/probe.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'ALG001 L12 P007 — private source-ordered My Lesson entry',
  robots: {index: false, follow: false, noarchive: true},
};

/** A separate source-ordered entry retains the frozen generic calibration
 * route. It admits the same reviewed P006 lesson and host before navigation. */
export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' ||
    (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try {descriptor = algL12P006CurrentJsDescriptor();}
  catch {notFound();}
  if (descriptor.pages[6]?.animationId !== 'shared-alg001-l12-p007' ||
    descriptor.pages[6].rendererAvailability.kind !== 'registered') notFound();
  return <main id="main-content" className={styles.probe}
    data-p006-current-js="registered" data-source-entry-placement="shared-alg001-l12-p007"
    data-official-alg-l12-current-js={`${descriptor.productBridge.registeredAnimationCount}/52`}
    data-official-g678-current-js={`${registeredLocalOnlyAnimationKeys.length}/2282`}>
    <G678AlgL12P006HostLesson descriptor={descriptor}
      initialPlacementId="shared-alg001-l12-p007" locale={locale} audioEnabled={false}
      candidateMode hostPresentation="modern-wide" reviewerMode
      releasePublished={false} strictCompleteMemberCount={0}/>
  </main>;
}
