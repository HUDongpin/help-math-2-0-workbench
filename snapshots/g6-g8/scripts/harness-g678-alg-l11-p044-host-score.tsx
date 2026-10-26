import React,{useCallback,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimationRuntime} from '../apps/web/components/animation-runtime';
import {createMemoryOnlyLessonHost,type LessonHostRequest} from '../packages/demos/src/runtime';
import {G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE} from '../packages/demos/src/g678-alg-l11-p044-host-score-candidate';

const ID='shared-alg001-l11-p044';
Object.assign(window,{__D_SCORE_MODULES:{[ID]:G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE},__D_SCORE_AUDIT:[]});
const testWindow=window as typeof window&{__D_SCORE_CASE:{permission:boolean;seed:number};__D_SCORE_AUDIT:unknown[]};
function Harness(){
  const config=testWindow.__D_SCORE_CASE;
  const host=useMemo(()=>createMemoryOnlyLessonHost({releaseId:'p044-host-score-test-only',releaseMemberIds:[ID],currentAnimationId:ID,
    enabledCapabilities:config.permission?['fq-scoring']:[],mode:'audit',releasePublished:false}),[config.permission]);
  const [paused,setPaused]=useState(false);const fault=useRef(false);const [faultState,setFaultState]=useState(false);
  const [revision,setRevision]=useState(0);const[completions,setCompletions]=useState(0);
  const handle=useCallback((request:LessonHostRequest)=>{
    const forwarded=fault.current&&request.type==='record-fq-score'?{...request,pointsPossible:0}:request;
    const decision=host.dispatch(forwarded);
    testWindow.__D_SCORE_AUDIT.push({request,forwarded,status:decision.status,
      code:decision.status==='blocked'?decision.code:null,score:host.snapshot().fqScore});
    setRevision(value=>value+1);return decision;
  },[host]);
  const score=host.snapshot().fqScore;
  return<main data-test-loader="p044-host-score-unregistered" data-host-revision={revision}
    data-real-host-attempted={score.attempted} data-real-host-correct={score.correct}
    data-real-host-awarded={score.pointsAwarded} data-real-host-possible={score.pointsPossible}
    data-real-host-source-ids={score.scoredQuestionIds.join(',')} data-completions={completions}>
    <header style={{padding:12,background:'#eef3f8'}}><p>Actual runtime / memory-only FQ host test. No registry, LRS, or production effect.</p>
      <button onClick={()=>setPaused(value=>!value)} aria-pressed={paused}>Pause test runtime</button>
      <button onClick={()=>{fault.current=!fault.current;setFaultState(fault.current);}} aria-pressed={faultState}>Reject next score records in real host</button>
      <p>Real host score: {score.pointsAwarded} / {score.pointsPossible}</p></header>
    <div style={{width:800,margin:'0 auto'}}><AnimationRuntime animationId={ID} moduleKey={ID}
      query={{lang:'en',seed:String(config.seed)}} paused={paused} presentation="legacy-shell" audioEnabled={false}
      onLessonHostRequest={handle} onPlaybackComplete={()=>setCompletions(value=>value+1)}
      labels={{replay:'Replay',reduced:'Reduced motion active',prototype:'Test candidate',loading:'Loading',unavailable:'Unavailable'}}/></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
