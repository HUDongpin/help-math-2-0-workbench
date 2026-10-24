import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {G678AlgL12P006HostLesson} from '@/components/g678-alg-l12-p006-host-lesson';
import {ALG_L12_P006_CURRENT_JS_ID, algL12P006CurrentJsDescriptor} from
  '@/lib/g678-alg-l12-p006-current-js.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {registeredLocalOnlyAnimationKeys} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import styles from './probe.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'ALG001 L12 P006 — private Current-JS My Lesson',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' ||
    (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try {descriptor = algL12P006CurrentJsDescriptor();}
  catch {notFound();}
  const officialLesson = descriptor.productBridge.registeredAnimationCount;
  const officialG678 = registeredLocalOnlyAnimationKeys.length;
  return <main id="main-content" className={styles.probe} data-p006-current-js="registered"
    data-official-alg-l12-current-js={`${officialLesson}/52`}
    data-official-g678-current-js={`${officialG678}/2282`}>
    <G678AlgL12P006HostLesson descriptor={descriptor}
      initialPlacementId={ALG_L12_P006_CURRENT_JS_ID} locale={locale} audioEnabled={false}
      candidateMode hostPresentation="modern-wide" reviewerMode
      releasePublished={false} strictCompleteMemberCount={0}/>
    <p role="status">{locale === 'es'
      ? `My Lesson local: ${officialLesson}/52 páginas registradas en ALG L12 y ${officialG678}/2282 en G6–G8. P006 está registrada como Current-JS privado y no está publicada.`
      : `Local My Lesson: ${officialLesson}/52 registered pages in ALG L12 and ${officialG678}/2282 in G6–G8. P006 is registered as private Current-JS and remains unpublished.`}</p>
    <p role="note">{locale === 'es'
      ? 'El texto nativo y el dibujo Canvas conservan el estado ligado a la fuente. El texto fuente en inglés no constituye una traducción al español. Audio, trazas originales, fidelidad, revisión humana y del Owner y finalización estricta siguen sin aceptación.'
      : 'Native text and the Canvas drawing retain source-bound state. English source text is not a Spanish translation. Audio, original-runtime traces, fidelity, human and Owner review, and strict completion remain unaccepted.'}</p>
  </main>;
}
