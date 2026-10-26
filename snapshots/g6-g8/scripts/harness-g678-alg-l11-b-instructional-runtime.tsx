import React,{useCallback,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimationRuntime} from '../apps/web/components/animation-runtime';
import {createMemoryOnlyLessonHost,type LessonHostRequest} from '../packages/demos/src/runtime';
import {transitionDescriptorGlossaryPause,type DescriptorGlossaryPauseSession} from '../apps/web/lib/descriptor-driven-glossary-pause';
import {G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES} from '../packages/demos/src/g678-alg-l11-behavior10-tranche-b-state';
import {createAlgL11BInstructionalVisualCandidate,type AlgL11BVectorBundle,
  type AlgL11BExplanationBundle,type AlgL11BSourceGlossaryConfig} from '../packages/demos/src/g678-alg-l11-b-instructional-visuals';

const testWindow=window as typeof window&{
 __B10_CASE:{animationId:string;bundle:AlgL11BVectorBundle;explanations?:AlgL11BExplanationBundle;glossary:AlgL11BSourceGlossaryConfig};
 __B10_TEST_MODULES:Record<string,unknown>;__B10_AUDIT:unknown[];
};
const supplied=testWindow.__B10_CASE;
const config=G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES.find(p=>p.animationId===supplied.animationId);
if(!config)throw Error('Unknown exact B10 mounted test member');
const candidate=createAlgL11BInstructionalVisualCandidate(config,supplied.bundle,supplied.explanations,supplied.glossary);
testWindow.__B10_TEST_MODULES={[config.animationId]:candidate.module};
testWindow.__B10_AUDIT=[];

function Harness(){
 const animationId=supplied.animationId;
 const host=useMemo(()=>createMemoryOnlyLessonHost({releaseId:'b10-successor-mounted-test-only',
  releaseMemberIds:[animationId],currentAnimationId:animationId,enabledCapabilities:['practice-feedback','glossary','language'],
  initialLanguage:'en',mode:'audit',releasePublished:false}),[animationId]);
 const [paused,setPaused]=useState(false),[revision,setRevision]=useState(0),[completions,setCompletions]=useState(0);
 const pauseSession=useRef<DescriptorGlossaryPauseSession<null>|null>(null);
 const blocked=useRef(false);const [fault,setFault]=useState(false);
 const request=useCallback((intent:LessonHostRequest)=>{
  if(intent.type==='open-glossary'&&!supplied.glossary.entries.some(e=>e.id===intent.entryId))throw Error('Missing exact source glossary entry');
  const forwarded=blocked.current&&intent.type==='record-practice-feedback'?{...intent,branchCount:0}:intent;
  const decision=host.dispatch(forwarded);
  if(decision.status==='allowed'&&(intent.type==='open-glossary'||intent.type==='close-glossary')){
   const next=transitionDescriptorGlossaryPause({allowed:true,pageSessionId:animationId,paused,
    requestType:intent.type,seekRequest:null,session:pauseSession.current});pauseSession.current=next.session;setPaused(next.paused);
  }
  testWindow.__B10_AUDIT.push({request:intent,forwarded,status:decision.status,
   reason:decision.status==='blocked'?decision.reason:null,host:host.snapshot()});
  setRevision(r=>r+1);return decision;
 },[host,paused]);
 const state=host.snapshot();const term=supplied.glossary.entries.find(e=>e.id===state.glossaryEntryId);
 return <main data-test-loader="unregistered-b10-instructional-successor" data-product-calibration-passed="false"
  data-host-revision={revision} data-host-feedback-active={String(state.practiceFeedback!==null)}
  data-host-glossary-entry={state.glossaryEntryId??''} data-test-completion-count={completions}>
  <header style={{padding:12,background:'#f2f5fa'}}>
   <p>Mounted B10 runtime test. No product registration or acceptance.</p>
   <button onClick={()=>setPaused(p=>!p)} aria-pressed={paused}>Pause test runtime</button>
   <button onClick={()=>{blocked.current=!blocked.current;setFault(blocked.current);}} aria-pressed={fault}>Reject answer record in real host</button>
   <button onClick={()=>request({type:'set-language',language:state.language==='en'?'es':'en'})}>Toggle glossary language</button>
  </header>
  <div style={{width:'100%',maxWidth:800,margin:'0 auto'}}>
   <AnimationRuntime animationId={animationId} moduleKey={animationId} query={{lang:'en',seed:'0'}}
    audioEnabled={false} presentation="legacy-shell" paused={paused} uiLanguage={state.language}
    onLessonHostRequest={request} onPlaybackComplete={()=>setCompletions(c=>c+1)}
    labels={{replay:'Replay',reduced:'Reduced motion active',prototype:'Test candidate',loading:'Loading test module',unavailable:'Test module unavailable'}}/>
  </div>
  {term?<div role="dialog" aria-modal="true" aria-label="Source bilingual glossary"
    style={{position:'fixed',inset:'20% 8%',background:'white',border:'3px solid #235b8a',padding:24,zIndex:10}}>
    <h2 data-glossary-label="true">{term.labels[state.language]}</h2>
    <p data-glossary-definition="true">{term.definitions[state.language]}</p>
    <button onClick={()=>request({type:'close-glossary'})}>Close glossary</button>
   </div>:null}
 </main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
