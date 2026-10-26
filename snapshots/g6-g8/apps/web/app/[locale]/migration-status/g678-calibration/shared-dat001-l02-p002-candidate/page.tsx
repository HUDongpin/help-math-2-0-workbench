import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {DAT_L02_P002_AUDIO_URL} from '@/lib/dat-l02-p002-source-audio-access';
import {loadDatL02P002CandidateAssets} from '@/lib/g678-dat-l02-p002-candidate.server';
import {DAT_L02_P002_ID, datL02P002HostProbeDescriptor} from
  '@/lib/g678-dat-l02-p002-host-probe.server';
import {G678DatL02P002HostLesson} from '@/components/g678-dat-l02-p002-host-lesson';
import {registeredLocalOnlyAnimationKeys} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {DatL02P002CandidateViewer} from './viewer';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'DAT001 L2 P002 — local audiovisual candidate, not admitted',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function Page({params, searchParams}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{frame?: string; host?: string}>;
}) {
  const [{locale}, query] = await Promise.all([params, searchParams]);
  if (process.env.NODE_ENV === 'production' || (locale !== 'en' && locale !== 'es') ||
      !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  if (query.host !== undefined && query.host !== '1') notFound();
  if (query.host === '1' && query.frame !== undefined) notFound();
  const frame = query.frame === undefined ? 1 : Number(query.frame);
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 276) notFound();
  let assets;
  try {assets = loadDatL02P002CandidateAssets();} catch {notFound();}
  if (query.host === '1') {
    let descriptor;
    try {descriptor = datL02P002HostProbeDescriptor();} catch {notFound();}
    const official = registeredLocalOnlyAnimationKeys.length;
    const simulated = descriptor.productBridge.registeredAnimationCount;
    return <main id="main-content" data-dat-p002-host-probe="unregistered"
      data-official-g678-current-js={`${official}/2282`}>
      <p role="status">{locale === 'es'
        ? `Prueba local de My Lesson: la vista ${simulated}/53 incluye una página simulada. El registro oficial G6–G8 permanece en ${official}/2282; P002 no está admitida.`
        : `Local My Lesson probe: the ${simulated}/53 view includes one simulated page. Official G6–G8 registration remains ${official}/2282; P002 is not admitted.`}</p>
      <p role="note">{locale === 'es'
        ? 'El texto original sigue en inglés. El reloj del audio es provisional; la sincronización, el final de página y la fidelidad en Flash no están aceptados.'
        : 'Source text remains English. The audio clock is provisional; synchronization, page completion and Flash fidelity are not accepted.'}</p>
      <G678DatL02P002HostLesson descriptor={descriptor} assets={assets}
        initialPlacementId={DAT_L02_P002_ID} locale={locale} audioEnabled={false}
        candidateMode hostPresentation="modern-wide" reviewerMode
        releasePublished={false} strictCompleteMemberCount={0}/>
    </main>;
  }
  return <main id="main-content"><DatL02P002CandidateViewer
    locale={locale} initialFrame={frame} assetHrefs={assets.assetHrefs}
    maskPaths={assets.maskPaths} transcript={assets.transcript}
    audioUrl={DAT_L02_P002_AUDIO_URL}/></main>;
}
