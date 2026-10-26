import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {P038_LOCAL_ORIGIN,p038DocumentRequest} from '@/lib/alg-l07-p038-preview-policy-v1';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/components/g678-alg-l07-current-host-lesson-v1');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l07-p038-candidate-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L7 P038 — local source candidate',
 robots:{index:false,follow:false,noarchive:true}};

export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 const url=new URL(`${P038_LOCAL_ORIGIN}/${locale}/migration-status/g678-calibration/shared-alg001-l07-p038/candidate-v1`);
 for(const [key,value] of Object.entries(query)){
  if(typeof value!=='string')notFound();url.searchParams.set(key,value);
 }
 const incoming=await headers();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!p038DocumentRequest(url,incoming,'GET','candidate')||
  !isG678LocalPreviewRequestHeaders(incoming))notFound();
 const host=await loadHost(),source=await loadSource();if(!host||!source)notFound();
 let descriptor;try{descriptor=source.algL07P038CandidateDescriptor()}catch{notFound()}
 return <main id="main-content" data-l07-p038-page="candidate" data-official-g678-current-js={`${source.algL07CurrentRegisteredSharedCount()}/2282`}>
  <p role="status">{locale==='es'?`My Lesson local: P038 presenta la elección de una gráfica cúbica y cinco pares ordenados, con audio en español activado por el usuario. ALG001 L7 tiene ${descriptor.productBridge.registeredAnimationCount} páginas disponibles de 62 en esta vista. La escucha y la aceptación permanecen pendientes.`:`Local My Lesson: P038 presents the source cubic-graph choice and five ordered pairs, feedback and glossary and user-triggered Spanish Audio. ALG001 L7 has ${descriptor.productBridge.registeredAnimationCount} of 62 pages available in this view. Listening and acceptance remain pending.`}</p>
  <host.G678AlgL07CurrentHostLessonV1 descriptor={descriptor}
   initialPlacementId="shared-alg001-l07-p038" locale={locale as 'en'|'es'}
   registeredPagePresentation="candidate" audioEnabled candidateMode
   hostPresentation="modern-wide" reviewerMode releasePublished={false}
   strictCompleteMemberCount={0}/>
 </main>;
}
