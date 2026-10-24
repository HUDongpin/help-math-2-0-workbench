import {p043DocumentHeaders} from '@/lib/alg-l06-p043-preview-policy-v1';
import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import type {PageOnlyLessonPlayerDescriptor}
 from '@/lib/whole-lesson-player-descriptor';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/components/g678-alg-l06-p043-host-lesson-v1');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l06-p043-candidate-v1.server');
const loadFormal=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l06-p043-formal-admission-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L6 P043 — local source-audio candidate',
 robots:{index:false,follow:false,noarchive:true}};

/** One source-audio page in the real My Lesson player at its current gate. */
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 if(Object.entries(query).some(([key,value])=>
  !(key==='mode'&&value==='focus')&&!(key==='_rsc'&&typeof value==='string'&&
  /^[A-Za-z0-9_-]{1,128}$/.test(value))))notFound();
 const incoming=await headers();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!p043DocumentHeaders(incoming)||
  !isG678LocalPreviewRequestHeaders(incoming))notFound();
 const formal=!!localOnlyAnimationModuleRegistration('shared-alg001-l06-p043');
 const host=await loadHost();if(!host)notFound();
 let descriptor:PageOnlyLessonPlayerDescriptor;
 try{
  if(formal){const source=await loadFormal();if(!source)notFound();
   descriptor=source.algL6P043FormalDescriptor();}
  else{const source=await loadSource();if(!source)notFound();
   descriptor=source.algL6P043CandidateDescriptor();}
 }catch{notFound()}
 const {G678AlgL6P043HostLessonV1}=host;
 return <main id="main-content" data-p043-page={formal?'registered':'candidate'}
  data-official-g678-current-js={formal?'523/2282':'522/2282'}>
  <style>{`[data-p043-page] button[data-responsive-focus-key="rewind"]:disabled,
    [data-p043-page] button[data-responsive-focus-key="forward"]:disabled { display: none !important; }`}</style>
  <p role="status">{formal
   ?locale==='es'
    ?'My Lesson local: P043 tiene un módulo Current-JS registrado con audio de origen. La sincronización original, la escucha y la aceptación siguen pendientes; ALG001 L6 tiene 46 páginas registradas de 60.'
    :'Local My Lesson: P043 has a registered Current-JS module with source audio. Original timing, listening, and acceptance remain open; ALG001 L6 has 46 of 60 pages registered.'
   :locale==='es'
    ?'My Lesson local: P043 usa audio original en una vista de ingeniería sin registro Current-JS. La sincronización, la escucha y la aceptación siguen pendientes. La proyección conserva 45 páginas registradas de 60.'
    :'Local My Lesson: P043 uses source audio in an unregistered engineering candidate. Timing, listening, and acceptance remain open. The projection retains 45 of 60 registered pages.'}</p>
  <G678AlgL6P043HostLessonV1 descriptor={descriptor}
   initialPlacementId="shared-alg001-l06-p043" locale={locale as 'en'|'es'}
   registeredPagePresentation={formal?'registered':'candidate'}
   audioEnabled={true} candidateMode hostPresentation="modern-wide"
   reviewerMode releasePublished={false} strictCompleteMemberCount={0}/>
 </main>;
}
