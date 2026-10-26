import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {p058RegisteredDocumentRequest}
 from '@/lib/alg-l06-p058-registered-access-v1';
import {P058_LOCAL_ORIGIN} from '@/lib/alg-l06-p058-preview-policy-v1';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/components/g678-alg-l06-p058-host-lesson-v1');
const loadFormal=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l06-p058-formal-admission-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L6 P058 — local registered Current-JS',
 robots:{index:false,follow:false,noarchive:true}};

export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 const url=new URL(`${P058_LOCAL_ORIGIN}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p058/registered-v1`);
 for(const [key,value] of Object.entries(query)){
  if(typeof value!=='string')notFound();url.searchParams.set(key,value);
 }
 const incoming=await headers();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!p058RegisteredDocumentRequest(url,incoming,'GET')||
  !isG678LocalPreviewRequestHeaders(incoming)||
  !localOnlyAnimationModuleRegistration('shared-alg001-l06-p058'))notFound();
 const host=await loadHost(),source=await loadFormal();
 if(!host||!source)notFound();
 let descriptor;
 try{descriptor=source.algL6P058FormalDescriptor()}catch{notFound()}
 const {G678AlgL6P058HostLessonV1}=host;
 return <main id="main-content" data-p058-page="registered"
  data-official-g678-current-js="534/2282">
  <style>{`[data-p058-page] button[data-responsive-focus-key="rewind"]:disabled,
    [data-p058-page] button[data-responsive-focus-key="forward"]:disabled { display: none !important; }`}</style>
  <p role="status">{locale==='es'
   ?'My Lesson local: P058 tiene un módulo Current-JS registrado con audio de origen. La sincronización original, la escucha y la aceptación siguen pendientes; ALG001 L6 tiene 57 páginas registradas de 60.'
   :'Local My Lesson: P058 has a registered Current-JS module with source audio. Original timing, listening, and acceptance remain open; ALG001 L6 has 57 of 60 pages registered.'}</p>
  <G678AlgL6P058HostLessonV1 descriptor={descriptor}
   initialPlacementId="shared-alg001-l06-p058" locale={locale as 'en'|'es'}
   registeredPagePresentation="registered" audioEnabled candidateMode
   hostPresentation="modern-wide" reviewerMode releasePublished={false}
   strictCompleteMemberCount={0}/>
 </main>;
}
