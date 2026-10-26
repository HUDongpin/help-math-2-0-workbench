import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {p062AssetManifest} from '@/lib/nms-l02-p062-assets.server';
import {NMS_L02_P062_ADMISSION} from '@/lib/nms-l02-p062-admission-activation';
import {nmsL02P062AdmissionDescriptor} from '@/lib/nms-l02-p062-admission.server';
import {nmsL02P061AdmissionDescriptor} from '@/lib/nms-l02-p061-admission.server';
import {nmsL02P062CandidateDescriptorV1} from '@/lib/nms-l02-p062-candidate-descriptor-v1';
import '@/components/nms-l02-p056-host-v1.css';
import '@/components/nms-l02-p057-host-v1.css';
import '@/components/nms-l02-p058-host-v1.css';
import '@/components/nms-l02-p060-host-v1.css';
import '@/components/nms-l02-p061-host-v1.css';
import '@/components/nms-l02-p062-host-v1.css';

const loadHost=()=>process.env.NODE_ENV==='production'?import('@/lib/nms-l02-p062-production-stub'):
 import('@/components/g678-nms-l02-p062-candidate-lesson-v1.generated');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'P062 — local teaching candidate',robots:{index:false,follow:false,noarchive:true}};
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params;
 if(process.env.NODE_ENV==='production'||(locale!=='en'&&locale!=='es')||
  !isG678LocalPreviewRequestHeaders(await headers())||Object.keys(await searchParams).length)notFound();
 try{
  p062AssetManifest();
  const formal=NMS_L02_P062_ADMISSION?nmsL02P062AdmissionDescriptor():null;
  const predecessor=formal?null:nmsL02P061AdmissionDescriptor();
  if(!formal&&!predecessor?.registered)notFound();
  const descriptor=formal?.descriptor??nmsL02P062CandidateDescriptorV1(predecessor!.descriptor);
  const registered=formal?.registered===true;
  const {G678NmsL02P062CandidateLessonV1}=await loadHost();
  return <main id="main-content" data-p062-current-js={registered?"registered-local-current-js":"unregistered-probe"}>
   <G678NmsL02P062CandidateLessonV1 descriptor={descriptor} initialPlacementId="shared-nms002-l02-p062"
    locale={locale} audioEnabled={false} candidateMode hostPresentation="modern-wide" reviewerMode
    releasePublished={false} strictCompleteMemberCount={0}
    unregisteredCandidateIds={registered?[]:['shared-nms002-l02-p062']}/>
   <p role="status">{registered?(locale==='es'?'Current-JS local registrado; aceptación y publicación pendientes.':
    'Local Current-JS registered; acceptance and publication remain pending.'):(locale==='es'?
    'Candidato local sin registrar; aceptación y publicación pendientes.':
    'Unregistered local candidate; acceptance and publication remain pending.')}</p>
  </main>;
 }catch{notFound();}
}
