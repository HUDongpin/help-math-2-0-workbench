import assert from 'node:assert/strict';
import test from 'node:test';
import {loadCanvasAsset} from '../src/source-static-canvas-candidate';

test('failed source script retries with a fresh element; concurrent callers share the attempt', async()=>{
 const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 let current:any=null;const appended:any[]=[];const registry:Record<string,unknown>={};
 const config={animationId:'course-retry-test',assetSource:'/retry.js',assetSha256:'a'.repeat(64)};
 Object.defineProperty(globalThis,'window',{configurable:true,value:{HELP_MATH_CANVAS_ASSETS:registry}});
 Object.defineProperty(globalThis,'document',{configurable:true,value:{baseURI:'http://localhost/',querySelector:()=>current,createElement:()=>{
  let src='';return {dataset:{},onload:null,onerror:null,integrity:'',crossOrigin:null,set src(v:string){src=new URL(v,'http://localhost/').href;},get src(){return src;},remove(){if(current===this)current=null;}};
 },head:{appendChild(s:any){current=s;appended.push(s);}}}});
 try {
  const first=loadCanvasAsset(config);assert.equal(loadCanvasAsset(config),first);
  const rejected=assert.rejects(first,/could not load/);appended[0].onerror();await rejected;
  assert.equal(current,null);
  const second=loadCanvasAsset(config);assert.equal(appended.length,2);assert.notEqual(appended[0],appended[1]);
  const missing=assert.rejects(second,/did not register/);appended[1].onload();await missing;assert.equal(current,null);
  const third=loadCanvasAsset(config);assert.equal(appended.length,3);registry[config.animationId]={render(){}};appended[2].onload();assert.equal(await third,registry[config.animationId]);
  assert.equal(await loadCanvasAsset(config),registry[config.animationId]);assert.equal(appended.length,3);
  current.integrity='changed';await assert.rejects(loadCanvasAsset(config),/mismatched integrity/);assert.equal(appended.length,3);
 }finally{
  if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else Reflect.deleteProperty(globalThis,'document');
  if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else Reflect.deleteProperty(globalThis,'window');
 }
});
