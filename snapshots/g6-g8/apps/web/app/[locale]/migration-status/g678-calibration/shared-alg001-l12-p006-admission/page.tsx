import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {G678AlgL12P006HostLesson} from '@/components/g678-alg-l12-p006-host-lesson';
import {ALG_L12_P006_CURRENT_JS_ID, algL12P006AdmissionCandidateDescriptor} from
  '@/lib/g678-alg-l12-p006-current-js.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import styles from '../shared-alg001-l12-p006/probe.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'ALG001 L12 P006 — staged engineering evidence collection',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' ||
    (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try {descriptor = algL12P006AdmissionCandidateDescriptor();}
  catch {notFound();}
  return <main id="main-content" className={styles.probe}
    data-p006-admission-candidate={descriptor.admissionCandidateDisclosure.status}
    data-typography-gate={descriptor.admissionCandidateDisclosure.typographyGate}
    data-official-completion-claim="false">
    <p role="status">{locale === 'es'
      ? 'Candidato de ingeniería local. La comprobación actual completa de tipografía y la evidencia del anfitrión formal están pendientes. Esta superficie recopila evidencia y no declara finalización oficial.'
      : 'Local engineering candidate. The complete current typography check and formal host evidence are pending. This surface collects evidence and makes no official completion claim.'}</p>
    <G678AlgL12P006HostLesson descriptor={descriptor}
      initialPlacementId={ALG_L12_P006_CURRENT_JS_ID} locale={locale} audioEnabled={false}
      candidateMode hostPresentation="modern-wide" reviewerMode
      releasePublished={false} strictCompleteMemberCount={0}/>
    <p role="note">{locale === 'es'
      ? 'Audio, ejecución original, fidelidad, revisión humana y del Owner, finalización estricta y publicación siguen sin aceptación.'
      : 'Audio, original-runtime, fidelity, human and Owner review, strict completion and publication remain unaccepted.'}</p>
  </main>;
}
