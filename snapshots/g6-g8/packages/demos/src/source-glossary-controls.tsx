'use client';
import {useState} from 'react';
import type {AnimationRendererProps} from './contract';

export interface SourceGlossaryControlPage {
 readonly animationId:string; readonly sourceSha256:string; readonly frameDomain:string; readonly frameCount:number;
 readonly controls:readonly {id:string;entryId:string;sourceKeyAttribute:string;characterId:number;firstFrame:number;lastFrameExclusive:number;label:string}[];
}
/** Validate button occurrence identity independently of dictionary entry identity.
 * Two source buttons may request one term; neither button can disappear by deduplication. */
export function validateSourceGlossaryControls(page:SourceGlossaryControlPage):SourceGlossaryControlPage {
 if(!/^shared-[a-z0-9-]+$/.test(page.animationId)||!/^[a-f0-9]{64}$/.test(page.sourceSha256)||
  !/^sprite-\d+$/.test(page.frameDomain)||!Number.isSafeInteger(page.frameCount)||page.frameCount<1||!page.controls.length)
  throw Error('Invalid source glossary page');
 const ids=new Set<string>();
 for(const c of page.controls){
  if(ids.has(c.id)||!c.id.startsWith(page.frameDomain+'/depth-')||!c.entryId||!c.sourceKeyAttribute||!c.label||
    !Number.isSafeInteger(c.characterId)||c.characterId<1||!Number.isSafeInteger(c.firstFrame)||!Number.isSafeInteger(c.lastFrameExclusive)||
    c.firstFrame<1||c.firstFrame>=c.lastFrameExclusive||c.lastFrameExclusive>page.frameCount+1)
   throw Error('Invalid source glossary control');
  ids.add(c.id);
 }
 return page;
}
export function sourceGlossaryControlsAtFrame(page:SourceGlossaryControlPage,frame:number,frameDomain:string){
 validateSourceGlossaryControls(page);
 if(!Number.isSafeInteger(frame)||frame<1||frame>page.frameCount||frameDomain!==page.frameDomain)
  throw Error('Unsupported source glossary context');
 return page.controls.filter(c=>frame>=c.firstFrame&&frame<c.lastFrameExclusive);
}
/** Companion controls use the typed modern host. The host owns pause, modal,
 * focus return and explicit resume; this component never starts audio or timers. */
export function SourceGlossaryControls({page,frame,frameDomain,onLessonHostRequest,ready,replay=0}: {
 page:SourceGlossaryControlPage;frame:number;frameDomain:string;ready:boolean;
 replay?:number;onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];
}){
 const [denial,setDenial]=useState<{replay:number;message:string}|null>(null);
 const visible=sourceGlossaryControlsAtFrame(page,frame,frameDomain);
 return <section aria-label="Source vocabulary controls" lang="en" data-source-animation-id={page.animationId}
   data-source-control-count={visible.length}>
  {visible.map(c=><button key={c.id} type="button" disabled={!ready||!onLessonHostRequest}
    data-source-instance-id={c.id} data-source-character-id={c.characterId} data-source-key-attribute={c.sourceKeyAttribute}
    onClick={event=>{
     const decision=onLessonHostRequest?.({type:'open-glossary',entryId:c.entryId},{trigger:event.currentTarget});
     setDenial(decision?.status==='allowed'?null:{replay,message:'This source vocabulary entry is unavailable.'});
    }}>{c.label}</button>)}
  {denial?.replay===replay&&<p role="status">{denial.message}</p>}
 </section>;
}
