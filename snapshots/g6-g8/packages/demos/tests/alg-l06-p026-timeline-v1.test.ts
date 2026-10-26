import assert from 'node:assert/strict';
import test from 'node:test';
import {P026_TIMELINE,p026TimelineState} from '../src/alg-l06-p026-timeline-v1';

const IDs=[6,12,15,17,20,23,26,27,28,30];
const firstFrame=(predicate:(frame:number)=>boolean)=>{
 for(let frame=1;frame<=389;frame++)if(predicate(frame))return frame;
 throw new Error('never active');
};

test('root, nested domain, source geometry, and letter fallback remain distinct',()=>{
 assert.equal(P026_TIMELINE.rootFrameCount,10);
 assert.equal(P026_TIMELINE.rootEntryFrame,6);
 assert.equal(P026_TIMELINE.frameDomain,'sprite-55');
 assert.equal(P026_TIMELINE.mainFrameCount,389);
 assert.equal(P026_TIMELINE.sourceSwfSha256,'a61e60f95dc597c7b0024e7f013abfade47e199ae911be77916d5b38c7828e0c');
 const independent=P026_TIMELINE.definitions.find(def=>def.textId===6)?.runs.find(run=>run.text==='independent variable');
 assert(independent);
 assert.equal(independent.glyphs.length,20);
 assert.equal(independent.glyphs.reduce((sum,glyph)=>sum+glyph.advance,0),independent.width);
 const projected=p026TimelineState(6).nativeParagraphs.find(p=>p.sourceTextId===6)?.runs.find(run=>run.text==='independent variable');
 assert(projected);
 assert.equal(projected.glyphAdvanceBoxesTwips.length,20);
 assert.equal(projected.glyphAdvanceBoxesTwips[0].left,projected.ink.left);
 assert.deepEqual(p026TimelineState(1).nativeParagraphs,[]);
 assert.deepEqual(p026TimelineState(2).nativeParagraphs,[]);
 assert.equal(p026TimelineState(2).paragraphStates.find(p=>p.sourceTextId===6)?.alpha,0);
 assert.equal(p026TimelineState(3).paragraphStates.find(p=>p.sourceTextId===6)?.alpha,0.25);
 assert.equal(p026TimelineState(6).paragraphStates.find(p=>p.sourceTextId===6)?.alpha,1);
 assert.equal(p026TimelineState(199).canvasFallbackTextInstanceIds.length,0);
 assert.equal(p026TimelineState(200).canvasFallbackTextInstanceIds.length,31);
 assert.equal(p026TimelineState(253).canvasFallbackTextInstanceIds.length,31);
 assert.equal(p026TimelineState(254).canvasFallbackTextInstanceIds.length,0);
 assert.equal(p026TimelineState(262).canvasFallbackTextInstanceIds.length,2);
 assert.equal(p026TimelineState(319).canvasFallbackTextInstanceIds.length,2);
 assert.equal(p026TimelineState(320).canvasFallbackTextInstanceIds.length,0);
 for(const frame of [329,331,333,335])assert.equal(p026TimelineState(frame).canvasFallbackTextInstanceIds.length,1);
 for(const frame of [330,332,334,336])assert.equal(p026TimelineState(frame).canvasFallbackTextInstanceIds.length,0);
 assert.throws(()=>p026TimelineState(0),/P026_FRAME_OUT_OF_RANGE/u);
 assert.throws(()=>p026TimelineState(390),/P026_FRAME_OUT_OF_RANGE/u);
});

