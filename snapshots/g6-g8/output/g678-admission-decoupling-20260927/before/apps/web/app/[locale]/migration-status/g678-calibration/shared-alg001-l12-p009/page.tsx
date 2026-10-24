import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {G678AlgL12P009HostLesson} from '@/components/g678-alg-l12-p009-host-lesson';
import {ALG_L12_P009_CURRENT_JS_ID, algL12P009CurrentJsDescriptor} from
  '@/lib/g678-alg-l12-p009-current-js-v2.server';
import {algL12P009HostProbeDescriptor} from '@/lib/g678-alg-l12-p009-host-probe.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {registeredLocalOnlyAnimationKeys} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import styles from './probe.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'ALG001 L12 P009 — source-bound Current-JS candidate',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' ||
    (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  const formal = registeredLocalOnlyAnimationKeys.includes(ALG_L12_P009_CURRENT_JS_ID);
  let descriptor;
  try {descriptor = formal ? algL12P009CurrentJsDescriptor() : algL12P009HostProbeDescriptor();}
  catch {notFound();}
  const registered = new Set<string>(registeredLocalOnlyAnimationKeys);
  const officialLesson = descriptor.pages.filter(page => registered.has(page.animationId)).length;
  const officialG678 = registeredLocalOnlyAnimationKeys.length;
  return <main id="main-content" className={styles.probe} data-p009-current-js={formal ? "source-bound-local" : "unregistered-probe"}
    data-official-alg-l12-current-js={`${officialLesson}/52`}
    data-official-g678-current-js={`${officialG678}/2282`}>
    <G678AlgL12P009HostLesson descriptor={descriptor}
      initialPlacementId={ALG_L12_P009_CURRENT_JS_ID} locale={locale} audioEnabled={false}
      candidateMode hostPresentation="modern-wide" reviewerMode
      releasePublished={false} strictCompleteMemberCount={0}/>
    {!formal ? <p role="status">{locale === 'es'
      ? 'Prueba local sin registrar. P009 no se cuenta en el registro Current-JS; la admisión formal está pendiente.'
      : 'Unregistered local probe. P009 is not counted in Current-JS registration; formal admission is pending.'}</p> : null}
    <p role="status">{locale === 'es'
      ? `Registro Current-JS verificado de las páginas existentes: ${officialLesson}/52 (ALG L12), ${officialG678}/2282 (G6–G8). Esta página no está publicada.`
      : `Verified Current-JS registration of existing pages: ${officialLesson}/52 (ALG L12), ${officialG678}/2282 (G6–G8). This page is unpublished.`}</p>
    <p role="note">{locale === 'es'
      ? 'El dibujo Canvas fuente y sus colores son candidatos. El texto fuente en inglés no constituye una traducción al español. Audio, trazas originales, fidelidad, revisión humana y del Owner y finalización estricta siguen sin aceptación.'
      : 'The source Canvas drawing and colors are candidates. English source text is not a Spanish translation. Audio, original-runtime traces, fidelity, human and Owner review, and strict completion remain unaccepted.'}</p>
  </main>;
}
