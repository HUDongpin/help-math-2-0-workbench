import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import '../../../../../../../packages/demos/src/nms-l02-p054-board-candidate.css';
import '@/components/nms-l02-p053-host-v1.css';
import '@/components/nms-l02-p054-product-host-v1.css';
import '@/components/nms-l02-p056-host-v1.css';
import '@/components/nms-l02-p057-host-v1.css';
import '@/components/nms-l02-p058-host-v1.css';
import '@/components/nms-l02-p060-host-v1.css';
import '@/components/nms-l02-p061-host-v1.css';
import '@/components/nms-l02-p062-host-v1.css';
import '../../../../../../../packages/demos/src/nms-l02-p064-quiz-candidate.css';

const loadHost=()=>process.env.NODE_ENV==='production'
 ? import('@/lib/nms-l02-p053-product-host.production-stub')
 : import('@/components/g678-nms-l02-p053-product-lesson-v1.generated');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 : import('@/lib/nms-l02-p053-product-candidate.server');
const loadAdmission=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 : import('@/lib/nms-l02-p053-admission.server');
const loadActivation=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 : import('@/lib/nms-l02-p053-admission-activation');
const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'P053 — local directions candidate',
 robots:{index:false,follow:false,noarchive:true}};

export default async function Page({params,searchParams}:{
 params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const {locale}=await params;
 if(process.env.NODE_ENV==='production'||(locale!=='en'&&locale!=='es')||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==sourceRoot||
  !isG678LocalPreviewRequestHeaders(await headers()))notFound();
 if(Object.keys(await searchParams).length!==0)notFound();
 try{
  const source=await loadSource();
  if(!source)notFound();
  const activation=await loadActivation();
  const admission=activation?.NMS_L02_P053_ADMISSION?await loadAdmission():null;
  const admitted=admission?.nmsL02P053AdmissionDescriptor();
  const descriptor=admitted?.descriptor??source.nmsL02P053ProductCandidateDescriptor();
  const registered=admitted?.registered===true;
  const {G678NmsL02P053ProductLessonV1}=await loadHost();
  return <main id="main-content" data-p053-current-js={registered?'registered':admitted?'formal-candidate':'unregistered-product-candidate'}>
   <G678NmsL02P053ProductLessonV1 key={locale} descriptor={descriptor}
    initialPlacementId="shared-nms002-l02-p053" locale={locale} audioEnabled={false}
    candidateMode reviewerMode hostPresentation="modern-wide" releasePublished={false}
    strictCompleteMemberCount={0} unregisteredCandidateIds={registered?[]:['shared-nms002-l02-p053']}/>
   <p role="status">{locale==='es'
    ? registered?'Registro Current-JS local; aceptación y publicación pendientes.':'Candidato local sin registrar; aceptación y publicación pendientes.'
    : registered?'Local Current-JS registered; acceptance and publication remain pending.':'Unregistered local candidate; acceptance and publication remain pending.'}</p>
  </main>;
 }catch{notFound();}
}
