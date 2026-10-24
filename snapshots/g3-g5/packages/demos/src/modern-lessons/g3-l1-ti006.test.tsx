import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import type {RuntimeContext} from '../contract';
import {getCourseG03L01Ti006FrameState} from '../modules/course-g03-l01-ti-006';
import {G3_L1_TI006_CONFIG as config,G3_L1_TI006_COPY,G3_L1_TI006_TEXT_BINDING,G3_L1_TI006_TEXT_PRESENTATION,G3_L1_TI006_TERMS,G3L1Ti006QuestionContent,G3L1Ti006HelpContent} from './g3-l1-ti006';
import {chooseSixQuestionChoiceAnswer,createSixQuestionChoiceState,getSixQuestionChoiceSnapshot,getSixQuestionChoiceTeaching,getSixQuestionChoiceFeedback,synchronizeSixQuestionChoiceState,getSixQuestionChoiceActivityDefinitions} from './source-six-question-choice';
const context=(frame=79,seed=0):RuntimeContext=>({frame,seed,scenario:'source-static-frame',lang:'en',frameDomain:'sprite-315',rootFrame:6,replay:0});
const state=(c:RuntimeContext)=>getCourseG03L01Ti006FrameState(c.frame,c);
const source=JSON.parse(gunzipSync(readFileSync(new URL('../../../../catalog/typography-v1/source-catalog/assets/'+config.sourceSha256+'.json.gz',import.meta.url))).toString());

test('all maintained blocks resolve exact source runs or the read-only dynamic field',()=>{
 const ids=new Set(source.textDefinitions.flatMap((t:any)=>[t.sourceTextId,...(t.runs??[]).map((r:any)=>r.sourceTextId)]));
 for(const block of G3_L1_TI006_TEXT_BINDING.blocks){assert(block.sourceTextIds.length>0);for(const id of block.sourceTextIds)assert(ids.has(id),id);assert.equal(block.language,'en');assert(G3_L1_TI006_COPY[block.id]);}
 assert.equal(G3_L1_TI006_TEXT_BINDING.placementId,'g03-l01-placement-063');
});

test('each source hold exposes only its own authored question, answer values and admitted controls',()=>{
 for(const q of config.questions){const c=context(q.frame);const snapshot=getSixQuestionChoiceSnapshot(config,state(c),c);assert.equal(snapshot.status,'ready');const visible=snapshot.blocks.filter(b=>b.visible);assert.deepEqual(visible.filter(b=>b.role==='question').map(b=>b.text),[q.prompt]);assert.deepEqual(visible.filter(b=>b.role==='answer').map(b=>b.text),q.answers.map(a=>a.text));assert(!visible.some(b=>b.id.startsWith('help-')&&b.id!=='help-button'));assert(!visible.some(b=>b.role==='feedback'));}
 const before=context(9),s=getSixQuestionChoiceSnapshot(config,state(before),before);assert.deepEqual(s.blocks.filter(b=>b.visible).map(b=>b.id),['root-title']);
 const reveal=context(60),r=getSixQuestionChoiceSnapshot(config,state(reveal),reveal);assert.equal(r.blocks.find(b=>b.id==='instruction')?.text,'Click the');
});

