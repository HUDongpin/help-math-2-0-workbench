import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AudioEngine} from '../src/hfr/audio';
import {Renderer} from '../src/hfr/render';
function replace(t:any,key:string,value:any){const old=Object.getOwnPropertyDescriptor(globalThis,key);Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});t.after(()=>{if(old)Object.defineProperty(globalThis,key,old);else delete(globalThis as any)[key]})}
function audio(t:any,fetcher:any,decode:any=async()=>({duration:1})){
 replace(t,'fetch',fetcher);
 replace(t,'AudioContext',class {destination={};createGain(){return {gain:{value:1},connect(){}}}decodeAudioData=decode;});
 return new AudioEngine('/private/page/',12);
}
function renderer(t:any,fail:(src:string)=>boolean){
 replace(t,'document',{createElement:()=>({getContext:()=>({}),width:1,height:1})});
 replace(t,'Image',class {onload:any;onerror:any;set src(value:string){queueMicrotask(()=>fail(value)?this.onerror(new Error('image failed')):this.onload())}});
 return new Renderer({getContext:()=>({})} as any,'/private/page/');
}
test('HTTP audio failure rejects before decoding or reporting a ready buffer',async t=>{
 let decoded=false;const engine=audio(t,async()=>new Response('missing',{status:404}),async()=>{decoded=true;return {duration:1}});
 await assert.rejects(engine.preload(['media/main.mp3']),/required media media\/main.mp3/);
 assert.equal(decoded,false);assert.equal(engine.buffers.size,0);
});
test('malformed required audio rejects instead of silently playing without narration',async t=>{
 const engine=audio(t,async()=>new Response(new Uint8Array([1,2,3])),async()=>{throw new Error('unsupported audio')});
 await assert.rejects(engine.preload(['media/main.mp3']),/required media media\/main.mp3/);assert.equal(engine.buffers.size,0);
});
test('unreachable required audio rejects',async t=>{
 const engine=audio(t,async()=>{throw new Error('connection refused')});
 await assert.rejects(engine.preload(['media/main.mp3']),/required media media\/main.mp3/);
});
test('valid required audio is decoded once and cached by its exact source',async t=>{
 const calls:string[]=[];let decoded=0;
 const engine=audio(t,async(src:string)=>{calls.push(src);return new Response(new Uint8Array([1,2,3]))},async()=>{decoded++;return {duration:1}});
 await engine.preload(['media/main.mp3','media/main.mp3']);await engine.preload(['media/main.mp3']);
 assert.deepEqual(calls,['/private/page/media/main.mp3']);assert.equal(decoded,1);assert.equal(engine.buffers.size,1);
});
test('required bitmap failure rejects instead of a blank successful page',async t=>{
 const value=renderer(t,src=>src.endsWith('/image.png'));
 await assert.rejects(value.preload({dictionary:{7:{kind:'bitmap',src:'media/image.png'}}}),/HFR bitmap 7/);assert.equal(value.images.size,0);
});
test('required alpha bitmap failure rejects the corresponding bitmap',async t=>{
 const value=renderer(t,src=>src.endsWith('/alpha.png'));
 await assert.rejects(value.loadBitmap('7',{kind:'bitmap',src:'media/image.png',alpha:'media/alpha.png'}),/HFR bitmap 7/);assert.equal(value.images.size,0);
});
test('valid bitmap still resolves and remains available to the renderer',async t=>{
 const value=renderer(t,()=>false);await value.preload({dictionary:{7:{kind:'bitmap',src:'media/image.png'}}});assert.equal(value.images.size,1);
});
