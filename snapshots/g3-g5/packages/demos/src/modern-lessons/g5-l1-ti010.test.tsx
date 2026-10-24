import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
import {validateLessonTextActivities, validateLessonTextFrameControl} from '../lesson-text-frame-control';
import {getCourseG05L01Ti010FrameState} from '../modules/course-g05-l01-ti-010';
import {G5_L1_TI010_SOURCE_DATA as S} from './generated/g5-l1-ti010-source-v1';
import {G5_L1_TI010_ROOT_TITLE, G5_L1_TI010_ACTIVITIES, G5_L1_TI010_TEXT_BINDING, G5_L1_TI010_TEXT_PRESENTATION, G5_L1_TI010_TERMS, createG5L1Ti010Session, synchronizeG5L1Ti010Session, getG5L1Ti010ActivityId, getG5L1Ti010Feedback, reduceG5L1Ti010Session, getG5L1Ti010Teaching, getG5L1Ti010TextSnapshot, G5L1Ti010ModernRenderer, type G5L1Ti010Session} from './g5-l1-ti010';
const c = (frame=208, seed=0):RuntimeContext => ({frame,seed,replay:0,rootFrame:6,frameDomain:'sprite-248',scenario:'source-static-frame',lang:'en'});
const st = (context:RuntimeContext) => getCourseG05L01Ti010FrameState(context.frame,context);
const source=JSON.parse(gunzipSync(readFileSync(new URL('../../../../catalog/typography-v1/source-catalog/assets/'+S.sourceSha256+'.json.gz',import.meta.url))).toString());
const scripts=gunzipSync(readFileSync(new URL('../../../../migrations/course-g05-l01-ti-010/audit/machine/ffdec-scripts.txt.gz',import.meta.url))).toString();
const section=(name:string)=>scripts.split(/^===== /m).find((s:string)=>s.startsWith(name))??'';
function activity(session:G5L1Ti010Session,frame?:number,revision=1,status:'playing'|'completed'='completed'):LessonTextActivitySnapshot {const d=G5_L1_TI010_ACTIVITIES.find(d=>d.id===getG5L1Ti010ActivityId(session))!;return{id:d.id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,frame:frame??d.endFrame,revision,status};}

