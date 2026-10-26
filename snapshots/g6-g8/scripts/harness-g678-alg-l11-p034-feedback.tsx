import React,{useCallback,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimationRuntime} from '../apps/web/components/animation-runtime';
import {createMemoryOnlyLessonHost,type LessonHostRequest} from '../packages/demos/src/runtime';
import {G678_ALG_L11_P034_FEEDBACK_CANDIDATE_MODULE} from '../packages/demos/src/g678-alg-l11-p034-feedback-candidate';
const ID='shared-alg001-l11-p034';
Object.assign(window,{__P034_TEST_MODULES:{[ID]:G678_ALG_L11_P034_FEEDBACK_CANDIDATE_MODULE},__P034_AUDIT:[]});
const testWindow=window as typeof window&{__P034_CASE:{permission:boolean};__P034_AUDIT:unknown[]};
function Harness(){
  const host=useMemo(()=>createMemoryOnlyLessonHost({releaseId:'p034-feedback-test-only',releaseMemberIds:[ID],currentAnimationId:ID,
    enabledCapabilities:testWindow.__P034_CASE.permission?['practice-feedback']:[],mode:'audit',releasePublished:false}),[]);
  const[paused,setPaused]=useState(false),[faultState,setFaultState]=useState('none'),[revision,setRevision]=useState(0),[completions,setCompletions]=useState(0);
  const fault=useRef('none');
  const handle=useCallback((request:LessonHostRequest)=>{
    const forwarded=fault.current==='record'&&request.type==='record-practice-feedback'?{...request,branchCount:0}
      :fault.current==='reset'&&request.type==='reset-practice-feedback'?{...request,interactionId:'invalid-reset-target'}:request;
    const decision=host.dispatch(forwarded);
    testWindow.__P034_AUDIT.push({request,forwarded,status:decision.status,code:decision.status==='blocked'?decision.code:null,feedback:host.snapshot().practiceFeedback});
    setRevision(value=>value+1);return decision;
  },[host]);
  const feedback=host.snapshot().practiceFeedback;
  return<main data-test-loader="p034-feedback-unregistered" data-host-revision={revision} data-completions={completions}
    data-real-host-feedback={feedback?JSON.stringify(feedback):''}>
    <header style={{padding:12,background:'#eef3f8'}}><p>Actual runtime / memory-only practice host test. Source audio is extracted, not routed.</p>
      <button onClick={()=>setPaused(value=>!value)} aria-pressed={paused}>Pause test runtime</button>
      {['none','record','reset'].map(mode=><button key={mode} onClick={()=>{fault.current=mode;setFaultState(mode);}} aria-pressed={faultState===mode}>Host fault: {mode}</button>)}</header>
    <div style={{maxWidth:800,margin:'0 auto'}}><AnimationRuntime animationId={ID} moduleKey={ID} query={{lang:'en',seed:'31'}}
      paused={paused} presentation="legacy-shell" audioEnabled={false} onLessonHostRequest={handle} onPlaybackComplete={()=>setCompletions(value=>value+1)}
      labels={{replay:'Replay',reduced:'Reduced motion active',prototype:'Test candidate',loading:'Loading',unavailable:'Unavailable'}}/></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
