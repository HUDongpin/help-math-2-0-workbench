import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {P039_LOCAL_ORIGIN,p039DocumentRequest} from '@/lib/alg-l08-p039-preview-policy-v1';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/components/g678-alg-l08-current-host-lesson-v1');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l08-p039-formal-admission-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L8 P039 — registered local source activity',
 robots:{index:false,follow:false,noarchive:true}};

export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 const url=new URL(`${P039_LOCAL_ORIGIN}/${locale}/migration-status/g678-calibration/shared-alg001-l08-p039/registered-v1`);
 for(const [key,value] of Object.entries(query)){
  if(typeof value!=='string')notFound();url.searchParams.set(key,value);
 }
 const incoming=await headers();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!p039DocumentRequest(url,incoming,'GET','registered')||
  !isG678LocalPreviewRequestHeaders(incoming))notFound();
 const host=await loadHost(),source=await loadSource();if(!host||!source)notFound();
 let descriptor;try{descriptor=await source.algL08P039FormalDescriptorAsync()}catch{notFound()}
 return <main id="main-content" data-l08-p039-page="registered" data-official-g678-current-js={`${source.algL08CurrentRegisteredSharedCount()}/2282`}>
  <p role="status">{locale==='es'?`My Lesson local: P039, pregunta de la fuente. El audio se reproduce al seleccionarlo. ${descriptor.productBridge.registeredAnimationCount} de 50 páginas disponibles.`:`Local My Lesson: P039, source question. Audio starts when selected. ${descriptor.productBridge.registeredAnimationCount} of 50 pages available.`}</p>
  <host.G678AlgL08CurrentHostLessonV1 descriptor={descriptor}
   initialPlacementId="shared-alg001-l08-p039" locale={locale as 'en'|'es'}
   registeredPagePresentation="candidate" audioEnabled candidateMode
   hostPresentation="modern-wide" reviewerMode releasePublished={false}
   strictCompleteMemberCount={0}/>
 </main>;
}
