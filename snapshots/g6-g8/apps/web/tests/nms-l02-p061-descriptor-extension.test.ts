import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {createMemoryOnlyLessonHost} from '../../../packages/demos/src/lesson-host-contract';
import {P061_GLOSSARY_SOURCE_DISPOSITION,P061_SOURCE_TERMS} from
  '../../../packages/demos/src/generated/nms-l02-p061-terms-v1';
import {nmsL02P060AdmissionDescriptor} from '../lib/nms-l02-p060-admission.server';
import {extendNmsL02P061Descriptor,P061_DESCRIPTOR_GLOSSARY_QUALIFICATION,
  type NmsL02P061DescriptorProvenance} from '../lib/nms-l02-p061-descriptor-extension';
import type {PageOnlyLessonPlayerDescriptor} from '../lib/whole-lesson-player-descriptor';

const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const sourceSha='4712cc077841cc0d16ea63c0c10827b933a0904a80eef010ec8f04eed5ffa50a';
const xmlSha='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const productSha='3151623a0e76ef184bc4008a4641ab957f95967c72623264310be5a9e3ad6f3c';
const id=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');

function realPredecessor():PageOnlyLessonPlayerDescriptor {
  const env=process.env as Record<string,string|undefined>;
  const saved={nodeEnv:env.NODE_ENV,vercel:env.VERCEL,vercelEnv:env.VERCEL_ENV,
    sourceRoot:env.HELP_MATH_G678_SOURCE_ROOT};
  try {
    env.NODE_ENV='development';delete env.VERCEL;delete env.VERCEL_ENV;
    env.HELP_MATH_G678_SOURCE_ROOT=sourceRoot;
    const result=nmsL02P060AdmissionDescriptor();
    assert.equal(result.registered,true,'P060 must be the real registered predecessor');
    return result.descriptor;
  } finally {
    for(const [key,value] of [['NODE_ENV',saved.nodeEnv],['VERCEL',saved.vercel],
      ['VERCEL_ENV',saved.vercelEnv],['HELP_MATH_G678_SOURCE_ROOT',saved.sourceRoot]] as const)
      if(value===undefined)delete env[key];else env[key]=value;
  }
}

function provenance():NmsL02P061DescriptorProvenance {
  const source=readFileSync(`${sourceRoot}/G6-G8-shared/NMS002/L2/TS/L2TS08.swf`);
  assert.equal(source.length,585741);assert.equal(sha(source),sourceSha);
  const xml=readFileSync(`${sourceRoot}/G6-G8-shared/NMS002/L2/index.xml`);
  assert.equal(xml.length,12845);assert.equal(sha(xml),xmlSha);
  const product=readFileSync(new URL('../../../packages/demos/src/generated/nms-l02-p061-terms-v1.ts',
    import.meta.url));
  assert.equal(product.length,14048);assert.equal(sha(product),productSha);
  const candidate=readFileSync(new URL('../../../output/nms-l02-p061-glossary-20260927/conditional-bank.json',
    import.meta.url));
  assert.equal(sha(candidate),P061_GLOSSARY_SOURCE_DISPOSITION.candidateSha256);
  return {calibrationId:'g678-nms-l02-p061-conditional-host-current-js-v1',
    sourceXml:{path:'G6-G8-shared/NMS002/L2/index.xml',bytes:xml.length,sha256:sha(xml)},
    source:{path:`${sourceRoot}/G6-G8-shared/NMS002/L2/TS/L2TS08.swf`,
      bytes:source.length,sha256:sha(source)},
    selectedPage:{animationId:id(61),placementId:id(61),assetId:`swf-${sourceSha}`,
      globalPageOrdinal:61,sourceOccurrence:61,sectionCode:'TS',sectionPageOrdinal:7,
      sourceSha256:sourceSha,runtime:{frameDomain:'sprite-315',frameCount:882,
        rootBeginFrame:6,fps:12,stage:{width:800,height:600},scenario:'source-static-frame'}},
    // Syntactically valid fixture only. The page-proof reader must supply
    // the actual immutable freeze pin before the formal route invokes this.
    freeze:{path:'catalog/product-bridge-calibrations/g678-nms-l02-p061-conditional-host-current-js-v1.json',
      sha256:'f'.repeat(64)},
    glossary:{candidateSha256:sha(candidate),
      product:{path:'packages/demos/src/generated/nms-l02-p061-terms-v1.ts',
        bytes:product.length,sha256:sha(product)},
      sourceSelection:P061_GLOSSARY_SOURCE_DISPOSITION.sourceSelection,
      originalL2XmlResolved:false,historicalHostAssociationEstablished:false,
      originalRuntimeLookupVerified:false,modernSelectionByScreenkeyTerm:false,
      conditionalModernLabelResolutionReviewed:true}};
}

