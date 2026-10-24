import assert from'node:assert/strict';import test from'node:test';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';import{gunzipSync}from'node:zlib';import{renderToStaticMarkup}from'react-dom/server';import{createElement}from'react';
import{G4_L4_TI003_SOURCE_DATA as SOURCE}from'./generated/g4-l4-ti003-source-v1';import{TI003_QUESTIONS,createTi003Practice,reduceTi003Practice,drawTi003Question,ti003PlaceDigits,getTi003Prelude}from'./g4-l4-ti003-state';import{TI003_BINDING,TI003_DECIMAL_POINT_INSTANCES,TI003_ACTIVITIES,G4L4Ti003ModernRenderer,G4_L4_TI003_TEXT_PRESENTATION,getTi003TextSnapshot}from'./g4-l4-ti003';import{getCourseG04L04Ti003FrameState}from'../modules/course-g04-l04-ti-003';import{validateLessonTextActivities,validateLessonTextFrameControl}from'../lesson-text-frame-control';
const root=new URL('../../../../',import.meta.url);const context=(frame:number)=>({frame,frameDomain:'sprite-341',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:3,replay:0});
const bytes=await readFile(new URL('catalog/typography-v1/source-catalog/assets/'+SOURCE.sourceSha256+'.json.gz',root)),source=JSON.parse(gunzipSync(bytes).toString()),main=source.timelines.find((t:any)=>t.timelineId==='sprite-341');
test('all eleven answers and editable fields agree with exact source labels and arithmetic',()=>{
 for(const q of TI003_QUESTIONS){const field=source.textDefinitions.find((t:any)=>t.characterId===q.inputCharacter);assert.equal(field.flags.readOnly,false);assert.equal(field.kind,'dynamic-field');const named=main.events.find((e:any)=>e.frame===q.frame&&e.name?.text==='Answertxt');assert.equal(named.characterId,q.inputCharacter);assert.equal(main.events.find((e:any)=>e.kind==='frame-label'&&e.label.text===q.id).frame,q.frame);
 const a=Number(q.left.replaceAll(',','')),b=Number(q.right.replaceAll(',',''));assert.ok(Math.abs(a+(q.operator==='+'?b:-b)-Number(q.answer.replaceAll(',','')))<1e-8);}
});
test('source array order and punctuation are recovered unchanged',async()=>{
 const script=gunzipSync(await readFile(new URL('migrations/course-g04-l04-ti-003/audit/machine/ffdec-scripts.txt.gz',root))).toString();
 const match=script.match(/_loc1_\.AnswerArray = \[(.*?)\]/s);assert.ok(match);const values=JSON.parse('['+match[1]+']');assert.deepEqual(values,TI003_QUESTIONS.map(q=>q.answer+'~'+q.answer));
 assert.match(script,/if\(Answertxt.text == TempSplt\[i\]\)/);assert.match(script,/quizLabelArray\.splice\(tempRand,1\)/);
});
test('every question can be answered, does not repeat within a bag, and source refill continues without a fake terminal',()=>{
 for(const seed of [0,1,42,0xffffffff]){let state=createTi003Practice(seed),seen=new Set<number>();for(let n=0;n<11;n++){state=drawTi003Question(state);assert.equal(state.mode,'answering');assert.ok(!seen.has(state.current!));seen.add(state.current!);const q=TI003_QUESTIONS[state.current!]!;state=reduceTi003Practice(state,{type:'type',value:q.answer});state=reduceTi003Practice(state,{type:'submit'});assert.equal(state.mode,'correct');}assert.equal(seen.size,11);assert.equal(state.bag.length,0);state=drawTi003Question(state);assert.equal(state.mode,'answering');assert.equal(state.draws,12);assert.equal(state.bag.length,10);assert.deepEqual(drawTi003Question(createTi003Practice(seed)),drawTi003Question(createTi003Practice(seed)));}
});
test('answer format, empty submit, locking, early Close, help and Replay preserve source input rules',()=>{
 let state={...createTi003Practice(7),current:0,mode:'answering' as const};
 for(const invalid of ['','7200',' 7,200','7,200 ','7,200.00']){let wrong=reduceTi003Practice(state,{type:'type',value:invalid});wrong=reduceTi003Practice(wrong,{type:'submit'});assert.equal(wrong.mode,'wrong');assert.equal(reduceTi003Practice(wrong,{type:'new-problem'}),wrong);assert.equal(reduceTi003Practice(wrong,{type:'type',value:'7,200'}),wrong);wrong=reduceTi003Practice(wrong,{type:'close-wrong'});assert.equal(wrong.current,0);assert.equal(wrong.answer,'');assert.equal(wrong.mode,'answering');}
 let help=reduceTi003Practice(state,{type:'open-help'});assert.equal(help.help,true);assert.equal(reduceTi003Practice(help,{type:'submit'}),help);assert.equal(reduceTi003Practice(help,{type:'close-help'}).current,0);
 assert.equal(reduceTi003Practice({...state,current:10},{type:'open-help'}).help,false,'Source Help sprite removed at Q11');
 let correct=reduceTi003Practice({...state,answer:'7,200'},{type:'submit'});assert.equal(correct.mode,'correct');assert.equal(reduceTi003Practice(correct,{type:'open-help'}),correct);assert.deepEqual(reduceTi003Practice(correct,{type:'reset',seed:7}),createTi003Practice(7));
});
test('source prelude preserves complete-word masks, answer typing and the graph reveal at214',()=>{
 assert.equal(getTi003Prelude(81).instruction,'');assert.equal(getTi003Prelude(82).instruction,'Click');assert.equal(getTi003Prelude(88).instruction,'Click New Problem.');assert.equal(getTi003Prelude(181).answer,'');assert.equal(getTi003Prelude(182).answer,'5');assert.equal(getTi003Prelude(185).answer,'56');assert.equal(getTi003Prelude(188).answer,'568');assert.equal(getTi003Prelude(191).answer,'5,680');assert.equal(getTi003Prelude(213).blocks,false);assert.equal(getTi003Prelude(214).blocks,true);assert.equal(main.instances.find((i:any)=>i.characterId===89).firstFrame,214);assert.match(getTi003Prelude(328).instruction,/New Problem again\.$/);
});
test('whole native text binds only real source definitions and all audio remains byte bound',async()=>{
 const ids=new Set(source.textDefinitions.map((d:any)=>d.sourceTextId));for(const block of TI003_BINDING.blocks)for(const id of block.sourceTextIds)assert.ok(ids.has(id),id);
 for(const audio of SOURCE.audio){const bytes=await readFile(new URL('apps/web/public'+audio.source,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),audio.sha256);}
 validateLessonTextFrameControl(G4_L4_TI003_TEXT_PRESENTATION.frameControl!,393);validateLessonTextActivities(TI003_ACTIVITIES,393,12);
 const wrong=main.instances.find((i:any)=>i.characterId===140);assert.deepEqual(TI003_ACTIVITIES[0]!.parentLifetime,{firstFrame:wrong.firstFrame,lastFrameExclusive:wrong.lastFrameExclusive});
});
test('place-value blocks preserve integer and decimal mathematical quantities',()=>{
 for(const q of TI003_QUESTIONS){const decimal=q.left.includes('.');for(const value of[q.left,q.right,q.answer]){const digits=ti003PlaceDigits(value,decimal);assert.equal(digits.reduce((total,digit,i)=>total+digit*[1000,100,10,1][i]!,0),Math.round(Number(value.replaceAll(',',''))*(decimal?100:1)));}}
});
test('native prelude has actual text and an input but does not leak future practice answers',()=>{
 const props={...context(120),paused:false,reducedMotion:false};const html=renderToStaticMarkup(createElement(G4L4Ti003ModernRenderer,props));assert.match(html,/Click New Problem\./);assert.match(html,/1,351/);assert.match(html,/readOnly/);assert.doesNotMatch(html,/7,200|Oops! Try Again|<canvas|foreignObject/);
 const snapshot=getTi003TextSnapshot(getCourseG04L04Ti003FrameState(120,props),props);assert.equal(snapshot.status,'ready');assert.equal(snapshot.blocks.find(b=>b.id==='answer')!.text,'');assert.equal(snapshot.blocks.find(b=>b.id==='wrong')!.visible,false);
});
test('demonstration pointer, authored down states and visible caret follow their real source placements',()=>{
 assert.equal(getTi003Prelude(6).buttons,false);assert.equal(getTi003Prelude(7).buttons,true);
 assert.equal(getTi003Prelude(76).pointer,null);assert.equal(getTi003Prelude(77).pointer?.alpha,.125);assert.equal(getTi003Prelude(97).pointedControl,'new');assert.equal(getTi003Prelude(97).pointer?.xTwips,5133);
 assert.equal(getTi003Prelude(106).pointedControl,'operands');assert.equal(getTi003Prelude(169).pointedControl,'answer');assert.equal(getTi003Prelude(177).pointer,null);assert.equal(getTi003Prelude(195).pointedControl,'enter');assert.equal(getTi003Prelude(229).pointer,null);
 for(const frame of [99,100,102,103])assert.equal(getTi003Prelude(frame).newPressed,frame>=100&&frame<103);
 for(const frame of [213,214,215,216])assert.equal(getTi003Prelude(frame).enterPressed,frame>=214&&frame<216);
 assert.equal(getTi003Prelude(176).caretVisible,false,'Source caret is placed with zero horizontal scale');assert.equal(getTi003Prelude(178).caretVisible,false);assert.equal(getTi003Prelude(180).caretVisible,true);assert.equal(getTi003Prelude(181).caretVisible,false);
});
test('automatic click streams are bounded by placed sprite lifetime and excluded from manual narration',async()=>{
 const cues=G4_L4_TI003_TEXT_PRESENTATION.sourceTimelineAudioCues!,clicks=cues.filter(cue=>cue.manualNarration===false);
 const sourceClicks=main.instances.filter((instance:any)=>instance.characterId===78);
 assert.deepEqual(clicks.map(cue=>[cue.frame,cue.endFrame]),sourceClicks.map((instance:any)=>[instance.firstFrame,instance.lastFrameExclusive]));
 assert.deepEqual(cues.filter(cue=>cue.manualNarration!==false).map(cue=>cue.id),['ti003-main']);
 for(const cue of clicks)assert.equal(cue.sha256,SOURCE.audio.find(audio=>audio.id==='demo-click')!.sha256);
 const {loadAnimationModuleForPresentation}=await import('../animation-registry');assert.ok((await loadAnimationModuleForPresentation(SOURCE.animationId,{modernText:true}))?.textPresentation);
});

