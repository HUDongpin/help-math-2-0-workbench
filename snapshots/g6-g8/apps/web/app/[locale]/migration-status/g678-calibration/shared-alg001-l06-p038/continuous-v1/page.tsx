import {p038DocumentHeaders} from '@/lib/alg-l06-p038-preview-policy-v1';
import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/components/g678-alg-l06-p038-host-lesson-v1');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l06-p038-formal-admission-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L6 P038 — local registered My Lesson',
 robots:{index:false,follow:false,noarchive:true}};

/** Served locally through the candidate URL so existing source resource pins retain their referer. */
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 if(Object.entries(query).some(([key,value])=>
  !(key==='mode'&&value==='focus')&&!(key==='_rsc'&&typeof value==='string'&&
  /^[A-Za-z0-9_-]{1,128}$/.test(value))))notFound();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!p038DocumentHeaders(await headers())||
  !isG678LocalPreviewRequestHeaders(await headers()))notFound();
 const host=await loadHost(),source=await loadSource();if(!host||!source)notFound();
 let descriptor;try{descriptor=source.algL6P038FormalDescriptor();}catch{notFound();}
 const {G678AlgL6P038HostLessonV1}=host;
 return <main id="main-content" data-p038-formal="registered-current-js">
  <p role="status">{locale==='es'
   ?'My Lesson local: P038 está registrado como Current-JS local. Esta proyección muestra 43 de 60 páginas registradas. El audio español separado se inicia solo al solicitarlo.'
   :'Local My Lesson: P038 is registered as local Current-JS. This projection shows 43 of 60 registered pages. Separate Spanish audio starts only when requested.'}</p>
  <G678AlgL6P038HostLessonV1 descriptor={descriptor}
   initialPlacementId="shared-alg001-l06-p038" locale={locale as 'en'|'es'}
   audioEnabled={false} candidateMode registeredPagePresentation="registered"
   hostPresentation="modern-wide" reviewerMode releasePublished={false}
   strictCompleteMemberCount={0}/>
 </main>;
}
