import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/components/g678-alg-l06-p015-host-lesson-v1');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l06-p015-formal-admission-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L6 P015 — local Current-JS',
 robots:{index:false,follow:false,noarchive:true}};

export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 if(Object.entries(query).some(([key,value])=>
  !(key==='mode'&&value==='focus')&&!(key==='_rsc'&&typeof value==='string'&&
  /^[A-Za-z0-9_-]{1,128}$/.test(value))))notFound();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!isG678LocalPreviewRequestHeaders(await headers()))notFound();
 const host=await loadHost(),source=await loadSource();if(!host||!source)notFound();
 let descriptor;try{descriptor=source.algL6P015FormalDescriptor();}catch{notFound();}
 const {G678AlgL6P015HostLessonV1}=host;
 return <main id="main-content" data-p015-formal="registered-local-current-js">
  <p role="status">{locale==='es'
   ?'My Lesson local: página JavaScript registrada. El texto de la animación conserva el inglés original; el audio español separado requiere una acción explícita. El registro no establece publicación ni aceptación del contenido original.'
   :'Local My Lesson: registered JavaScript page. Animation text retains its source English; separate Spanish audio requires an explicit action. Registration does not establish publication or original-content acceptance.'}</p>
  <G678AlgL6P015HostLessonV1 descriptor={descriptor} initialPlacementId="shared-alg001-l06-p015"
   locale={locale as 'en'|'es'} audioEnabled={false} formal candidateMode hostPresentation="modern-wide"
   reviewerMode releasePublished={false} strictCompleteMemberCount={0}/>
 </main>;
}
