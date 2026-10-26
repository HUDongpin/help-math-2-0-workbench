import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {p061AssetManifest} from '@/lib/nms-l02-p061-assets.server';
import {NMS_L02_P061_ADMISSION} from '@/lib/nms-l02-p061-admission-activation';
import {nmsL02P061AdmissionDescriptor} from '@/lib/nms-l02-p061-admission.server';
import {nmsL02P060AdmissionDescriptor} from '@/lib/nms-l02-p060-admission.server';
import {nmsL02P061CandidateDescriptorV1} from '@/lib/nms-l02-p061-candidate-descriptor-v1';
import '@/components/nms-l02-p056-host-v1.css';
import '@/components/nms-l02-p057-host-v1.css';
import '@/components/nms-l02-p058-host-v1.css';
import '@/components/nms-l02-p060-host-v1.css';
import '@/components/nms-l02-p061-host-v1.css';

const loadHost=()=>process.env.NODE_ENV==='production'?import('@/lib/nms-l02-p061-production-stub'):
 import('@/components/g678-nms-l02-p061-candidate-lesson-v1.generated');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'P061 — local teaching candidate',robots:{index:false,follow:false,noarchive:true}};
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params;
 if(process.env.NODE_ENV==='production'||(locale!=='en'&&locale!=='es')||
  !isG678LocalPreviewRequestHeaders(await headers())||Object.keys(await searchParams).length)notFound();
 try{
  p061AssetManifest();
  const formal=NMS_L02_P061_ADMISSION?nmsL02P061AdmissionDescriptor():null;
  const predecessor=formal?null:nmsL02P060AdmissionDescriptor();
  if(!formal&&!predecessor?.registered)notFound();
  const descriptor=formal?.descriptor??nmsL02P061CandidateDescriptorV1(predecessor!.descriptor);
  const registered=formal?.registered===true;
  const {G678NmsL02P061CandidateLessonV1}=await loadHost();
  return <main id="main-content" data-p061-current-js={registered?"registered-local-current-js":"unregistered-probe"}>
   <G678NmsL02P061CandidateLessonV1 descriptor={descriptor} initialPlacementId="shared-nms002-l02-p061"
    locale={locale} audioEnabled={false} candidateMode hostPresentation="modern-wide" reviewerMode
    releasePublished={false} strictCompleteMemberCount={0} unregisteredCandidateIds={registered?[]:['shared-nms002-l02-p061']}/>
   <p role="status">{registered?(locale==='es'?'Current-JS local registrado; aceptación y publicación pendientes.':
    'Local Current-JS registered; acceptance and publication remain pending.'):(locale==='es'?
    'Candidato local sin registrar; aceptación y publicación pendientes.':
    'Unregistered local candidate; acceptance and publication remain pending.')}</p>
  </main>;
 }catch{notFound();}
}