test('real P060 descriptor extends only P061: 60/64, 25 terms, Decimal fraction reused',()=>{
  const base=realPredecessor(),before=structuredClone(base),facts=provenance();
  assert.equal(base.productBridge.registeredAnimationCount,59);
  assert.equal(base.glossary.length,20);
  const result=extendNmsL02P061Descriptor(base,facts);
  assert.equal(result.pages.length,64);
  assert.equal(result.productBridge.registeredAnimationCount,60);
  assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered').length,60);
  assert.deepEqual(result.productBridge.selectedAnimationIds,[
    ...Array.from({length:52},(_,index)=>id(index+1)),
    id(55),id(56),id(57),id(58),id(59),id(60),id(61),id(63)]);
  for(let index=0;index<64;index++)if(index!==60)
    assert.equal(result.pages[index],base.pages[index],`predecessor page ${index+1}`);
  assert.deepEqual(result.pages[60].rendererAvailability,{kind:'registered',moduleKey:id(61),
    runtimeQuery:{frameDomain:'sprite-315',language:'fixed-en',scenario:'source-static-frame',seed:'0'}});
  assert.equal(result.pages[60].runtimeEvidenceBoundary?.naturalTraceValidation,'not-established');
  assert.equal(result.pages[60].runtimeEvidenceBoundary?.audioAcceptance,'not-established');
  assert.equal(result.glossary.length,25);
  for(let index=0;index<20;index++)assert.equal(result.glossary[index],base.glossary[index]);
  assert.equal(result.glossary.find(term=>term.id==='decimal-fraction'),
    base.glossary.find(term=>term.id==='decimal-fraction'));
  assert.deepEqual(result.glossary.slice(20).map(term=>term.id),
    P061_SOURCE_TERMS.filter(term=>term.id!=='decimal-fraction').map(term=>term.id));
  assert.equal(result.glossary.find(term=>term.id==='decimal-fraction')?.sourceKeyAttribute,
    'Decimal fraction');
  assert.equal(P061_DESCRIPTOR_GLOSSARY_QUALIFICATION.modernSelectionByScreenkeyTerm,false);
  assert.equal(P061_DESCRIPTOR_GLOSSARY_QUALIFICATION.historicalHostAssociationEstablished,false);
  assert.equal(result.source.candidateFreezeManifestPath,facts.freeze.path);
  assert.equal(result.source.candidateFreezeManifestSha256,facts.freeze.sha256);
  assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
  assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
  assert(result.releaseId.length<=256,'bounded single-page release identity');
  assert.doesNotThrow(()=>createMemoryOnlyLessonHost({releaseId:result.releaseId,
    releaseMemberIds:result.pages.map(page=>page.animationId),currentAnimationId:id(61),mode:'audit'}));
  assert.deepEqual(base,before);
});

test('formal extension rejects predecessor and source/proof packet mutations',()=>{
  const base=realPredecessor(),facts=provenance();
  for(const change of [
    (copy:any)=>{copy.productBridge.registeredAnimationCount=57;},
    (copy:any)=>{copy.productBridge.selectedAnimationIds.pop();},
    (copy:any)=>{copy.pages[60].source.assetId='swf-wrong';},
    (copy:any)=>{copy.pages[60].sectionPageOrdinal=5;},
    (copy:any)=>{copy.pages[60].rendererAvailability={kind:'registered',moduleKey:id(61)};},
    (copy:any)=>{copy.pages[59].nextPlacementId=id(62);},
    (copy:any)=>{copy.pages[51].rendererAvailability={kind:'unavailable',reason:'drift'};},
    (copy:any)=>{copy.source.sourceXmlSha256='0'.repeat(64);},
    (copy:any)=>{copy.productBridge.acceptanceEffects.audioAccepted=true;},
    (copy:any)=>{copy.glossary.find((term:any)=>term.id==='decimal-fraction').definitions.en='drift';},
    (copy:any)=>{copy.glossary.push({...copy.glossary[0],id:'equivalent-decimal'});},
  ]) {
    const wrong=structuredClone(base) as any;change(wrong);
    assert.throws(()=>extendNmsL02P061Descriptor(wrong,facts),
      /NMS_L02_P061_(DESCRIPTOR|CANDIDATE)_INVALID/u);
  }
  for(const change of [
    (copy:any)=>{copy.calibrationId='wrong';},
    (copy:any)=>{copy.source.sha256='0'.repeat(64);},
    (copy:any)=>{copy.sourceXml.bytes=1;},
    (copy:any)=>{copy.selectedPage.sourceSha256='0'.repeat(64);},
    (copy:any)=>{copy.selectedPage.sectionPageOrdinal=5;},
    (copy:any)=>{copy.selectedPage.runtime.frameCount=720;},
    (copy:any)=>{copy.freeze.path='catalog/product-bridge-calibrations/wrong.json';},
    (copy:any)=>{copy.freeze.sha256='not-a-hash';},
    (copy:any)=>{copy.glossary.candidateSha256='0'.repeat(64);},
    (copy:any)=>{copy.glossary.product.sha256='0'.repeat(64);},
    (copy:any)=>{copy.glossary.originalL2XmlResolved=true;},
    (copy:any)=>{copy.glossary.modernSelectionByScreenkeyTerm=true;},
    (copy:any)=>{copy.glossary.conditionalModernLabelResolutionReviewed=false;},
  ]) {
    const wrong=structuredClone(facts) as any;change(wrong);
    assert.throws(()=>extendNmsL02P061Descriptor(base,wrong),
      /NMS_L02_P061_DESCRIPTOR_INVALID/u);
  }
});