test('G3 TI006 source title30 and exercise5 retain root identity, placement10..90, Help and Replay',()=>{
 const main=source.timelines.find((t:any)=>t.timelineId==='sprite-315'),root=source.timelines.find((t:any)=>t.timelineId==='root');
 assert.equal(root.events.find((e:any)=>e.characterId===31).name.text,'Mc_Page_Title');
 const title=source.textDefinitions.find((d:any)=>d.characterId===30),marker=source.textDefinitions.find((d:any)=>d.characterId===35);
 assert.equal(title.runs.map((r:any)=>r.text).join(''),'Place Value: Try It!');assert.equal(marker.runs.map((r:any)=>r.text).join(''),'5');
 const instance=main.instances.find((i:any)=>i.characterId===35);assert.deepEqual([instance.firstFrame,instance.lastFrameExclusive],[10,91]);
 assert.deepEqual(G3_L1_TI006_TEXT_BINDING.blocks.slice(0,2).map(b=>[b.id,b.sourceTextIds,b.sourceShapeIds??[]]),[['root-title',['character-30/run-0'],[]],['exercise-number',['character-35/run-0'],[33]]]);
 assert(!G3_L1_TI006_TEXT_BINDING.blocks.some(b=>b.sourceTextIds.includes('character-28/run-0')));
 const Renderer=G3_L1_TI006_TEXT_PRESENTATION.Renderer!;
 for(let frame=1;frame<=90;frame++){
  const c=context(frame),snapshot=getSixQuestionChoiceSnapshot(config,state(c),c),html=renderToStaticMarkup(<Renderer {...c} state={state(c)}/>),placed=frame>=instance.firstFrame&&frame<instance.lastFrameExclusive;
  assert.equal(snapshot.blocks.find(b=>b.id==='root-title')!.visible,true);assert.equal(snapshot.blocks.find(b=>b.id==='exercise-number')!.visible,placed,String(frame));
  assert.match(html,/<h2[^>]+data-lesson-text-block="root-title">Place Value: Try It!<\/h2>/);assert.equal((html.match(/data-lesson-text-block="exercise-number"/g)??[]).length,placed?1:0);
  if(placed)assert.match(html,/aria-label="Exercise 5" style="opacity:1">5<\/span>/);
 }
 assert.equal(getSixQuestionChoiceTeaching(config,91).exerciseNumberAlpha,0);
 const c=context(79),base=createSixQuestionChoiceState(),wrong=chooseSixQuestionChoiceAnswer(config,base,79,'choice-1')!,branch=config.feedback.find(f=>f.id===wrong.feedback!.id)!;
 const activity={id:branch.id,sourceInstanceId:branch.sourceInstanceId,frameDomain:`sprite-${branch.sprite}`,frame:22,revision:1,status:'completed' as const};
 for(const session of[base,{...base,help:true},wrong]){const snapshot=getSixQuestionChoiceSnapshot(config,state(c),c,session,[activity]);for(const id of['root-title','exercise-number'])assert.equal(snapshot.blocks.find(b=>b.id===id)!.visible,true,id);}
 const replay={...context(1),replay:1};assert.equal(getSixQuestionChoiceSnapshot(config,state(replay),replay,synchronizeSixQuestionChoiceState(wrong,replay)).blocks.find(b=>b.id==='exercise-number')!.visible,false);
 for(const bad of[{...c,rootFrame:1},{...c,frameDomain:'root'},{...c,lang:'es' as const},{...c,frame:91}]){assert.equal(getSixQuestionChoiceSnapshot(config,state(c),bad).status,'blocked');assert(!renderToStaticMarkup(<Renderer {...bad} state={state(c)}/>).includes('data-lesson-text-block="root-title"'));}
});

test('wrong answers can retry beyond two attempts without advancing or exposing another question',()=>{
 const q=config.questions[0];let session=createSixQuestionChoiceState();
 for(let n=0;n<7;n++){const selected=chooseSixQuestionChoiceAnswer(config,session,q.frame,q.answers.find(a=>!a.correct)!.id,n);assert(selected?.feedback);assert.equal(selected.pendingFromFrame,null);assert.equal(selected.attempts[0],n+1);assert.equal(selected.feedback.parentFrame,79);session={...selected,feedback:null};}
 assert.equal(session.attempts[0],7);assert.deepEqual(session.attempts.slice(1),[0,0,0,0,0]);
});

test('wrong popup and held feedback complete only through source-bound Close/outro, rejecting stale revisions',()=>{
 const session=chooseSixQuestionChoiceAnswer(config,createSixQuestionChoiceState(),79,'choice-1',4)!;
 const branch=config.feedback.find(f=>f.id===session.feedback!.id)!;
 const at=(frame:number,revision=5,id:string=branch.id)=>({id,sourceInstanceId:branch.sourceInstanceId,frameDomain:`sprite-${branch.sprite}`,frame,revision,status:'completed' as const});
 assert.equal(getSixQuestionChoiceFeedback(config,session,[at(22)]).popup,true);
 assert.equal(getSixQuestionChoiceFeedback(config,session,[at(22)]).complete,false);
 assert.equal(getSixQuestionChoiceFeedback(config,session,[at(22,4)]).bound,false);
 const outro={...session,feedback:{...session.feedback!,stage:'outro' as const,revisionFloor:5}};
 assert.equal(getSixQuestionChoiceFeedback(config,outro,[at(branch.endFrame,6,branch.id+'-outro')]).complete,true);
 assert.equal(getSixQuestionChoiceFeedback(config,outro,[at(branch.endFrame,5,branch.id+'-outro')]).complete,false);
 const definitions=getSixQuestionChoiceActivityDefinitions(config),definition=definitions.find(d=>d.id===branch.id+'-outro')!;assert.equal(definition.startFrame,23);assert.equal(definition.entryFromActivity?.lastFrame,22);assert.equal(definition.sourceInstanceId,branch.sourceInstanceId);
});

