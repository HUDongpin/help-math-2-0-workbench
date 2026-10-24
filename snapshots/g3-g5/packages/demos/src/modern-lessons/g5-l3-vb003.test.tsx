import assert from 'node:assert/strict';import test from 'node:test';import {readFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {gunzipSync} from 'node:zlib';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {readTextSourceAsset} from '../../../../scripts/build-lesson-text-source-catalog-v1.mjs';
import {getCourseG05L03Vb003FrameState as legacy} from '../modules/course-g05-l03-vb-003';import type {RuntimeContext} from '../contract';
import {lessonTextActivityRequestAllowed} from '../lesson-text-frame-control';
import {G5_L3_VB003_SOURCE_DATA as SOURCE} from './g5-l3-vb003.source-data';
import {G5_L3_VB003_TEXT_BINDING as BINDING,G5_L3_VB003_ACTIVITY_TIMELINES as ACTIVITIES,G5_L3_VB003_KEY_TERMS,G5_L3_VB003_KEY_TERMS_CAPABILITY,G5L3Vb003ModernRenderer,createG5L3Vb003Interaction as initial,chooseG5L3Vb003Answer as choose,getG5L3Vb003FeedbackActivity as activityState,getG5L3Vb003TeachingState as teaching,getG5L3Vb003TextSnapshot as snapshot,synchronizeG5L3Vb003Interaction as sync} from './g5-l3-vb003';
const root=fileURLToPath(new URL('../../../../',import.meta.url)),hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const context=(frame=40,patch:Partial<RuntimeContext>={}):RuntimeContext=>({frame,frameDomain:'sprite-381',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,replay:0,...patch});
const source=(async()=>{const index=JSON.parse(await readFile(root+'catalog/typography-v1/source-catalog/index.json','utf8'));return readTextSourceAsset(root,index.assets.find((a:any)=>a.sourceSha256===BINDING.sourceSwfSha256));})();
test('all teaching text, including the real dynamic field, binds exact source identifiers',async()=>{
 const a=await source,ids=new Set(a.textDefinitions.flatMap((d:any)=>[d.sourceTextId,...(d.runs??[]).map((r:any)=>r.sourceTextId)]));
 for(const b of BINDING.blocks)for(const id of b.sourceTextIds)assert(ids.has(id),id);
 assert.equal(BINDING.placementId,'g05-l03-placement-006');assert.equal(a.summary.unresolvedRuns,0);
 assert.deepEqual(BINDING.blocks.find(b=>b.id==='wrong-exponent-explanation')!.sourceTextIds,['character-222']);
});
test('actual source alpha thresholds and emphasis spans retain blank and transition states',async()=>{
 const a=await source,t=a.timelines.find((t:any)=>t.timelineId==='sprite-381');
 for(const[id,first,last]of[[5,6,46],[10,2,95],[214,55,95]]){
  const i=t.instances.find((i:any)=>i.characterId===id),e=t.events.filter((e:any)=>e.instanceId===i.instanceId);
  const nonzero=e.find((e:any)=>(e.colorTransform?.multiply[3]??0)>0);assert.equal(nonzero.frame,first);
  const zero=e.find((e:any)=>e.frame>first&&e.colorTransform?.multiply[3]===0);assert.equal(zero?zero.frame-1:95,last);
 }
 assert(!teaching(1).expression);assert(teaching(2).expression);assert(!teaching(5).question1);assert(teaching(6).question1);assert(!teaching(47).question1);assert(!teaching(54).question2);assert(teaching(55).question2);
 assert.deepEqual(SOURCE.sourceBeats.baseEmphasis,t.instances.filter((i:any)=>i.characterId===12).map((i:any)=>[i.firstFrame,i.lastFrameExclusive-1]));
});
test('all 95 modern source states preserve exact old static guards instead of weakening them',()=>{
 for(let frame=1;frame<=95;frame++){const c=context(frame),old=legacy(frame,c);assert.equal(old.status,frame<40?'ready':'blocked');assert.equal(snapshot(old,c).status,'ready');}
 const c=context();for(const patch of[{status:'ready',blocker:null},{animationId:'another-page'},{exportFrame:99},{sourceHostBehaviorResolved:true},{naturalRuntimeEstablished:true},{audioRendered:true}])assert.equal(snapshot({...legacy(40,c),...patch} as any,c).status,'blocked');
});
test('unsupported language, domain, scenario, source capture and state identities fail closed',()=>{
 for(const patch of [{lang:'es'},{frameDomain:'root'},{scenario:'source-drawing-default'},{rootFrame:1},{frame:96},{frame:0},{frame:2.5},{entryStateSha256:'f'.repeat(64)}] as Partial<RuntimeContext>[]){const c=context(40,patch);assert.equal(snapshot(legacy(c.frame,c),c).status,'blocked',JSON.stringify(patch));}
 const c=context();assert.equal(snapshot({...legacy(40,c),sourceSwfSha256:'0'.repeat(64)},c).status,'blocked');assert.equal(snapshot({...legacy(40,c),seed:5},c).status,'blocked');
});
test('source wrong pools retry indefinitely and the seeded right pools have exactly four variants',()=>{
 for(const frame of[40,94]){const wrong=frame===40?3:5,right=frame===40?5:3;
  for(let seed=0;seed<4;seed++){const r=choose(initial(seed),frame,right)!;assert.equal(r.feedback!.id,`q${frame===40?1:2}-correct-${seed+1}`);assert.equal(choose(r,frame,right),null);}
  let state=initial();for(let attempt=0;attempt<8;attempt++){state=choose(state,frame,wrong)!;assert.equal(state.feedback!.id,`q${frame===40?1:2}-wrong-${attempt%3+1}`);state={...state,feedback:null};}assert.equal(state.pendingFromFrame,null);
 }
 assert.equal(choose(initial(),39,5),null);assert.equal(choose(initial(),95,3),null);
});
test('all wrong Close edges bind the viewed child revision and popup frame; intro hold is not terminal',()=>{
 for(const branch of SOURCE.feedback.filter(b=>b.kind==='wrong')){
  const frame=branch.question===1?40:94,value=branch.question===1?3:5,state=choose(initial(branch.variant-1),frame,value)!;
  const activity={id:branch.id,frameDomain:`sprite-${branch.sprite}`,frame:22,revision:1,status:'completed' as const};
  assert.equal(activityState(state,activity).popup,true);assert.equal(activityState(state,activity).complete,false);
  const request={id:branch.id+'-outro',parentFrame:frame,fromActivity:{id:branch.id,revision:1}};
  assert(lessonTextActivityRequestAllowed(ACTIVITIES,request,{frame,capture:false,activity}));
  assert.equal(lessonTextActivityRequestAllowed(ACTIVITIES,{...request,fromActivity:{id:branch.id,revision:0}},{frame,capture:false,activity}),undefined);
  assert.equal(lessonTextActivityRequestAllowed(ACTIVITIES,request,{frame,capture:false,activity:{...activity,frame:branch.popupFrames[0]![0]-1}}),undefined);
  const outro={...state,feedback:{...state.feedback!,stage:'outro' as const,revisionFloor:1}};
  assert.equal(activityState(outro,{...activity,id:request.id,frame:branch.endFrame,revision:2}).complete,true);
  assert.equal(activityState(outro,{...activity,id:request.id,frame:branch.endFrame,revision:1}).complete,false);
 }
});
test('first wrong is static rich mathematics and second wrong is a source-assigned dynamic value',async()=>{
 const a=await source,scripts=gunzipSync(await readFile(root+'migrations/course-g05-l03-vb-003/audit/machine/ffdec-scripts.txt.gz')).toString();
 assert(scripts.includes('_global.WrongFeed = "'+SOURCE.dynamicWrongFeedback+'";'));
 const popup=a.timelines.find((t:any)=>t.timelineId==='sprite-223');assert(popup.events.some((e:any)=>e.characterId===222&&e.name?.text==='txtFeed'));
 const first=a.timelines.find((t:any)=>t.timelineId==='sprite-38');assert(!first.events.some((e:any)=>e.name?.text==='txtFeed'));
 const expression=a.textDefinitions.find((d:any)=>d.characterId===26);assert.deepEqual(expression.runs.map((r:any)=>r.text),['In the expression 3','2',', 3 is the base and 2 is the ','exponent.  Try again.']);
});
test('Replay and page changes reject stale child feedback and reset repeated attempts',()=>{
 const state=choose(initial(3),40,3)!;assert.equal(sync(state,context(40,{replay:1})).feedback,null);assert.deepEqual(sync(state,context(1,{seed:3})).attempts,[0,0]);assert.equal(sync(state,context(94,{seed:3})).feedback,null);
 assert.equal(activityState(state,{id:state.feedback!.id,frameDomain:'sprite-999',frame:22,revision:8,status:'completed'}).bound,false);
});
test('native HTML preserves 5 raised to 3 with neutral answer names and no old drawing plane',()=>{
 const c=context(),html=renderToStaticMarkup(<G5L3Vb003ModernRenderer {...c}/>);assert(!/<canvas|<img|<svg/.test(html));assert(html.includes('aria-label="5 to the power of 3"'));assert(html.includes('aria-label="5"'));assert(html.includes('aria-label="3"'));assert(!html.includes(SOURCE.dynamicWrongFeedback));assert(!html.includes('In the expression 3'));assert(!html.includes('aria-label="base"'));
});
test('source glossary button ids and exact bilingual source entries remain distinct from missing page Spanish',async()=>{
 const bytes=await readFile(root+'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml');assert.equal(hash(bytes),G5_L3_VB003_KEY_TERMS_CAPABILITY.sourceSha256);
 const index=JSON.parse(await readFile(root+'apps/web/public/generated/g4-grade-wide-keyterms-en.json','utf8'));for(const [name,term]of Object.entries(G5_L3_VB003_KEY_TERMS)){const e=index.entries.find((e:any)=>e.id===term.entryId);assert.equal(e.titles.en,name);assert(e.definitions.en);assert(e.definitions.es);}
});
test('14 source MP3s bind source frame spans and decode evidence without invented speech',async()=>{
 const receipt=JSON.parse(await readFile(root+'work/typography-v1/g5-l3-vb003/feedback-audio.json','utf8'));assert.equal(receipt.assets.length,14);assert.equal(ACTIVITIES.length,20);for(const a of receipt.assets){assert.equal(hash(await readFile(root+a.path)),a.sha256);assert.equal(a.decodeToEofPassed,true);for(const d of ACTIVITIES.filter(d=>d.audio?.source===a.source)){assert.equal(d.audio!.firstFrame,a.firstFrame);assert.equal(d.audio!.lastFrame,a.lastFrame);}}assert.equal(receipt.audioAccepted,false);
});

test('main stream is independently bound to frames6..95 and does not replace associated narration',async()=>{
 const receipt=JSON.parse(await readFile(root+'work/typography-v1/g5-l3-vb003/main-audio.json','utf8'));
 assert.equal(receipt.cue.frame,6);assert.equal(receipt.cue.endFrame,96);assert.equal(receipt.sourceLastBlockFrame,95);assert.equal(receipt.decodeToEofPassed,true);
 assert.equal(hash(await readFile(root+receipt.path)),receipt.cue.sha256);assert.deepEqual(receipt.sourceMainStops,[40,94,95]);assert.equal(receipt.audioAccepted,false);
 const {G5_L3_VB003_TEXT_PRESENTATION}=await import('./g5-l3-vb003');assert.deepEqual(G5_L3_VB003_TEXT_PRESENTATION.sourceTimelineAudioCues,[receipt.cue]);
});


test('native title binds the onstage root outline and exact offstage companion wording across all95 states',async()=>{
 const a=await source,t=a.textDefinitions.find((d:any)=>d.characterId===2),shape=a.shapeDefinitions.find((d:any)=>d.characterId===3),rootTimeline=a.timelines.find((t:any)=>t.timelineId==='root');
 assert.equal(t.sourceTagSha256,'a1f19f768ba409d451e18144e468a69c8b71764c5d93cbaf3047255be9808465');
 assert.equal(shape.sourceTagSha256,'517ea058fe6ee2067044dd26383a509ca61eb50c7e9b4f78ecbdc59ee496e38f');
 assert.equal(t.runs[0].text,'Exponents and Prime Factorizations: Important Words ');assert.equal(SOURCE.rootTitle.text,t.runs[0].text.trimEnd());
 const i=rootTimeline.instances.find((i:any)=>i.characterId===3);assert.equal(i.instanceId,SOURCE.rootTitle.instanceId);assert.equal(i.firstFrame,6);assert.equal(i.lastFrameExclusive,11);
 const placement=rootTimeline.events.find((e:any)=>e.eventId===SOURCE.rootTitle.placementEventId);assert.equal(placement.sourceTagSha256,SOURCE.rootTitle.placementTagSha256);assert.deepEqual(placement.matrix,[1,0,0,1,0,0]);
 const title=BINDING.blocks[0];assert.equal(title.id,'root-title');assert.equal(title.role,'title');assert.equal(title.readingOrder,0);assert.deepEqual(title.sourceTextIds,['character-2/run-0']);assert.equal(BINDING.version,'g05-l03-placement-006-modern-text-v2');assert.equal(BINDING.blocks.length,22);
 for(let frame=1;frame<=95;frame++){const c=context(frame),s=snapshot(legacy(frame,c),c);assert.equal(s.status,'ready');assert.equal(s.blocks[0].text,SOURCE.rootTitle.text);assert.equal(s.blocks[0].visible,true);}
 const c=context(),html=renderToStaticMarkup(<G5L3Vb003ModernRenderer {...c}/>);assert(html.includes('<h2 class="vb003-modern__title" data-lesson-text-block="root-title">'+SOURCE.rootTitle.text+'</h2>'));assert(html.indexOf('data-lesson-text-block="root-title"')<html.indexOf('data-lesson-text-block="question-base"'));
 const wrong=choose(initial(),40,3)!,branch=SOURCE.feedback.find(b=>b.id===wrong.feedback!.id)!,popup=snapshot(legacy(40,c),c,wrong,{id:branch.id,frameDomain:`sprite-${branch.sprite}`,frame:22,revision:1,status:'completed'});assert(popup.blocks[0].visible);assert.equal(popup.blocks[0].text,SOURCE.rootTitle.text);
});
