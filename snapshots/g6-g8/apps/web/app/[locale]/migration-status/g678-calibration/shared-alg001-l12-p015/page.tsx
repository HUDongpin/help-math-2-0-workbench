import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {registeredLocalOnlyAnimationKeys,hasLocalOnlyAnimationModule} from '@helpmath/demos/local-only-animation-registry-metadata';
import {splitAdmissionDescriptor} from '@/lib/g678-split-admission.server';
import {glossaryPairHostProbeDescriptor} from '@/lib/g678-glossary-pair-host-probe.server';
import {p012AssetManifest} from '@/lib/g678-alg-l12-p012-assets.server';
import {pairHostAssetManifest} from '@/lib/g678-glossary-pair-assets.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import styles from '../shared-alg001-l12-p010/probe.module.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Plot Ordered Pairs — local Current-JS review',robots:{index:false,follow:false,noarchive:true}};
const loadHost=()=>process.env.NODE_ENV==='production'?import('@/lib/g678-glossary-pair-host.production-stub'):import('@/components/g678-glossary-pair-host-lesson');
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(process.env.NODE_ENV==='production'||process.env.VERCEL||(locale!=='en'&&locale!=='es')||!isG678LocalPreviewRequestHeaders(await headers()))notFound();
 const registered=hasLocalOnlyAnimationModule('shared-alg001-l12-p015');
 let descriptor,p012Assets;try{p012Assets=p012AssetManifest();descriptor=registered?splitAdmissionDescriptor('shared-alg001-l12-p015'):glossaryPairHostProbeDescriptor('shared-alg001-l12-p015');pairHostAssetManifest('shared-alg001-l12-p015');}catch{notFound();}
 const {G678GlossaryPairHostLesson}=await loadHost();
 return <main id="main-content" className={styles.probe} data-pair-current-js={registered?'registered-local-current-js':'unregistered-probe'} data-official-g678-current-js={`${registeredLocalOnlyAnimationKeys.length}/2282`}>
  <G678GlossaryPairHostLesson key={locale} descriptor={descriptor} p012Assets={p012Assets} initialPlacementId="shared-alg001-l12-p015" locale={locale}
   audioEnabled={false} candidateMode hostPresentation="modern-wide" reviewerMode releasePublished={false} strictCompleteMemberCount={0}/>
  <p role="status">{registered?(locale==='es'?'Current-JS registrado para revisión local. Fidelidad, audio, revisión humana y publicación pendientes.':'Registered Current-JS for local review. Fidelity, audio, human review and publication remain pending.'):(locale==='es'?'Candidato local sin registrar. No se cuenta como una nueva migración completada.':'Unregistered local candidate. Not counted as a newly completed migration.')}</p>
 </main>;
}
