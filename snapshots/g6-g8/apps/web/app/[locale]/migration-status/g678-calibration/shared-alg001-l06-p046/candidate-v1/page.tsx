import {p046DocumentHeaders} from '@/lib/alg-l06-p046-preview-policy-v1';
import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

const loadHost=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/components/g678-alg-l06-p046-host-lesson-v1');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):
 import('@/lib/alg-l06-p046-candidate-v1.server');
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ALG001 L6 P046 — local source-audio candidate',
 robots:{index:false,follow:false,noarchive:true}};

/** One unregistered source-audio candidate in the real My Lesson player. */
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params,query=await searchParams;
 if(Object.entries(query).some(([key,value])=>
  !(key==='mode'&&value==='focus')&&!(key==='_rsc'&&typeof value==='string'&&
  /^[A-Za-z0-9_-]{1,128}$/.test(value))))notFound();
 const incoming=await headers();
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  !['en','es'].includes(locale)||!p046DocumentHeaders(incoming)||
  !isG678LocalPreviewRequestHeaders(incoming))notFound();
 const host=await loadHost(),source=await loadSource();
 if(!host||!source)notFound();
 let descriptor;
 try{descriptor=source.algL6P046CandidateDescriptor()}catch{notFound()}
 const {G678AlgL6P046HostLessonV1}=host;
 return <main id="main-content" data-p046-page="candidate"
  data-official-g678-current-js="525/2282">
  <style>{`[data-p046-page] button[data-responsive-focus-key="rewind"]:disabled,
    [data-p046-page] button[data-responsive-focus-key="forward"]:disabled { display: none !important; }`}</style>
  <p role="status">{locale==='es'
   ?'My Lesson local: P046 usa audio original en una vista de ingeniería sin registro Current-JS. La sincronización, la escucha y la aceptación siguen pendientes. Hay 48 páginas registradas de 60.'
   :'Local My Lesson: P046 uses source audio in an unregistered engineering candidate. Timing, listening, and acceptance remain open. The lesson has 48 of 60 pages registered.'}</p>
  <G678AlgL6P046HostLessonV1 descriptor={descriptor}
   initialPlacementId="shared-alg001-l06-p046" locale={locale as 'en'|'es'}
   registeredPagePresentation="candidate" audioEnabled candidateMode
   hostPresentation="modern-wide" reviewerMode releasePublished={false}
   strictCompleteMemberCount={0}/>
 </main>;
}
