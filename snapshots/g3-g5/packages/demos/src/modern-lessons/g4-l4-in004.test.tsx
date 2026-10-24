import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../contract';
import {audioCueMatchesContext} from '../runtime';
import {getCourseG04L04In004FrameState} from '../modules/course-g04-l04-in-004';
import {validateLessonTextActivities,validateLessonTextFrameControl} from '../lesson-text-frame-control';
import {G4_L4_IN004_TEXT_PRESENTATION as P,IN004_ACTIVITIES} from './g4-l4-in004';
import {G4_L4_IN004_CAPABILITY_CONFIG as C} from './generated/g4-l4-in004-capability-config';
import {getIn004TextSnapshot} from './g4-l4-in004-text';
import {In004Page} from './g4-l4-in004-page';
import {createIn004Session,dispatchIn004,bindIn004Children} from './g4-l4-in004-host-state';
const root=process.env.IN004_SOURCE_ROOT!;assert(root);
const runtime=(extra:Partial<AnimationRendererProps>={}):AnimationRendererProps=>({frame:470,frameDomain:'sprite-207',rootFrame:6,lang:'en',scenario:'source-static-frame',seed:13,replay:0,onLessonActivityRequest:()=>true,onLessonActivitiesRequest:()=>true,onLessonFrameRequest:()=>true,...extra});
const source=(r:AnimationRendererProps)=>getCourseG04L04In004FrameState(r.frame,r);
test('own 483-frame source identity, native axis, reveal and nine question equations are represented',()=>{
 const equations=['15–9=','2+8=','11–8=','6+3=','7–3=','4+2=','10–7=','5–3=','8–5='];
 for(let frame=1;frame<=483;frame++){const r=runtime({frame}),s=getIn004TextSnapshot(source(r),r);assert.equal(s.status,'ready');assert.equal(s.blocks.length,25);const find=(id:string)=>s.blocks.find(b=>b.id===id&&b.visible)?.text;assert.equal(find('title'),'Addition & Subtraction: Learn It');if(frame<=470||frame>=474&&frame<=482)assert.deepEqual([-15,-10,-5,0,5,10,15].map(n=>find('tick-'+n)),['–15','–10','–5','0','5','10','15']);if(frame<71)assert.equal(find('instruction'),undefined);if(frame===71)assert.equal(find('instruction'),'Click ');if(frame>=131)assert.equal(find('instruction'),'Click New Problem each time you are ready to begin a new addition or subtraction problem.');if(frame>=474&&frame<=482)assert.equal(find('question'),equations[frame-474]);if(frame>=360&&frame<403)assert.equal(find('intro-equation'),'5 + 8 = 13');assert.equal(find('answer'),undefined,'source placeholder never becomes an answer');}
});
test('foreign frame/source/seed/language/capture identities block native claims',()=>{
 const r=runtime(),s=source(r);for(const x of [{frame:469},{frame:484},{frame:1.5},{frameDomain:'sprite-97'},{rootFrame:1},{seed:2},{lang:'es' as const},{scenario:'other'},{entryStateSha256:'capture'}])assert.equal(getIn004TextSnapshot(s,{...r,...x}).status,'blocked');assert.equal(getIn004TextSnapshot({...s,sourceSwfSha256:'0'.repeat(64)},r).status,'blocked');
});
test('all own source text roles resolve; two coach authoring labels are geometrically offstage',()=>{
 const intake=JSON.parse(fs.readFileSync(path.join(root,'work/typography-v1/g4-l4-in004-number-line-practice/source-intake-r1.json'),'utf8'));const bytes=fs.readFileSync(path.join(root,intake.asset.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),intake.asset.sha256);const asset=JSON.parse(gunzipSync(bytes).toString());const ids=new Set<string>(asset.textDefinitions.flatMap((t:any)=>t.kind==='static-text'?t.runs.map((r:any)=>r.sourceTextId):[t.sourceTextId]));const mapped=new Set(C.binding.blocks.flatMap(b=>b.sourceTextIds));for(const x of mapped)assert(ids.has(x));for(const x of C.offstageLabels)assert(x.rightStageTwips<0);assert.deepEqual(C.offstageLabels.map(x=>x.characterId),[90,92]);const excluded=new Set(C.offstageLabels.flatMap(x=>x.sourceTextIds));assert.deepEqual([...ids].filter(x=>!mapped.has(x as never)).sort(),[...excluded].sort());assert.equal(asset.textDefinitions.length,61);
});
test('formal renderer emits native intro and source block markers without canvas fallback',()=>{
 for(const frame of [1,71,131,186,285,360,470]){const html=renderToStaticMarkup(<In004Page {...runtime({frame})}/>);assert.match(html,/data-modern-text-page="course-g04-l04-in-004"/);assert.match(html,/data-lesson-text-status="ready"/);assert.match(html,/data-lesson-text-block="title"/);assert.doesNotMatch(html,/<canvas|<foreignObject|Coach_audio_/);}
});
test('formal activity definitions bind own sample entries and exact Close button lifetime',()=>{
 validateLessonTextActivities(IN004_ACTIVITIES,483,12);validateLessonTextFrameControl(P.frameControl!,483);const a=JSON.parse(fs.readFileSync(path.join(root,'work/typography-v1/g4-l4-in004-number-line-practice/audio-r1/receipt.json'),'utf8'));
 for(const d of IN004_ACTIVITIES){const row=a.rows.find((r:any)=>r.domain===d.frameDomain),e=row.entries.find((e:any)=>e.firstFrame===d.startFrame);assert.equal(d.audio!.sha256,row.source.sha256);assert.equal(d.audio!.offsetSeconds,e.offsetSamples/22050);assert.equal(d.audio!.lastFrame,d.endFrame);}
 assert.equal(IN004_ACTIVITIES.at(-1)!.sourceInstanceId,'sprite-207/depth-75/generation-1/sprite-89/depth-1/generation-1/button-86/record-10');assert.equal(IN004_ACTIVITIES.at(-1)!.buttonPress!.sourceButtonId,86);assert.equal(P.playbackEndFrameByDomain!['sprite-207'],470);assert.equal(P.reducedMotionFrameByDomain!['sprite-207'],470);
 const cue=P.sourceTimelineAudioCues![0];assert(audioCueMatchesContext(cue,{frameDomain:'sprite-207',scenario:'source-static-frame',seed:13,lang:'en'}));assert(!audioCueMatchesContext(cue,{frameDomain:'sprite-207',scenario:'source-static-frame',seed:13,lang:'es'}));assert(IN004_ACTIVITIES.every(a=>a.audio?.language==='shared'));
});
test('live answer and final text use current practice and exact owned child token',()=>{
 let s=dispatchIn004(createIn004Session(13),{type:'begin'},runtime());const q=Number(s.practice!.question.slice(1)),r=runtime({frame:473+q});s=dispatchIn004(s,{type:'drop',card:'Mc_Jump_1',target:'Mc_NumLine'},r);s=dispatchIn004(s,{type:'drop',card:'Mc_Jump_3',target:'Mc_NumLine1'},r);const d=IN004_ACTIVITIES.find(a=>a.id==='in004-g4l4-final')!,a={id:d.id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,frame:2,revision:3,status:'playing' as const,cancellationToken:'own-final'};s=bindIn004Children(s,[a]);const view=(all:any[])=>getIn004TextSnapshot(source(r),r,s,all).blocks;assert.equal(view([a]).find(b=>b.id==='answer')?.text,s.practice!.answer);assert(view([a]).find(b=>b.id==='correct')?.visible);assert(!view([{...a,cancellationToken:'foreign'}]).find(b=>b.id==='correct')?.visible);assert(!view([{...a,frame:25,status:'completed'}]).find(b=>b.id==='correct')?.visible);
});
