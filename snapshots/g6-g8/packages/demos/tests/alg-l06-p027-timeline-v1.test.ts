import assert from 'node:assert/strict';
import test from 'node:test';
import {P027_TIMELINE,p027TimelineState} from '../src/alg-l06-p027-timeline-v1';

const firstFrame=(predicate:(frame:number)=>boolean)=>{
 for(let frame=1;frame<=770;frame++)if(predicate(frame))return frame;
 throw new Error('never active');
};

test('source root and sprite domains, all 17 definitions, and 36 text instances stay distinct',()=>{
 assert.equal(P027_TIMELINE.rootFrameCount,10);
 assert.equal(P027_TIMELINE.rootEntryFrame,6);
 assert.equal(P027_TIMELINE.frameDomain,'sprite-46');
 assert.equal(P027_TIMELINE.mainFrameCount,770);
 assert.equal(P027_TIMELINE.sourceSwfSha256,
  '689318e75aac8740344e8ff119df34a288e7da24dc3dc0c62c0f22601666f984');
 assert.deepEqual(P027_TIMELINE.definitions.map(def=>def.textId),
  [5,10,11,12,13,15,18,20,22,25,26,27,28,30,31,33,35]);
 assert.equal(P027_TIMELINE.nativeCandidateTextInstanceIds.length,36);
 assert.equal(p027TimelineState(1).textStates.length,0);
 assert.equal(p027TimelineState(770).frameDomain,'sprite-46');
 assert.throws(()=>p027TimelineState(0),/P027_FRAME_OUT_OF_RANGE/u);
 assert.throws(()=>p027TimelineState(771),/P027_FRAME_OUT_OF_RANGE/u);
 assert.throws(()=>p027TimelineState(1.5),/P027_FRAME_OUT_OF_RANGE/u);
});

test('moving masks govern full ink, partial glyphs, and graph labels',()=>{
 assert.deepEqual(P027_TIMELINE.instances.filter(row=>row.objectId===2&&row.clipDepth!==null)
  .map(row=>[row.depth,row.clipDepth]),[[1,10],[11,18],[19,24]]);
 assert.equal(p027TimelineState(2).activeMasks.length,1);
 assert.equal(p027TimelineState(66).activeMasks.length,2);
 assert.equal(p027TimelineState(195).activeMasks.length,3);
 assert(p027TimelineState(2).partialSourceTextInstances.some(row=>row.sourceTextId===5));
 assert(!p027TimelineState(64).nativeReadyTextInstances.some(row=>row.sourceTextId===5));
 assert(p027TimelineState(65).nativeReadyTextInstances.some(row=>row.sourceTextId===5));
 assert(p027TimelineState(66).partialSourceTextInstances.some(row=>row.sourceTextId===15));
 assert(p027TimelineState(194).nativeReadyTextInstances.some(row=>row.sourceTextId===15));
 assert(p027TimelineState(195).partialSourceTextInstances.some(row=>row.sourceTextId===20));
 assert.equal(firstFrame(frame=>p027TimelineState(frame).nativeReadyTextInstances.some(row=>row.sourceTextId===20)),248);
 assert(!p027TimelineState(265).nativeReadyTextInstances.some(row=>row.sourceTextId===25));
 assert(p027TimelineState(266).nativeReadyTextInstances.some(row=>row.sourceTextId===25));
 const paragraph=p027TimelineState(248).nativeReadyTextInstances.find(row=>row.sourceTextId===20);
 assert(paragraph);
 assert.equal(paragraph.partialGlyphCount,0);
 assert.equal(paragraph.runs[2].glyphs.at(-1)?.character,' ');
 assert.equal(paragraph.runs[2].visibleGlyphIndexes.length,paragraph.runs[2].glyphs.length,
  'trailing space has no ink to clip');
});

test('glossary dispatch waits for full hit and own blue glyphs, including split Vertical and Line',()=>{
 const first=new Map([
  ['Vertical-line test',16],['Graph',56],['Function',65],
  ['Vertical',153],['Line',156],['Point',217],
 ]);
 for(const [key,frame] of first){
  assert.equal(firstFrame(f=>p027TimelineState(f).glossary[key as keyof ReturnType<typeof p027TimelineState>['glossary']]),frame,key);
  const previous=p027TimelineState(frame-1).glossaryInstances.find(control=>control.key===key);
  const current=p027TimelineState(frame).glossaryInstances.find(control=>control.key===key);
  assert(previous&&current);
  assert.equal(previous.available,false);
  assert.equal(previous.ownBlueGlyphReady,false);
  assert.equal(current.available,true);
  assert.equal(current.hitRegionMaskReady,true);
  assert.equal(current.ownBlueGlyphReady,true);
  assert.equal(current.ownInkOverlap,true);
  assert(current.hitRegionTwips&&current.labelInkTwips);
 }
 const vertical=p027TimelineState(194).glossaryInstances.find(row=>row.key==='Vertical');
 const line=p027TimelineState(194).glossaryInstances.find(row=>row.key==='Line');
 assert(vertical&&line);
 assert.equal(vertical.label.sourceTextId,line.label.sourceTextId);
 assert.equal(vertical.label.glyphStart,0);
 assert.equal(line.label.glyphStart,9);
 assert.notDeepEqual(vertical.labelInkTwips,line.labelInkTwips);
});

test('every frame keeps Canvas source glyphs and declines whole-character suppression',()=>{
 for(let frame=1;frame<=770;frame++){
  const state=p027TimelineState(frame);
  assert.equal(state.canvasSourceGlyphsPreserved,true);
  assert.deepEqual(state.suppressibleSourceTextInstanceIds,[]);
  assert.equal(new Set(state.nativeReadyTextInstances.map(row=>row.instanceId)).size,
   state.nativeReadyTextInstances.length);
  for(const control of state.glossaryInstances.filter(row=>row.available)){
   assert(control.hitRegionMaskReady&&control.ownBlueGlyphReady&&control.ownInkOverlap);
   assert(control.sourceAlpha>0&&control.sourceLabelAlpha>0);
   assert.equal(control.sourceActionSha256.length,64);
  }
 }
 assert.equal(p027TimelineState(1).originalRuntimeAccepted,false);
});
