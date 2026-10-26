import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {P042_LOCAL_ORIGIN,p042DocumentRequest} from '@/lib/alg-l07-p042-preview-policy-v1';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/components/g678-alg-l07-current-host-lesson-v1');
const loadFormal=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l07-p042-formal-admission-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L7 P042 — local registered Current-JS',
 robots:{index:false,follow:false,noarchive:true}};

export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 const url=new URL(`${P042_LOCAL_ORIGIN}/${locale}/migration-status/g678-calibration/shared-alg001-l07-p042/registered-v1`);
 for(const [key,value] of Object.entries(query)){
  if(typeof value!=='string')notFound();url.searchParams.set(key,value);
 }
 const incoming=await headers();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!p042DocumentRequest(url,incoming,'GET','registered')||
  !isG678LocalPreviewRequestHeaders(incoming)||
  !localOnlyAnimationModuleRegistration('shared-alg001-l07-p042'))notFound();
 const host=await loadHost(),source=await loadFormal();if(!host||!source)notFound();
 let descriptor;try{descriptor=source.algL07P042FormalDescriptor()}catch{notFound()}
 return <main id="main-content" data-l07-p042-page="registered" data-official-g678-current-js={`${source.algL07CurrentRegisteredSharedCount()}/2282`}>
  <p role="status">{locale==='es'?`My Lesson local: P042, pendiente de una función lineal. Audio en español activado por el usuario. ${descriptor.productBridge.registeredAnimationCount} de 62 páginas disponibles.`:`Local My Lesson: P042, graph slope. Spanish Audio starts when selected. ${descriptor.productBridge.registeredAnimationCount} of 62 pages available.`}</p>
  <host.G678AlgL07CurrentHostLessonV1 descriptor={descriptor}
   initialPlacementId="shared-alg001-l07-p042" locale={locale as 'en'|'es'}
   registeredPagePresentation="registered" audioEnabled candidateMode
   hostPresentation="modern-wide" reviewerMode releasePublished={false}
   strictCompleteMemberCount={0}/>
 </main>;
}
