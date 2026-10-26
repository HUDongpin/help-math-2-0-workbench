import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {P052Player} from '../src/nms-l02-p052-player-v1';
import {createP052BrowserController} from '../src/nms-l02-p052-browser-controller-v1';
test('SSR is a bilingual pending state without starting audio or advertising ready playback',()=>{
 for(const language of ['en','es'] as const){
  const html=renderToStaticMarkup(<P052Player language={language} paused={false} onComplete={()=>assert.fail('SSR completion')}/>);
  assert.match(html,/role="status"/);assert.ok(html.includes(language==='es'?'Cargando':'Loading'));
  assert.doesNotMatch(html,/<button|<audio|source-audio/);
 }
});
test('browser controller construction and teardown before activation require no browser audio globals',async()=>{
 const c=createP052BrowserController(()=>{},17);assert.equal(c.snapshot().started,false);assert.equal(c.snapshot().state.seed,17);
 c.setVolume(.5);c.setNarration(false);await c.close();assert.equal(c.snapshot().closed,true);
});
