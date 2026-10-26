import React,{useCallback,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimationRuntime} from '../apps/web/components/animation-runtime';
import {createMemoryOnlyLessonHost,type LessonHostRequest} from '../packages/demos/src/runtime';
import {P044_SOURCE_GLOSSARY} from '../packages/demos/src/generated/g678-nms-l01-p044-source-glossary-v1';
import {createP044State,queryP044} from '../packages/demos/src/g678-nms-l01-p044-controller';
const ID='shared-nms002-l01-p044';
Object.assign(window,{__P044_PREPARED_MODULE_LOADERS:{[ID]:async()=>{
  const {default:module,P044_MODULE_PREPARATION:preparation}=await import('../packages/demos/src/g678-nms-l01-p044-prepared-module');
  Object.assign(window,{__P044_ADMITTED_PREPARATION:{...preparation,at:performance.now()}});return module;
}}});
Object.assign(window,{__P044_COMPARE_PREPARED_DEFAULTS:async()=>{
  const [{prepareP044CanvasMount},{createP044SourceCanvasAdapter}]=await Promise.all([
    import('../packages/demos/src/g678-nms-l01-p044-canvas-preparation'),import('../packages/demos/src/generated/g678-nms-l01-p044-source-canvas-v1')]);
  const a=document.createElement('canvas'),b=document.createElement('canvas');for(const c of[a,b]){c.width=800;c.height=600;}
  const prepared=await(await prepareP044CanvasMount())(a),raw=createP044SourceCanvasAdapter(b);await raw.ready();const records=[];
  for(const frame of[1,2,3,6,7,8,12,20,70,71,72,73,76,77,120,240,311,312,449,575,697,737,756]){
    prepared.render({...queryP044(createP044State()),mainFrame:frame,sourceContexts:[]});raw.render({rootFrame:6,mainFrame:frame,instances:[]});
    const p=a.getContext('2d')!.getImageData(0,0,800,600).data,q=b.getContext('2d')!.getImageData(0,0,800,600).data;let different=0;
    for(let i=0;i<p.length;i++)if(p[i]!==q[i])different++;records.push({frame,differingBytes:different});
  }return records;
}});
function Fixture(){
  const [paused,setPaused]=useState(false),[glossary,setGlossary]=useState<string|null>(null);
  const [requests,setRequests]=useState(0),[completions,setCompletions]=useState(0),[deny,setDeny]=useState(false);
  const [epoch,setEpoch]=useState(0),[seed,setSeed]=useState(0),[slotMode,setSlotMode]=useState('valid');
  const slotId='fixture-nms-l01-p044-readable-instruction';
  const es=(window as Window & {__P044_FIXTURE_LOCALE?:string}).__P044_FIXTURE_LOCALE==='es';
  const host=useMemo(()=>createMemoryOnlyLessonHost({releaseId:'p044-prepared-loader-fixture',releaseMemberIds:[ID],currentAnimationId:ID,
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
  return <main data-p044-isolated-fixture="true" data-prepared-loader="true" data-no-external-visual-ready-hold="true"
    data-not-my-lesson="true" data-not-registered="true" data-completions={completions} data-host-request-count={requests}
    style={{margin:'0 auto',maxWidth:900,padding:12}}>
    <h1>Prepared p044 module-loader fixture</h1><p>No external visual-ready pause. No registration, audio, original-runtime acceptance or publication.</p>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button data-fixture-pause="true" aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>Pause fixture</button>
      <button data-fixture-deny="true" aria-pressed={deny} onClick={()=>setDeny(p=>!p)}>Deny feedback in test</button>
      <label>Seed <select data-fixture-seed="true" value={seed} onChange={e=>{setSeed(Number(e.target.value));setEpoch(n=>n+1);setCompletions(0);}}>{[0,1,2,3].map(n=><option key={n}>{n}</option>)}</select></label>
      <label>Companion slot <select data-fixture-slot="true" value={slotMode} onChange={e=>setSlotMode(e.target.value)}>{['valid','unmarked','duplicate','missing'].map(mode=><option key={mode}>{mode}</option>)}</select></label>
    </div>
    <div className="lesson-shell2__learning-column">
      <AnimationRuntime key={epoch} animationId={ID} moduleKey={ID} query={{lang:'en',seed:String(seed)}} uiLanguage={es?'es':'en'}
        presentation="workbench" paused={paused||Boolean(glossary)} audioEnabled={false} pageInteractionCompanionTargetId={slotId}
        onLessonHostRequest={request} onPlaybackComplete={()=>setCompletions(n=>n+1)}
        labels={{replay:'Replay runtime',reduced:'Reduced motion candidate',prototype:'UNREGISTERED PREPARED P044',loading:'Loading candidate',unavailable:'Candidate unavailable'}}/>
      {slotMode!=='missing'?<div id={slotId} data-page-interaction-companion-host={slotMode==='unmarked'?undefined:'true'}/>:null}
      {slotMode==='duplicate'?<div id={slotId} data-page-interaction-companion-host="true"/>:null}
    </div>
    {entry?<section role="dialog" aria-modal="true" aria-label="Source glossary" data-p044-fixture-glossary="true" style={{position:'fixed',zIndex:1000,inset:'10% 8%',padding:24,background:'white',border:'3px solid #2459a9',overflow:'auto'}}>
      <h2>{entry.labels[es?'es':'en']}</h2><p>{entry.definitions[es?'es':'en']}</p><button data-fixture-glossary-close="true" onClick={()=>request({type:'close-glossary'})}>Close glossary</button>
    </section>:null}
  </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
