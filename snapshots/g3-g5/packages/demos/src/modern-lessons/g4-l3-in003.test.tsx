import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {getCourseG04L03In003FrameState,COURSE_G04_L03_IN_003_RUNTIME} from '../timelines/course-g04-l03-in-003';
import {G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES} from '../g4-l3-main-timeline-audio.generated';
import {G4_L3_IN003_SOURCE_DATA as DATA} from './g4-l3-in003-source.generated';
import {G4L3In003ModernRenderer,G4_L3_IN003_TEXT_BINDING,G4_L3_IN003_TEXT_PRESENTATION,G4_L3_IN003_SOURCE_AUDIO_CUES,getG4L3In003TeachingState,getG4L3In003TextSnapshot} from './g4-l3-in003';

const root=process.env.IN003_PROJECT_ROOT??process.cwd();
const sourceMapPromise=readFile(path.join(root,DATA.sourceReferences[0].path)).then(bytes=>{
  assert.equal(createHash('sha256').update(bytes).digest('hex'),DATA.sourceReferences[0].sha256);return JSON.parse(bytes.toString());
});
const semanticMapPromise=readFile(path.join(root,DATA.sourceReferences[1].path)).then(bytes=>{
  assert.equal(createHash('sha256').update(bytes).digest('hex'),DATA.sourceReferences[1].sha256);return JSON.parse(bytes.toString());
});
const context=(frame:number,changes:Partial<RuntimeContext>={}):RuntimeContext=>({frame,frameDomain:'sprite-84',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,replay:0,...changes});
const snapshot=(frame:number,changes:Partial<RuntimeContext>={})=>{
  const request=context(frame,changes);return getG4L3In003TextSnapshot(getCourseG04L03In003FrameState(frame,request),request);
};
const inIntervals=(frame:number,intervals:readonly (readonly number[])[])=>intervals.some(([start,end])=>frame>=start&&frame<end);
const alpha=(frame:number,states:any[])=>states.filter(state=>state.frame<=frame).at(-1)?.color.multiply[3]/256;
const visibleText=(frame:number,id:string)=>snapshot(frame).blocks.find(block=>block.id===id)?.visible;

test('source references and every text/shape identity are bound to checked source maps',async()=>{
  const source=await sourceMapPromise;
  const semantic=await semanticMapPromise;
  assert.equal(source.source.swfSha256,DATA.sourceSwfSha256);
  assert.equal(semantic.sourceMapSha256,DATA.sourceReferences[0].sha256);
  const texts=new Set(source.textDefinitions.flatMap((row:any)=>row.sourceTextIds??row.runs?.map((run:any)=>run.sourceTextId)??[]));
  const shapes=new Set(source.geometry.map((row:any)=>row.characterId));
  for(const block of G4_L3_IN003_TEXT_BINDING.blocks){
    for(const id of block.sourceTextIds)assert.ok(texts.has(id),`${block.id}: ${id}`);
    for(const id of block.sourceShapeIds??[])assert.ok(shapes.has(id),`${block.id}: shape${id}`);
  }
  const correction=await readFile(path.join(root,DATA.decisionReference.path));
  assert.equal(createHash('sha256').update(correction).digest('hex'),DATA.decisionReference.sha256);
  assert.deepEqual(JSON.parse(correction.toString()).nativeCorrection,DATA.mathematicalCorrection);
  assert.equal(G4_L3_IN003_TEXT_BINDING.placementId,'g04-l03-placement-014');
  assert.equal(G4_L3_IN003_TEXT_BINDING.blocks.length,26);
});

