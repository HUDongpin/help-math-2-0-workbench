import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678MultiPageLessonPlayer} from '@/components/g678-multi-page-lesson-player-v3.generated';
import {GEO_L06_P002_RUNTIME_ADAPTER} from '@/components/g678-geo-l06-p002-runtime';
import {GEO_L06_P002_ID, geoL06P002HostProbeDescriptor} from
  '@/lib/g678-geo-l06-p002-host-probe.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {registeredLocalOnlyAnimationKeys} from '@helpmath/demos/local-only-animation-registry-metadata';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'GEO001 L6 P002 — unregistered My Lesson host probe',
  robots: {index: false, follow: false, noarchive: true}};

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  let descriptor;
  try { descriptor = geoL06P002HostProbeDescriptor(); } catch { notFound(); }
  const officialGeoL06 = descriptor.productBridge.registeredAnimationCount - 1;
  const officialG678 = registeredLocalOnlyAnimationKeys.length;
  const simulatedGeoL06 = officialGeoL06 + 1;
  return <main id="main-content" data-p002-host-probe="unregistered"
    data-official-geo-l06-current-js={`${officialGeoL06}/54`}
    data-official-g678-current-js={`${officialG678}/2282`}>
    <p role="status">{locale === 'es'
      ? `Prueba local de My Lesson: el ${simulatedGeoL06}/54 mostrado dentro del anfitrión incluye una página simulada. El registro oficial es ${officialGeoL06}/54 (GEO L6), ${officialG678}/2282 (G6–G8); P002 no está inscrita ni aprobada para publicación.`
      : `Local My Lesson probe: the ${simulatedGeoL06}/54 shown inside the host includes one simulated page. Official registration is ${officialGeoL06}/54 (GEO L6), ${officialG678}/2282 (G6–G8); P002 is unregistered and unpublished.`}</p>
    <p role="note">{locale === 'es'
      ? 'El XML de esta lección pide índices de términos L6 que faltan en la colección actual. Las definiciones L1 de esta prueba son provisionales; además, los índices antiguos discrepan sobre Surface. Cerrar el glosario no reanuda la animación.'
      : 'This lesson XML names L6 key-term indexes missing from the current source collection. This probe uses provisional L1 definitions; the legacy indexes also disagree on Surface. Closing the glossary does not resume the animation.'}</p>
    <G678MultiPageLessonPlayer descriptor={descriptor} initialPlacementId={GEO_L06_P002_ID}
      locale={locale} privateRuntimeAdapter={GEO_L06_P002_RUNTIME_ADAPTER}
      audioEnabled={false} candidateMode hostPresentation="modern-wide" reviewerMode
      releasePublished={false} strictCompleteMemberCount={0}/>
  </main>;
}
