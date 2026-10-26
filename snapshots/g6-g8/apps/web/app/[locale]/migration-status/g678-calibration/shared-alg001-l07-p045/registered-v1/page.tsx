import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {P045_LOCAL_ORIGIN,p045DocumentRequest} from '@/lib/alg-l07-p045-preview-policy-v1';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/components/g678-alg-l07-current-host-lesson-v1');
const loadFormal=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l07-p045-formal-admission-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L7 P045 — local registered Current-JS',
 robots:{index:false,follow:false,noarchive:true}};

export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 const url=new URL(`${P045_LOCAL_ORIGIN}/${locale}/migration-status/g678-calibration/shared-alg001-l07-p045/registered-v1`);
 for(const [key,value] of Object.entries(query)){
  if(typeof value!=='string')notFound();url.searchParams.set(key,value);
 }
 const incoming=await headers();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!p045DocumentRequest(url,incoming,'GET','registered')||
  !isG678LocalPreviewRequestHeaders(incoming)||
  !localOnlyAnimationModuleRegistration('shared-alg001-l07-p045'))notFound();
 const host=await loadHost(),source=await loadFormal();if(!host||!source)notFound();
 let descriptor;try{descriptor=source.algL07P045FormalDescriptor()}catch{notFound()}
 return <main id="main-content" data-l07-p045-page="registered" data-official-g678-current-js={`${source.algL07CurrentRegisteredSharedCount()}/2282`}>
  <p role="status">{locale==='es'?`My Lesson local: P045, intersección con el eje y de una función lineal. Audio en español activado por el usuario. ${descriptor.productBridge.registeredAnimationCount} de 62 páginas disponibles.`:`Local My Lesson: P045, linear equation y-intercept. Spanish Audio starts when selected. ${descriptor.productBridge.registeredAnimationCount} of 62 pages available.`}</p>
  <host.G678AlgL07CurrentHostLessonV1 descriptor={descriptor}
   initialPlacementId="shared-alg001-l07-p045" locale={locale as 'en'|'es'}
   registeredPagePresentation="registered" audioEnabled candidateMode
   hostPresentation="modern-wide" reviewerMode releasePublished={false}
   strictCompleteMemberCount={0}/>
 </main>;
}
