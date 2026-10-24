import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../contract';
import {audioCueMatchesContext} from '../runtime';
import {getCourseG04L04Vb014FrameState} from '../modules/course-g04-l04-vb-014';
import {validateLessonTextActivities,validateLessonTextFrameControl} from '../lesson-text-frame-control';
import {createVb014Session,reduceVb014,bindVb014Children} from './g4-l4-vb014-state';
import {G4_L4_VB014_NATIVE_CONFIG as raw} from './generated/g4-l4-vb014-native-config';
import {getVb014TextSnapshot,vb014Alpha,vb014CardFigure,VB014_ACTIVITIES,Vb014Scene,G4_L4_VB014_TEXT_PRESENTATION as P,type Vb014NativeConfig} from './g4-l4-vb014';
const C:Vb014NativeConfig=raw;
const runtime=(extra:Partial<AnimationRendererProps>={}):AnimationRendererProps=>({frame:139,frameDomain:'sprite-67',rootFrame:6,seed:13,replay:0,lang:'en',scenario:'source-static-frame',onLessonActivityRequest:()=>true,onLessonActivitiesRequest:()=>true,onLessonFrameRequest:()=>true,...extra});
const source=(r:AnimationRendererProps)=>getCourseG04L04Vb014FrameState(r.frame,r);
test('all171 source frames expose exact native title, complete signed axis and six arrow labels',()=>{
 const s=createVb014Session(13);
 for(let frame=1;frame<=171;frame++){
  const r=runtime({frame}),state=source(r),snapshot=getVb014TextSnapshot(state,r,s);
  assert.equal(snapshot.status,'ready');assert.equal(snapshot.blocks.length,18);
  const visible=snapshot.blocks.filter(b=>b.visible),find=(id:string)=>visible.find(b=>b.id===id)?.text;
  assert.equal(find('title'),'Addition & Subtraction: Important Words');assert.equal(visible.length,frame===1?1:15);
  if(frame===1)continue;
  assert.deepEqual(C.ticks.map(t=>find('tick-'+t.value)),['–10','–5','0','5','10','15','20']);
  assert.deepEqual(C.cards.map(c=>find('card-'+c.id)),['4','–4','6','–6','–10','10']);
  assert.equal(find('instruction'),'Drag and drop the arrows on the number line to show 6 + 4 =10.');
  const html=renderToStaticMarkup(<Vb014Scene runtime={r} state={state} session={s} snapshot={snapshot} onAction={()=>{}}/>);
  assert.doesNotMatch(html,/<canvas|<foreignObject|Coach_audio_|setTimeout/);
  assert.equal((html.match(/data-vb014-card=/g)??[]).length,6);
  assert.equal((html.match(/data-axis-value=/g)??[]).length,7);
 }
 assert.deepEqual(Array.from({length:7},(_,i)=>vb014Alpha(i+1)),[0,43/256,85/256,128/256,171/256,213/256,1]);
});
test('source identity failures block native text instead of assigning unrelated content',()=>{
 const r=runtime(),state=source(r);
 for(const extra of [{frame:138},{frame:172},{frame:1.1},{rootFrame:1},{frameDomain:'sprite-60'},{lang:'es' as const},{seed:14},{scenario:'other'},{entryStateSha256:'original-capture'}]){
  assert.equal(getVb014TextSnapshot(state,{...r,...extra}).status,'blocked');
 }
 assert.equal(getVb014TextSnapshot({...state,sourceSwfSha256:'0'.repeat(64)},r).status,'blocked');
});
test('pre-interaction artwork changes to exact child geometry, preserving source snap translations',()=>{
 let s=createVb014Session(13);const plus6=C.cards.find(c=>c.id==='plus6')!,plus4=C.cards.find(c=>c.id==='plus4')!;
 assert.equal(vb014CardFigure(plus6,138,s).figure.shapes[0].character,21);
 assert.equal(vb014CardFigure(plus6,139,s).figure.shapes[0].character,37);
 assert.deepEqual(vb014CardFigure(plus6,139,s).shift,[178,1899]);
 s=reduceVb014(s,{type:'drop',card:'plus6',target:'Mc_NumLine'}).state;
 assert.deepEqual(vb014CardFigure(plus6,139,s).shift,[-622,-541]);
 assert.deepEqual(vb014CardFigure(plus4,139,s).shift,[-4454,2031]);
 s=reduceVb014(s,{type:'drop',card:'plus4',target:'Mc_NumLine1'}).state;
 assert.deepEqual(vb014CardFigure(plus4,139,s).shift,[1492,-410]);
 assert.deepEqual(vb014CardFigure(plus6,171,s).shift,[-622,-541]);
 assert.equal(C.shapes.length,13);assert(C.shapes.every(s=>s.paths.length>0));
});
test('wrong and final source text bind to their actual independent interaction lifetimes',()=>{
 const r=runtime();let s=createVb014Session(13);
 s=reduceVb014(s,{type:'drop',card:'minus4',target:null}).state;
 let snapshot=getVb014TextSnapshot(source(r),r,s);assert(snapshot.blocks.find(b=>b.id==='wrong')?.visible);
 const html=renderToStaticMarkup(<Vb014Scene runtime={r} state={source(r)} session={s} snapshot={snapshot} onAction={()=>{}}/>);
 assert.doesNotMatch(html,/aria-modal="true"|role="alertdialog"/);assert.match(html,/data-lesson-text-block="close"/);
 s=reduceVb014(s,{type:'press',card:'plus6'}).state;s=reduceVb014(s,{type:'drop',target:'Mc_NumLine'}).state;
 s=reduceVb014(s,{type:'drop',card:'plus4',target:'Mc_NumLine1'}).state;
 const d=VB014_ACTIVITIES.find(a=>a.id==='vb014-final')!;
 const final={id:d.id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,frame:2,revision:3,status:'playing' as const,cancellationToken:'clock-final'};
 s=bindVb014Children(s,[final]);snapshot=getVb014TextSnapshot(source(r),r,s,[final]);
 assert(snapshot.blocks.find(b=>b.id==='correct')?.visible);assert.equal(snapshot.blocks.find(b=>b.id==='wrong')?.visible,false);
 assert.equal(getVb014TextSnapshot(source(r),r,s,[{...final,cancellationToken:'old'}]).blocks.find(b=>b.id==='correct')?.visible,false);
 assert.equal(getVb014TextSnapshot(source(r),r,s,[{...final,frame:25,status:'completed'}]).blocks.find(b=>b.id==='correct')?.visible,false);
});
test('activity audio uses exact branch sample entries and real host declaration contracts',()=>{
 validateLessonTextActivities(VB014_ACTIVITIES,171,12);validateLessonTextFrameControl(P.frameControl!,171);
 const base=process.env.VB014_SOURCE_ROOT!;assert(base);
 const receipt=JSON.parse(fs.readFileSync(path.join(base,'work/typography-v1/g4-l4-vb014-number-line-drag/audio-timing-r1/receipt.json'),'utf8'));
 for(const d of VB014_ACTIVITIES){
  const row=receipt.rows.find((row:any)=>row.domain===d.frameDomain),entry=row.entries.find((e:any)=>e.firstFrame===d.startFrame);
  assert.equal(d.audio!.sha256,row.source.sha256);assert.equal(d.audio!.firstFrame,d.startFrame);assert.equal(d.audio!.lastFrame,d.endFrame);
  assert.equal(d.audio!.offsetSeconds,entry.offsetSamples/22050);
 }
 assert.deepEqual(VB014_ACTIVITIES.filter(d=>d.id.startsWith('vb014-wrong')).map(d=>d.audio!.offsetSeconds),[1673,27391,51272,67805].map(n=>n/22050));
 assert.equal(P.sourceTimelineAudioCues![0].frame,8);assert.equal(P.sourceTimelineAudioCues![0].endFrame,172);
 assert.equal(P.playbackEndFrameByDomain!['sprite-67'],139);assert.equal(P.reducedMotionFrameByDomain!['sprite-67'],139);
});

test('source main narration matches EN only while user-triggered feedback remains shared',()=>{
 const context={frameDomain:'sprite-67',scenario:'source-static-frame',seed:13};
 const cue=P.sourceTimelineAudioCues![0];
 assert(audioCueMatchesContext(cue,{...context,lang:'en'}));
 assert.equal(audioCueMatchesContext(cue,{...context,lang:'es'}),false);
 assert(VB014_ACTIVITIES.every(a=>a.audio?.language==='shared'));
});