test('all472frames preserve signed axis, counter values/instances, full alpha, highlights and comparisons',async()=>{
  const source=await sourceMapPromise,semantic=await semanticMapPromise;
  for(let frame=1;frame<=472;frame++){
    const actual=getG4L3In003TeachingState(frame),rendered=snapshot(frame,{seed:71,replay:3});
    assert.equal(rendered.status,'ready');assert.deepEqual(rendered.suppressedInstances,[]);
    assert.equal(rendered.identity.frame,frame);assert.equal(rendered.identity.rootFrame,6);assert.equal(rendered.identity.seed,71);assert.equal(rendered.identity.replay,3);
    assert.deepEqual(actual.tickValues,frame>=2?semantic.axis.ticks.map((tick:any)=>tick.value):[]);
    const counter=semantic.counterInstances.find((row:any)=>inIntervals(frame,row.visibleIntervals));
    assert.equal(actual.counter?.value??null,counter?.signedValue??null,`counter ${frame}`);
    assert.equal(actual.counter?.instanceId??null,counter?.instanceId??null,`counter identity ${frame}`);
    if(counter){
      assert.equal(actual.counter?.sourceAlpha,alpha(frame,source.instances.find((row:any)=>row.instanceId===counter.instanceId).states));
      assert.equal(actual.counter?.sourceFontHeightTwips,counter.sourceFontHeightTwips);
    }
    const highlightRows=semantic.highlightInstances.filter((row:any)=>inIntervals(frame,row.visibleIntervals));
    assert.deepEqual(actual.highlights.map(row=>row.instanceId),highlightRows.map((row:any)=>row.instanceId));
    assert.deepEqual(actual.highlights.map(row=>row.sourceSignedValues),highlightRows.map((row:any)=>Array.isArray(row.signedValue)?row.signedValue:[row.signedValue]));
    const expected=highlightRows.flatMap((row:any)=>[255,257,259].includes(frame)&&row.sourceCharacterId===67?[-4]:Array.isArray(row.signedValue)?row.signedValue:[row.signedValue]);
    assert.deepEqual(actual.axisHighlightedValues,[...new Set(expected)]);
    for(const [index,row] of semantic.comparisons.entries()){
      assert.equal(actual.comparisons[index].visible,inIntervals(frame,[row.visible]));
      assert.equal(actual.comparisons[index].sourceAlpha,alpha(frame,source.instances.find((i:any)=>i.characterId===Number(row.sourceTextIds[0].match(/character-(\d+)/)[1])).states) || 0);
      assert.equal(actual.comparisons[index].axisEmphasized,inIntervals(frame,row.emphasisIntervals));
    }
    for(const [index,row] of semantic.directions.entries()){
      const morph=source.instances.find((entry:any)=>entry.characterId===row.morphShapeId);
      const states=morph.states.filter((entry:any)=>entry.frame<=frame);
      const ratio=frame>=row.completeFrom?1:(states.at(-1)?.ratio??0)/65535;
      assert.equal(actual.directions[index].extent,ratio);
      assert.equal(actual.directions[index].labelVisible,inIntervals(frame,[row.labelVisible]));
    }
    const numeric=rendered.blocks.filter(block=>block.visible&&block.id.startsWith('tick-')).map(block=>Number(block.text.replace('−','-')));
    assert.deepEqual(numeric,[...numeric].sort((a,b)=>a-b));assert.equal(new Set(numeric).size,numeric.length);
  }
});

test('source reveal/removal boundaries preserve gaps rather than final values at the beginning',()=>{
  assert.equal(visibleText(1,'tick-zero'),false);assert.equal(visibleText(2,'tick-zero'),true);
  for(const [before,start,id] of [[45,46,'increase'],[77,78,'decrease'],[332,333,'positive-comparison'],[405,406,'negative-comparison']] as const){
    assert.equal(visibleText(before,id),false);assert.equal(visibleText(start,id),true);
  }
  for(const frame of [111,208,209,226,307,309,472])assert.equal(visibleText(frame,'counting-value'),false);
  for(const frame of [112,115,194,207,227,255,306])assert.equal(visibleText(frame,'counting-value'),true);
  assert.equal(getG4L3In003TeachingState(112).counter?.sourceAlpha,85/256);
  assert.equal(getG4L3In003TeachingState(114).counter?.sourceAlpha,1);
  assert.equal(getG4L3In003TeachingState(333).comparisons[0].sourceAlpha,.25);
  assert.equal(getG4L3In003TeachingState(336).comparisons[0].sourceAlpha,1);
});

test('the deliberate −4 correction retains actual −3 source evidence and no other correction',()=>{
  for(const frame of [255,257,259]){
    const teaching=getG4L3In003TeachingState(frame);
    assert.equal(teaching.counter?.text,'−4');assert.deepEqual(teaching.axisHighlightedValues,[-4]);
    assert.deepEqual(teaching.highlights[0].sourceSignedValues,[-3]);assert.equal(teaching.highlights[0].sourceCharacterId,67);
    assert.equal(teaching.mathematicalCorrectionApplied,true);
  }
  assert.deepEqual(getG4L3In003TeachingState(249).axisHighlightedValues,[-3]);
  assert.deepEqual(getG4L3In003TeachingState(256).axisHighlightedValues,[]);
  for(let frame=1;frame<=472;frame++)assert.equal(getG4L3In003TeachingState(frame).mathematicalCorrectionApplied,[255,257,259].includes(frame));
});

