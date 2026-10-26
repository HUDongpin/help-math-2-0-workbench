import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {build} from 'esbuild';
import {chromium, type Browser, type Page} from 'playwright';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {LessonRuntimeAdapterProps} from '../lib/lesson-runtime-adapter';
import {NmsL02P053LessonRuntimeV1} from '../components/nms-l02-p053-lesson-runtime-v1';

const ID='shared-nms002-l02-p053';
const pageErrors=new WeakMap<Page,string[]>();
const base={animationId:ID,moduleKey:ID,
 query:{frameDomain:'sprite-187',scenario:'source-directions-v1',lang:'en'},
 uiLanguage:'es'} as unknown as LessonRuntimeAdapterProps;

test('only the exact source context renders a paused, English-source direction scene',()=>{
 const html=renderToStaticMarkup(<NmsL02P053LessonRuntimeV1 {...base}/>);
 assert.match(html,/data-p053-runtime-status="contextual-candidate"/);
 assert.match(html,/data-p053-frame="1"/);
 assert.match(html,/data-p053-playing="false"/);
 assert.match(html,/data-p053-audio="idle"/);
 assert.match(html,/Escuchar instrucciones en inglés/);
 assert.match(html,/data-p053-text-id=/);
 assert.doesNotMatch(html,/<audio\b|data-p053-close|data-p053-popup="unresolved-after-close"/);
 for(const changed of [
  {animationId:'shared-nms002-l02-p054'}, {moduleKey:'shared-nms002-l02-p054'},
  {query:{...base.query,lang:'es'}},
  {query:{...base.query,frameDomain:'root'}},
  {query:{...base.query,scenario:'source-quiz-seeded'}},
 ]){
  const blocked=renderToStaticMarkup(<NmsL02P053LessonRuntimeV1 {...base} {...changed}/>);
  assert.match(blocked,/data-p053-runtime-status="blocked"/);
  assert.doesNotMatch(blocked,/data-p053-text-id=|data-p053-control=/);
 }
});

const harness=`import React from 'react';
import {createRoot} from 'react-dom/client';
import {NmsL02P053LessonRuntimeV1} from './apps/web/components/nms-l02-p053-lesson-runtime-v1';
const id='shared-nms002-l02-p053';
let root=null;
const events=[];
window.__p053Test={events,controls:null,
 mount(language='en'){
  root=createRoot(document.getElementById('root'));
  root.render(React.createElement(NmsL02P053LessonRuntimeV1,{
   animationId:id,moduleKey:id,
   query:{frameDomain:'sprite-187',scenario:'source-directions-v1',lang:'en'},
   uiLanguage:language,volume:0.5,
   connectRuntimeControls(controls){window.__p053Test.controls=controls;
    events.push(['connect']);return()=>{window.__p053Test.controls=null;events.push(['disconnect']);};},
   onRuntimePausedChange(paused){events.push(['paused',paused]);},
   onPlaybackStateChange(state){events.push(['playback',state.frame,state.narration]);},
   onLessonHostRequest(request){events.push(['host-request',request]);},
  }));
 },
 unmount(){root.unmount();root=null;},
};`;

async function browserHarness(browser:Browser):Promise<Page>{
 const page=await browser.newPage();
 const errors:string[]=[];pageErrors.set(page,errors);
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('http://127.0.0.1:3332/p053-runtime-test',route=>route.fulfill({
  status:200,contentType:'text/html',body:'<!doctype html><html><body><div id="root"></div></body></html>',
 }));
 await page.goto('http://127.0.0.1:3332/p053-runtime-test');
 const result=await build({stdin:{contents:harness,resolveDir:path.resolve('.'),
  sourcefile:'p053-runtime-browser-harness.tsx',loader:'tsx'},bundle:true,
  platform:'browser',format:'iife',write:false,jsx:'automatic',logLevel:'silent'});
 await page.addScriptTag({content:result.outputFiles[0]!.text});
 return page;
}
async function closeChecked(page:Page):Promise<void>{
 const errors=pageErrors.get(page);
 await page.close();
 assert.deepEqual(errors,[]);
}

