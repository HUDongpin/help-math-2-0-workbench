import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement,act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import type {AnimationRendererProps} from '../contract';
import {Fq002AudioControls} from './g4-l3-fq002-audio-controls';
import {fq002AudioAsset} from './g4-l3-fq002-audio';

async function fixture(run:(f:any)=>Promise<void>){
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/'}),previous=new Map();
 for(const name of ['window','document','HTMLElement','HTMLButtonElement','HTMLSelectElement','Node','navigator','IS_REACT_ACT_ENVIRONMENT']){previous.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:(dom.window as any)[name]});}
 const doc=dom.window.document,root=createRoot(doc.getElementById('root')!),requests:any[]=[];
 let mounted=true,questionId=7,ready=true,runtime={lang:'en',uiLanguage:'en',audioEnabled:true,paused:false,replay:0,onLessonHostRequest:(request:any)=>{requests.push(request);}} as unknown as AnimationRendererProps;
 const render=async(patch:Partial<AnimationRendererProps>={},question=questionId,enabled=ready)=>{runtime={...runtime,...patch};questionId=question;ready=enabled;await act(async()=>root.render(createElement(Fq002AudioControls,{questionId,ready,runtime})));};
 const click=async(id:string)=>{const button=doc.querySelector<HTMLButtonElement>(`[data-fq002-audio="${id}"]`);assert(button,id);await act(async()=>button.click());};
 const unmount=async()=>{await act(async()=>root.unmount());mounted=false;};
 try{await render();await run({doc,requests,render,click,unmount,changeLanguage:async(value:string)=>{const select=doc.querySelector('select')!;await act(async()=>{select.value=value;select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});}});}
 finally{if(mounted)await act(async()=>root.unmount());dom.window.close();for(const[name,descriptor]of previous){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}}
}

test('mounted EN/ES question and answer controls request exact source IDs and pause/resume',async()=>fixture(async({doc,requests,render,click}:any)=>{
 for(const language of ['en','es'] as const){await render({uiLanguage:language,activeInteractiveAudioId:null,pausedInteractiveAudioId:null},25);
  for(const option of [null,'A','B','C','D'] as const){const id=fq002AudioAsset(25,language,option)!.id;requests.length=0;await click(id);assert.deepEqual(requests,[{type:'play-audio',cueId:id}]);
   await render({activeInteractiveAudioId:id,pausedInteractiveAudioId:null});assert.equal(doc.querySelector(`[data-fq002-audio="${id}"]`).getAttribute('data-audio-state'),'playing');requests.length=0;await click(id);assert.deepEqual(requests,[{type:'pause-audio',cueId:id}]);
   await render({activeInteractiveAudioId:null,pausedInteractiveAudioId:id});requests.length=0;await click(id);assert.deepEqual(requests,[{type:'resume-audio',cueId:id}]);await render({activeInteractiveAudioId:null,pausedInteractiveAudioId:null});
  }
 }
}));
test('question transition stops the previous question cue',async()=>fixture(async({requests,render}:any)=>{
 const id=fq002AudioAsset(7,'en','A')!.id;await render({activeInteractiveAudioId:id});requests.length=0;await render({},8);assert.deepEqual(requests,[{type:'stop-audio',cueId:id}]);
}));
test('old question cleanup cannot stop the new question already published by the host',async()=>fixture(async({requests,render}:any)=>{
 await render({activeInteractiveAudioId:fq002AudioAsset(7,'en','A')!.id});requests.length=0;
 await render({activeInteractiveAudioId:fq002AudioAsset(8,'en','B')!.id},8);assert.deepEqual(requests,[]);
}));
test('unmount and pause cannot control a cue belonging to another question',async()=>fixture(async({requests,render,unmount}:any)=>{
 await render({activeInteractiveAudioId:fq002AudioAsset(8,'en','B')!.id});requests.length=0;
 await render({paused:true});await unmount();assert.deepEqual(requests,[]);
}));
test('language change retires old audio and changes actual button cue identities',async()=>fixture(async({doc,requests,render,changeLanguage,click}:any)=>{
 const old=fq002AudioAsset(7,'en',null)!.id,next=fq002AudioAsset(7,'es',null)!.id;await render({activeInteractiveAudioId:old});requests.length=0;
 await changeLanguage('es');assert(requests.length>0&&requests.every((r:any)=>r.type==='stop-audio'&&r.cueId===old));assert.equal(doc.querySelector('[role="group"]').getAttribute('data-audio-language'),'es');
 requests.length=0;await click(next);assert.deepEqual(requests,[{type:'play-audio',cueId:next}]);
}));
test('Replay and unmount retire this question paused cue',async()=>fixture(async({requests,render,unmount}:any)=>{
 const id=fq002AudioAsset(7,'en','C')!.id;await render({pausedInteractiveAudioId:id});requests.length=0;await render({replay:1});assert.deepEqual(requests,[{type:'stop-audio',cueId:id}]);requests.length=0;await unmount();assert.deepEqual(requests,[{type:'stop-audio',cueId:id}]);
}));
test('unready, paused and publication-disabled controls cannot start audio',async()=>fixture(async({doc,requests,render,click}:any)=>{
 const id=fq002AudioAsset(7,'en',null)!.id;await render({},7,false);requests.length=0;await click(id);assert.deepEqual(requests,[]);assert(doc.querySelector('select').disabled);
 await render({paused:true},7,true);await click(id);assert.deepEqual(requests,[]);await render({audioEnabled:false});assert.equal(doc.querySelector('[role="group"]'),null);
}));
