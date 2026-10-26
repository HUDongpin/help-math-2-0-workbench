import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {G678AlgL10PairLesson} from '@/components/g678-alg-l10-pair-lesson-v3';
import {algL10PairDescriptor} from '@/lib/g678-alg-l10-pair.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
export const metadata:Metadata={title:'Algebraic Expressions Involving Powers — private Current-JS',robots:{follow:false,index:false,noarchive:true}};
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(process.env.NODE_ENV==='production'||!isG678LocalPreviewRequestHeaders(await headers())||(locale!=='en'&&locale!=='es'))notFound();
 let descriptor;try{descriptor=algL10PairDescriptor();}catch{notFound();}
 return <main id="main-content"><G678AlgL10PairLesson audioEnabled={false} candidateMode descriptor={descriptor} hostPresentation="modern-wide"
  initialPlacementId="shared-alg001-l10-p005" locale={locale} releasePublished={false} reviewerMode strictCompleteMemberCount={0}/></main>;
}
