import {p041DocumentHeaders} from '@/lib/alg-l06-p041-preview-policy-v1';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 :import('@/components/g678-alg-l06-p041-host-lesson-v1');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 :import('@/lib/alg-l06-p041-candidate-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L6 P041 — local My Lesson candidate',
 robots:{index:false,follow:false,noarchive:true}};

export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 if(Object.entries(query).some(([key,value])=>
  !(key==='mode'&&value==='focus')&&!(key==='_rsc'&&typeof value==='string'&&
  /^[A-Za-z0-9_-]{1,128}$/.test(value))))notFound();
 const incoming=await headers();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!p041DocumentHeaders(incoming)||
  !isG678LocalPreviewRequestHeaders(incoming))notFound();
 const host=await loadHost(),source=await loadSource();if(!host||!source)notFound();
 let descriptor;
 try{descriptor=source.algL6P041CandidateDescriptor();}catch{notFound();}
 if(!descriptor)notFound();
 const {G678AlgL6P041HostLessonV1}=host;
 return <main id="main-content" data-p041-candidate="unregistered"
  data-official-g678-current-js="520/2282">
  <p role="status">{locale==='es'
   ?'My Lesson local: P041 es un candidato sin registrar. Esta lección tiene 43 páginas registradas y 1 candidata; registro G6–G8: 520/2282. El audio español separado se inicia solo al solicitarlo.'
   :'Local My Lesson: P041 is an unregistered candidate. This lesson has 43 registered pages and 1 candidate; G6–G8 registration: 520/2282. Separate Spanish audio starts only when requested.'}</p>
  <G678AlgL6P041HostLessonV1 descriptor={descriptor}
   initialPlacementId="shared-alg001-l06-p041" locale={locale as 'en'|'es'}
   audioEnabled={false} candidateMode hostPresentation="modern-wide"
   reviewerMode releasePublished={false} strictCompleteMemberCount={0}/>
 </main>;
}
