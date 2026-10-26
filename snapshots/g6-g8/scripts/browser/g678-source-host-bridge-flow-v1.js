async page => {
 const plan=page.__g678HostCase;
 if(!plan||!['017','018'].includes(plan.page)||!['en','es'].includes(plan.locale))throw Error('explicit supported host case required');
 const {page:p,locale,part}=plan,id=`shared-alg001-l06-p${p}`,prefix=`p${p}`;
 const labels=locale==='es'?{play:'Reproducir animación',pause:'Pausar animación',replay:'Repetir',sa:'Audio en español',return:'Volver a la animación',close:'Cerrar glosario',previous:'← Anterior'}:
  {play:'Play animation',pause:'Pause animation',replay:'Replay',sa:'Spanish Audio',return:'Return to animation',close:'Close glossary',previous:'← Previous'};
 const assert=(value,message)=>{if(!value)throw Error(message);};
 const state=()=>page.evaluate(p=>{
  const node=document.querySelector(`[data-p${p}-player]`),native=document.querySelector(`[data-p${p}-native-text]`);
  return {dataset:{...node?.dataset},canvas:node?.querySelector('canvas')?.getAttribute('data-flash-frame'),
   focused:document.activeElement?.getAttribute('data-source-button-instance-id'),
   nativeOutsideCanvas:Boolean(native&&!node?.contains(native)),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
   resources:performance.getEntriesByType('resource').map(r=>r.name),audio:window.__G678_HOST_AUDIO?.events??[]};
 },p);
 const ready=()=>page.waitForFunction(p=>document.querySelector(`[data-p${p}-player]`)?.getAttribute(`data-p${p}-player-phase`)==='ready',p,{timeout:45000});
 const phase=(s)=>s.dataset[`${prefix}PlayerPhase`],frame=s=>Number(s.dataset[`${prefix}PlayerFrame`]);
 const sa=s=>s.dataset[`${prefix}SaPhase`],owner=s=>s.dataset[`${prefix}AudioOwner`];
 const waitFrame=n=>page.waitForFunction(({p,n})=>Number(document.querySelector(`[data-p${p}-player]`)?.getAttribute(`data-p${p}-player-frame`))>=n,{p,n},{timeout:30000});
 const button=name=>page.getByRole('button',{name,exact:true});
 if(part==='exercise') {
  if(!page.__g678HostObserver) {
   const host={events:[],errors:[]};page.__g678HostObserver=host;
   page.on('pageerror',error=>host.errors.push(String(error)));
   page.on('console',message=>{const text=message.text();if(text.startsWith('[G678_HOST_AUDIO]'))host.events.push(JSON.parse(text.slice(17)));});
   await page.addInitScript(()=>{
    const Native=window.AudioContext,events=[],documentId=crypto.randomUUID();let next=0;
    const record=(kind,detail={})=>{const row={kind,documentId,path:location.pathname,...detail};events.push(row);console.info('[G678_HOST_AUDIO]'+JSON.stringify(row));};
    window.__G678_HOST_AUDIO={events};
    window.AudioContext=class extends Native {
     constructor(...args){super(...args);const id=++next;record('created',{id});
      const make=this.createBufferSource.bind(this);this.createBufferSource=(...args)=>{
       const source=make(...args),start=source.start.bind(source),stop=source.stop.bind(source);
       source.start=(...args)=>{record('start',{id});return start(...args);};
       source.stop=(...args)=>{record('stop',{id});return stop(...args);};return source;
      };
      const close=this.close.bind(this);this.close=(...args)=>{const result=close(...args);result.then(()=>record('closed',{id}));return result;};
     }
    };
   });
  }
  await page.setViewportSize(locale==='es'?{width:390,height:844}:{width:1280,height:900});
  await page.emulateMedia({reducedMotion:locale==='es'?'reduce':'no-preference'});
  const response=await page.goto(`http://127.0.0.1:3331/${locale}/migration-status/g678-calibration/${id}/continuous-v1?mode=focus`,{waitUntil:'domcontentloaded',timeout:60000});
  assert(response.status()===200,'registered route response');await ready();
  await button(labels.play).waitFor();
  const cases=[];page.__g678HostCases=cases;
  const initial=await state();assert(frame(initial)===1&&sa(initial)==='idle','initial frame and SA hold');
  assert(!initial.audio.some(e=>e.kind==='start')&&!initial.resources.some(r=>r.includes('optional-spanish-audio')),'no automatic main or SA start');
  assert(initial.nativeOutsideCanvas,'source-native companion stays in the real host');
  const formal=await page.locator(`[data-p${p}-formal]`).getAttribute(`data-p${p}-formal`);
  assert(formal==='registered-local-current-js','formal registration');
  assert((await page.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'),'local noindex');
  cases.push({kind:'initial',status:response.status(),formal,locale,animationId:id,state:initial});
  await button(labels.play).click();await waitFrame(5);await button(labels.pause).click();
  const held=await state();await page.waitForTimeout(500);const paused=await state();
  assert(phase(paused)==='paused'&&frame(paused)===frame(held),'host Pause holds source cursor');
  cases.push({kind:'play-pause',held,paused});
  await button(labels.replay).click();await ready();
  const glossary=p==='017'?[['Equation','equation',11,0],['Function','function',20,0],['Sentence','sentence',54,0],['Rule','rule',68,0],['Output variable','output-variable',108,0],['Input variable','input-variable',173,0]]:
   [['Evaluate','evaluate',11,0],['Function','function',18,0],['Substitute','substitute',43,0],['Input variable','input-variable',65,0],['Result','result',102,0],['Evaluate','evaluate',324,1],['Function','function',333,1]];
  for(const [key,entryId,first,ordinal] of glossary) {
   await button(labels.play).click();await waitFrame(first);
   const trigger=page.locator(`[data-p${p}-glossary-key="${key}"]`).nth(ordinal);
   await trigger.waitFor();assert(await trigger.isEnabled(),`source glossary gate: ${key}`);
   const instance=await trigger.getAttribute('data-source-button-instance-id');
   await trigger.focus();await trigger.press('Enter');
   const dialog=page.locator(`[role="dialog"][data-glossary-entry-id="${entryId}"]`);
   await dialog.waitFor({state:'visible'});const opened=await state();
   await dialog.getByRole('button',{name:labels.close,exact:true}).click();await dialog.waitFor({state:'hidden'});
   const closed=await state();assert(phase(closed)==='paused'&&frame(closed)===frame(opened)&&closed.focused===instance,`glossary hold and focus: ${key}`);
   cases.push({kind:'glossary',key,entryId,ordinal,instance,opened,closed});
  }
  let release;const gate=new Promise(resolve=>release=resolve);let requested=false;
  const pattern=`**/${id}/optional-spanish-audio-v1?*`;
  await page.route(pattern,async route=>{requested=true;await gate;try{await route.continue();}catch{}});
  await button(labels.sa).click();
  await page.waitForFunction(p=>document.querySelector(`[data-p${p}-player]`)?.getAttribute(`data-p${p}-sa-phase`)==='loading',p);
  const loading=await state();await button(labels.replay).click();await ready();release();await page.unroute(pattern);
  await page.waitForTimeout(400);const reset=await state();assert(requested&&frame(reset)===1&&sa(reset)==='idle'&&owner(reset)==='main','Replay cancels delayed SA');
  cases.push({kind:'replay-cancels-delayed-sa',loading,reset});
  await button(labels.play).click();await waitFrame(5);await button(labels.sa).click();
  await page.waitForFunction(p=>document.querySelector(`[data-p${p}-player]`)?.getAttribute(`data-p${p}-sa-phase`)==='playing',p);
  const selected=await state();await page.waitForTimeout(400);const heldSa=await state();
  assert(frame(selected)===frame(heldSa)&&owner(heldSa)==='spanish','explicit SA holds main cursor');
  await button(labels.return).click();await page.waitForFunction(p=>document.querySelector(`[data-p${p}-player]`)?.getAttribute(`data-p${p}-player-phase`)==='playing'&&document.querySelector(`[data-p${p}-player]`)?.getAttribute(`data-p${p}-audio-owner`)==='main',p);
  cases.push({kind:'explicit-sa-return',selected,heldSa,returned:await state()});
  assert(page.__g678HostObserver.errors.length===0,'browser page errors');
  return {status:'exercise-passed',animationId:id,locale,cases,pageErrors:page.__g678HostObserver.errors};
 }
 assert(part==='finish'&&page.__g678HostCases,'exercise precedes natural completion');
 await page.waitForFunction(p=>document.querySelector(`[data-p${p}-player]`)?.getAttribute(`data-p${p}-player-phase`)==='timeline-ended',p,{timeout:70000});
 const ended=await state(),last=p==='017'?721:648;
 assert(frame(ended)===last&&ended.canvas===String(last),'natural visual and source audio tail completion');
 page.__g678HostCases.push({kind:'natural-final',state:ended});
 await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
 const reflow=await state();assert(reflow.scrollWidth<=reflow.width,'200 percent host reflow');
 page.__g678HostCases.push({kind:'reflow-200-percent',state:reflow});
 await page.screenshot({path:`${plan.output}/${id}-${locale}-final.png`,fullPage:true});
 await button(labels.replay).click();await ready();const replay=await state();assert(frame(replay)===1&&sa(replay)==='idle','Replay resets ended source and SA');
 page.__g678HostCases.push({kind:'replay-from-end',state:replay});
 await button(labels.sa).click();await page.waitForFunction(p=>document.querySelector(`[data-p${p}-player]`)?.getAttribute(`data-p${p}-sa-phase`)==='playing',p);
 const leaving=await state(),created=leaving.audio.filter(e=>e.kind==='created');
 await button(labels.previous).click();
 await page.waitForFunction(p=>!document.querySelector(`[data-p${p}-player]`),p,{timeout:45000});
 await page.waitForTimeout(500);
 const events=page.__g678HostObserver.events;
 assert(created.every(e=>events.some(c=>c.kind==='closed'&&c.id===e.id&&c.documentId===e.documentId)),'all departed AudioContexts close');
 assert(page.__g678HostObserver.errors.length===0,'browser page errors');
 page.__g678HostCases.push({kind:'previous-during-sa-cleans-up',leaving,closed:events.filter(e=>e.kind==='closed')});
 return {status:'host-flow-passed',animationId:id,locale,cases:page.__g678HostCases,pageErrors:page.__g678HostObserver.errors};
}
