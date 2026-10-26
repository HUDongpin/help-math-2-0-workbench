import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P038NativeTextCompanionV1,p038CanOpenGlossary,p038NativeTextState,
  type P038GlossaryKey} from '../src/native-text/alg-l06-p038-native';

const firstReady:Record<P038GlossaryKey,number>={
  Table:173,Input:212,Output:220,Equation:268,
  Rule:298,Graph:358,Function:402};

test('clip rectangle, full own blue label, and hit region delay each glossary control',()=>{
  for(const [key,first] of Object.entries(firstReady) as [P038GlossaryKey,number][]){
    const before=p038NativeTextState(first-1).glossary.find(v=>v.key===key);
    const ready=p038NativeTextState(first).glossary.find(v=>v.key===key);
    assert.equal(before?.sourceFullOwnLabelAndHit,false,key);
    assert.equal(ready?.sourceFullOwnLabelAndHit,true,key);
    assert.equal(ready?.buttonObjectId,
      {Table:49,Input:53,Output:52,Equation:57,Rule:60,Graph:64,Function:66}[key]);
  }
  assert.deepEqual(p038NativeTextState(166).glossary.filter(v=>v.sourceFullOwnLabelAndHit),[]);
  assert.equal(p038NativeTextState(166).activeMasks.length,1);
  assert.equal(p038NativeTextState(409).activeMasks.length,10);
});

test('source inventory preserves hidden, removed, ratio, and mask state',()=>{
  const before=p038NativeTextState(165),placed=p038NativeTextState(166);
  const hidden=p038NativeTextState(7).sourceInventory.find(v=>v.objectId===5);
  assert.equal(hidden?.sourceAlphaNumerator,0);
  assert.equal(hidden?.fullyUnclippedSourceGlyphs,false);
  assert(!before.sourceInventory.some(v=>v.objectId===49));
  const table=placed.sourceInventory.find(v=>v.objectId===49);
  assert(table);
  assert.equal(table.sourceRatio,165);
  assert.equal(table.sourceAlphaNumerator,256);
  assert.equal(table.fullyUnclippedSourceGlyphs,false);
  assert.deepEqual(table.sourceMaskInstanceIds,['depth-80/generation-1']);
  assert.equal(placed.sourceCanvasGlyphsPreserved,true);
  assert.deepEqual(placed.sourceCanvasGlyphSuppressionIds,[]);
  assert.equal(placed.sourceStageOverlayEnabled,false);
  assert.equal(placed.canvasAlignmentCalibrated,false);
  assert.throws(()=>p038NativeTextState(0),RangeError);
  assert.throws(()=>p038NativeTextState(410),RangeError);
});

test('companion retains English source glyphs and keyboard-native 44px controls',()=>{
  const early=renderToStaticMarkup(React.createElement(P038NativeTextCompanionV1,
    {frame:172,onGlossary:()=>true}));
  assert(!early.includes('data-p038-section="source-glossary-controls"'));
  const complete=renderToStaticMarkup(React.createElement(P038NativeTextCompanionV1,
    {frame:409,language:'es',onGlossary:()=>true}));
  assert(complete.includes('lang="en"'));
  assert(complete.includes('data-p038-language-policy="source-en-fallback"'));
  assert(complete.includes('data-p038-source-canvas-glyphs="preserved"'));
  assert(complete.includes('data-p038-canvas-alignment="uncalibrated"'));
  assert(complete.includes('data-p038-glossary-keys="Table,Output,Input,Equation,Rule,Graph,Function"'));
  assert(complete.includes('data-source-button-id="49"'));
  assert(complete.includes('data-source-button-id="66"'));
  assert(complete.includes('min-height:44px'));
  assert(complete.includes('picture of the function.'));
  assert(complete.includes('the output for any  '));
  assert.deepEqual(p038NativeTextState(409).fullyUnclippedNarrative.map(v=>v.objectId),
    [47,51,54,56,58,59,61,62,63,65]);
  assert(!complete.includes('data-source-text-id="29"'));
});

test('glossary dispatch guard rejects stale frame, foreign scope, disabled, or forged button',()=>{
  const attrs=new Map([['data-p038-glossary-key','Table'],
    ['data-source-button-id','49'],
    ['data-source-button-instance-id','depth-83/generation-1']]);
  const trigger={disabled:false,getAttribute:(key:string)=>attrs.get(key)??null} as unknown as HTMLButtonElement;
  const scope={contains:(node:unknown)=>node===trigger,
    getAttribute:(key:string)=>key==='data-p038-frame'?'173':null} as unknown as HTMLElement;
  assert.equal(p038CanOpenGlossary('Table',trigger,173,scope),true);
  assert.equal(p038CanOpenGlossary('Table',trigger,173,scope,p038NativeTextState(172)),false);
  assert.equal(p038CanOpenGlossary('Table',trigger,172,scope),false);
  assert.equal(p038CanOpenGlossary('Table',trigger,173,null),false);
  attrs.set('data-source-button-id','999');
  assert.equal(p038CanOpenGlossary('Table',trigger,173,scope),false);
  attrs.set('data-source-button-id','49');
  trigger.disabled=true;
  assert.equal(p038CanOpenGlossary('Table',trigger,173,scope),false);
});