test('all exact source glossary targets are available in their native prompts or Help',()=>{
 const all=Object.values(G3_L1_TI006_TERMS).map(t=>t.entryId);assert.equal(new Set(all).size,5);assert.deepEqual(G3_L1_TI006_TEXT_PRESENTATION.keyTerms?.entryIds,all);
 const runtime={...context(),onLessonHostRequest:()=>undefined};
 const html=config.questions.map(question=>renderToStaticMarkup(<G3L1Ti006QuestionContent runtime={runtime} question={question}/>)).join('')+renderToStaticMarkup(<G3L1Ti006HelpContent runtime={runtime}/>);
 for(const id of all)assert(html.includes(id));assert(html.includes('50,000'));assert(html.includes('460'));assert(html.includes('46,789'));assert(!html.includes('<canvas'));assert(!html.includes('<img'));assert(!html.includes('<input'));
});

test('native rendering keeps source math and reset identities while rejecting foreign source and untranslated Spanish state',()=>{
 const c=context();const Renderer=G3_L1_TI006_TEXT_PRESENTATION.Renderer!;
 const html=renderToStaticMarkup(<Renderer {...c} state={state(c)} onLessonActivityRequest={()=>true}/>);assert(html.includes('35,103'));assert(html.includes('40,000'));assert(!/<(?:canvas|img|input|textarea)\b/.test(html));
 const selected=chooseSixQuestionChoiceAnswer(config,createSixQuestionChoiceState(),79,'choice-1')!;assert.deepEqual(synchronizeSixQuestionChoiceState(selected,{...c,replay:1}),createSixQuestionChoiceState(0,1));
 assert.equal(getSixQuestionChoiceSnapshot(config,{...state(c),sourceSwfSha256:'0'.repeat(64)},c).status,'blocked');
 const spanish={...c,lang:'es' as const};assert.equal(getSixQuestionChoiceSnapshot(config,state(spanish),spanish).status,'blocked');
});


test('the actual product loader admits all distinct source button generations and protected modern capability',async()=>{
 const {loadAnimationModuleForPresentation}=await import('../animation-registry');
 const loaded=await loadAnimationModuleForPresentation(config.animationId,{modernText:true});
 assert.equal(loaded?.textPresentation?.binding.placementId,'g03-l01-placement-063');
 const buttons=loaded!.textPresentation!.activityTimelines!.filter(a=>a.buttonPress);
 assert.equal(buttons.length,9);assert.equal(new Set(buttons.map(a=>a.sourceInstanceId)).size,9);
 for(let i=0;i<6;i++)assert(buttons[i].sourceInstanceId?.includes(`depth-30-generation-${i+1}`));
 assert(buttons.every(a=>a.sourceInstanceId?.endsWith('/record-10')));
});

// These composite diagrams hide visual arrow markup and must expose a legal named role.
test('Help number diagrams expose the deciding digit with a named graphic role',()=>{
 const runtime={...context(),onLessonHostRequest:()=>undefined};
 const dom=new JSDOM(renderToStaticMarkup(<G3L1Ti006HelpContent runtime={runtime}/>));
 const diagrams=[...dom.window.document.querySelectorAll('[data-lesson-text-block^="help-number-"]')];
 assert.equal(diagrams.length,2);
 for(const [i,node] of diagrams.entries()){
  assert.equal(node.getAttribute('role'),'img');
  assert.equal(node.getAttribute('aria-label'),`${i===0?'46,789':'456'}; the digit 6 determines rounding.`);
  assert.equal(node.getAttribute('tabindex'),'0');
  assert.equal(node.querySelector('.six-choice-modern__digit')?.textContent,'6↑');
  assert.equal(node.querySelector('[aria-hidden="true"]')?.textContent?.replace('↑',''),i===0?'46,789':'456');
  assert.equal(node.querySelectorAll('button,input,a').length,0);
 }
 dom.window.close();
});
