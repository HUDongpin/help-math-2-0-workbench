import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
import {getCourseG05L02Ti006FrameState} from '../modules/course-g05-l02-ti-006';
import {G5L2Ti006ModernRenderer,G5_L2_TI006_TEXT_BINDING,G5_L2_TI006_TEXT_PRESENTATION,G5_L2_TI006_SOURCE_TITLE,G5_L2_TI006_WORDS,G5_L2_TI006_CHOICES,G5_L2_TI006_FEEDBACK,G5_L2_TI006_DYNAMIC,G5_L2_TI006_TERMS,G5_L2_TI006_ACTIVITIES,createTi006Session,syncTi006Session,reduceTi006Session,getTi006ActivityState,getTi006TeachingState,getG5L2Ti006TextSnapshot,ti006ActivityId} from './g5-l2-ti006';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const hash=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const json=async(path:string)=>JSON.parse(await readFile(root+path,'utf8'));
const asset=(async()=>{const summary=await json('work/typography-v1/g5-l2-ti006/source-summary.json');return JSON.parse(gunzipSync(await readFile(root+summary.placement.assetPath)).toString());})();
const actions=(async()=>gunzipSync(await readFile(root+'migrations/course-g05-l02-ti-006/audit/machine/ffdec-scripts.txt.gz')).toString())();
const context=(frame:number,extra:Partial<RuntimeContext>={}):RuntimeContext=>({frame,frameDomain:'sprite-258',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,replay:0,...extra});
const activity=(session:ReturnType<typeof createTi006Session>,frame:number,status:'playing'|'completed'='playing',revision=1):LessonTextActivitySnapshot=>({id:ti006ActivityId(session)!,frameDomain:G5_L2_TI006_ACTIVITIES.find(a=>a.id===ti006ActivityId(session))!.frameDomain,frame,status,revision});
const buttonBody=async(character:number)=>{const text=await actions;const marker=`===== DefineButton2_${character}/BUTTONCONDACTION on(release).as =====`;const start=text.indexOf(marker);assert(start>=0);return text.slice(start,text.indexOf('\n===== ',start+1));};

