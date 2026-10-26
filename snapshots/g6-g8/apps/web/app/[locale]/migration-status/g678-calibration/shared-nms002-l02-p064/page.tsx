import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {NMS_L02_P064_ADMISSION} from '@/lib/nms-l02-p064-admission-activation';
import '../../../../../../../packages/demos/src/nms-l02-p064-quiz-candidate.css';
import '@/components/nms-l02-p056-host-v1.css';
import '@/components/nms-l02-p057-host-v1.css';
import '@/components/nms-l02-p058-host-v1.css';
import '@/components/nms-l02-p060-host-v1.css';
import '@/components/nms-l02-p061-host-v1.css';
import '@/components/nms-l02-p062-host-v1.css';

const loadHost=()=>process.env.NODE_ENV==='production'
  ? import('@/lib/nms-l02-p064-product-host.production-stub')
  : import('@/components/g678-nms-l02-p064-candidate-lesson-v1.generated');
const loadSource=()=>process.env.NODE_ENV==='production' ? Promise.resolve(null)
  : import('@/lib/nms-l02-p064-product-candidate.server');
const loadAdmission=()=>process.env.NODE_ENV==='production' ? Promise.resolve(null)
  : import('@/lib/nms-l02-p064-admission.server');

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'P064 — local quiz candidate',
  robots: {index: false, follow: false, noarchive: true}};

export default async function Page({params, searchParams}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || (locale !== 'en' && locale !== 'es')
    || process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot
    || !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  const query = await searchParams;
  if (Object.keys(query).some(key => key !== 'seed')) notFound();
  const value = query.seed;
  if (Array.isArray(value) || (value !== undefined && !/^(0|[1-9]\d{0,9})$/.test(value))) notFound();
  const seed = Number(value ?? '0');
  if (!Number.isSafeInteger(seed) || seed > 0xffffffff) notFound();
  try {
    const admission=NMS_L02_P064_ADMISSION?await loadAdmission():null;
    const formal=admission?admission.nmsL02P064AdmissionDescriptor(NMS_L02_P064_ADMISSION,seed):null;
    const source=formal?null:await loadSource();
    if(!formal&&!source)notFound();
    const descriptor=formal?.descriptor??source!.nmsL02P064ProductCandidateDescriptor(seed);
    const registered=formal?.registered===true;
    const {G678NmsL02P064CandidateLessonV1}=await loadHost();
    return <main id="main-content" data-p064-current-js={registered?'registered-local-current-js':
      formal?'formal-candidate':'unregistered-product-candidate'}>
      <G678NmsL02P064CandidateLessonV1 key={`${locale}:${seed}`} descriptor={descriptor}
        initialPlacementId="shared-nms002-l02-p064" locale={locale} audioEnabled={false}
        candidateMode reviewerMode hostPresentation="modern-wide" releasePublished={false}
        strictCompleteMemberCount={0} unregisteredCandidateIds={registered?[]:['shared-nms002-l02-p064']}/>
      <p role="status">{registered?(locale==='es'
        ? 'Current-JS local registrado; aceptación y publicación pendientes.'
        : 'Local Current-JS registered; acceptance and publication remain pending.'):(locale==='es'
        ? 'Candidato local sin registrar; aceptación y publicación pendientes.'
        : 'Unregistered local candidate; acceptance and publication remain pending.')}</p>
    </main>;
  } catch {notFound();}
}
