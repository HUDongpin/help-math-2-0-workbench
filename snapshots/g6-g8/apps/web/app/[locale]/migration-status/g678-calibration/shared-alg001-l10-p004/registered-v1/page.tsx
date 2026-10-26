import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {P004_LOCAL_ORIGIN,p004DocumentRequest} from '@/lib/alg-l10-p004-preview-policy-v1';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/components/g678-alg-l10-p004-host-lesson-v1');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l10-p004-formal-admission-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L10 P004 — local registered Current-JS',
 robots:{index:false,follow:false,noarchive:true}};

export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 const url=new URL(`${P004_LOCAL_ORIGIN}/${locale}/migration-status/g678-calibration/shared-alg001-l10-p004/registered-v1`);
 for(const [key,value] of Object.entries(query)){
  if(typeof value!=='string')notFound();url.searchParams.set(key,value);
 }
 const incoming=await headers();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!p004DocumentRequest(url,incoming,'GET','registered')||
  !isG678LocalPreviewRequestHeaders(incoming))notFound();
 const host=await loadHost(),source=await loadSource();if(!host||!source)notFound();
 let descriptor;try{descriptor=source.algL10P004FormalDescriptor()}catch{notFound()}
 return <main id="main-content" data-l10-p004-page="registered" data-official-g678-current-js={`${source.algL10CurrentRegisteredSharedCount()}/2282`}>
  <p role="status">{locale==='es'?`My Lesson local: P004, actividad del mundo real. Texto original en inglés; el audio en español se reproduce por separado con la animación en pausa. ${descriptor.productBridge.registeredAnimationCount} de 52 páginas registradas.`:`Local My Lesson: P004, real world activity. Original English text; Spanish audio plays separately while the animation is paused. ${descriptor.productBridge.registeredAnimationCount} of 52 pages registered.`}</p>
  <host.G678AlgL10P004HostLessonV1 descriptor={descriptor}
   initialPlacementId="shared-alg001-l10-p004" locale={locale as 'en'|'es'}
   registeredPagePresentation="registered" audioEnabled candidateMode
   hostPresentation="modern-wide" reviewerMode releasePublished={false}
   strictCompleteMemberCount={0}/>
 </main>;
}