test('page title and exercise marker use exact placed definitions and source lifetimes',()=>{
 const title=source.textDefinitions.find((d:any)=>d.characterId===51),marker=source.textDefinitions.find((d:any)=>d.characterId===64);
 assert.equal(title.runs.map((r:any)=>r.text).join('').trim(),'Addition & Subtraction: Try It!');assert.equal(marker.runs.map((r:any)=>r.text).join('').trim(),'2');
 const rootTimeline=source.timelines.find((t:any)=>t.timelineId==='root');assert.equal(rootTimeline.events.find((e:any)=>e.name?.text==='Mc_Page_Title').frame,6);
 const markerPlacements=main.instances.filter((i:any)=>i.characterId===64);assert.deepEqual(markerPlacements.map((i:any)=>[i.firstFrame,i.lastFrameExclusive]),[[3,88],[88,210],[210,394]]);for(const instance of markerPlacements){for(const id of instance.updates){const event=main.events.find((e:any)=>e.eventId===id);assert.equal(event.colorTransform,undefined);assert.equal(event.clipDepth,undefined);}}
 for(const frame of [1,2,3,82,88,210,382,393]){const props={...context(frame),paused:false,reducedMotion:false};const html=renderToStaticMarkup(createElement(G4L4Ti003ModernRenderer,props));assert.match(html,/Addition &amp; Subtraction: Try It!/);assert.equal(html.includes('data-lesson-text-block="exercise-number"'),frame>=3);const snapshot=getTi003TextSnapshot(getCourseG04L04Ti003FrameState(frame,props),props);assert.equal(snapshot.blocks.find(b=>b.id==='exercise-number')!.visible,frame>=3);}
});
test('decimal-point annotation preserves heading placement and correct-only McBlock row dots',()=>{
 const header=source.timelines.find((t:any)=>t.timelineId==='sprite-288');assert.ok(header.instances.some((i:any)=>i.characterId===286));assert.ok(header.instances.some((i:any)=>i.characterId===287));
 const decimalIds=['Q3','Q4','Q5','Q9','Q10','Q11'];assert.deepEqual(TI003_QUESTIONS.filter(q=>q.left.includes('.')).map(q=>q.id),decimalIds);
 for(const [current,q] of TI003_QUESTIONS.entries()){const props=context(q.frame),state=getCourseG04L04Ti003FrameState(q.frame,props);const practice={...createTi003Practice(props.seed),current,mode:'answering' as const};const pending=getTi003TextSnapshot(state,props,practice),correct=getTi003TextSnapshot(state,props,{...practice,mode:'correct'}),decimal=decimalIds.includes(q.id);assert.equal(pending.blocks.find(b=>b.id==='decimal-point')!.visible,decimal);for(const row of [0,1,2]){assert.equal(pending.blocks.find(b=>b.id===`decimal-point-row-${row}`)!.visible,false);const dot=correct.blocks.find(b=>b.id===`decimal-point-row-${row}`)!;assert.equal(dot.visible,decimal);assert.equal(dot.text,'•');}if(decimal){const block=source.timelines.find((t:any)=>t.timelineId==='sprite-'+q.blocksSprite);assert.deepEqual(block.instances.filter((i:any)=>i.characterId===292).map((i:any)=>i.instanceId),TI003_DECIMAL_POINT_INSTANCES[q.id]);}}
 assert.equal(getTi003TextSnapshot(getCourseG04L04Ti003FrameState(214,context(214)),context(214)).blocks.find(b=>b.id==='decimal-point')!.visible,false);
 assert.deepEqual(TI003_BINDING.blocks.find(b=>b.id==='decimal-point')!.sourceTextIds,['character-286','character-287']);for(const row of [0,1,2])assert.deepEqual(TI003_BINDING.blocks.find(b=>b.id===`decimal-point-row-${row}`)!.sourceTextIds,['character-292']);
 const orders=TI003_BINDING.blocks.map(b=>b.readingOrder);assert.equal(new Set(orders).size,orders.length);
});

