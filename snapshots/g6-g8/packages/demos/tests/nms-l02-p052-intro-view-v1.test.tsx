import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {P052IntroView,p052IntroText} from '../src/nms-l02-p052-intro-view-v1';
import {p052IntroScene} from '../src/nms-l02-p052-intro-scene-v1';
test('all228 frame-language text projections bind every main source text and exact alpha',()=>{
 for(const language of ['en','es'] as const)for(let frame=1;frame<=114;frame++){
  const state=p052IntroText(frame,language),scene=p052IntroScene(frame);
  const source=scene.filter(o=>o.kind==='text'&&![157,158,159].includes(o.characterId));
  assert.deepEqual(state.labels.map(l=>[l.path,l.sourceId,l.alpha]),source.map(o=>[o.path,o.characterId,o.alpha]));
  assert.equal(state.promptAlpha,scene.find(o=>o.characterId===157)?.alpha??0);
  for(const l of state.labels)assert.ok(Number.isFinite(l.left)&&Number.isFinite(l.top));
 }
});
test('counter follows source rise, hold and descent rather than answer75',()=>{
 assert.equal(p052IntroText(31,'en').digits,null);
 for(let f=32;f<=47;f++)assert.equal(p052IntroText(f,'en').digits,String(f-31).padStart(3,'0'));
 for(let f=47;f<=61;f++)assert.equal(p052IntroText(f,'en').digits,'016');
 for(let f=62;f<=77;f++)assert.equal(p052IntroText(f,'en').digits,String(77-f).padStart(3,'0'));
 assert.equal(p052IntroText(114,'en').digits,'000');
});
test('prompt and demonstration-control alpha differ and must not be conflated',()=>{
 assert.equal(p052IntroText(2,'en').promptAlpha,0);assert.equal(p052IntroText(3,'en').promptAlpha,0.19921875);
 const state=p052IntroText(7,'en');assert.equal(state.labels.find(l=>l.sourceId===168)?.alpha,0);
 assert.equal(state.labels.find(l=>l.sourceId===170)?.alpha,1);
});
test('both languages render actual HTML and no active practice controls during demonstration',()=>{
 for(const language of ['en','es'] as const){const html=renderToStaticMarkup(<P052IntroView frame={47} language={language}/>);
  assert.ok(html.includes(language==='en'?'Question 10':'Pregunta 10'));
  assert.ok(html.includes(language==='en'?'16% shaded: 16 of 100 squares.':'16% coloreado: 16 de 100 cuadrados.'));
  assert.ok(html.includes(language==='en'?'>Done<':'>Listo<'));
  assert.doesNotMatch(html,/<button|<input|<text/);assert.match(html,/data-p052-source-text="157 159"/);
 }
});
