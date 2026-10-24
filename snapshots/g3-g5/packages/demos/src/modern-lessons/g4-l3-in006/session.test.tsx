import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {createRequire} from 'node:module';
import type {AnimationRendererProps} from '../../contract';
import {In006ModernRenderer} from './index';
import {CORRECT_ACTIVITY,CORRECT_INSTANCE} from './interaction';
const require=createRequire(import.meta.url);const {JSDOM}=require('jsdom');

test('actual React session preserves clear/new/replay semantics and only current terminal child completes it',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
 const old=new Map<string,PropertyDescriptor|undefined>();for(const [name,value] of Object.entries({window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true})){
  old.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 }
 const root=createRoot(dom.window.document.getElementById('root'));let admitted=true,requests:string[][]=[],completions=0,completionAttempts=0,completionAllowed=false;
 let runtime:AnimationRendererProps={frame:1054,frameDomain:'sprite-151',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,replay:0,
  onLessonActivitiesRequest:rows=>{requests.push(rows.map(r=>r.id));return admitted;},onLessonCompletionRequest:()=>{completionAttempts++;if(completionAllowed)completions++;return completionAllowed;}};
 const render=async()=>act(async()=>root.render(<In006ModernRenderer {...runtime}/>));
 const find=(id:string)=>dom.window.document.querySelector(`[data-in006-focus-control="${id}"]`) as HTMLButtonElement;
 const click=async(id:string)=>act(async()=>find(id).click());
 try{
  await render();await click('jump-2');await click('place');assert.match(dom.window.document.body.textContent!,/-11 \+ 2 = -9/);
  // The complete page may revisit a teaching frame without resetting this question.
  runtime={...runtime,frame:1053};await render();assert.equal(find('place'),null);
  runtime={...runtime,frame:1054};await render();assert.match(dom.window.document.body.textContent!,/-11 \+ 2 = -9/);assert.equal(find('place').textContent,'Place +2 jump');
  // A pause preference does not reset answers or selection.
  runtime={...runtime,paused:true};await render();assert.equal(find('place').disabled,true);assert.match(dom.window.document.body.textContent!,/-11 \+ 2 = -9/);
  runtime={...runtime,paused:false};await render();await click('jump-1');admitted=false;await click('place');assert.equal(find('new-number').disabled,true);assert.match(dom.window.document.body.textContent!,/-11 \+ 2 = -9/);
  admitted=true;await click('place');assert.deepEqual(requests.at(-1),[CORRECT_ACTIVITY,'in006-correct-coach']);assert.equal(find('new-number').disabled,true);
  const child={id:CORRECT_ACTIVITY,sourceInstanceId:CORRECT_INSTANCE,frameDomain:'sprite-150',frame:24,revision:2,status:'playing' as const};
  runtime={...runtime,lessonActivities:[child]};await render();assert.equal(completions,0);
  assert.deepEqual(JSON.parse(dom.window.document.querySelector('[data-in006-source-activities]')!.getAttribute('data-in006-source-activities')!),[child]);
  runtime={...runtime,lessonActivities:[{...child,frame:25,status:'completed'}]};await render();assert.equal(find('new-number').disabled,false);assert.equal(completions,0);assert.equal(completionAttempts,1);assert.equal(dom.window.document.activeElement,find('new-number'));
  await render();assert.equal(completionAttempts,1); // no unbounded retries on unrelated repaint
  completionAllowed=true;runtime={...runtime,onLessonCompletionRequest:()=>{completionAttempts++;completions++;return true;}};await render();assert.equal(completions,1);assert.equal(completionAttempts,2);
  await render();assert.equal(completions,1);await click('new-number');assert.match(dom.window.document.body.textContent!,/First point: -8/);assert.equal(find('new-number').disabled,true);
  runtime={...runtime,replay:1,lessonActivities:[]};await render();assert.match(dom.window.document.body.textContent!,/First point: -11/);assert.equal(dom.window.document.querySelector('[data-lesson-text-block="equation"]'),null);
  await click('jump-2');await click('place');await click('jump-1');await click('place');await click('clear');
  runtime={...runtime,lessonActivities:[{...child,revision:20,frame:25,status:'completed'}]};await render();assert.equal(find('new-number').disabled,true);assert.equal(completions,1);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const [name,descriptor] of old){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}}
});
