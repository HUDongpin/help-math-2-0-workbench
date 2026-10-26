/** Exact P005 page adapter for the maintained collector. No product-state writes. */
import assert from 'node:assert/strict';
export const P005_ID='shared-nms002-l07-p005';
export const P005_SHA='52e001516750770e9e3f406d2f49bc1deecee438e4c37c1efae1080058c3fba4';
const sameRun=(a,b)=>a&&b&&a.identity.playerId===b.identity.playerId&&a.identity.leaseToken===b.identity.leaseToken&&a.identity.replay===b.identity.replay;
const sameFrame=(a,b)=>sameRun(a,b)&&a.source.frame===b.source.frame&&a.source.frameDomain===b.source.frameDomain&&a.source.tick===b.source.tick;
export function assertP005Parameters(parameters,contract) {
  assert.equal(parameters.animationId,P005_ID);assert.equal(contract.animationId,P005_ID);assert.equal(contract.source.sha256,P005_SHA);
  assert.equal(parameters.route,'/{locale}/migration-status/g678-course/nms002/7');
  assert.equal(parameters.surfaceSelector,`[data-hfr-page="${P005_ID}"] canvas`);
  assert.equal(parameters.ownerSelector,`[data-hfr-page="${P005_ID}"]`);
  assert.deepEqual(parameters.pageInteractions.map(c=>[c.entryId,c.buttonId]),[['comparison',38],['proportion',39]]);
  for(const c of parameters.pageInteractions) {
    assert.equal(c.selector,`${parameters.ownerSelector} button[data-hfr-source-button="${c.buttonId}"][data-hfr-glossary-entry="${c.entryId}"]`);
    assert(['en','es'].every(locale=>typeof c.definitions[locale]==='string'&&c.definitions[locale].length&&/^[a-f0-9]{64}$/.test(c.dictionarySource[locale].sha256)),'exact bilingual source definitions');
  }
  assert.equal(contract.terminal.frameDomain,'sprite-40');assert.equal(contract.terminal.frame,157);
  assert.equal(contract.terminal.initialState['source.frameDomain'],'root');assert.equal(contract.terminal.initialState['source.frame'],1);
  return parameters;
}

/** Serialized into the page after the ordinary actual-commit adapter. Only DOM
 * observations are added; source/render fields are the unchanged producer read. */
export function createP005RuntimeAdapter(base) {
  const id='shared-nms002-l07-p005',sha='52e001516750770e9e3f406d2f49bc1deecee438e4c37c1efae1080058c3fba4';
  return Object.freeze({...base,
    read() {
      const value=base.read();if(value?.status!=='ready')return value;
      const root=document.querySelector(`[data-hfr-page="${id}"]`);
      if(value.identity?.animationId!==id||value.identity?.sourceSha256!==sha||root?.getAttribute('data-hfr-source-sha256')!==sha)return {status:'unsupported'};
      const sentence=root.querySelector('[data-hfr-styled-sentence]'),dialog=document.querySelector('[role="dialog"][data-glossary-entry-id]');
      const focused=root.contains(document.activeElement)?document.activeElement?.closest('button[data-hfr-source-button]'):null;
      const rootFrame=root.getAttribute('data-hfr-root-frame');
      const technical=window.__g678TechnicalObserver?.records,html=window.__g678SourceVmHtmlMediaObserver?.records;
      const exact=row=>row.owner?.playerId===value.identity.playerId&&row.owner.leaseToken===value.identity.leaseToken&&row.owner.replay===value.identity.replay;
      const sourceHtmlMedia=html?.samples.findLast(exact)??null;
      const pendingSourceMediaControls=Array.isArray(technical?.contextOps)&&Array.isArray(html?.operations)
        ?technical.contextOps.filter(row=>exact(row)&&row.state==='pending').length+html.operations.filter(row=>exact(row)&&row.state==='pending').length:null;
      return {...value,dom:{...(value.dom??{}),documentHidden:document.hidden,contentLanguage:sentence?.getAttribute('lang')??null,
        rootFrame:rootFrame!==null&&/^\d+$/.test(rootFrame)?Number(rootFrame):null,
        sourceHtmlMedia:sourceHtmlMedia?structuredClone(sourceHtmlMedia):null,pendingSourceMediaControls,
        focusButtonId:focused?Number(focused.getAttribute('data-hfr-source-button')):null,
        glossary:{entryId:dialog?.getAttribute('data-glossary-entry-id')??null,
          sourceSha256:dialog?.getAttribute('data-source-sha256')??null,text:dialog?.innerText??null}}};
    },
  });
}

/** These are actual observed native states, not host Pause labels. */
export function p005AudioBoundaryReady(sample,cue,paused) {
  if(!sample||sample.dom?.pendingSourceMediaControls!==0||sample.host?.paused!==paused)return false;
  if(cue?.transport==='web-audio-buffer') {
    const contexts=sample.media?.contexts;
    return Array.isArray(contexts)&&contexts.length===1&&contexts[0].state===(paused?'suspended':'running')&&Number.isFinite(contexts[0].currentTime);
  }
  if(cue?.transport!=='html-media')return false;
  const row=sample.dom?.sourceHtmlMedia,state=row?.state;
  return row?.owner?.playerId===sample.identity.playerId&&row.owner.leaseToken===sample.identity.leaseToken&&row.owner.replay===sample.identity.replay&&
    sample.atMs>=row.atMs&&sample.atMs-row.atMs<=50&&state.currentSrc===cue.sourceUrl&&state.paused===paused&&state.ended===false&&
    state.seeking===false&&state.muted===false&&state.volume>0&&state.playbackRate===1&&state.defaultPlaybackRate===1&&state.readyState>=2&&Number.isFinite(state.currentTime);
}
export function p005AudioAdvanced(before,after,cue) {
  if(!sameRun(before,after)||!p005AudioBoundaryReady(after,cue,false))return false;
  if(cue.transport==='web-audio-buffer') {
    const a=before.media?.contexts,b=after.media?.contexts;
    return a?.length===1&&b?.length===1&&a[0].contextId===b[0].contextId&&b[0].currentTime>a[0].currentTime;
  }
  const a=before.dom?.sourceHtmlMedia,b=after.dom?.sourceHtmlMedia;
  return !!a&&!!b&&a.mediaElementId===b.mediaElementId&&b.state.currentTime>a.state.currentTime;
}

