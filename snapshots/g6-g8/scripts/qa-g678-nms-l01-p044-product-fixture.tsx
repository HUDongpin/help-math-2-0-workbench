import React,{createContext,useCallback,useContext,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimationRuntime} from '../apps/web/components/animation-runtime';
import {createMemoryOnlyLessonHost,type LessonHostRequest} from '../packages/demos/src/runtime';
import type {AnimationRendererProps} from '../packages/demos/src/contract';
import {createP044CandidateModule} from '../packages/demos/src/g678-nms-l01-p044-candidate-module';
import {NmsL01P044ProductCandidate} from '../packages/demos/src/g678-nms-l01-p044-product-candidate';
import {P044_SOURCE_GLOSSARY} from '../packages/demos/src/generated/g678-nms-l01-p044-source-glossary-v1';
const ID='shared-nms002-l01-p044';
const Ready=createContext<(ready:boolean)=>void>(()=>{});
function Renderer(props:AnimationRendererProps){const ready=useContext(Ready);return <NmsL01P044ProductCandidate {...props} onVisualReady={ready}/>;}
Object.assign(window,{__P044_PRODUCT_MODULES:{[ID]:createP044CandidateModule(Renderer)}});
function Fixture(){
  const [ready,setReady]=useState(false),[paused,setPaused]=useState(false),[glossary,setGlossary]=useState<string|null>(null);
  const [requests,setRequests]=useState(0),[completions,setCompletions]=useState(0),[deny,setDeny]=useState(false);
  const [epoch,setEpoch]=useState(0),[seed,setSeed]=useState(0);
  const [slotMode,setSlotMode]=useState('valid');const slotId='fixture-nms-l01-p044-readable-instruction';
  const es=(window as Window & {__P044_FIXTURE_LOCALE?:string}).__P044_FIXTURE_LOCALE==='es';
  const host=useMemo(()=>createMemoryOnlyLessonHost({releaseId:'p044-isolated-product-fixture',releaseMemberIds:[ID],currentAnimationId:ID,
    enabledCapabilities:['glossary','practice-feedback'],mode:'audit',releasePublished:false}),[epoch]);
  const request=useCallback((message:LessonHostRequest)=>{
    setRequests(n=>n+1);
    if(deny&&message.type==='record-practice-feedback')return {status:'blocked' as const,code:'capability-not-enabled' as const,reason:'Deliberate fixture denial',state:host.snapshot()};
    const decision=host.dispatch(message);
    if(decision.status==='allowed'&&message.type==='open-glossary')setGlossary(message.entryId);
    if(decision.status==='allowed'&&message.type==='close-glossary')setGlossary(null);
    return decision;
  },[host,deny]);
  const entry=P044_SOURCE_GLOSSARY.entries.find(entry=>entry.id===glossary);
  return <main data-p044-isolated-fixture="true" data-not-my-lesson="true" data-not-registered="true" data-completions={completions}
    data-host-request-count={requests} data-ready={ready} style={{margin:'0 auto',maxWidth:900,padding:12}}>
    <h1>Isolated p044 source candidate</h1><p>No registration, audio, original-runtime acceptance or publication.</p>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button data-fixture-pause="true" aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>Pause fixture</button>
      <button data-fixture-deny="true" aria-pressed={deny} onClick={()=>setDeny(p=>!p)}>Deny feedback in test</button>
      <label>Seed <select data-fixture-seed="true" value={seed} onChange={e=>{setSeed(Number(e.target.value));setEpoch(n=>n+1);setCompletions(0);setReady(false);}}>{[0,1,2,3].map(n=><option key={n}>{n}</option>)}</select></label>
      <label>Companion slot <select data-fixture-slot="true" value={slotMode} onChange={e=>setSlotMode(e.target.value)}>{['valid','unmarked','duplicate','missing'].map(mode=><option key={mode}>{mode}</option>)}</select></label>
    </div>
    <div className="lesson-shell2__learning-column"><Ready.Provider value={setReady}><AnimationRuntime key={epoch} animationId={ID} moduleKey={ID} query={{lang:'en',seed:String(seed)}}
      uiLanguage={es?'es':'en'} presentation="workbench" paused={!ready||paused||Boolean(glossary)} audioEnabled={false}
      pageInteractionCompanionTargetId={slotId}
      onLessonHostRequest={request} onPlaybackComplete={()=>setCompletions(n=>n+1)}
      labels={{replay:'Replay runtime',reduced:'Reduced motion candidate',prototype:'UNREGISTERED P044',loading:'Loading candidate',unavailable:'Candidate unavailable'}}/>
    </Ready.Provider>
      {slotMode!=='missing'?<div id={slotId} data-page-interaction-companion-host={slotMode==='unmarked'?undefined:'true'}/>:null}
      {slotMode==='duplicate'?<div id={slotId} data-page-interaction-companion-host="true"/>:null}
    </div>
    {entry?<section role="dialog" aria-modal="true" aria-label="Source glossary" data-p044-fixture-glossary="true" style={{position:'fixed',zIndex:1000,inset:'10% 8%',padding:24,background:'white',border:'3px solid #2459a9',overflow:'auto'}}>
      <h2>{entry.labels[es?'es':'en']}</h2><p>{entry.definitions[es?'es':'en']}</p>
      <button data-fixture-glossary-close="true" onClick={()=>request({type:'close-glossary'})}>Close glossary</button>
    </section>:null}
  </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