test('negative comparison retains both shape82 minus signs and numerical truth',()=>{
  const negative=DATA.comparisons[1];assert.equal(negative.literalSourceText,'10 <   8');
  assert.deepEqual(negative.shapeIds,[82]);assert.equal(negative.sourceMinusRectangleCount,2);
  assert.equal(negative.text,'−10 < −8');assert.ok(-10 < -8);
  assert.equal(DATA.comparisons[0].text,'10 > 8');assert.ok(10 > 8);
  for(const frame of [411,413,415,417,419])assert.deepEqual(getG4L3In003TeachingState(frame).axisHighlightedValues,[-10,-8]);
});

test('actual legacy state type works without animationId and malformed requests fail closed',()=>{
  const request=context(255),state=getCourseG04L03In003FrameState(255,request);
  assert.equal('animationId' in state,false);assert.equal(getG4L3In003TextSnapshot(state,request).status,'ready');
  const invalid:any[]=[null,undefined,{},[],{frame:255},{...state,frame:NaN},{...state,sourceSwfSha256:'x'},
    {...state,frame:254},{...state,rootFrame:5},{...state,exportFrame:253},{...state,seed:1},
    {...state,language:'es'},{...state,scenario:'other'},{...state,status:'blocked'},
    {...state,blocker:'spanish-visual-and-audio-unvalidated'},{...state,sourceStaticVisualReady:false},
    {...state,naturalRuntimeEstablished:true},{...state,audioRendered:true}];
  for(const value of invalid){const output=getG4L3In003TextSnapshot(value,request);assert.equal(output.status,'blocked');assert.deepEqual(output.blocks,[]);}
  for(const changes of [{lang:'es'},{frameDomain:'root'},{frameDomain:'sprite-88'},{scenario:'other'},{rootFrame:5},{frame:254},{seed:3}] as const){
    assert.equal(getG4L3In003TextSnapshot(state,context(255,changes)).status,'blocked');
  }
  assert.equal(renderToStaticMarkup(<G4L3In003ModernRenderer {...request} state={{frame:255}}/>),'');
});

test('native markup contains actual signed HTML labels, one accessible list and no old graphic loader',()=>{
  const markup=renderToStaticMarkup(<G4L3In003ModernRenderer {...context(255)}/>);
  assert.match(markup,/<span[^>]*data-lesson-text-block="tick-negative-4"[^>]*data-in003-highlight="true"[^>]*>−4<\/span>/);
  assert.match(markup,/<p[^>]*data-lesson-text-block="counting-value"[^>]*>−4<\/p>/);
  assert.equal((markup.match(/aria-label="Number line labels"/g)??[]).length,1);
  assert.match(markup,/aria-hidden="true"><ul class="lesson-text-presentation__label-list"/);
  assert.doesNotMatch(markup,/<canvas|<image|<img|<script|<text[ >]/);
  assert.doesNotMatch(markup,/Perimeter and Area|Source-static|Engineering preview|source-assets|canvas-renderer\.js/);
  const final=renderToStaticMarkup(<G4L3In003ModernRenderer {...context(472)}/>);
  assert.match(final,/−10 &lt; −8/);assert.match(final,/10 &gt; 8/);
  assert.doesNotMatch(final,/data-in003-counter-value/);
});

test('Replay and reduced motion use source identity without a second clock or fabricated completion',()=>{
  assert.equal(COURSE_G04_L03_IN_003_RUNTIME.frameCount,10);
  assert.deepEqual(COURSE_G04_L03_IN_003_RUNTIME.frameDomains,[{id:'sprite-84',frameCount:472,fps:12,rootFrame:6}]);
  assert.equal(snapshot(472).blocks.filter(block=>block.visible).length,25);
  assert.deepEqual(snapshot(1,{replay:1}).blocks.filter(block=>block.visible),[]);
  assert.equal(snapshot(1,{replay:1}).identity.replay,1);
  assert.deepEqual(snapshot(255,{seed:10,replay:8}).blocks,snapshot(255,{seed:9,replay:0}).blocks);
  assert.deepEqual(G4_L3_IN003_TEXT_PRESENTATION.reducedMotionFrameByDomain,{'sprite-84':472});
  assert.equal(getG4L3In003TeachingState(472).highlights.length,0);assert.equal(getG4L3In003TeachingState(472).counter,null);
  for(const key of ['frameControl','activityTimelines','completion','keyTerms','playbackEndFrameByDomain'])assert.equal(key in G4_L3_IN003_TEXT_PRESENTATION,false);
});

