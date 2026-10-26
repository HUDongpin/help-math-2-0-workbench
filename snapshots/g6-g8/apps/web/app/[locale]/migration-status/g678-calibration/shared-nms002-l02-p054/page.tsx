import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {NMS_L02_P054_ADMISSION} from '@/lib/nms-l02-p054-admission-activation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import '../../../../../../../packages/demos/src/nms-l02-p054-board-candidate.css';

import '@/components/nms-l02-p054-product-host-v1.css';
import '@/components/nms-l02-p056-host-v1.css';
import '@/components/nms-l02-p057-host-v1.css';
import '@/components/nms-l02-p058-host-v1.css';
import '@/components/nms-l02-p060-host-v1.css';
import '@/components/nms-l02-p061-host-v1.css';
import '@/components/nms-l02-p062-host-v1.css';
import '../../../../../../../packages/demos/src/nms-l02-p064-quiz-candidate.css';

const loadHost=()=>process.env.NODE_ENV==='production'
  ? import('@/lib/nms-l02-p054-product-host.production-stub')
  : import('@/components/g678-nms-l02-p054-product-lesson-v1.generated');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
  : import('@/lib/nms-l02-p054-product-candidate.server');

const loadAdmission=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
  : import('@/lib/nms-l02-p054-admission.server');

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'P054 — local matching candidate',
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
  if (Object.keys(query).some(key => key !== 'level')) notFound();
  const value = query.level ?? '1';
  if (Array.isArray(value) || (value !== '1' && value !== '2')) notFound();
  try {
    const admission=NMS_L02_P054_ADMISSION?await loadAdmission():null;
    const formal=admission?admission.nmsL02P054AdmissionDescriptor(NMS_L02_P054_ADMISSION,value==='2'?2:1):null;
    const source=formal?null:await loadSource();
    if(!formal&&!source)notFound();
    const descriptor=formal?.descriptor??source!.nmsL02P054ProductCandidateDescriptor(value==='2'?2:1);
    const registered=formal?.registered===true;
    const {G678NmsL02P054ProductLessonV1}=await loadHost();
    return <main id="main-content" data-p054-current-js={registered?'registered-local-current-js':
      formal?'formal-candidate':'unregistered-product-candidate'}>
      <G678NmsL02P054ProductLessonV1 key={`${locale}:${value}`} descriptor={descriptor}
        initialPlacementId="shared-nms002-l02-p054" locale={locale} audioEnabled={false}
        candidateMode reviewerMode hostPresentation="modern-wide" releasePublished={false}
        strictCompleteMemberCount={0} unregisteredCandidateIds={registered?[]:['shared-nms002-l02-p054']}/>
      <p role="status">{registered?(locale==='es'
        ? 'Current-JS local registrado; aceptación y publicación pendientes.'
        : 'Local Current-JS registered; acceptance and publication remain pending.'):(locale==='es'
        ? 'Candidato local sin registrar; aceptación y publicación pendientes.'
        : 'Unregistered local candidate; acceptance and publication remain pending.')}</p>
    </main>;
  } catch {notFound();}
}