export function p005GlossaryIssues({control,locale,before,opened,held,closed,resumed}) {
  const issues=[];
  if(![before,opened,held,closed,resumed].every(s=>s?.identity?.animationId===P005_ID&&s.identity.sourceSha256===P005_SHA&&sameRun(before,s)))issues.push('exact-source-owner-changed');
  if(opened?.source?.frameDomain!=='sprite-40'||opened.source.frame<142||opened.source.frame>=157)issues.push('glossary-outside-source-resumable-window');
  if(opened?.dom?.glossary?.entryId!==control.entryId||opened.dom.glossary.sourceSha256!==control.dictionarySource[locale].sha256||!opened.dom.glossary.text?.includes(control.definitions[locale]))issues.push('source-glossary-content-mismatch');
  if(opened?.host?.paused!==true||held?.host?.paused!==true||!sameFrame(opened,held)||held.atMs-opened.atMs<250)issues.push('glossary-did-not-hold-source');
  if(closed?.dom?.glossary?.entryId!==null||closed?.host?.paused!==true||!sameFrame(held,closed))issues.push('close-did-not-preserve-source-hold');
  if(closed?.dom?.focusButtonId!==control.buttonId)issues.push('close-did-not-return-focus-to-real-trigger');
  if(resumed?.host?.paused!==false||resumed.source.tick<=closed.source.tick||resumed.source.frame<=closed.source.frame)issues.push('explicit-play-did-not-resume-source');
  return issues;
}

export function p005TerminalHeld(first,last) {
  return Boolean(sameRun(first,last)&&last.atMs-first.atMs>=350&&[first,last].every(s=>
    s.identity.animationId===P005_ID&&s.identity.sourceSha256===P005_SHA&&s.source.frameDomain==='sprite-40'&&s.source.frame===157&&
    s.dom.rootFrame===6&&s.dom.documentHidden===false&&s.host.paused===false&&s.source.errors.length===0&&s.source.missing.length===0)&&last.source.tick>first.source.tick);
}

export function p005CaptureGroups(parameters,contract,stateId) {
  const targets=contract.layout.targetIdsByState?.[stateId]??contract.layout.targetIds;
  assert(Array.isArray(targets)&&targets.length&&new Set(targets).size===targets.length,'exact state targets');
  const groups=(contract.layout.simultaneousGroups?.[stateId]??[]).map(group=>{
    assert(Array.isArray(group)&&group.length&&new Set(group).size===group.length&&group.every(id=>targets.includes(id)),'simultaneous group stays within exact state targets');
    return [...group];
  });
  const included=new Set(groups.flat());for(const id of targets)if(!included.has(id))groups.push([id]);
  return groups.map(ids=>{
    assert(ids.every(id=>typeof parameters.layoutTargets[id]==='string'&&parameters.layoutTargets[id]),'actual selectors for every target');
    return {targetIds:ids,selector:parameters.layoutTargets[ids[0]],scope:ids[0]==='stage'?'stage':'target',targetId:ids[0]};
  });
}

/** An image of the first group target must contain every actually measured
 * member. DOM containment alone does not prove that the image covers overflow. */
export function p005GroupImageCoverage(group,observation) {
  const rows=observation.layout.targets,image=rows.find(row=>row.id===group.targetId)?.rect;
  const valid=r=>r&&['left','top','right','bottom','width','height'].every(k=>Number.isFinite(r[k]))&&r.width>0&&r.height>0;
  const missingTargetIds=group.targetIds.filter(id=>rows.filter(row=>row.id===id).length!==1);
  const outsideImageTargetIds=group.targetIds.filter(id=>{
    const r=rows.find(row=>row.id===id)?.rect;
    return !valid(image)||!valid(r)||r.left<image.left-1||r.top<image.top-1||r.right>image.right+1||r.bottom>image.bottom+1;
  });
  return {targetIds:group.targetIds,imageTargetId:group.targetId,imageRect:image??null,missingTargetIds,outsideImageTargetIds,
    complete:missingTargetIds.length===0&&outsideImageTargetIds.length===0};
}

/** Read only the actual destination producer. The P005 observer stays scoped
 * to P005 and is never repointed to manufacture a destination sample. */
export function readP005Destination({animationId,sourceSha256}) {
  const root=document.querySelector(`[data-hfr-page="${animationId}"]`),surface=root?.querySelector('canvas');
  const observed=typeof surface?.__g678TechnicalRead==='function'?surface.__g678TechnicalRead():null;
  if(document.querySelector('[data-current-animation-id]')?.getAttribute('data-current-animation-id')!==animationId||
    root?.getAttribute('data-hfr-source-sha256')!==sourceSha256||observed?.status!=='ready'||
    observed.identity.animationId!==animationId||observed.identity.sourceSha256!==sourceSha256||observed.render?.status!=='ready'||
    observed.source?.frameDomain==='root'||!(observed.source?.frame>=3)||observed.source.errors.length||observed.source.missing.length)return null;
  return {atMs:performance.now(),animationId,observation:observed};
}
