import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {G4_L1_TI006_CONFIG as CONFIG, G4_L1_TI006_TEXT_BINDING as BINDING, G4_L1_TI006_TEXT_PRESENTATION as CAPABILITY, G4_L1_TI006_KEY_TERMS, G4_L1_TI006_BUTTON_ACTIVITIES} from './g4-l1-ti006';
import {G4_L1_TI006_SOURCE_DATA as SOURCE} from './generated/g4-l1-ti006-source-v1';
import {chooseSixQuestionChoiceAnswer, createSixQuestionChoiceState, getSixQuestionChoiceFeedback, getSixQuestionChoiceSnapshot, getSixQuestionChoiceTeaching, synchronizeSixQuestionChoiceState} from './source-six-question-choice';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
const root = new URL('../../../../',import.meta.url), hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const context=(frame:number,seed=0,replay=0)=>({frame,frameDomain:SOURCE.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed,replay});
const snapshot=(frame:number)=>getSixQuestionChoiceSnapshot(CONFIG,CONFIG.getFrameState(frame,context(frame)),context(frame));
test('G4 TI006 source title30 and exercise5 retain root identity, placement10..90, Help and Replay',async()=>{
 const asset=JSON.parse(gunzipSync(await readFile(new URL(`catalog/typography-v1/source-catalog/assets/${SOURCE.sourceSha256}.json.gz`,root))).toString());
 const main=asset.timelines.find((t:any)=>t.timelineId==='sprite-209'),rootTimeline=asset.timelines.find((t:any)=>t.timelineId==='root');
 assert.equal(rootTimeline.events.find((e:any)=>e.characterId===31).name.text,'Mc_Page_Title');
 assert.equal(asset.textDefinitions.find((d:any)=>d.characterId===30).runs.map((r:any)=>r.text).join(''),'Place Value: Try It!');
 assert.equal(asset.textDefinitions.find((d:any)=>d.characterId===34).runs.map((r:any)=>r.text).join(''),'5');
 const instance=main.instances.find((i:any)=>i.characterId===34);assert.deepEqual([instance.firstFrame,instance.lastFrameExclusive],[10,91]);
 assert.deepEqual(BINDING.blocks.slice(0,2).map(b=>[b.id,b.sourceTextIds,b.sourceShapeIds??[]]),[['root-title',['character-30/run-0'],[]],['exercise-number',['character-34/run-0'],[33]]]);
 assert(!BINDING.blocks.some(b=>b.sourceTextIds.includes('character-28/run-0')));
 const Renderer=CAPABILITY.Renderer!;
 for(let frame=1;frame<=90;frame++){
  const c=context(frame),view=snapshot(frame),html=renderToStaticMarkup(<Renderer {...c} state={CONFIG.getFrameState(frame,c)}/>),placed=frame>=instance.firstFrame&&frame<instance.lastFrameExclusive;
  assert.equal(view.blocks.find(b=>b.id==='root-title')!.visible,true);assert.equal(view.blocks.find(b=>b.id==='exercise-number')!.visible,placed,String(frame));
  assert.match(html,/<h2[^>]+data-lesson-text-block="root-title">Place Value: Try It!<\/h2>/);assert.equal((html.match(/data-lesson-text-block="exercise-number"/g)??[]).length,placed?1:0);
  if(placed)assert.match(html,/aria-label="Exercise 5" style="opacity:1">5<\/span>/);
 }
 assert.equal(getSixQuestionChoiceTeaching(CONFIG,91).exerciseNumberAlpha,0);
 const c=context(79),base=createSixQuestionChoiceState(),wrong=chooseSixQuestionChoiceAnswer(CONFIG,base,79,'choice-1')!,branch=SOURCE.feedback.find(f=>f.id===wrong.feedback!.id)!;
 const activity={id:branch.id,sourceInstanceId:branch.sourceInstanceId,frameDomain:`sprite-${branch.sprite}`,frame:22,revision:1,status:'completed' as const};
 for(const session of[base,{...base,help:true},wrong]){const view=getSixQuestionChoiceSnapshot(CONFIG,CONFIG.getFrameState(79,c),c,session,[activity]);for(const id of['root-title','exercise-number'])assert.equal(view.blocks.find(b=>b.id===id)!.visible,true,id);}
 const replay=context(1,0,1);assert.equal(getSixQuestionChoiceSnapshot(CONFIG,CONFIG.getFrameState(1,replay),replay,synchronizeSixQuestionChoiceState(wrong,replay)).blocks.find(b=>b.id==='exercise-number')!.visible,false);
 for(const bad of[{...c,rootFrame:1},{...c,frameDomain:'root'},{...c,lang:'es' as const},{...c,frame:91}]){assert.equal(getSixQuestionChoiceSnapshot(CONFIG,CONFIG.getFrameState(79,c),bad).status,'blocked');assert(!renderToStaticMarkup(<Renderer {...bad} state={CONFIG.getFrameState(79,c)}/>).includes('data-lesson-text-block="root-title"'));}
});
test('G4 TI006 binds the actual source SWF, paired FLA, static data and every source text role',async()=>{
  const source=await readFile(new URL('source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/TI/L1TI06.swf',root));assert.equal(hash(source),SOURCE.sourceSha256);
  const evidence=JSON.parse(await readFile(new URL('work/typography-v1/g4-l1-ti006/source-evidence.json',root),'utf8'));
  assert.equal(hash(await readFile(new URL(evidence.fla.path,root))),evidence.fla.sha256);assert.equal(evidence.fla.entries.length,74);
  assert.equal(hash(await readFile(new URL(evidence.generated.path,root))),evidence.generated.sha256);
  const ids=new Set<string>(SOURCE.sourceText.flatMap(d=>[d.id,...d.runs.map(r=>r.id)]));for(const block of BINDING.blocks)for(const id of block.sourceTextIds)assert(ids.has(id),id);
  const dynamic=SOURCE.sourceText.filter(d=>d.kind==='dynamic-field');assert.equal(dynamic.length,1);assert.equal(dynamic[0].characterId,56);assert.equal(dynamic[0].readOnly,true);
});
test('all six exact source questions retain authored answer order and mathematically correct source button positions',()=>{
  assert.deepEqual(SOURCE.questions.map(q=>q.frame),[79,81,83,85,87,89]);
  assert.deepEqual(SOURCE.questions.map(q=>q.answers.find(a=>a.correct)!.text),['940,000','400,000','92,340','1,000,000','3','40.3']);
  assert.deepEqual(SOURCE.questions.map(q=>q.answers.findIndex(a=>a.correct)),[2,2,2,0,2,1]);
  for(const q of SOURCE.questions){assert.equal(q.answers.length,3);const input=Number(q.prompt.match(/[\d][\d,.]*/)?.[0].replaceAll(',',''));const result=Number(q.answers.find(a=>a.correct)!.text.replaceAll(',',''));assert(Math.abs(Math.round(input/q.roundUnit)*q.roundUnit-result)<1e-8);assert.equal(q.answers.find(a=>a.correct)!.sourceButton,46);}
});
test('source instruction word endpoints and question changes remain queryable at all 90 real main frames',()=>{
  assert.deepEqual(SOURCE.instructionFrames,[{frame:1,text:''},{frame:47,text:'Click'},{frame:52,text:'Click the'},{frame:58,text:'Click the correct'},{frame:65,text:'Click the correct answer.'}]);
  for(let frame=1;frame<=90;frame++){const view=snapshot(frame);assert.equal(view.status,'ready',String(frame));const q=SOURCE.questions.find(q=>frame>=q.firstFrame&&frame<q.lastFrameExclusive);assert.deepEqual(view.blocks.filter(b=>b.role==='question'&&b.visible).map(b=>b.text),q?[q.prompt]:[]);assert.equal(view.blocks.filter(b=>b.role==='answer'&&b.visible).length,q?3:0);assert(!view.blocks.some(b=>b.id.startsWith('help-example')&&b.visible));}
});
test('six questions and source 3/4 pools admit one placed feedback each; wrong answers never force advancement',()=>{
  for(const q of SOURCE.questions)for(const a of q.answers)for(let seed=0;seed<12;seed++){
    const state=createSixQuestionChoiceState(seed),next=chooseSixQuestionChoiceAnswer(CONFIG,state,q.frame,a.id)!;assert(next.feedback);const branch=SOURCE.feedback.find(b=>b.id===next.feedback!.id)!;assert.equal(branch.kind,a.correct?'correct':'wrong');assert.equal(next.feedback.parentFrame,q.frame);assert.equal(next.attempts.reduce((a,b)=>a+b,0),1);
    assert.equal(chooseSixQuestionChoiceAnswer(CONFIG,next,q.frame,a.id),null);
    for(const outside of [1,q.frame-1,90])assert.equal(chooseSixQuestionChoiceAnswer(CONFIG,state,outside,a.id),null);
  }
  const q=SOURCE.questions[0],wrong=q.answers.find(a=>!a.correct)!;let state=createSixQuestionChoiceState(0);for(let attempt=0;attempt<12;attempt++){const next=chooseSixQuestionChoiceAnswer(CONFIG,state,q.frame,wrong.id)!;assert.equal(next.feedback!.parentFrame,79);state={...next,feedback:null};}assert.equal(state.attempts[0],12);assert.equal(state.pendingFromFrame,null);
});
test('wrong feedback waits at its source22 gate and rejects mismatched instance or stale Close revision',()=>{
  for(const branch of SOURCE.feedback){const q=SOURCE.questions[0],choice=q.answers.find(a=>a.correct===(branch.kind==='correct'))!;const state=chooseSixQuestionChoiceAnswer(CONFIG,createSixQuestionChoiceState(branch.variant-1),79,choice.id,5)!;
    assert.equal(state.feedback!.id,branch.id);
    const active:LessonTextActivitySnapshot={id:branch.id,sourceInstanceId:branch.sourceInstanceId,frameDomain:`sprite-${branch.sprite}`,revision:6,frame:branch.kind==='wrong'?22:branch.endFrame,status:'completed'};
    const good=getSixQuestionChoiceFeedback(CONFIG,state,[active]);assert.equal(good.bound,true);assert.equal(good.complete,branch.kind==='correct');
    assert.equal(getSixQuestionChoiceFeedback(CONFIG,state,[{...active,revision:5}]).bound,false);assert.equal(getSixQuestionChoiceFeedback(CONFIG,state,[{...active,sourceInstanceId:'another-placed-child'}]).bound,false);
    if(branch.kind==='wrong'){assert.equal(good.popup,true);const resumed={...state,feedback:{...state.feedback!,stage:'outro' as const,revisionFloor:6}};const outro={...active,id:branch.id+'-outro',revision:7,frame:branch.endFrame};assert.equal(getSixQuestionChoiceFeedback(CONFIG,resumed,[outro]).complete,true);assert.equal(getSixQuestionChoiceFeedback(CONFIG,resumed,[active]).bound,false);}
  }
});
test('Replay clears the full state; source parent changes cannot retain a child popup',()=>{
  const s=chooseSixQuestionChoiceAnswer(CONFIG,createSixQuestionChoiceState(2),79,'choice-1')!;assert.deepEqual(synchronizeSixQuestionChoiceState({...s,help:true},context(1,2,1)),createSixQuestionChoiceState(2,1));
  assert.equal(synchronizeSixQuestionChoiceState(s,context(81,2)).feedback,null);
});
test('Help uses source examples, exact glossary IDs and drawn glyph206 upward indicators',async()=>{
  const state={...createSixQuestionChoiceState(),help:true};const view=getSixQuestionChoiceSnapshot(CONFIG,CONFIG.getFrameState(79,context(79)),context(79),state);
  assert(view.blocks.filter(b=>CONFIG.helpBlockIds.includes(b.id)).every(b=>b.visible));assert(!view.blocks.some(b=>b.id.startsWith('question-')&&b.visible));
  assert.equal(view.blocks.find(b=>b.id==='help-example1-answer')!.text,'123,000,000');assert.match(view.blocks.find(b=>b.id==='help-example2-explanation')!.text,/4\.6$/);
  const index=JSON.parse(await readFile(new URL('apps/web/public/generated/g4-grade-wide-keyterms-en.json',root),'utf8'));for(const[name,binding]of Object.entries(G4_L1_TI006_KEY_TERMS))assert.equal(index.entries.find((e:{id:string})=>e.id===binding.entryId).titles.en,name);
  const evidence=JSON.parse(await readFile(new URL('work/typography-v1/g4-l1-ti006/source-evidence.json',root),'utf8'));assert.match(evidence.sourceGeometry.sourceCode206Glyph,/map="206"/);assert.match(evidence.sourceGeometry.sourceCode206Glyph,/x="99" y="-174"/);
});
test('all ten audio assets remain bound to exact source streams and Close has true down-state activities',async()=>{
  for(const audio of SOURCE.audio)assert.equal(hash(await readFile(new URL(audio.path,root))),audio.sha256);
  assert.equal(SOURCE.audio.length,10);assert.equal(G4_L1_TI006_BUTTON_ACTIVITIES.length,9);assert(G4_L1_TI006_BUTTON_ACTIVITIES.every(d=>d.startFrame===1&&d.endFrame===5&&d.buttonPress&&d.sourceInstanceId?.endsWith('/record-10')));
  assert.deepEqual(CAPABILITY.frameControl!.transitions.map(e=>e.stopFrame),[81,83,85,87,89,90]);
  assert.equal(CAPABILITY.sourceTimelineAudioCues![0].frame,7);assert.equal(CAPABILITY.sourceTimelineAudioCues![0].endFrame,87);
});
test('snapshot rejects source, unsupported context and unbound authoring assumptions',()=>{
  const c=context(79),state=CONFIG.getFrameState(79,c);for(const altered of [{...c,lang:'es' as const},{...c,frame:91},{...c,entryStateSha256:'a'.repeat(64)},{...c,rootFrame:5},{...c,frameDomain:'root'},{...c,scenario:'invented'}])assert.equal(getSixQuestionChoiceSnapshot(CONFIG,state,altered).status,'blocked');assert.equal(getSixQuestionChoiceSnapshot(CONFIG,{...state,sourceSwfSha256:'a'.repeat(64)},c).status,'blocked');
});
test('the default modern renderer emits semantic answer buttons and no old Canvas layer',()=>{
  const Renderer=CAPABILITY.Renderer!,markup=renderToStaticMarkup(<Renderer {...context(79)} state={CONFIG.getFrameState(79,context(79))}/>);assert.equal((markup.match(/class="six-choice-modern__answer"/g)??[]).length,3);assert(!markup.includes('<canvas'));assert(markup.includes('936,103'));assert(!markup.includes('123,000,000'));assert(!markup.includes('setTimeout'));
});
test('same-lesson source host is an unmodified 3/4 pool adapter without an invented attempt threshold',async()=>{
  const source=gunzipSync(await readFile(new URL('migrations/shell-course-g04-l01-index-local/audit/machine/ffdec-scripts.txt.gz',root))).toString();const from=source.indexOf('function showWrongFeed()'),to=source.indexOf('\nfunction ',from+1),fn=source.slice(from,to);assert.match(fn,/random\(3\)/);assert(!fn.includes('quizTryCount'));assert(!fn.includes('_parent.play'));
});