test('full paragraph ownership follows authored replacement and both moving masks',()=>{
 const expected=new Map([[6,3],[12,3],[15,19],[17,31],[20,80],[23,131],[26,145],[27,145],[28,147],[30,161]]);
 for(const id of IDs){
  assert.equal(firstFrame(frame=>p026TimelineState(frame).nativeParagraphs.some(p=>p.sourceTextId===id)),expected.get(id),`text ${id}`);
 }
 assert.deepEqual(p026TimelineState(18).suppressibleSourceTextIds,[6,12]);
 assert.deepEqual(p026TimelineState(19).suppressibleSourceTextIds,[6,15]);
 assert.deepEqual(p026TimelineState(30).suppressibleSourceTextIds,[6,15]);
 assert.deepEqual(p026TimelineState(31).suppressibleSourceTextIds,[17,15]);
 assert.deepEqual(p026TimelineState(80).suppressibleSourceTextIds,[17,15,20]);
 assert.deepEqual(p026TimelineState(81).suppressibleSourceTextIds,[17,15,20]);
 assert.deepEqual(p026TimelineState(131).suppressibleSourceTextIds,[17,15,20,23]);
 assert.deepEqual(p026TimelineState(145).suppressibleSourceTextIds,[17,15,26,27]);
 assert.deepEqual(p026TimelineState(147).suppressibleSourceTextIds,[17,15,26,28]);
 assert.deepEqual(p026TimelineState(161).suppressibleSourceTextIds,[17,15,30,28]);
 for(let frame=1;frame<=389;frame++){
  const state=p026TimelineState(frame);
  assert.equal(new Set(state.suppressibleSourceTextInstanceIds).size,state.suppressibleSourceTextInstanceIds.length);
  for(const instance of state.suppressibleSourceTextInstanceIds)assert(state.nativeParagraphs.some(p=>p.instanceId===instance));
  for(const instance of state.canvasFallbackTextInstanceIds)assert(!state.suppressibleSourceTextInstanceIds.includes(instance));
 }
});

test('seven source actions dispatch only from visible own blue label and current hit instance',()=>{
 const expected=new Map([
  ['Independent variable',3],['Function',3],['Input variable',3],['Domain',3],
  ['Dependent variable',51],['Output variable',68],['Range',131],
 ]);
 for(const [key,frame] of expected){
  assert.equal(firstFrame(f=>p026TimelineState(f).glossary[key as keyof ReturnType<typeof p026TimelineState>['glossary']]),frame,key);
  assert.equal(p026TimelineState(frame-1).glossary[key as keyof ReturnType<typeof p026TimelineState>['glossary']],false,key);
 }
 assert.equal(p026TimelineState(50).glossary['Dependent variable'],false);
 assert.equal(p026TimelineState(67).glossary['Output variable'],false);
 assert.equal(p026TimelineState(130).glossary.Range,false);
 for(const [frame,key] of [[50,'Dependent variable'],[67,'Output variable'],[130,'Range']] as const){
  const control=p026TimelineState(frame).glossaryInstances.find(row=>row.key===key&&row.sourceAlpha>0);
  assert(control,`${key} button is source-present at ${frame}`);
  assert.equal(control.hitRegionMaskReady,false,`${key} full hit remains clipped at ${frame}`);
  assert.equal(control.available,false);
 }
 const at80=p026TimelineState(80).glossaryInstances.filter(g=>g.key==='Function'&&g.available);
 assert.equal(at80.length,2);
 assert.notEqual(at80[0].instanceId,at80[1].instanceId);
 assert.notEqual(at80[0].label.textInstanceId,at80[1].label.textInstanceId);
 assert.equal(p026TimelineState(146).glossary.Range,true);
 assert.equal(p026TimelineState(147).glossary.Range,false);
 assert.equal(p026TimelineState(148).glossary.Range,true);
 const staleRange=p026TimelineState(147).glossaryInstances.find(row=>row.key==='Range'&&row.sourceAlpha>0);
 assert(staleRange);
 assert.equal(staleRange.sourceLabelAlpha,0,'old Range button remains but its own text instance is replaced');
 for(let frame=1;frame<=389;frame++){
  const state=p026TimelineState(frame);
  for(const control of state.glossaryInstances.filter(row=>row.available)){
   assert(control.labelInkTwips&&control.hitRegionTwips);
   assert.equal(control.hitRegionMaskReady,true);
   assert.equal(control.ownInkOverlap,true);
   assert(control.sourceAlpha>0&&control.sourceLabelAlpha>0);
   assert.equal(control.sourceActionSha256.length,64);
   assert(state.paragraphStates.some(p=>p.instanceId===control.label.textInstanceId&&
    p.runs.some(run=>run.sourceTextId===control.label.sourceTextId&&run.colorRgb.join(',')==='0,0,204'&&run.maskReady)));
  }
 }
});
