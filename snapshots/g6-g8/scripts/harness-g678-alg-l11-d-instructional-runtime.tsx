import React,{useCallback,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimationRuntime} from '../apps/web/components/animation-runtime';
import {createMemoryOnlyLessonHost,type LessonHostRequest} from '../packages/demos/src/runtime';
import {G678_ALG_L11_D_INSTRUCTIONAL_P033_MODULE} from '../packages/demos/src/g678-alg-l11-p033-instructional-candidate';
import {G678_ALG_L11_D_INSTRUCTIONAL_P034_MODULE,G678_ALG_L11_D_INSTRUCTIONAL_P044_MODULE} from '../packages/demos/src/g678-alg-l11-tranche-d-instructional-candidates';
import type {LessonHostNavigationHandoff} from '../packages/demos/src/lesson-host-contract';

const testModules={
  'shared-alg001-l11-p033':G678_ALG_L11_D_INSTRUCTIONAL_P033_MODULE,
  'shared-alg001-l11-p034':G678_ALG_L11_D_INSTRUCTIONAL_P034_MODULE,
  'shared-alg001-l11-p044':G678_ALG_L11_D_INSTRUCTIONAL_P044_MODULE,
};
type ModuleId=keyof typeof testModules;
Object.assign(window,{__D_TEST_MODULES:testModules,__D_AUDIT:[],__D_POINTER:[]});
document.addEventListener('click',event=>{
  const button=event.composedPath().find(node=>node instanceof HTMLButtonElement) as HTMLButtonElement|undefined;
  const target=event.target as Element;
  (window as typeof window&{__D_POINTER:unknown[]}).__D_POINTER.push({label:button?.getAttribute('aria-label'),
    source:button?.getAttribute('data-source-instance-name'),disabled:button?.disabled,
    tag:target?.tagName,pressed:button?.getAttribute('aria-pressed')});
});
const testWindow=window as typeof window&{__D_CASE:{animationId:ModuleId;seed?:number};__D_AUDIT:unknown[]};
function Harness(){
  const initial=testWindow.__D_CASE;
  if(!testModules[initial.animationId])throw new Error('unknown D test module');
  const [active,setActive]=useState(initial.animationId);
  const [handoff,setHandoff]=useState<LessonHostNavigationHandoff|null>(null);
  const [paused,setPaused]=useState(false);
  const [completions,setCompletions]=useState(0);
  const [revision,setRevision]=useState(0);
  const host=useMemo(()=>createMemoryOnlyLessonHost({releaseId:'d-instructional-mounted-test-only',
    releaseMemberIds:Object.keys(testModules),currentAnimationId:initial.animationId,
    enabledCapabilities:['navigation'],initialLanguage:'en',mode:'audit',releasePublished:false}),[initial.animationId]);
  const handleRequest=useCallback((request:LessonHostRequest)=>{
    const decision=host.dispatch(request);
    testWindow.__D_AUDIT.push({request,status:decision.status,state:host.snapshot()});
    if(decision.status==='allowed'&&request.type==='navigate'){
      setHandoff(request.handoff??null);setActive(request.targetAnimationId as ModuleId);
    }
    setRevision(value=>value+1);return decision;
  },[host]);
  return <main data-test-loader="unregistered-d-instructional-successor" data-current-page={active}
    data-test-completion-count={completions} data-host-revision={revision}
    data-host-current-page={host.snapshot().currentAnimationId} data-product-calibration-passed="false">
    <header style={{padding:12,background:'#eef3f8'}}><p>Mounted D runtime test: no product registration or calibration.</p>
      <button onClick={()=>setPaused(value=>!value)} aria-pressed={paused}>Pause test runtime</button></header>
    <div style={{width:800,margin:'0 auto'}}><AnimationRuntime animationId={active} moduleKey={active}
      query={{lang:'en',seed:String(initial.seed??31)}} presentation="legacy-shell" audioEnabled={false} paused={paused}
      lessonHostNavigationHandoff={handoff} onLessonHostRequest={handleRequest}
      onPlaybackComplete={()=>setCompletions(value=>value+1)}
      labels={{replay:'Replay',reduced:'Reduced motion active',prototype:'Test candidate',loading:'Loading test module',unavailable:'Test module unavailable'}}/>
    </div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
