import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {p055PilotAssetManifest,p055PilotText} from '@/lib/nms-l02-ts-pilot-assets.server';
import {NmsL02TsPilot} from '@/components/nms-l02-ts-pilot';
import {NMS_L02_ADMISSION} from '@/lib/nms-l02-admission-activation';
import {nmsL02P055AdmissionDescriptor} from '@/lib/nms-l02-successor-admission.server';
import {registeredLocalOnlyAnimationKeys} from '@helpmath/demos/local-only-animation-registry-metadata';
import '@/components/nms-l02-ts-pilot.css';
import '@/components/nms-l02-p055-host.css';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'P055 — local source candidate',robots:{index:false,follow:false,noarchive:true}};
const loadHost=()=>process.env.NODE_ENV==='production'?import('@/lib/nms-l02-successor.production-stub'):
 import('@/components/g678-nms-l02-successor-lesson');
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params;
 if(process.env.NODE_ENV==='production'||!['en','es'].includes(locale)||
  !isG678LocalPreviewRequestHeaders(await headers())||Object.keys(await searchParams).length)notFound();
 try{
  if(NMS_L02_ADMISSION){
   const {descriptor,registered}=nmsL02P055AdmissionDescriptor();
   p055PilotAssetManifest();
   const {G678NmsL02SuccessorLesson}=await loadHost();
   return <main id="main-content" data-p055-current-js={registered?'registered-local-current-js':'unregistered-probe'}
    data-official-g678-current-js={`${registeredLocalOnlyAnimationKeys.filter(key=>
     /^shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/u.test(key)).length}/2282`}>
    <G678NmsL02SuccessorLesson key={locale} descriptor={descriptor} initialPlacementId="shared-nms002-l02-p055"
     locale={locale as 'en'|'es'} audioEnabled={false} candidateMode hostPresentation="modern-wide" reviewerMode
     releasePublished={false} strictCompleteMemberCount={0}
     unregisteredCandidateIds={registered?[]:['shared-nms002-l02-p055']}/>
    <p role="status">{registered?(locale==='es'?'Current-JS registrado para revisión local; aceptación y publicación pendientes.':
     'Registered Current-JS for local review; acceptance and publication remain pending.'):
     (locale==='es'?'Candidato local sin registrar. No se cuenta como una nueva migración completada.':
      'Unregistered local candidate. Not counted as a newly completed migration.')}</p>
    <p>{locale==='es'?'El glosario usa provisionalmente el banco L1 del host identificado. Los bancos L2 y la consulta histórica no están verificados.':
     'The glossary provisionally uses the identified host’s L1 bank. The L2 banks and historical lookup remain unverified.'}</p>
   </main>;
  }
  const assets=p055PilotAssetManifest(),ir=p055PilotText();
  return <main id="main-content"><NmsL02TsPilot assets={assets} ir={ir} locale={locale as 'en'|'es'}/></main>;
 }catch{notFound();}
}
