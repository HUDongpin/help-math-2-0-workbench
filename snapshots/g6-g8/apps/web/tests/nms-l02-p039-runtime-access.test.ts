import assert from'node:assert/strict';import test from'node:test';
import{isP039RuntimeScope,isP039RuntimeModule,P039_RUNTIME_ID as ID}from'../lib/nms-l02-p039-runtime-access';
import{P039_AUDIO_SOURCE}from'../../../packages/demos/src/generated/nms-l02-p039-audio-source-v1';
import{P039_FRAME_DOMAINS}from'../../../packages/demos/src/nms-l02-p039-frame-v1';
const props=()=>({animationId:ID,moduleKey:ID,audioEnabled:true,query:{capture:'0',frameDomain:'sprite-237',scenario:'source-practice',lang:'en'}});
const candidate=()=>({key:ID,maturity:'private-current-js',runtime:{defaultFrameDomain:'sprite-237',frameCount:10,fps:12,frameDomains:Object.entries(P039_FRAME_DOMAINS).map(([id,frameCount])=>({id,frameCount,...id==='root'?{}:{rootFrame:6}}))},textPresentation:{Renderer:()=>null},privateP039PercentPractice:{version:1,sourceSwfSha256:'cb087b675e4ada79fb53d4a7f7368f69ed96abf6a71ea4c6e56afdaa683bd649',audio:structuredClone(P039_AUDIO_SOURCE),offstageAudioDomain:{id:'sprite-230',frameCount:55},dormantDomain:{id:'sprite-236',frameCount:20}}});
test('private adapter scope rejects publication, captures and mismatched placement/runtime identity',()=>{
 const env={NODE_ENV:'development'};assert(isP039RuntimeScope(props(),env));
 for(const e of [{NODE_ENV:'production'},{NODE_ENV:'development',VERCEL_ENV:'preview'}])assert(!isP039RuntimeScope(props(),e));
 for(const patch of [{animationId:'wrong'},{moduleKey:'wrong'},{audioEnabled:false}])assert(!isP039RuntimeScope({...props(),...patch},env));
 for(const patch of [{capture:'1'},{frameDomain:'root'},{scenario:'wrong-first'},{lang:'es'}])assert(!isP039RuntimeScope({...props(),query:{...props().query,...patch}},env));
});
test('actual metadata contract requires source/audio/domain identity; malformed objects fail closed',()=>{
 assert(isP039RuntimeModule(candidate()));for(const value of [null,undefined,{},Object.create(null)])assert(!isP039RuntimeModule(value));
 let m=candidate();m.privateP039PercentPractice.sourceSwfSha256='0'.repeat(64);assert(!isP039RuntimeModule(m));
 m=candidate();Reflect.set(m.runtime.frameDomains[1],'frameCount',580);assert(!isP039RuntimeModule(m));
 m=candidate();m.runtime.frameDomains.push(m.runtime.frameDomains[1]);assert(!isP039RuntimeModule(m));
 m=candidate();m.privateP039PercentPractice.offstageAudioDomain.frameCount=54;assert(!isP039RuntimeModule(m));
 m=candidate();m.privateP039PercentPractice.audio={...m.privateP039PercentPractice.audio,sampleRate:44100} as unknown as typeof P039_AUDIO_SOURCE;assert(!isP039RuntimeModule(m));
 m=candidate();m.maturity='current-js';assert(!isP039RuntimeModule(m));
 assert(!isP039RuntimeModule({get key(){throw Error('malformed getter');}}));
});