test('fresh source custody and every native block resolve within the exact P1 asset',async()=>{
  const bindings=await json('work/typography-v1/g5-l2-ti006/source-bindings.json');for(const b of bindings)assert.equal(hash(await readFile(b.path)),b.sha256);
  const source=await asset;assert.equal(source.sourceSha256,G5_L2_TI006_TEXT_BINDING.sourceSwfSha256);assert.equal(source.summary.textDefinitions,49);
  const ids=new Set(source.textDefinitions.flatMap((d:any)=>[d.sourceTextId,...(d.runs??[]).map((r:any)=>r.sourceTextId)]));
  for(const block of G5_L2_TI006_TEXT_BINDING.blocks){
    for(const id of block.sourceTextIds)assert(ids.has(id),id);
    for(const id of block.sourceShapeIds??[])assert(source.shapeDefinitions.some((s:any)=>s.characterId===id),`shape-${id}`);
  }
  assert.equal(new Set(G5_L2_TI006_TEXT_BINDING.blocks.map(b=>b.readingOrder)).size,G5_L2_TI006_TEXT_BINDING.blocks.length);
});
test('outlined root title binds its exact source placement and stays ahead of the fraction question',async()=>{
  const source=await asset;
  const shape=source.shapeDefinitions.find((s:any)=>s.characterId===11);
  assert.equal(shape.sourceTagSha256,G5_L2_TI006_SOURCE_TITLE.sourceTagSha256);
  assert.equal(shape.sourceTagOffset,6581);
  const timeline=source.timelines.find((t:any)=>t.timelineId==='root');
  const instance=timeline.instances.find((i:any)=>i.instanceId===G5_L2_TI006_SOURCE_TITLE.instanceId);
  assert.equal(instance.characterId,11);assert.equal(instance.firstFrame,6);assert.equal(instance.lastFrameExclusive,11);
  const placement=timeline.events.find((e:any)=>e.eventId===instance.createdByEventId);
  assert.equal(placement.eventId,'root/tag-7385');assert.deepEqual(placement.matrix,[1,0,0,1,0,0]);
  const title=G5_L2_TI006_TEXT_BINDING.blocks[0]!;
  assert.equal(title.id,'root-title');assert.equal(title.role,'title');assert.deepEqual(title.sourceTextIds,[]);assert.deepEqual(title.sourceShapeIds,[11]);
  assert.equal(title.instance?.id,instance.instanceId);
  assert.equal(G5_L2_TI006_TEXT_BINDING.blocks.length,21);
  for(const frame of [1,4,5,32,35,36,87,189,207,232]){
    const ctx=context(frame),state=getCourseG05L02Ti006FrameState(frame,ctx);
    const snapshot=getG5L2Ti006TextSnapshot(state,ctx);
    assert.equal(snapshot.status,'ready');assert.equal(snapshot.blocks[0].id,'root-title');
    assert.equal(snapshot.blocks[0].text,'Percents: Try It!');assert.equal(snapshot.blocks[0].visible,true);
    const question=snapshot.blocks.find(b=>b.id==='question')!;
    assert(snapshot.blocks[0].readingOrder<question.readingOrder);assert.equal(question.visible,frame>=5);
    const markup=renderToStaticMarkup(createElement(G5L2Ti006ModernRenderer,{...ctx,state}));
    assert.match(markup,/<h2[^>]*data-lesson-text-block="root-title"[^>]*>Percents: Try It!<\/h2>/);
    if(frame>=5){assert.match(markup,/<h3[^>]*data-lesson-text-block="question"/);assert(markup.indexOf('data-lesson-text-block="root-title"')<markup.indexOf('data-lesson-text-block="question"'));}
  }
  const ctx=context(35),state=getCourseG05L02Ti006FrameState(35,ctx);
  const help=reduceTi006Session(createTi006Session(),35,{type:'help'}).nextState;
  assert.equal(getG5L2Ti006TextSnapshot(state,ctx,help).blocks[0].visible,true);
  const wrongRoot=context(35,{rootFrame:5});
  assert.equal(getG5L2Ti006TextSnapshot(getCourseG05L02Ti006FrameState(35,wrongRoot),wrongRoot).status,'blocked');
});
test('the source dynamic field is read-only and preserves bold both without inventing input or a score',async()=>{
  const source=await asset,field=source.textDefinitions.find((d:any)=>d.characterId===74);assert.equal(field.flags.readOnly,true);assert.equal(field.flags.html,true);
  assert.match(await actions,/txtFeed\.htmlText = _global\.WrongFeed/);assert(!/score|point/i.test(await actions));
  const expected=G5_L2_TI006_DYNAMIC.beforeBoth+'<FONT><B>both</B></FONT>'+G5_L2_TI006_DYNAMIC.afterBoth;
  for(const id of[33,34,36]){const body=await buttonBody(id);assert(body.includes(expected+G5_L2_TI006_DYNAMIC.retry));assert(body.includes(expected+'"'));assert.match(body,/_global\.quizTryCount\+\+/);}
});
test('source positions and arithmetic establish 12/16,5/18,3/21,3/24 and exact B handler',async()=>{
  const source=await asset,timeline=source.timelines.find((t:any)=>t.timelineId==='sprite-258');
  const aOnes=timeline.events.filter((e:any)=>e.characterId===21);assert.deepEqual(aOnes.map((e:any)=>e.matrix.slice(4)),[[-1943,-1514],[-1943,-2042]]);
  assert.deepEqual(G5_L2_TI006_CHOICES.map(c=>`${c.numerator}/${c.denominator}`),['12/16','5/18','3/21','3/24']);
  const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
  assert.deepEqual(G5_L2_TI006_CHOICES.filter(c=>gcd(Number(c.numerator),Number(c.denominator))===1).map(c=>c.letter),['B']);
  const correct=G5_L2_TI006_CHOICES.find(c=>c.letter==='B')!;assert.equal(correct.button,35);assert.match(await buttonBody(correct.button),/showRightFeed/);
  assert.equal(timeline.events.find((e:any)=>e.characterId===35&&e.name)?.name.text,'AnsBtn2');
});
test('question whole-word reveals, source alpha and main stop boundaries match the extracted timeline',async()=>{
  const timing=await json('work/typography-v1/g5-l2-ti006/source-timing.json');assert.deepEqual(G5_L2_TI006_WORDS,timing.question.words.map(({text,frame}:{text:string;frame:number})=>({text,frame})));
  for(const word of G5_L2_TI006_WORDS)assert(getTi006TeachingState(word.frame).question.endsWith(word.text));
  assert.equal(getTi006TeachingState(30).choices,false);assert.equal(getTi006TeachingState(31).choices,true);assert.equal(getTi006TeachingState(86).allChoices,true);assert.equal(getTi006TeachingState(87).allChoices,false);
  assert.match(await actions,/DefineSprite_258\/frame_35\/DoAction\.as =====\nstop\(\)/);assert.match(await actions,/DefineSprite_258\/frame_232\/DoAction\.as =====\nstop\(\)/);
});
test('feedback variant IDs follow same-lesson instance names rather than sorted sprite numbers',async()=>{
  const named=await json('work/typography-v1/g5-l2-ti006/named-instances.json');
  for(const kind of['wrong','correct']as const)for(const definition of G5_L2_TI006_FEEDBACK[kind])assert.equal(named.find((e:any)=>e.name===`Mc_${kind==='wrong'?'Wrong':'Right'}_Feed${definition.variant}`)?.id,definition.sprite);
  const host=await readFile(root+'work/typography-v1/g5-l2-ti011/host-scripts/scripts/frame_35/DoAction.as','utf8');assert.match(host,/function showWrongFeed\(\)[\s\S]{0,80}random\(3\)/);assert.match(host,/function showRightFeed\(\)[\s\S]{0,80}random\(4\)/);
});
test('all authored feedback end frames and disjoint OH NO text windows are preserved',async()=>{
  const text=await actions;
  for(const kind of['wrong','correct']as const)for(const d of G5_L2_TI006_FEEDBACK[kind])assert(text.includes(`DefineSprite_${d.sprite}/frame_${d.end}/DoAction.as`));
  const session=reduceTi006Session(createTi006Session(2),35,{type:'answer',choice:'A'}).nextState;
  for(const frame of[3,6,7,15,16,26])assert.equal(getTi006ActivityState(session,activity(session,frame)).titleVisible,true);
  for(const frame of[2,8,10,14,27])assert.equal(getTi006ActivityState(session,activity(session,frame)).titleVisible,false);
});
test('outlined feedback copies retain exact shapes and the two turning-sign text frames',async()=>{
  const source=await asset;
  for(const [id,sha]of [[91,'c0d77053de1efad30b64c3af989203303ce2a4d08ca287c96b211bde5324af37'],[99,'090c1308459faa2302e8218200e9ac8b71c78c6a081e91aaa1f207677fe961a7'],[120,'87bc4789811325bcd3d9302229b711e03a0f9d921a40b06d8ce01baead971b61']]as const){
    assert.equal(source.shapeDefinitions.find((s:any)=>s.characterId===id).sourceTagSha256,sha);
  }
  assert.deepEqual(G5_L2_TI006_TEXT_BINDING.blocks.find(b=>b.id==='feedback-wrong-3')!.sourceShapeIds,[91,99]);
  assert.deepEqual(G5_L2_TI006_TEXT_BINDING.blocks.find(b=>b.id==='feedback-wrong-1')!.sourceShapeIds,[120]);
  const turning=source.timelines.find((t:any)=>t.timelineId==='sprite-102');
  for(const [id,frame]of [[91,7],[99,15]]){
    const instance=turning.instances.find((i:any)=>i.characterId===id);
    assert.equal(instance.firstFrame,frame);assert.equal(instance.lastFrameExclusive,frame+1);
    const event=turning.events.find((e:any)=>e.eventId===instance.createdByEventId);
    assert.deepEqual(event.matrix,[1,0,0,1,0,0]);assert.equal(event.flags.hasColorTransform,false);assert.equal(event.flags.hasClipDepth,false);
    const session=reduceTi006Session(createTi006Session(2),35,{type:'answer',choice:'A'}).nextState;
    const ctx=context(35,{seed:2}),snapshot=getG5L2Ti006TextSnapshot(getCourseG05L02Ti006FrameState(35,ctx),ctx,session,activity(session,frame));
    const copy=snapshot.blocks.find(b=>b.id==='feedback-wrong-3')!;assert.equal(copy.visible,true);assert.equal(copy.text,'OH! NO');
  }
  const retry=source.timelines.find((t:any)=>t.timelineId==='sprite-128');
  for(const id of [120,122]){
    const instance=retry.instances.find((i:any)=>i.characterId===id);
    const updates=retry.events.filter((e:any)=>instance.updates.includes(e.eventId));
    assert.deepEqual(updates.filter((e:any)=>[5,6,25,26].includes(e.frame)).map((e:any)=>[e.frame,e.colorTransform.multiply[3]]),[[5,0],[6,64],[25,85],[26,0]]);
  }
  assert.deepEqual(G5_L2_TI006_FEEDBACK.wrong[0].windows,[[6,26]]);
});
test('each wrong variant allows source early Close only after its real popup reveal and binds the active revision',()=>{
  for(let seed=0;seed<3;seed++){
    const session=reduceTi006Session(createTi006Session(seed),35,{type:'answer',choice:'A'}).nextState,definition=G5_L2_TI006_FEEDBACK.wrong[seed]!;
    assert.equal(reduceTi006Session(session,35,{type:'close-feedback',activity:activity(session,definition.popupFirst!-1)}).allowed,false);
    const close=reduceTi006Session(session,35,{type:'close-feedback',activity:activity(session,definition.popupFirst!)});
    assert.equal(close.allowed,true);assert.equal(close.activityRequest?.id,`wrong-${seed+1}-outro`);assert.deepEqual(close.activityRequest?.fromActivity,{id:`wrong-${seed+1}-intro`,revision:1});
    assert.equal(getTi006ActivityState(close.nextState,activity(close.nextState,23,'playing',1)).matched,false);
  }
});
test('stop22 waits for Close and first wrong retry happens only after its source outro',()=>{
  const answered=reduceTi006Session(createTi006Session(),35,{type:'answer',choice:'D'}).nextState;
  const waiting=reduceTi006Session(answered,35,{type:'activity-complete'}).nextState;assert.equal(waiting.feedback?.phase,'waiting');assert.equal(waiting.tries,1);
  assert.equal(reduceTi006Session(waiting,35,{type:'activity-complete'}).allowed,false);
  const outro=reduceTi006Session(waiting,35,{type:'close-feedback',activity:activity(waiting,22,'completed')}).nextState;
  const retry=reduceTi006Session(outro,35,{type:'activity-complete'});assert.equal(retry.frameRequest,null);assert.equal(retry.nextState.feedback,null);assert.equal(retry.nextState.tries,1);
});
test('second wrong resets the source count and correct feedback advances only to the declared terminal segment',()=>{
  let session={...createTi006Session(),tries:1};session=reduceTi006Session(session,35,{type:'answer',choice:'C'}).nextState;assert.equal(session.tries,2);
  session=reduceTi006Session(session,35,{type:'close-feedback',activity:activity(session,22,'completed')}).nextState;
  const second=reduceTi006Session(session,35,{type:'activity-complete'});assert.deepEqual(second.frameRequest,{fromFrame:35,toFrame:36,stopFrame:232});assert.equal(second.nextState.tries,0);assert.equal(second.nextState.outcome,'two-wrong-continuation');
  for(let seed=0;seed<4;seed++){const correct=reduceTi006Session(createTi006Session(seed),35,{type:'answer',choice:'B'}).nextState;const definition=G5_L2_TI006_FEEDBACK.correct[seed]!;assert.equal(getTi006ActivityState(correct,activity(correct,definition.end-1,'completed')).complete,false);assert.equal(getTi006ActivityState(correct,activity(correct,definition.end,'completed')).complete,true);assert.equal(reduceTi006Session(correct,35,{type:'activity-complete'}).nextState.outcome,'correct');}
});
test('Replay, seed changes, stale activity revisions and external source-frame changes stay deterministic',()=>{
  const answered=reduceTi006Session(createTi006Session(),35,{type:'answer',choice:'B',revisionFloor:4}).nextState;
  assert.equal(getTi006ActivityState(answered,activity(answered,27,'completed',4)).matched,false);
  assert.equal(getTi006ActivityState(answered,{...activity(answered,27,'completed',5),id:'correct-4'}).matched,false);
  assert.deepEqual(syncTi006Session(answered,context(35,{replay:1})),createTi006Session(0,1));assert.deepEqual(syncTi006Session(answered,context(35,{seed:8})),createTi006Session(8));
  assert.equal(reduceTi006Session(createTi006Session(),34,{type:'answer',choice:'B'}).allowed,false);
});
test('Help starts hidden, disables quiz, and closes without advancing the source parent',()=>{
  const initial=createTi006Session(),help=reduceTi006Session(initial,35,{type:'help'});assert.equal(help.nextState.help,true);assert.equal(help.frameRequest,null);assert.equal(reduceTi006Session(help.nextState,35,{type:'answer',choice:'B'}).allowed,false);
  const closed=reduceTi006Session(help.nextState,35,{type:'close-help'});assert.equal(closed.nextState.help,false);assert.equal(closed.frameRequest,null);
});
test('source Symbol F0B8 resolves as division from its exact font outline without mutating P1',async()=>{
  const source=await asset,resolution=await json('work/typography-v1/g5-l2-ti006/symbol-glyph-resolution.json');
  const text=source.textDefinitions.find((d:any)=>d.characterId===60);assert.equal(text.runs[0].glyphs[0].code,61624);assert.equal(text.runs[0].text,null);assert.equal(resolution.value,'÷');assert.equal(hash(resolution.outline),resolution.outlineSha256);assert.match(resolution.outline,/M 19 -288 L 19 -238 544 -238 544 -288/);
  assert.equal(4/2,2);assert.equal(6/2,3);assert.equal(4/6,2/3);
});
test('seven activity media and the main cue bind the exact source payload and frame metadata',async()=>{
  const feedback=await json('work/typography-v1/g5-l2-ti006/feedback-audio.json'),main=await json('work/typography-v1/g5-l2-ti006/main-audio.json');
  assert.equal(feedback.assets.length,7);assert.equal(G5_L2_TI006_ACTIVITIES.length,10);
  for(const definition of G5_L2_TI006_ACTIVITIES){const a=feedback.assets.find((a:any)=>a.id===definition.id.replace(/-(intro|outro)$/,''));assert.equal(definition.audio.sha256,a.sha256);assert.equal(hash(await readFile(root+a.path)),a.sha256);assert.equal(definition.audio.firstFrame,a.firstBlockFrame);assert.equal(definition.audio.lastFrame,a.lastBlockFrame);}
  const cue=G5_L2_TI006_TEXT_PRESENTATION.sourceTimelineAudioCues[0]!;assert.equal(cue.sha256,main.asset.sha256);assert.equal(hash(await readFile(root+main.asset.path)),cue.sha256);assert.equal(cue.frame,main.asset.firstBlockFrame);assert.equal(cue.endFrame,main.asset.lastBlockFrame+1);
});
test('four exact source glossary targets retain English index and authored stop handlers',async()=>{
  const index=await json('apps/web/public/generated/g4-grade-wide-keyterms-en.json');assert.equal(index.source.sha256,G5_L2_TI006_TEXT_PRESENTATION.keyTerms.sourceSha256);
  for(const[name,term]of Object.entries(G5_L2_TI006_TERMS)){const entry=index.entries.find((e:any)=>e.id===term.entryId);assert.equal(entry.titles.en.toLowerCase(),name.toLowerCase());for(const button of term.buttons){const body=await buttonBody(button);assert(body.includes(`_global.KeyAttribute = "${name}"`));assert.match(body,/DoHyperLinks\(\)/);assert.match(body,/animation\.stop\(\)/);}}
});
test('native source text rejects identity mismatches and contains no editable field, Canvas or bitmap',()=>{
  const ctx=context(35),state=getCourseG05L02Ti006FrameState(35,ctx);assert.equal(getG5L2Ti006TextSnapshot(state,ctx).status,'ready');
  for(const mismatch of[{...ctx,lang:'es' as const},{...ctx,frameDomain:'root'},{...ctx,rootFrame:7},{...ctx,scenario:'default'},{...ctx,frame:34}])assert.equal(getG5L2Ti006TextSnapshot(state,mismatch).status,'blocked');
  const markup=renderToStaticMarkup(createElement(G5L2Ti006ModernRenderer,{...ctx,state}));assert(!/<(?:canvas|img|image|input|textarea)\b/i.test(markup));assert.match(markup,/Which/);assert.match(markup,/data-lesson-text-block="choice-B"/);
});
