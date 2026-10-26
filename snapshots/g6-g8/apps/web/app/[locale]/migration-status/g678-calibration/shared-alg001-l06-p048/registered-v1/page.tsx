import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {p048RegisteredDocumentRequest}
 from '@/lib/alg-l06-p048-registered-access-v1';
import {P048_LOCAL_ORIGIN} from '@/lib/alg-l06-p048-preview-policy-v1';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/components/g678-alg-l06-p048-host-lesson-v1');
const loadFormal=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l06-p048-formal-admission-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L6 P048 — local registered Current-JS',
 robots:{index:false,follow:false,noarchive:true}};

export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 const url=new URL(`${P048_LOCAL_ORIGIN}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p048/registered-v1`);
 for(const [key,value] of Object.entries(query)){
  if(typeof value!=='string')notFound();url.searchParams.set(key,value);
 }
 const incoming=await headers();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!p048RegisteredDocumentRequest(url,incoming,'GET')||
  !isG678LocalPreviewRequestHeaders(incoming)||
  !localOnlyAnimationModuleRegistration('shared-alg001-l06-p048'))notFound();
 const host=await loadHost(),source=await loadFormal();
 if(!host||!source)notFound();
 let descriptor;
 try{descriptor=source.algL6P048FormalDescriptor()}catch{notFound()}
 const {G678AlgL6P048HostLessonV1}=host;
 return <main id="main-content" data-p048-page="registered"
  data-official-g678-current-js="528/2282">
  <style>{`[data-p048-page] button[data-responsive-focus-key="rewind"]:disabled,
    [data-p048-page] button[data-responsive-focus-key="forward"]:disabled { display: none !important; }`}</style>
  <p role="status">{locale==='es'
   ?'My Lesson local: P048 tiene un módulo Current-JS registrado con audio de origen. La sincronización original, la escucha y la aceptación siguen pendientes; ALG001 L6 tiene 51 páginas registradas de 60.'
   :'Local My Lesson: P048 has a registered Current-JS module with source audio. Original timing, listening, and acceptance remain open; ALG001 L6 has 51 of 60 pages registered.'}</p>
  <G678AlgL6P048HostLessonV1 descriptor={descriptor}
   initialPlacementId="shared-alg001-l06-p048" locale={locale as 'en'|'es'}
   registeredPagePresentation="registered" audioEnabled candidateMode
   hostPresentation="modern-wide" reviewerMode releasePublished={false}
   strictCompleteMemberCount={0}/>
 </main>;
}
