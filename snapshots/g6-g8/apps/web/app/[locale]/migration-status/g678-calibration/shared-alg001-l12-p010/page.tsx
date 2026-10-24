import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {ALG_L12_P010_ID, algL12P010HostProbeDescriptor} from '@/lib/g678-alg-l12-p010-host-probe.server';
import {splitAdmissionDescriptor} from '@/lib/g678-split-admission.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {registeredLocalOnlyAnimationKeys} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import styles from './probe.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'ALG001 L12 P010 — source-bound Current-JS candidate',
  robots: {index: false, follow: false, noarchive: true},
};

// Kept outside Page's narrowed control flow so both TypeScript and the
// production compiler can resolve the environment-specific import.
const loadHost = () => process.env.NODE_ENV === 'production'
  ? import('@/lib/g678-alg-l12-p010-host.production-stub')
  : import('@/components/g678-alg-l12-p010-host-lesson');

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' ||
    (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  // Compile-time branch keeps the local renderer outside production bundles.
  // Production build output is independently checked before admission.
  const {G678AlgL12P010HostLesson} = await loadHost();
  const formal = registeredLocalOnlyAnimationKeys.includes(ALG_L12_P010_ID);
  let descriptor;
  try {descriptor = formal ? splitAdmissionDescriptor('shared-alg001-l12-p010') : algL12P010HostProbeDescriptor();}
  catch {notFound();}
  const registered = new Set<string>(registeredLocalOnlyAnimationKeys);
  const officialLesson = descriptor.pages.filter(page => registered.has(page.animationId)).length;
  const officialG678 = registeredLocalOnlyAnimationKeys.length;
  return <main id="main-content" className={styles.probe} data-p010-current-js={formal ? "source-bound-local" : "unregistered-probe"}
    data-official-alg-l12-current-js={`${officialLesson}/52`}
    data-official-g678-current-js={`${officialG678}/2282`}>
    <G678AlgL12P010HostLesson descriptor={descriptor}
      initialPlacementId={ALG_L12_P010_ID} locale={locale} audioEnabled={false}
      candidateMode hostPresentation="modern-wide" reviewerMode
      releasePublished={false} strictCompleteMemberCount={0}/>
    {!formal ? <p role="status">{locale === 'es'
      ? 'Prueba local sin registrar. P010 no se cuenta en el registro Current-JS; la admisión formal está pendiente.'
      : 'Unregistered local probe. P010 is not counted in Current-JS registration; formal admission is pending.'}</p> : null}
    <p role="status">{locale === 'es'
      ? `Registro Current-JS verificado de las páginas existentes: ${officialLesson}/52 (ALG L12), ${officialG678}/2282 (G6–G8). Esta página no está publicada.`
      : `Verified Current-JS registration of existing pages: ${officialLesson}/52 (ALG L12), ${officialG678}/2282 (G6–G8). This page is unpublished.`}</p>
    <p role="note">{locale === 'es'
      ? 'El dibujo Canvas fuente y sus colores son candidatos. El texto fuente en inglés no constituye una traducción al español. Audio, trazas originales, fidelidad, revisión humana y del Owner y finalización estricta siguen sin aceptación.'
      : 'The source Canvas drawing and colors are candidates. English source text is not a Spanish translation. Audio, original-runtime traces, fidelity, human and Owner review, and strict completion remain unaccepted.'}</p>
  </main>;
}
