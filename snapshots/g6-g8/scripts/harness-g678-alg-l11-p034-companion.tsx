import React,{useCallback,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimationRuntime} from '../apps/web/components/animation-runtime';
import {createMemoryOnlyLessonHost,type LessonHostRequest} from '../packages/demos/src/runtime';
import {G678_ALG_L11_P034_COMPANION_CANDIDATE_MODULE} from '../packages/demos/src/g678-alg-l11-p034-companion-candidate';
const ID='shared-alg001-l11-p034';
Object.assign(window,{__P034_COMPANION_MODULES:{[ID]:G678_ALG_L11_P034_COMPANION_CANDIDATE_MODULE},__P034_COMPANION_AUDIT:[]});
const testWindow=window as typeof window&{__P034_COMPANION_CASE:{permission:boolean;provided:boolean;present:boolean;valid:boolean};__P034_COMPANION_AUDIT:unknown[]};
function Harness(){
  const config=testWindow.__P034_COMPANION_CASE;
  const host=useMemo(()=>createMemoryOnlyLessonHost({releaseId:'p034-companion-test-only',releaseMemberIds:[ID],currentAnimationId:ID,
    enabledCapabilities:config.permission?['practice-feedback']:[],mode:'audit',releasePublished:false}),[config.permission]);
  const[paused,setPaused]=useState(false),[faultState,setFaultState]=useState('none'),[revision,setRevision]=useState(0),[completions,setCompletions]=useState(0);
  const[present,setPresent]=useState(config.present),[valid,setValid]=useState(config.valid),[width,setWidth]=useState(800);
  const fault=useRef('none'),column=useRef<HTMLDivElement|null>(null);
  useLayoutEffect(()=>{const element=column.current;if(!element)return;const update=()=>setWidth(element.getBoundingClientRect().width);
    update();const observer=new ResizeObserver(update);observer.observe(element);return()=>observer.disconnect();},[]);
  const handle=useCallback((request:LessonHostRequest)=>{
    const forwarded=fault.current==='record'&&request.type==='record-practice-feedback'?{...request,branchCount:0}
      :fault.current==='reset'&&request.type==='reset-practice-feedback'?{...request,interactionId:'invalid-reset-target'}:request;
    const decision=host.dispatch(forwarded);
    testWindow.__P034_COMPANION_AUDIT.push({request,forwarded,status:decision.status,code:decision.status==='blocked'?decision.code:null,feedback:host.snapshot().practiceFeedback});
    setRevision(value=>value+1);return decision;
  },[host]);
  const feedback=host.snapshot().practiceFeedback;
  return<main data-test-loader="p034-companion-unregistered" data-host-revision={revision} data-completions={completions}
    data-real-host-feedback={feedback?JSON.stringify(feedback):''}>
    <header style={{padding:12,background:'#e7edf4',display:'flex',gap:8,flexWrap:'wrap'}}>
      <p style={{width:'100%',margin:0}}>Actual runtime / memory-only host, explicit test loader. Source plane and companion mounting fixture; not registered My Lesson.</p>
      <button onClick={()=>setPaused(value=>!value)} aria-pressed={paused}>Pause test runtime</button>
      {['none','record','reset'].map(mode=><button key={mode} onClick={()=>{fault.current=mode;setFaultState(mode);}} aria-pressed={faultState===mode}>Host fault: {mode}</button>)}
      <button onClick={()=>setPresent(value=>!value)} aria-pressed={present}>Toggle companion target</button>
      <button onClick={()=>setValid(value=>!value)} aria-pressed={valid}>Toggle valid target marker</button>
    </header>
    <div ref={column} style={{maxWidth:800,margin:'0 auto',width:'100%'}}>
      <div data-test-fixed-stage={String(config.provided)} style={config.provided?{height:width*.75,overflow:'hidden',position:'relative'}:undefined}>
        <div style={config.provided?{width:800,height:600,transform:`scale(${width/800})`,transformOrigin:'top left'}:undefined}>
          <AnimationRuntime animationId={ID} moduleKey={ID} query={{lang:'en',seed:'31'}} paused={paused} presentation="legacy-shell" audioEnabled={false}
            pageInteractionCompanionTargetId={config.provided?'p034-companion-test-target':undefined}
            onLessonHostRequest={handle} onPlaybackComplete={()=>setCompletions(value=>value+1)}
            labels={{replay:'Replay',reduced:'Reduced motion active',prototype:'Test candidate',loading:'Loading',unavailable:'Unavailable'}}/>
        </div>
      </div>
      {present?<div id="p034-companion-test-target" data-page-interaction-companion-host={valid?'true':'false'}/>:null}
    </div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
