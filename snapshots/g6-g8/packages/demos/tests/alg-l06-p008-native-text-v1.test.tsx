import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P008NativeTextV1} from '../src/alg-l06-p008-native-text-v1';
const render=(frame:number,replay=0)=>renderToStaticMarkup(<P008NativeTextV1 frame={frame} replay={replay}/>);
test('masked answer pairs are withheld until both cells are fully revealed',()=>{
 for(const [cups,start] of [[80,796],[90,801],[100,806],[110,810]]){
  assert.doesNotMatch(render(start-1),new RegExp(`data-p008-row="cups-${cups}"`));
  assert.match(render(start),new RegExp(`data-p008-row="cups-${cups}"`));
 }
 assert.doesNotMatch(render(938),/data-p008-row="cups-80"/);
});
test('scene changes remove table and price pairs; Replay restores only initial content',()=>{
 assert.doesNotMatch(render(636),/data-p008-table|data-p008-price=/);
 assert.match(render(601),/data-p008-price="lemonade-price"/);
 assert.doesNotMatch(render(601),/data-p008-table|data-p008-price="orange-juice-price"/);
 const reset=render(1,1);
 assert.match(reset,/data-p008-text-replay="1"/);
 assert.equal((reset.match(/data-p008-row=/g)||[]).length,6);
 assert.equal((reset.match(/data-p008-price=/g)||[]).length,2);
 assert.doesNotMatch(reset,/data-p008-emphasis/);
});
test('native source emphasis preserves a single semantic quantity and valid table headers',()=>{
 const html=render(182);
 assert.match(html,/data-source-shape-ids="111"/);
 assert.equal((html.match(/>60</g)||[]).length,1);
 assert.equal((html.match(/scope="col"/g)||[]).length,2);
 assert.match(html,/data-p008-canvas-suppression="none"/);
 assert.match(renderToStaticMarkup(<P008NativeTextV1 frame={1} language="es"/>),/lang="en"/);
 assert.throws(()=>render(939),/P008_TEXT_FRAME_OUT_OF_RANGE/);
});