test('48 source text definitions retain exact identifiers and only six decorative ROCKET glyphs are not native blocks',()=>{
 assert.equal(source.textDefinitions.length,48);const used=new Set(G5_L1_TI010_TEXT_BINDING.blocks.flatMap(b=>b.sourceTextIds));const all=new Set(source.textDefinitions.flatMap((d:any)=>[d.sourceTextId,...(d.runs??[]).map((r:any)=>r.sourceTextId)]));for(const id of used)assert(all.has(id),id);
 const omitted=source.textDefinitions.filter((d:any)=>![d.sourceTextId,...(d.runs??[]).map((r:any)=>r.sourceTextId)].some((id:string)=>used.has(id))).map((d:any)=>d.characterId);assert.deepEqual(omitted,[121,122,123,124,125,126]);const field=source.textDefinitions.find((d:any)=>d.characterId===67);assert(field.flags.readOnly);assert(section('DefineSprite_74/frame_1/').includes('txtFeed.text = _global.WrongFeed'));
});
test('source B4 and the added clarification preserve round-each-then-add instead of silently replacing the answer with5',()=>{
 assert.deepEqual(S.choices.filter(q=>q.correct).map(q=>[q.letter,q.value,q.button]),[['B',4,56]]);assert(section('DefineButton2_56/').includes('_root.showRightFeed()'));assert(section('DefineButton2_57/').includes('_root.showWrongFeed()'));
 assert.equal(Math.round(1.19)+Math.round(3.4),4);assert.equal(Math.round(1.19+3.4),5);assert(S.question.map(q=>q.fullText).join(' ').includes('To the nearest whole number'));
 assert.equal(S.clarificationSource.kind,'source-backed-clarification-not-verbatim');assert(S.clarification.includes('each weight'));assert(S.clarificationSource.sourceTextIds.includes('character-247/run-0'));assert(S.explanation[2].fullText.endsWith('rounds to 5'));assert(S.explanation[3].fullText.endsWith('1 + 3 = 4'));
});
test('source word reveal boundaries and both later methods remain on the authored parent clock',()=>{
 assert.equal(getG5L1Ti010Teaching(7).question[0].text,'');assert.equal(getG5L1Ti010Teaching(8).question[0].text,'Carlos');assert(!getG5L1Ti010Teaching(53).question[0].text.includes('1.19'));assert(getG5L1Ti010Teaching(54).question[0].text.includes('1.19'));
 assert.equal(getG5L1Ti010Teaching(178).clarification,false);assert.equal(getG5L1Ti010Teaching(179).clarification,true);assert.equal(getG5L1Ti010Teaching(201).choices,false);assert.equal(getG5L1Ti010Teaching(202).choices,true);assert.equal(getG5L1Ti010Teaching(222).allChoices,true);assert.equal(getG5L1Ti010Teaching(223).allChoices,false);
 assert.deepEqual(getG5L1Ti010Teaching(441).explanation.map(q=>q.text),S.explanation.map(q=>q.fullText));assert(!getG5L1Ti010Teaching(396).explanation[3].text.endsWith('4'));assert(getG5L1Ti010Teaching(397).explanation[3].text.endsWith('4'));
});
test('all actual source clocks and five press-bound instances pass the product validators',()=>{
 validateLessonTextFrameControl(G5_L1_TI010_TEXT_PRESENTATION.frameControl!,441);validateLessonTextActivities(G5_L1_TI010_ACTIVITIES,441,12);assert.equal(G5_L1_TI010_ACTIVITIES.length,15);
 const buttons=G5_L1_TI010_ACTIVITIES.filter(d=>d.buttonPress);assert.equal(buttons.length,5);assert.equal(new Set(buttons.map(d=>d.sourceInstanceId)).size,5);
 for(const d of S.downDefinitions){const b=source.buttonDefinitions.find((b:any)=>b.characterId===d.buttonId),r=b.statePlacements.find((r:any)=>r.recordIndex===d.record);assert.equal(r.characterId,d.sprite);assert.deepEqual(r.states,{up:false,over:false,down:true,hitTest:false});}
 assert(buttons.find(b=>b.id==='help-open-down')!.sourceInstanceId!.endsWith('/button-32/record-5'));assert(buttons.filter(b=>b.id.includes('wrong')).every(b=>b.sourceInstanceId!.endsWith('/button-73/record-10')));
});
test('wrong feedback waits at22, accepts only a current readable popup Close and increments count after the source outro',()=>{
 let session=reduceG5L1Ti010Session(createG5L1Ti010Session(),208,{type:'answer',choice:'A'}).state;assert.equal(session.tries,0);const b=S.feedback.find(b=>b.id===session.feedback!.id)!;assert.equal(b.id,'wrong-1');assert.deepEqual(b.popupFrames,[[17,22]]);
 assert.equal(reduceG5L1Ti010Session(session,208,{type:'close-feedback',activity:activity(session,16,1,'playing')}).allowed,false);assert.equal(reduceG5L1Ti010Session(session,208,{type:'activity-complete',activity:activity(session,21,1,'playing')}).allowed,false);
 session=reduceG5L1Ti010Session(session,208,{type:'activity-complete',activity:activity(session)}).state;assert.equal(session.feedback!.phase,'waiting');assert.equal(session.tries,0);assert.equal(reduceG5L1Ti010Session(session,208,{type:'activity-complete',activity:activity(session)}).allowed,false);
 let result=reduceG5L1Ti010Session(session,208,{type:'close-feedback',activity:activity(session)});assert.equal(result.activityRequest?.id,'wrong-1-outro');assert.deepEqual(result.activityRequest?.fromActivity,{id:'wrong-1-intro',revision:1});session=result.state;assert.equal(getG5L1Ti010Feedback(session,[activity(session,31,1)]).complete,false);
 result=reduceG5L1Ti010Session(session,208,{type:'activity-complete',activity:activity(session,31,2)});assert.equal(result.frameRequest,null);assert.equal(result.state.tries,1);assert.equal(result.state.feedback,null);assert.equal(result.state.focus,'choice-A');
});
test('second wrong completes through its own Close/outro and then requests208→209→441',()=>{
 let s={...createG5L1Ti010Session(),tries:1};s=reduceG5L1Ti010Session(s,208,{type:'answer',choice:'D'}).state;assert.equal(s.feedback!.id,'wrong-2');assert.equal(s.tries,1);
 const intro=activity(s,14,3,'playing'),close=reduceG5L1Ti010Session(s,208,{type:'close-feedback',activity:intro});assert(close.allowed);s=close.state;
 const result=reduceG5L1Ti010Session(s,208,{type:'activity-complete',activity:activity(s,27,4)});assert.deepEqual(result.frameRequest,{fromFrame:208,toFrame:209,stopFrame:441});assert.equal(result.state.outcome,'two-wrong-continuation');assert.equal(result.state.tries,0);
});
test('every same-lesson right/wrong variant stays within3/4 and rejects stale or foreign activity identity',()=>{
 for(let seed=0;seed<4;seed++){const s=reduceG5L1Ti010Session(createG5L1Ti010Session(seed),208,{type:'answer',choice:'B',revisionFloor:2}).state;assert.equal(s.feedback!.id,`correct-${seed+1}`);const done=activity(s,undefined,3);assert(getG5L1Ti010Feedback(s,[done]).complete);assert.equal(getG5L1Ti010Feedback(s,[{...done,sourceInstanceId:'foreign'}]).complete,false);assert.equal(getG5L1Ti010Feedback(s,[{...done,revision:2}]).complete,false);const r=reduceG5L1Ti010Session(s,208,{type:'activity-complete',activity:done});assert.equal(r.state.outcome,'correct');assert.deepEqual(r.frameRequest,S.transitions[0]);}
 for(let seed=0;seed<3;seed++)assert.equal(reduceG5L1Ti010Session(createG5L1Ti010Session(seed),208,{type:'answer',choice:'C'}).state.feedback!.id,`wrong-${seed+1}`);
});
test('Help is a static source visibility toggle and Replay/page changes clear source interaction identity',()=>{
 let s=reduceG5L1Ti010Session(createG5L1Ti010Session(),208,{type:'help'}).state;assert(s.help);assert.equal(reduceG5L1Ti010Session(s,208,{type:'answer',choice:'B'}).allowed,false);const r=reduceG5L1Ti010Session(s,208,{type:'close-help'});assert.equal(r.frameRequest,null);assert.equal(r.state.focus,'help');assert.equal(r.state.help,false);
 assert.deepEqual(synchronizeG5L1Ti010Session(s,{...c(),replay:1}),createG5L1Ti010Session(0,1));assert.equal(synchronizeG5L1Ti010Session(s,c(209)).help,false);assert.equal(reduceG5L1Ti010Session(createG5L1Ti010Session(),207,{type:'answer',choice:'B'}).allowed,false);
});
test('native help snapshot keeps the source dollar examples, highlighted zero, bold eight and four exact glossary targets',()=>{
 const current=c(),s={...createG5L1Ti010Session(),help:true},snap=getG5L1Ti010TextSnapshot(st(current),current,s),visible=snap.blocks.filter(b=>b.visible);assert(visible.some(b=>b.id==='help-28'&&b.text.includes('$1.00')));assert(!visible.some(b=>b.id.startsWith('question-')));assert(visible.some(b=>b.id==='help-label'));
 assert.deepEqual(Object.values(G5_L1_TI010_TERMS).map(t=>t.entryId),['en-0137-09788801a958','en-0591-985f6684fc7d','en-0156-78eead3d9112','en-0749-f97ce9cc1311']);const eight=source.fonts.find((f:any)=>f.characterId===24);assert(eight.flags.bold);assert.deepEqual(eight.codes,[56]);
});
test('all eleven semantic audio assets are exact source MP3s, with three byte-identical click streams',()=>{
 assert.equal(S.audio.length,11);for(const a of S.audio){const b=readFileSync(new URL('../../../../'+a.path,import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256);}
 const click=S.audio.filter(a=>a.id.includes('click'));assert.equal(click.length,3);assert.equal(new Set(click.map(a=>a.sha256)).size,1);const main=S.audio.find(a=>a.id==='main')!;assert.deepEqual([main.firstFrame,main.lastFrame],[2,423]);
});
test('native DOM uses source math, explicit clarification and no raster text or input field; foreign source and untranslated Spanish state fail closed',()=>{
 const current=c(),html=renderToStaticMarkup(<G5L1Ti010ModernRenderer {...current} state={st(current)} onLessonActivityRequest={()=>true}/>);assert(html.includes('1.19'));assert(html.includes('3.4'));assert(html.includes('Round each weight'));assert(html.includes('data-source-copy-kind="source-backed-clarification"'));assert(!/<(?:canvas|img|input|textarea)\b/.test(html));
 assert.equal(getG5L1Ti010TextSnapshot({...st(current),sourceSwfSha256:'0'.repeat(64)},current).status,'blocked');const es={...current,lang:'es' as const};assert.equal(getG5L1Ti010TextSnapshot(st(es),es).status,'blocked');assert.equal(getG5L1Ti010TextSnapshot(st(current),{...current,entryStateSha256:'1'.repeat(64)}).status,'blocked');
});


test('actual modern product loader admits p71 and its exact fifteen source activities',async()=>{
 const {loadAnimationModuleForPresentation}=await import('../animation-registry');const loaded=await loadAnimationModuleForPresentation(S.animationId,{modernText:true});assert.equal(loaded?.textPresentation?.binding.placementId,S.placementId);assert.equal(loaded!.textPresentation!.activityTimelines!.length,15);assert.deepEqual(loaded!.textPresentation!.frameControl!.transitions,[{fromFrame:208,toFrame:209,stopFrame:441}]);assert.equal(loaded!.textPresentation!.sourceTimelineAudioCues![0].sha256,S.audio.find(a=>a.id==='main')!.sha256);
});

test('outlined source shape33 title remains native and visible through Help, feedback and the complete child domain',()=>{
 const root=source.timelines.find((t:any)=>t.timelineId==='root');
 const shape=source.shapeDefinitions.find((s:any)=>s.characterId===33);
 assert.equal(shape.sourceTagSha256,'31441209a5bf27b16195360afea06c787568ed1a2e33ca967a1d0f806dfab645');
 assert.deepEqual(root.instances.filter((p:any)=>p.characterId===33).map((p:any)=>[p.firstFrame,p.lastFrameExclusive]),[[6,11]]);
 assert.equal(G5_L1_TI010_ROOT_TITLE,'Place Value: Try It!');
 const title=G5_L1_TI010_TEXT_BINDING.blocks.find(b=>b.id==='root-title')!;
 assert.equal(title.role,'title');assert.deepEqual(title.sourceTextIds,[]);assert.deepEqual(title.sourceShapeIds,[33]);
 assert.equal(G5_L1_TI010_TEXT_BINDING.blocks.length,30);
 for(const frame of [1,8,179,208,209,397,441]){const context=c(frame),snapshot=getG5L1Ti010TextSnapshot(st(context),context);const block=snapshot.blocks.find(b=>b.id==='root-title')!;assert.equal(block.text,G5_L1_TI010_ROOT_TITLE);assert.equal(block.visible,true);}
 const context=c(),help={...createG5L1Ti010Session(),help:true};assert(getG5L1Ti010TextSnapshot(st(context),context,help).blocks.find(b=>b.id==='root-title')!.visible);
 const wrong=reduceG5L1Ti010Session(createG5L1Ti010Session(),208,{type:'answer',choice:'A'}).state;
 assert(getG5L1Ti010TextSnapshot(st(context),context,wrong,[activity(wrong,22)]).blocks.find(b=>b.id==='root-title')!.visible);
 const html=renderToStaticMarkup(<G5L1Ti010ModernRenderer {...context} state={st(context)}/>);
 assert(html.includes('<h2 data-lesson-text-block="root-title">Place Value: Try It!</h2>'));
 assert.equal(G5_L1_TI010_TEXT_BINDING.blocks.some(b=>b.id==='exercise-number'),false);
});
