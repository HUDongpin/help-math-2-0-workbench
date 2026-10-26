import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678AlgL6P003HostLesson} from '@/components/g678-alg-l06-p003-host-lesson';
import {algL6P003HostProbeDescriptor} from
  '@/lib/g678-alg-l06-p003-host-probe.server';
import {ALG_L6_P003_ID} from '@/lib/g678-alg-l06-p003-probe-access';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {registeredLocalOnlyAnimationKeys} from '@helpmath/demos/local-only-animation-registry-metadata';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'ALG001 L6 P003 — unregistered My Lesson host probe',
  robots: {index: false, follow: false, noarchive: true}};

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try {descriptor = algL6P003HostProbeDescriptor();}
  catch {notFound();}
  const official = registeredLocalOnlyAnimationKeys.length;
  return <main id="main-content" data-p003-host-probe="unregistered"
    data-official-g678-current-js={`${official}/2282`}>
    <p role="status">{locale === 'es'
      ? `Prueba local de My Lesson. Esta página P003 se simula solo en este anfitrión; el registro oficial permanece en ${official}/2282. Audio y fidelidad no aceptados.`
      : `Local My Lesson probe. P003 is simulated only in this host; official registration remains ${official}/2282. Audio and fidelity are not accepted.`}</p>
    <G678AlgL6P003HostLesson descriptor={descriptor} initialPlacementId={ALG_L6_P003_ID}
      locale={locale} audioEnabled={false} candidateMode
      hostPresentation="modern-wide" reviewerMode releasePublished={false} strictCompleteMemberCount={0}/>
  </main>;
}
