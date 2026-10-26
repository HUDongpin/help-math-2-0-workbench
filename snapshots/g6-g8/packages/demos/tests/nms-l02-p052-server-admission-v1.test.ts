import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {P052_AUDIO_PLANS} from '../src/generated/nms-l02-p052-runtime-audio-v1';

// Dependency fixtures test rejection/projection logic, never actual admission.
const id='shared-nms002-l02-p052',sha='5efa48905e74c0dd604b9e896bee1a1b4cfb1fe0839044686527fe96e1311638';
const calibrationId='g678-nms-l02-p052-percent-practice-current-js-v1';
const source=fs.readFileSync(new URL('../../../apps/web/lib/g678-nms-l02-p052.server.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
function fixture(){
 const pin=(path:string)=>({path,bytes:1,sha256:'a'.repeat(64)});
 const artifacts={module:pin('packages/demos/src/modules/g678-nms-l02-percent-practice-p052.tsx'),
  timeline:pin('packages/demos/src/timelines/g678-nms-l02-percent-practice-p052.ts'),
  memberManifest:pin('member'),sourceRun:pin('run')};
 const freeze=pin('freeze');
 const packet:any={schemaVersion:1,calibrationId,deploymentScope:'local-only',
  source:{path:sourceRoot+'/G6-G8-shared/NMS002/L2/TI/L2TI11.swf',bytes:106791,sha256:sha},
  sourceXml:pin('G6-G8-shared/NMS002/L2/index.xml'),
  audio:Object.fromEntries(Object.entries(P052_AUDIO_PLANS).map(([key,value])=>[key,{path:`migrations/${id}/audit/${key}-source-stream-v1.mp3`,bytes:value.inputBytes,sha256:value.inputSha256,contentType:'audio/mpeg'}])),
  inputs:[pin('input')],outputs:Object.values(artifacts),entry:{key:id,module:'./modules/g678-nms-l02-percent-practice-p052',artifacts},
  selectedPages:[{animationId:id,sourceSha256:sha,runtimeEvidenceBoundary:{audioAcceptance:'not-established'},
   runtime:{frameDomain:'sprite-350',frameCount:156,rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600}}}],
  productCalibrationPassed:false,scaleOutAuthorized:false,
  acceptanceEffects:{originalRuntime:false,audioAcceptance:false,humanReview:false,ownerAcceptance:false,strictComplete:false,publication:false}};
 packet.outputs.push(...Object.values(packet.audio));
 const pages=Array.from({length:64},(_,index)=>({animationId:index===51?id:`fixture-${index}`,placementId:index===51?id:`fixture-${index}`,
  globalPageOrdinal:index+1,sectionCode:'TI',sectionPageOrdinal:index-41,source:{assetId:'swf-'+sha},
  rendererAvailability:index!==51&&index<54?{kind:'registered',moduleKey:`fixture-${index}`}:{kind:'unavailable',reason:'fixture'}}));
 const base:any={course:{moduleCode:'NMS002',lesson:2,activePageCount:64,courseShellCount:0},pages,
  source:{sourceXmlSha256:packet.sourceXml.sha256,sourceXmlPath:packet.sourceXml.path},productBridge:{registeredAnimationCount:53}};
 const registration:any={calibrationId,deploymentScope:'local-only',maturity:'private-current-js',freezeManifestSha256:freeze.sha256,
  moduleSha256:artifacts.module.sha256,timelineSha256:artifacts.timeline.sha256,rendererBindingKind:'maintained-dom-module-v1',memberManifestSha256:artifacts.memberManifest.sha256,sourceRunSha256:artifacts.sourceRun.sha256};
 const env:any={NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:sourceRoot};
 const reads:string[]=[];
 const imports:any={
  'server-only':{},'./catalog':{getWorkspaceRoot:()=>'/fixture'},
  './g678-nms-l02-p051.server':{nmsL2P051Descriptor:()=>base},
  './g678-nms-l02-p052-freeze-v1':{readP052FreezePin:()=>freeze},
  './nms-l02-p052-binding.server':{readP052Binding:(_root:string,p:any)=>{reads.push(p.path);return Buffer.from(JSON.stringify(packet));}},
  './nms-l02-p052-source-bytes':{P052_SOURCE_ROOT:sourceRoot,readP052CandidateAudio:()=>Buffer.from('fixture')},
  '@helpmath/demos/local-only-animation-registry-metadata':{localOnlyAnimationModuleRegistration:()=>registration},
  '../../../packages/demos/src/generated/nms-l02-p052-runtime-audio-v1':{P052_AUDIO_PLANS}};
 const exports:any={};vm.runInNewContext(code,{exports,process:{env},require:(key:string)=>{assert.ok(Object.hasOwn(imports,key),key);return imports[key];}});
 return {packet,base,registration,env,reads,api:exports};
}
test('descriptor changes only exact page52 after packet and registry bindings pass',()=>{
 const f=fixture(),before=JSON.stringify(f.base),d=f.api.nmsL2P052Descriptor();
 assert.equal(d.productBridge.registeredAnimationCount,54);assert.equal(d.pages.length,64);
 assert.equal(d.pages[51].rendererAvailability.runtimeQuery.scenario,'intro');
 assert.equal(d.pages[51].rendererAvailability.runtimeQuery.frameDomain,'sprite-350');
 for(let i=0;i<64;i++)if(i!==51)assert.equal(d.pages[i],f.base.pages[i]);
 assert.equal(JSON.stringify(f.base),before);assert.ok(f.reads.includes(f.packet.source.path));
});
test('packet/source/domain/registry/acceptance and predecessor drift fail closed',()=>{
 const changes=[(f:any)=>f.packet.source.sha256='0'.repeat(64),(f:any)=>f.packet.selectedPages[0].runtime.frameCount=10,
  (f:any)=>delete f.packet.audio['sprite-8'],(f:any)=>f.registration.maturity='legacy-prototype',
  (f:any)=>f.registration.freezeManifestSha256='0'.repeat(64),(f:any)=>f.packet.acceptanceEffects.audioAcceptance=true,
  (f:any)=>f.base.pages[51].source.assetId='wrong',(f:any)=>f.base.pages[51].sectionPageOrdinal=9,
  (f:any)=>f.base.productBridge.registeredAnimationCount=52,(f:any)=>f.env.NODE_ENV='production'];
 for(const change of changes){const f=fixture();change(f);assert.throws(()=>f.api.nmsL2P052Descriptor(),/NMS_L2_P052_INVALID/);}
});
test('registered audio reader checks exact bytes and root as well as packet admission',()=>{
 const f=fixture();assert.equal(f.api.readNmsL2P052Audio('sprite-8').toString(),'fixture');
 assert.throws(()=>f.api.readNmsL2P052Audio('8'),/audio domain/);
 f.packet.audio['sprite-8'].bytes++;assert.throws(()=>f.api.readNmsL2P052Audio('sprite-8'),/audio identity/);
 f.packet.audio['sprite-8'].bytes--;f.env.HELP_MATH_G678_SOURCE_ROOT='/wrong';
 assert.throws(()=>f.api.readNmsL2P052Audio('sprite-8'),/exact source root/);
});
