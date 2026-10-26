import {isP003ContinuousHostSearch} from '@/lib/alg-l06-p003-local-audio-request-v1';
import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
const loadHost = () => process.env.NODE_ENV === 'production' ? Promise.resolve(null)
  : import('@/components/g678-alg-l06-p003-continuous-host-lesson-v2');
const loadSource = () => process.env.NODE_ENV === 'production' ? Promise.resolve(null)
  : import('@/lib/alg-l06-p003-formal-admission-v1.server');
import {ALG_L6_P003_ID} from '@/lib/g678-alg-l06-p003-probe-access';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {registeredLocalOnlyAnimationKeys} from '@helpmath/demos/local-only-animation-registry-metadata';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'ALG001 L6 P003 — continuous stream My Lesson candidate',
  robots: {index: false, follow: false, noarchive: true}};

export default async function Page({params,searchParams}: {params: Promise<{locale: string}>;
  searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const {locale} = await params;
  const query = await searchParams;
  if(Object.values(query).some(value=>typeof value!=='string') ||
    !isP003ContinuousHostSearch(new URLSearchParams(query as Record<string,string>),true))notFound();
  if (process.env.NODE_ENV === 'production' || (locale !== 'en' && locale !== 'es') ||
    !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  const host = await loadHost(), source = await loadSource();
  if (!host || !source) notFound();
  const {G678AlgL6P003ContinuousHostLessonV2} = host;
  let descriptor;
  try {descriptor = source.algL6P003FormalDescriptor();}
  catch {notFound();}
  const official = registeredLocalOnlyAnimationKeys.length;
  return <main id="main-content" data-p003-host-probe="registered-current-js"
    data-official-g678-current-js={`${official}/2282`}>
    <p role="status">{locale === 'es'
      ? `My Lesson local. P003 está registrada como Current-JS; registro G6–G8: ${official}/2282. Audio y fidelidad no aceptados.`
      : `Local My Lesson. P003 is registered as Current-JS; G6–G8 registration: ${official}/2282. Audio and fidelity are not accepted.`}</p>
    <G678AlgL6P003ContinuousHostLessonV2 descriptor={descriptor} initialPlacementId={ALG_L6_P003_ID}
      locale={locale} audioEnabled={false} candidateMode
      hostPresentation="modern-wide" reviewerMode releasePublished={false} strictCompleteMemberCount={0}/>
  </main>;
}