test('Help preserves the crossed-out intermediate zero before the tens become ten',()=>{
 const help=source.timelines.find((t:any)=>t.timelineId==='sprite-131'),zero=source.textDefinitions.find((d:any)=>d.characterId===121),ten=source.textDefinitions.find((d:any)=>d.characterId===123);
 assert.equal(zero.runs.map((r:any)=>r.text).join(''),'0');assert.equal(ten.runs.map((r:any)=>r.text).join(''),'10');assert.deepEqual(help.instances.find((i:any)=>i.characterId===121).firstFrame,1);assert.equal(help.instances.find((i:any)=>i.characterId===121).lastFrameExclusive,2);
 const z=help.events.find((e:any)=>e.characterId===121),t=help.events.find((e:any)=>e.characterId===123);assert.ok(t.matrix[5]<z.matrix[5]);assert.ok(help.instances.some((i:any)=>i.characterId===118));
 const props=context(383),state=getCourseG04L04Ti003FrameState(383,props),practice={...createTi003Practice(props.seed),current:0,mode:'answering' as const};
 for(const open of [false,true]){const snapshot=getTi003TextSnapshot(state,props,{...practice,help:open}),block=snapshot.blocks.find(b=>b.id==='subtraction-intermediate-zero')!;assert.equal(block.text,'0');assert.equal(block.visible,open);}
 assert.deepEqual(TI003_BINDING.blocks.find(b=>b.id==='subtraction-intermediate-zero')!.sourceTextIds,['character-121']);assert.deepEqual(TI003_BINDING.blocks.find(b=>b.id==='subtraction-intermediate-zero')!.sourceShapeIds,[118]);
 assert.equal(reduceTi003Practice({...practice,current:10},{type:'open-help'}).help,false);
});
