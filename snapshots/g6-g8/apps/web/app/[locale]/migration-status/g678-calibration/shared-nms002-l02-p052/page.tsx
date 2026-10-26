import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {getWorkspaceRoot} from '@/lib/catalog';
import {isP052PreviewRequest} from '@/lib/nms-l02-p052-preview-access';
import {P052_SOURCE_ROOT,readP052CandidateAudio} from '@/lib/nms-l02-p052-source-bytes';
import {P052_AUDIO_PLANS} from '../../../../../../../packages/demos/src/generated/nms-l02-p052-runtime-audio-v1';
import {P052CandidateEntry} from '@/components/nms-l02-p052-candidate-entry';
import {parseP052CaptureQuery} from '@/lib/nms-l02-p052-capture-query';
import {G678NmsL2P052Lesson} from '@/components/g678-nms-l02-p052-lesson';
import {NMS_L2_P052_ID,nmsL2P052Descriptor} from '@/lib/g678-nms-l02-p052.server';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'P052 — private Percent Practice candidate',robots:{index:false,follow:false,noarchive:true}};
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params;
 if(!isP052PreviewRequest(await headers(),locale)||process.env.HELP_MATH_G678_SOURCE_ROOT!==P052_SOURCE_ROOT)notFound();
 let capture;try{capture=parseP052CaptureQuery(await searchParams,locale);}catch{notFound();}
 try{for(const domain of Object.keys(P052_AUDIO_PLANS))readP052CandidateAudio(getWorkspaceRoot(),P052_SOURCE_ROOT,domain);}catch{notFound();}
 if(capture)return <main id="main-content"><P052CandidateEntry language={locale as 'en'|'es'} capture={capture}/></main>;
 let descriptor;try{descriptor=nmsL2P052Descriptor();}catch{notFound();}
 return <main id="main-content"><G678NmsL2P052Lesson audioEnabled={false} candidateMode descriptor={descriptor}
  hostPresentation="modern-wide" initialPlacementId={NMS_L2_P052_ID} locale={locale as 'en'|'es'} releasePublished={false}
  reviewerMode strictCompleteMemberCount={0}/></main>;
}