test('source audio cues remain exact and English-only text does not change legacy ES rejection',()=>{
  const candidate=G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES['course-g04-l03-in-003'];
  assert.deepEqual(G4_L3_IN003_SOURCE_AUDIO_CUES,candidate.audioCues);
  assert.deepEqual(G4_L3_IN003_TEXT_PRESENTATION.sourceTimelineAudioCues,candidate.audioCues);
  assert.equal(G4_L3_IN003_SOURCE_AUDIO_CUES[0].frame,5);assert.equal(G4_L3_IN003_SOURCE_AUDIO_CUES[0].endFrame,473);
  assert.equal(G4_L3_IN003_SOURCE_AUDIO_CUES[0].sha256,'c8d354822d22b33c38559ab71c2d52276f18d16cd93f96de1239b3bb2f322795');
  assert.equal(candidate.audioTracks[0].sha256,'7a3cd30827262d18506f31114127012bd0a5b68dc5c7e37fe28b60693c3cff57');
  assert.ok(G4_L3_IN003_TEXT_BINDING.blocks.every(block=>block.language==='en'));
  assert.equal(getCourseG04L03In003FrameState(472,context(472,{lang:'es'})).blocker,'spanish-visual-and-audio-unvalidated');
  assert.equal(snapshot(472,{lang:'es'}).status,'blocked');
});


test('comparison-phase flashes remain on source axis operands without invented expression borders',async()=>{
  const source=await sourceMapPromise,semantic=await semanticMapPromise;
  const placed=(character:number,frame:number)=>source.instances.find((row:any)=>row.characterId===character&&inIntervals(frame,row.visibleIntervals));
  const lastMatrix=(row:any,frame:number)=>row.states.filter((state:any)=>state.frame<=frame).at(-1).matrix;
  const definition=(character:number)=>source.textDefinitions.find((row:any)=>row.characterId===character);
  const textY=(character:number,frame:number)=>{
    const matrix=lastMatrix(placed(character,frame),frame),bounds=definition(character).boundsTwips;
    assert.equal(matrix[1],0);assert.equal(matrix[2],0);
    return [bounds.top*matrix[3]+matrix[5],bounds.bottom*matrix[3]+matrix[5]];
  };
  // Positive emphasis reuses both the axis glyph definition geometry and the
  // exact axis placement; its role records a comparison teaching phase.
  for(const [emphasis,axis,countingFrame] of [[56,24,175],[60,28,194]] as const){
    assert.deepEqual(lastMatrix(placed(emphasis,337),337),lastMatrix(placed(axis,337),337));
    assert.deepEqual(lastMatrix(placed(emphasis,337),337),lastMatrix(placed(emphasis,countingFrame),countingFrame));
    assert.deepEqual(definition(emphasis).boundsTwips,definition(axis).boundsTwips);
    assert.deepEqual(definition(emphasis).matrix,definition(axis).matrix);
    assert.ok(textY(emphasis,337)[1]<textY(80,337)[0],'positive comparison expression is below the highlighted axis glyphs');
  }
  // Shape83 outlines the two negative axis operands. Its path's y coordinates
  // plus the current placement stay in the axis band, far above expression81.
  const shape=source.geometry.find((row:any)=>row.characterId===83);
  const coordinates=shape.paths.flatMap((value:string)=>(value.match(/-?\d+(?:\.\d+)?/g)??[]).map(Number));
  const ys=coordinates.filter((_:number,index:number)=>index%2===1);
  const matrix=lastMatrix(placed(83,411),411);
  const shapeY=[Math.min(...ys)*matrix[3]+matrix[5],Math.max(...ys)*matrix[3]+matrix[5]];
  assert.deepEqual(shapeY,[-43,275]);
  const axisY=textY(25,411),comparisonY=textY(81,411);
  assert.ok(shapeY[0]<axisY[1]&&shapeY[1]>axisY[0]);
  assert.deepEqual(comparisonY,[997,1388]);assert.ok(shapeY[1]<comparisonY[0]);
  for(const [frame,id,values] of [[337,'positive-comparison',[8,10]],[411,'negative-comparison',[-10,-8]]] as const){
    const state=getG4L3In003TeachingState(frame);
    assert.deepEqual(state.axisHighlightedValues,values);
    assert.equal(state.comparisons.find(row=>row.id===id)?.axisEmphasized,true);
    assert.ok(semantic.highlightInstances.filter((row:any)=>inIntervals(frame,row.visibleIntervals)).every((row:any)=>row.role===id));
    const markup=renderToStaticMarkup(<G4L3In003ModernRenderer {...context(frame)}/>);
    for(const value of values){
      const tick=`tick-${value<0?'negative':'positive'}-${Math.abs(value)}`;
      assert.match(markup,new RegExp(`<span[^>]*data-lesson-text-block="${tick}"[^>]*data-in003-highlight="true"`));
    }
    assert.doesNotMatch(markup,/<p[^>]*class="in003-comparison"[^>]*data-in003-highlight/);
  }
});
