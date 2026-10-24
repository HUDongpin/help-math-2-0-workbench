import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../contract';
import {Fq002AudioControls} from './g4-l3-fq002-audio-controls';
import {fq002AudioAsset} from './g4-l3-fq002-audio';
const base={lang:'en',uiLanguage:'en',audioEnabled:true,onLessonHostRequest:()=>undefined} as AnimationRendererProps;
const render=(runtime:AnimationRendererProps,ready=true)=>renderToStaticMarkup(createElement(Fq002AudioControls,{questionId:7,ready,runtime}));
test('native speakers expose5 separate accessible controls and preserve publication gate',()=>{
 const html=render(base);assert.equal((html.match(/<button/g)??[]).length,5);assert.match(html,/Listen to question/);assert.match(html,/Listen to answer D/);
 assert.equal(render({...base,audioEnabled:false}),'');assert.equal(render({...base,onLessonHostRequest:undefined}),'');
 assert.equal((render(base,false).match(/<button[^>]*disabled=""/g)??[]).length,5);
});
test('Spanish audio controls express playing and paused states independently of source text language',()=>{
 const id=fq002AudioAsset(7,'es','B')!.id;
 assert.match(render({...base,uiLanguage:'es',activeInteractiveAudioId:id}),/Pausar opción B/);
 assert.match(render({...base,uiLanguage:'es',pausedInteractiveAudioId:id}),/Continuar opción B/);
 assert.match(render({...base,uiLanguage:'es',pausedInteractiveAudioId:id}),/data-audio-state="paused"/);
});
test('audio language selector is named and defaults to the interface language behind the same gate',()=>{
 for(const uiLanguage of ['en','es'] as const){
  const html=render({...base,uiLanguage});
  assert.match(html,/data-audio-language=/);
  assert.ok(html.includes(uiLanguage==='es'?'Idioma del audio':'Audio language'));
  assert.ok(html.includes(`<option lang="${uiLanguage}" value="${uiLanguage}" selected="">`));
  assert.match(html,/<option lang="en" value="en"/);assert.match(html,/<option lang="es" value="es"/);
  assert.match(render({...base,uiLanguage},false),/<select[^>]*disabled=""/);
  assert.match(render({...base,uiLanguage,paused:true}),/<select[^>]*disabled=""/);
 }
});
