import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import source from '../../../../migrations/shared-alg001-l06-p034/native-v1/geometry-v1.json';
import {P034NativeTextV1,p034NativeTextState} from './alg-l06-p034-native';

test('source-reveal masks gate complete native text at actual timeline beats',()=>{
  const at1=p034NativeTextState(1),at74=p034NativeTextState(74),
    at124=p034NativeTextState(124),at185=p034NativeTextState(185);
  assert.equal(at1.activeMasks.length,1);
  assert.deepEqual(at1.nativeReadyTextInstances.map(v=>v.sourceTextId),[]);
  assert.deepEqual(at74.nativeReadyTextInstances.map(v=>v.sourceTextId),[5]);
  assert.deepEqual(at124.nativeReadyTextInstances.map(v=>v.sourceTextId),[5,12]);
  assert.deepEqual(at185.nativeReadyTextInstances.map(v=>v.sourceTextId),[5,12,15]);
  assert.equal(at185.partialSourceTextInstances.length,0);
});

test('graph-label ownership switches from direct placements to nested graph at 433',()=>{
  const before=p034NativeTextState(432),after=p034NativeTextState(433);
  const prior=before.activeTextInstances.filter(v=>v.role==='graph-label');
  const next=after.activeTextInstances.filter(v=>v.role==='graph-label');
  assert.equal(prior.length,19);assert.equal(next.length,19);
  assert(prior.every(v=>v.ownerSpriteId===40));
  assert(next.every(v=>v.ownerSpriteId===36));
  assert.equal(after.activeMasks.length,6);
  assert.deepEqual(after.suppressibleSourceTextInstanceIds,[]);
  assert.equal(after.canvasSourceGlyphsPreserved,true);
  assert.throws(()=>p034NativeTextState(0),RangeError);
  assert.throws(()=>p034NativeTextState(435),RangeError);
});

test('alpha-only source updates retain graph label matrix across fade frames',()=>{
  const label=source.instances.find(row=>row.ownerSpriteId===40&&row.objectId===24&&row.depth===10);
  assert(label);
  const at219=label.runs.find(run=>run.firstFrame<=219&&219<=run.lastFrame);
  const at220=label.runs.find(run=>run.firstFrame<=220&&220<=run.lastFrame);
  assert(at219&&at220);
  assert.deepEqual(at219.state.transform,
    {scaleX:0.661468505859375,scaleY:0.661468505859375,transX:-640,transY:-300});
  assert.deepEqual(at220.state.transform,at219.state.transform);
  assert.equal(at219.state.alpha,0);
  assert.equal(at220.state.alpha,37);
});

test('Spanish view clearly retains authored English text and physical source identity',()=>{
  const html=renderToStaticMarkup(React.createElement(P034NativeTextV1,
    {frame:433,language:'es'}));
  assert(html.includes('lang="en"'));
  assert(html.includes('data-p034-language-policy="source-en-fallback"'));
  assert(html.includes(`data-p034-source-sha256="${source.source.sha256}"`));
  assert(html.includes('data-p034-source-canvas-glyphs="preserved"'));
  assert(html.includes('Use the vertical-line test'));
  assert(html.includes('data-p034-graph-label-policy="canvas-only-native-inventory-retained"'));
  assert(!html.includes('data-p034-text-role="graph-labels"'));
  assert(!html.includes('data-source-text-id="24"'));
  assert(!html.includes('data-source-text-id="25"'));
  assert(!html.includes('data-source-text-id="26"'));
  assert(!html.includes('data-source-text-id="27"'));
  assert(!html.includes('data-source-text-id="28"'));
});

test('glossary controls follow revealed source labels without replacing native prose or graph labels',()=>{
  const early=renderToStaticMarkup(React.createElement(P034NativeTextV1,
    {frame:1,onOpenGlossary:()=>true}));
  assert(!early.includes('data-p034-section="source-glossary-controls"'));
  const first=renderToStaticMarkup(React.createElement(P034NativeTextV1,
    {frame:20,onOpenGlossary:()=>true}));
  assert(first.includes('data-source-button-id="7"'));
  assert(!first.includes('data-source-button-id="8"'));
  const complete=renderToStaticMarkup(React.createElement(P034NativeTextV1,
    {frame:433,onOpenGlossary:()=>true}));
  assert(complete.includes('data-p034-glossary-button-ids="7,8,9,20,21"'));
  assert(complete.includes('data-source-button-instance-id="depth-38/generation-1"'));
  assert(complete.includes('data-source-label-segment="function"'));
  assert(complete.includes('Use the vertical-line test'));
  assert(!complete.includes('data-source-text-id="24"'));
  assert(complete.includes('data-p034-source-canvas-glyphs="preserved"'));
});