test('mounted adapter obeys host pause, narration, source hold and cleanup',async t=>{
 const chrome=process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 assert.ok(existsSync(chrome),`Chrome is required for the mounted adapter test: ${chrome}`);
 const browser=await chromium.launch({headless:true,executablePath:chrome});
 t.after(()=>browser.close());

 await t.test('early Start requests same-page reload and resets the candidate',async()=>{
  const page=await browserHarness(browser);
  try{
   await page.evaluate('window.__p053Test.mount("es")');
   await page.locator('[data-p053-runtime-status="contextual-candidate"]').waitFor();
   await page.locator('[data-p053-control="mcL2"]').click();
   await page.locator('[data-p053-control="mcStart"]').click();
   const result=await page.evaluate<{events:unknown[][];frame:string;level:string}>('({events:window.__p053Test.events,frame:document.querySelector("[data-p053-frame]").dataset.p053Frame,level:document.querySelector("[data-p053-level]").dataset.p053Level})');
   assert.deepEqual(result.events.filter((event:unknown[])=>event[0]==='host-request')
    .map((event:unknown[])=>event[1]),[{type:'navigate',targetAnimationId:ID}]);
   assert.equal(result.frame,'1');assert.equal(result.level,'none');
  }finally{await closeChecked(page);}
 });

 await t.test('transport and narration pause the picture; unmount cancels callbacks',async()=>{
  const page=await browserHarness(browser);
  try{
   await page.evaluate(`window.fetch=(_input,init)=>new Promise((_resolve,reject)=>{
    init.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
   });window.__p053Test.mount('es');`);
   await page.locator('[data-p053-runtime-status="contextual-candidate"]').waitFor();
   await page.evaluate('window.__p053Test.controls.setPaused(false)');
   await page.locator('[data-p053-playing="true"]').waitFor();
   await page.getByRole('button',{name:'Escuchar instrucciones en inglés'}).click();
   await page.locator('[data-p053-audio="loading"][data-p053-playing="false"]').waitFor();
   await page.evaluate('window.__p053Test.controls.setPaused(false)');
   await page.locator('[data-p053-audio="idle"][data-p053-playing="true"]').waitFor();
   await page.evaluate('window.__p053Test.controls.setPaused(true)');
   await page.locator('[data-p053-playing="false"]').waitFor();
   await page.evaluate('window.__p053Test.controls.setPaused(false)');
   await page.locator('[data-p053-playing="true"]').waitFor();
   const before=await page.evaluate('window.__p053Test.events.length');
   await page.evaluate('window.__p053Test.unmount()');
   await page.waitForTimeout(150);
   const after=await page.evaluate('window.__p053Test.events.slice('+before+')');
   assert.deepEqual(after,[['disconnect']]);
   assert.equal(await page.locator('[data-p053-runtime-status]').count(),0);
  }finally{await closeChecked(page);}
 });

 await t.test('held-frame popup disables source controls and close enters explicit hold',async()=>{
  const page=await browserHarness(browser);
  try{
   await page.clock.install();
   await page.evaluate('window.__p053Test.mount()');
   await page.locator('[data-p053-runtime-status="contextual-candidate"]').waitFor();
   await page.evaluate('window.__p053Test.controls.setPaused(false)');
   await page.clock.runFor(1000);
   await page.locator('[data-p053-control="mcSkip"]').waitFor();
   await page.locator('[data-p053-control="mcSkip"]').click();
   await page.locator('section[data-p053-frame="693"]').waitFor();
   await page.locator('[data-p053-control="mcRepeat"]').click();
   await page.locator('[data-p053-popup="true"]').waitFor();
   assert.equal(await page.locator('[data-p053-control]:disabled').count(),4);
   await page.locator('[data-p053-control="mcStart"]').dispatchEvent('mouseenter');
   assert.equal(await page.locator('[data-p053-popup="true"]').count(),1);
   await page.locator('[data-p053-close]').click();
   await page.locator('[data-p053-popup="unresolved-after-close"]').waitFor();
   assert.equal(await page.locator('.p053-hold[role="alert"]').count(),1);
   assert.equal(await page.locator('svg[data-p053-source-scene]').count(),0);
   assert.equal(await page.locator('[data-p053-control]').count(),0);
  }finally{await closeChecked(page);}
 });
});
