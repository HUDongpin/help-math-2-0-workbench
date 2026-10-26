import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {P034SourceAudio} from '../src/nms-l02-p034-audio-v1';
import {p034PrepareSourcePcm} from '../src/nms-l02-p034-audio-pcm-v1';
import {P034_AUDIO_SOURCES as SOURCES} from '../src/nms-l02-p034-audio-source-v1';
const T='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
const plans=JSON.parse(readFileSync(T+'/nms-l02-p034-audio-plans-v1/receipt.json','utf8'));
const pcm=(domain:string)=>{const b=readFileSync(T+'/nms-l02-p034-behavior-source-v1/audio/measured-source-v1/sprite-'+domain+'/browser-full.f32le');return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
function fixture(){
 const nodes:Array<{stopped:boolean;onended:(()=>void)|null;offset?:number;duration?:number;stop():void;disconnect():void;connect():void;start(when:number,offset:number,duration:number):void;buffer:unknown}>=[];let contexts=0;const reads:string[]=[];
 const gain={value:.8,setValueAtTime(v:number){gain.value=v}};
 const context={currentTime:0,sampleRate:22050,state:'running',resume:async()=>{},close:async()=>{context.state='closed'},createGain:()=>({gain,connect(){},disconnect(){}}),createBuffer:(_channels:number,length:number)=>{const data=new Float32Array(length);return{duration:length/22050,getChannelData:()=>data}},decodeAudioData:async(bytes:ArrayBuffer)=>{const id=Object.keys(SOURCES).find(id=>SOURCES[id as keyof typeof SOURCES].sourceBytes===bytes.byteLength)!;const data=pcm(id);return{sampleRate:22050,numberOfChannels:1,length:data.length,getChannelData:()=>data}},createBufferSource:()=>{const node={stopped:false,onended:null as (()=>void)|null,buffer:null as unknown,stop(){node.stopped=true},disconnect(){},connect(){},start(_when:number,offset:number,duration:number){Object.assign(node,{offset,duration})}};nodes.push(node);return node}};
 const engine=new P034SourceAudio({seed:0,changed:()=>{},createContext:()=>{contexts++;return context as unknown as AudioContext},read:async domain=>{reads.push(domain);const b=readFileSync(T+'/nms-l02-p034-behavior-source-v1/audio/sprite-'+domain+'/source-stream.mp3');return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}});
 return{engine,context,nodes,reads,gain,contexts:()=>contexts};
}
test('both whole-stream PCM buffers match independent source plans byte for byte',()=>{
 for(const p of plans.streams){const id=p.frameDomain.split('-')[1],actual=p034PrepareSourcePcm(pcm(id),id),expected=readFileSync(p.prepared.path);assert.deepEqual(Buffer.from(actual.buffer),expected);}
});
test('full395interval retains source PCM, paused offsets and practice hold',async()=>{
 const {engine,context,nodes,reads,contexts}=fixture();assert(await engine.play());assert.equal(nodes[0].duration,395/12);
 context.currentTime=8.29;const before=engine.snapshot();engine.pause();context.currentTime+=5;assert.equal(engine.snapshot().state.mainFrame,before.state.mainFrame);assert(await engine.play());assert(Math.abs(nodes.at(-1)!.offset!-8.29)<1e-8);
 context.currentTime=5+395/12-.01;assert.equal(engine.snapshot().state.mainFrame,395);assert.equal(engine.snapshot().state.phase,'intro');assert.equal(engine.setValue(100),false);
 context.currentTime=5+395/12;assert.equal(engine.snapshot().phase,'waiting');assert.equal(engine.snapshot().state.value,15);assert(engine.setValue(100));context.currentTime+=10;assert.equal(engine.snapshot().state.mainFrame,395);assert.equal(engine.snapshot().state.value,100);
 assert(await engine.replay());assert.equal(engine.snapshot().state.mainFrame,1);assert.equal(engine.snapshot().state.replay,1);assert.equal(reads.length,2);assert.equal(contexts(),1);await engine.close();assert.equal(context.state,'closed');assert(nodes.every(n=>n.stopped));
});
test('Reset cue is independent, cancel wins a pending resume, and master volume covers both streams',async()=>{
 const {engine,context,nodes,gain}=fixture();await engine.play();context.currentTime=395/12;engine.snapshot();engine.setValue(73);
 assert(await engine.pressReset());assert.equal(engine.snapshot().resetSoundPlaying,true);assert.equal(engine.snapshot().state.value,73);const cue=nodes.at(-1)!;assert.equal(cue.duration,SOURCES['167'].totalSamples/22050);assert.equal(await engine.pressReset(),false);
 engine.setVolume(0);assert.equal(gain.value,0);engine.cancelReset();assert(cue.stopped);assert.equal(engine.snapshot().state.value,73);assert.equal(engine.snapshot().resetSoundPlaying,false);
 let resolve!:()=>void;context.resume=()=>new Promise<void>(r=>resolve=r);const count=nodes.length,pending=engine.pressReset();engine.cancelReset();resolve();assert.equal(await pending,false);assert.equal(nodes.length,count);
 context.resume=async()=>{};await engine.pressReset();engine.reset();assert.equal(engine.snapshot().state.value,0);assert.equal(engine.snapshot().resetSoundPlaying,false);assert.equal(engine.snapshot().state.mainFrame,395);
 engine.setVolume(.7);assert.equal(gain.value,.7);engine.setNarrationEnabled(false);await engine.pressReset();assert.equal(engine.snapshot().resetSoundPlaying,true);engine.pause();assert.equal(engine.snapshot().resetSoundPlaying,false);assert.equal(engine.snapshot().state.resetPressed,false);await engine.close();
});
test('glossary preserves clock position and narration-off still advances',async()=>{
 const {engine,context}=fixture();await engine.play();engine.setNarrationEnabled(false);context.currentTime=338/12;assert.equal(engine.snapshot().state.mainFrame,339);assert(engine.openTerm());context.currentTime+=8;assert.equal(engine.snapshot().state.mainFrame,339);assert.equal(await engine.play(),false);assert(engine.closeTerm());assert.equal(engine.snapshot().phase,'paused');await engine.play();context.currentTime+=(395-338)/12;assert.equal(engine.snapshot().phase,'waiting');await engine.close();
});
test('bad source bytes fail closed and pause does not clear a failed phase',async()=>{
 const f=fixture();const engine=new P034SourceAudio({seed:0,changed:()=>{},createContext:()=>f.context as unknown as AudioContext,read:async domain=>new ArrayBuffer(SOURCES[domain as keyof typeof SOURCES].sourceBytes)});
 assert.equal(await engine.play(),false);assert.equal(engine.snapshot().phase,'failed');assert.equal(engine.snapshot().failure,'P034_AUDIO_HASH');engine.pause();assert.equal(engine.snapshot().phase,'failed');assert.equal(f.nodes.length,0);await engine.close();assert.equal(f.context.state,'closed');
});
test('close invalidates an in-flight read even if the reader ignores cancellation',async()=>{
 const f=fixture();let resolve!:(b:ArrayBuffer)=>void,entered!:(d:string)=>void;const started=new Promise<string>(r=>entered=r);
 const engine=new P034SourceAudio({seed:0,changed:()=>{},createContext:()=>f.context as unknown as AudioContext,read:domain=>{entered(domain);return new Promise<ArrayBuffer>(r=>resolve=r)}});
 const playing=engine.play(),domain=await started;await engine.close();const b=readFileSync(T+'/nms-l02-p034-behavior-source-v1/audio/sprite-'+domain+'/source-stream.mp3');resolve(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));assert.equal(await playing,false);assert.equal(engine.snapshot().phase,'closed');assert.equal(f.context.state,'closed');assert.equal(f.nodes.length,0);
});
