import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {G678AlgL12P005HostLesson} from '@/components/g678-alg-l12-p005-host-lesson';
import {ALG_L12_P005_ID, algL12P005HostProbeDescriptor} from
  '@/lib/g678-alg-l12-p005-host-probe.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {registeredLocalOnlyAnimationKeys} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import styles from './probe.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'ALG001 L12 P005 — unregistered My Lesson host probe',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' ||
    (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try {descriptor = algL12P005HostProbeDescriptor();}
  catch {notFound();}
  const probeLesson = descriptor.productBridge.registeredAnimationCount;
  const registered = new Set<string>(registeredLocalOnlyAnimationKeys);
  const officialLesson = descriptor.pages.filter(page => registered.has(page.animationId)).length;
  const officialG678 = registeredLocalOnlyAnimationKeys.length;
  return <main id="main-content" className={styles.probe} data-p005-host-probe="unregistered"
    data-official-alg-l12-current-js={`${officialLesson}/52`}
    data-official-g678-current-js={`${officialG678}/2282`}>
    <G678AlgL12P005HostLesson descriptor={descriptor}
      initialPlacementId={ALG_L12_P005_ID} locale={locale} audioEnabled={false}
      candidateMode hostPresentation="modern-wide" reviewerMode
      releasePublished={false} strictCompleteMemberCount={0}/>
    <p role="status">{locale === 'es'
      ? `Prueba local de My Lesson: ${probeLesson}/52 en este anfitrión incluye P005 simulada. El registro oficial sigue en ${officialLesson}/52 (ALG L12) y ${officialG678}/2282 (G6–G8). P005 no está registrada ni publicada.`
      : `Local My Lesson probe: ${probeLesson}/52 in this host includes simulated P005. Official registration remains ${officialLesson}/52 (ALG L12) and ${officialG678}/2282 (G6–G8). P005 is unregistered and unpublished.`}</p>
    <p role="note">{locale === 'es'
      ? 'El dibujo Canvas v2 y sus colores son candidatos. El texto fuente en inglés no constituye una traducción al español. Audio, trazas originales, fidelidad, revisión humana y del Owner y finalización estricta siguen sin aceptación.'
      : 'The v2 Canvas drawing and colors are candidates. English source text is not a Spanish translation. Audio, original-runtime traces, fidelity, human and Owner review, and strict completion remain unaccepted.'}</p>
  </main>;
}
