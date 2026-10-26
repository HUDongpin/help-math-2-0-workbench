import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {P057_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p057-terms-v1';
import {extendNmsL02P055Descriptor} from '../lib/nms-l02-p055-descriptor-extension';
import {extendNmsL02P056Descriptor} from '../lib/nms-l02-p056-descriptor-extension';
import {extendNmsL02P057Descriptor,P057_DESCRIPTOR_GLOSSARY_QUALIFICATION,
 type NmsL02P057DescriptorProvenance} from '../lib/nms-l02-p057-descriptor-extension';
import type {PageOnlyLessonPlayerDescriptor} from '../lib/whole-lesson-player-descriptor';
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const id=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
function pinnedJson(relative:string,bytes:number,digest:string):any{
 const content=readFileSync(new URL(`../../../${relative}`,import.meta.url));
 assert.equal(content.length,bytes,relative);assert.equal(sha(content),digest,relative);
 return JSON.parse(content.toString('utf8'));
}
function predecessor():PageOnlyLessonPlayerDescriptor{
 const witness=pinnedJson('output/nms-l02-host-successor-20260927/predecessor/descriptor-witness-two-stage-v1.json',
  137815,'01cb25723b10cc2ce5a0a39e699420a08c7815804b0fe21988c5b155323230b6');
 let base=witness.descriptor as PageOnlyLessonPlayerDescriptor;
 for(const [number,bytes,digest,extend] of [
  [55,41970,'6d7b37096d01b7f712ebde9c461652733177b64cd654ecb75a9f0d656291bae1',extendNmsL02P055Descriptor],
  [56,31795,'29c0da9919a42535c5969e3cf48ca37305f6d100db531294156012aedae97486',extendNmsL02P056Descriptor],
 ] as const){
  const proof=pinnedJson(`work/g678-workflow/candidates/${id(number)}-v1.json`,bytes,digest);
  const packet=proof.packet;
  base=extend(base,{calibrationId:packet.calibrationId,sourceXml:packet.sourceXml,
   source:{...packet.source,path:`${packet.sourceRoot}/${packet.source.path}`},
   selectedPage:packet.selectedPages[0],freeze:proof.freeze,glossary:packet.glossary} as never);
 }
 return base;
}
function provenance():NmsL02P057DescriptorProvenance{
 const sourceSha='9cc456a0af745dc31240b3a6d805e8e115c1c1c2725f851fca8e907a767820aa';
 return {calibrationId:'g678-nms-l02-p057-conditional-host-current-js-v1',
  sourceXml:{path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
   sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'},
  source:{path:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/NMS002/L2/TS/L2TS04.swf',
   bytes:137055,sha256:sourceSha},
  selectedPage:{animationId:id(57),placementId:id(57),assetId:`swf-${sourceSha}`,
   globalPageOrdinal:57,sourceOccurrence:57,sectionCode:'TS',sectionPageOrdinal:3,sourceSha256:sourceSha,
   runtime:{frameDomain:'sprite-66',frameCount:328,rootBeginFrame:6,fps:12,
    stage:{width:800,height:600},scenario:'source-static-frame'}},
  freeze:{path:'catalog/product-bridge-calibrations/g678-nms-l02-p057-conditional-host-current-js-v1.json',
   sha256:'f'.repeat(64)},
  glossary:{candidateSha256:'b651a5d063e4c0c5c9a6f6b73543a643a3af2f5a5e27c8ac51eb6d705da9c365',
   product:{path:'packages/demos/src/generated/nms-l02-p057-terms-v1.ts',bytes:8325,
    sha256:'177cbcdef722656206b29da8a31a643ef6a3555c13decb5d21ff5b7db2285ee7'},
   sourceSelection:'identified-indexMI-export-literal-L1-bank-path',originalL2XmlResolved:false,
   historicalHostAssociationEstablished:false,originalRuntimeLookupVerified:false}};
}
test('actual registered P056 predecessor extends only exact source P057 and seven qualified terms',()=>{
 const base=predecessor(),before=structuredClone(base),result=extendNmsL02P057Descriptor(base,provenance());
 assert.equal(base.productBridge.registeredAnimationCount,56);
 assert.equal(result.productBridge.registeredAnimationCount,57);
 assert.deepEqual(result.productBridge.selectedAnimationIds,
  [...Array.from({length:52},(_,i)=>id(i+1)),id(55),id(56),id(57),id(59),id(63)]);
 for(let i=0;i<64;i++)if(i!==56)assert.equal(result.pages[i],base.pages[i]);
 assert.deepEqual(result.pages[56].rendererAvailability,{kind:'registered',moduleKey:id(57),
  runtimeQuery:{frameDomain:'sprite-66',language:'fixed-en',scenario:'source-static-frame',seed:'0'}});
 assert.equal(result.glossary.find(term=>term.id==='problem'),base.glossary.find(term=>term.id==='problem'));
 assert.deepEqual(result.glossary.slice(-6).map(term=>term.id),
  P057_SOURCE_TERMS.filter(term=>term.id!=='problem').map(term=>term.id));
 assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert.equal(P057_DESCRIPTOR_GLOSSARY_QUALIFICATION.historicalHostAssociationEstablished,false);
 assert.deepEqual(base,before);
});
test('P057 extension rejects wrong predecessor, source and glossary collisions',()=>{
 const base=predecessor(),facts=provenance();
 for(const change of [
  (x:any)=>x.pages[56].rendererAvailability={kind:'registered',moduleKey:id(57)},
  (x:any)=>x.pages[56].source.assetId='swf-wrong',
  (x:any)=>x.pages[55].nextPlacementId=id(58),
  (x:any)=>x.productBridge.registeredAnimationCount=55,
  (x:any)=>x.productBridge.acceptanceEffects.audioAccepted=true,
  (x:any)=>x.glossary.push({...P057_SOURCE_TERMS[0],definitions:{en:'wrong',es:'wrong'}}),
 ]){const copy=structuredClone(base) as any;change(copy);
  assert.throws(()=>extendNmsL02P057Descriptor(copy,facts),/NMS_L02_P057_DESCRIPTOR_INVALID/u);}
 for(const change of [
  (x:any)=>x.source.sha256='0'.repeat(64),
  (x:any)=>x.selectedPage.runtime.frameCount=234,
  (x:any)=>x.glossary.originalL2XmlResolved=true,
 ]){const copy=structuredClone(facts) as any;change(copy);
  assert.throws(()=>extendNmsL02P057Descriptor(base,copy),/NMS_L02_P057_DESCRIPTOR_INVALID/u);}
});