test('actual modern product loader accepts every source instance lifetime and button path',async()=>{
  const {loadAnimationModuleForPresentation}=await import('../animation-registry');const module=await loadAnimationModuleForPresentation(SOURCE.animationId,{modernText:true});assert(module?.textPresentation);assert.equal(module.textPresentation.activityTimelines?.length,19);
  const help=G4_L1_TI006_BUTTON_ACTIVITIES.filter(d=>d.id.startsWith('help-close'));assert.equal(new Set(help.map(d=>d.sourceInstanceId)).size,6);for(const [index,d]of help.entries()){assert(d.sourceInstanceId?.includes(`depth-25-generation-${index+1}`));assert.equal(d.parentLifetime?.firstFrame,79+index*2);}
});

test('G4 TI006 four Help numeric diagrams expose their existing deciding-digit labels',()=>{
  const Help=CONFIG.HelpContent;
  const runtime={...context(79),frame:79,onLessonHostRequest:()=>undefined};
  const dom=new JSDOM(renderToStaticMarkup(<Help runtime={runtime}/>));
  try{
    const diagrams=[...dom.window.document.querySelectorAll('.six-choice-modern__number')];
    assert.equal(diagrams.length,4);
    const expected=[
      {id:'help-example1-number',label:'123,456,789. Round at 3 in the millions place and inspect the next digit, 4.',number:'123,456,789',digit:'4↑'},
      {id:'help-example1-check',label:'123,456,789. Inspect the digit 4.',number:'123,456,789',digit:'4↑'},
      {id:'help-example2-number',label:'4.56. Inspect the digit 6.',number:'4.56',digit:'6↑'},
      {id:'help-example2-check',label:'4.56. Inspect the digit 6.',number:'4.56',digit:'6↑'},
    ];
    for(const [index,node] of diagrams.entries()){
      const item=expected[index];
      assert.equal(node.getAttribute('data-lesson-text-block'),item.id);
      assert.equal(node.getAttribute('role'),'img',item.id);
      assert.equal(node.getAttribute('aria-label'),item.label);
      assert.equal(node.getAttribute('tabindex'),'0');
      assert.equal(node.querySelector('.six-choice-modern__digit')?.textContent,item.digit);
      assert.equal(node.textContent?.replace('↑',''),item.number);
      assert.equal(node.querySelectorAll('button,input,a').length,0);
    }
    // One source numeric value must remain one DOM token; actual narrow-width
    // no-wrap/scroll reachability still requires the current browser probe.
    const sourceAnswer=SOURCE.helpRuns[19].text.trim();assert.equal(sourceAnswer,'123,000,000');
    const answer=dom.window.document.querySelector('[data-lesson-text-block="help-example1-answer"]');assert(answer);
    assert.equal(answer.textContent,sourceAnswer);assert.equal(answer.querySelectorAll('.six-choice-modern__numeric-token').length,1);
    const token=answer.querySelector('.six-choice-modern__numeric-token');assert(token);
    assert.equal(token.textContent,sourceAnswer);assert.equal(token.childNodes.length,1);assert.equal(token.firstChild?.nodeType,dom.window.Node.TEXT_NODE);
    assert.equal(answer.querySelectorAll('br,button,input,a').length,0);
  }finally{dom.window.close();}
});
