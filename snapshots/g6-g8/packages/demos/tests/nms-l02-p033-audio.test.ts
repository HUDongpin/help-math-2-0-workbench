import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P033SourceAudio} from '../src/nms-l02-p033-audio-v1';
import {P033_AUDIO_SOURCES} from '../src/nms-l02-p033-audio-source-v1';
import {p033PrepareSourcePcm} from '../src/nms-l02-p033-audio-pcm-v1';
const T='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
function pcm(domain:string){const b=readFileSync(T+'/nms-l02-p033-behavior-source-v1/audio/measured-source-v1/sprite-'+domain+'/browser-full.f32le');return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}
test('all nine source buffers match independent full PCM plans including dormant wrong4',()=>{
 for(const[domain,source]of Object.entries(P033_AUDIO_SOURCES)){
  const samples=pcm(domain),prepared=p033PrepareSourcePcm(samples,domain);
  assert.deepEqual(Buffer.from(prepared.buffer),readFileSync(T+'/nms-l02-p033-audio-plans-v1/sprite-'+domain+'-prepared.f32le'));
  assert.deepEqual(prepared.subarray(source.outputStartSample,source.outputEndSample),samples.subarray(1673));
  assert.throws(()=>p033PrepareSourcePcm(samples.subarray(1),domain));
 }
 assert.throws(()=>p033PrepareSourcePcm(new Float32Array(5),'__proto__'));
});
class Clock {
 currentTime=0;sampleRate=22050;state='running';destination={};decodingDomain='';
 starts:Array<{offset:number;duration:number}>=[];
 async resume(){this.state='running';}
 async close(){this.state='closed';}
 createGain(){const gain={value:0,setValueAtTime(v:number){gain.value=v;}};return{gain,connect(){},disconnect(){}};}
 createBuffer(_channels:number,length:number,rate:number){const data=new Float32Array(length);return{length,sampleRate:rate,numberOfChannels:1,duration:length/rate,getChannelData:()=>data};}
 async decodeAudioData(){const data=pcm(this.decodingDomain);return{length:data.length,sampleRate:22050,numberOfChannels:1,getChannelData:()=>data};}
 createBufferSource(){const self=this;return{buffer:null,loop:false,onended:null,connect(){},disconnect(){},stop(){},start(_when:number,offset:number,duration:number){self.starts.push({offset,duration});}};}
}
test('full question interval and delayed feedback completion join the main PCM at its exact next sample boundary',async()=>{
 const c=new Clock(),reads:string[]=[];
 const e=new P033SourceAudio({seed:0,changed:()=>{},createContext:()=>c as unknown as AudioContext,read:async domain=>{reads.push(domain);c.decodingDomain=domain;const b=readFileSync(T+'/nms-l02-p033-behavior-source-v1/audio/sprite-'+domain+'/source-stream.mp3');return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);}});
 assert(await e.play());assert.equal(reads.length,8);assert(!reads.includes('112'));assert.deepEqual(c.starts[0],{offset:0,duration:130/12});
 c.currentTime=129.5/12;assert.equal(e.snapshot().state.phase,'intro');assert.equal(e.snapshot().state.mainFrame,130);
 c.currentTime=130/12;assert.equal(e.snapshot().phase,'waiting');assert.equal(e.snapshot().state.phase,'question');
 assert(e.openHelp());e.closeHelp();assert.equal(e.snapshot().phase,'paused');assert(await e.answer(2));assert.equal(e.snapshot().state.domain,'138');
 const branch=c.starts.at(-1)!;assert.equal(branch.offset,1/12);assert.equal(branch.duration,30/12);
 c.currentTime+=branch.duration+.047;const next=e.snapshot();assert.equal(next.state.domain,'221');assert.equal(next.state.mainFrame,131);assert.equal(next.fraction,0);
 const resumed=c.starts.at(-1)!;assert.equal(resumed.offset,130/12);assert.equal(c.starts[0].offset+c.starts[0].duration,resumed.offset);
 await e.close();assert.equal(c.state,'closed');
});
