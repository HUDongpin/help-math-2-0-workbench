import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {createMemoryOnlyLessonHost} from '../../../packages/demos/src/lesson-host-contract';
import {P060_GLOSSARY_SOURCE_DISPOSITION,P060_SOURCE_TERMS} from
  '../../../packages/demos/src/generated/nms-l02-p060-terms-v1';
import {nmsL02P058AdmissionDescriptor} from '../lib/nms-l02-p058-admission.server';
import {extendNmsL02P060Descriptor,P060_DESCRIPTOR_GLOSSARY_QUALIFICATION,
  type NmsL02P060DescriptorProvenance} from '../lib/nms-l02-p060-descriptor-extension';
import type {PageOnlyLessonPlayerDescriptor} from '../lib/whole-lesson-player-descriptor';

const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const sourceSha='80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1';
const xmlSha='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const productSha='476bd5597e35e08b32a54cd89c4ea7753466ecb9f6580fea615b4de7d2a9d7bf';
const id=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');

function realPredecessor():PageOnlyLessonPlayerDescriptor {
  const env=process.env as Record<string,string|undefined>;
  const saved={nodeEnv:env.NODE_ENV,vercel:env.VERCEL,vercelEnv:env.VERCEL_ENV,
    sourceRoot:env.HELP_MATH_G678_SOURCE_ROOT};
  try {
    env.NODE_ENV='development';delete env.VERCEL;delete env.VERCEL_ENV;
    env.HELP_MATH_G678_SOURCE_ROOT=sourceRoot;
    const result=nmsL02P058AdmissionDescriptor();
    assert.equal(result.registered,true,'P058 must be the real registered predecessor');
    return result.descriptor;
  } finally {
    for(const [key,value] of [['NODE_ENV',saved.nodeEnv],['VERCEL',saved.vercel],
      ['VERCEL_ENV',saved.vercelEnv],['HELP_MATH_G678_SOURCE_ROOT',saved.sourceRoot]] as const)
      if(value===undefined)delete env[key];else env[key]=value;
  }
}

function provenance():NmsL02P060DescriptorProvenance {
  const source=readFileSync(`${sourceRoot}/G6-G8-shared/NMS002/L2/TS/L2TS07.swf`);
  assert.equal(source.length,577367);assert.equal(sha(source),sourceSha);
  const xml=readFileSync(`${sourceRoot}/G6-G8-shared/NMS002/L2/index.xml`);
  assert.equal(xml.length,12845);assert.equal(sha(xml),xmlSha);
  const product=readFileSync(new URL('../../../packages/demos/src/generated/nms-l02-p060-terms-v1.ts',
    import.meta.url));
  assert.equal(product.length,19429);assert.equal(sha(product),productSha);
  const candidate=readFileSync(new URL('../../../output/nms-l02-p060-glossary-20260927/conditional-bank.json',
    import.meta.url));
  assert.equal(sha(candidate),P060_GLOSSARY_SOURCE_DISPOSITION.candidateSha256);
  return {calibrationId:'g678-nms-l02-p060-conditional-host-current-js-v1',
    sourceXml:{path:'G6-G8-shared/NMS002/L2/index.xml',bytes:xml.length,sha256:sha(xml)},
    source:{path:`${sourceRoot}/G6-G8-shared/NMS002/L2/TS/L2TS07.swf`,
      bytes:source.length,sha256:sha(source)},
    selectedPage:{animationId:id(60),placementId:id(60),assetId:`swf-${sourceSha}`,
      globalPageOrdinal:60,sourceOccurrence:60,sectionCode:'TS',sectionPageOrdinal:6,
      sourceSha256:sourceSha,runtime:{frameDomain:'sprite-391',frameCount:721,
        rootBeginFrame:6,fps:12,stage:{width:800,height:600},scenario:'source-static-frame'}},
    // Syntactically valid fixture only. The page-proof reader must supply
    // the actual immutable freeze pin before the formal route invokes this.
    freeze:{path:'catalog/product-bridge-calibrations/g678-nms-l02-p060-conditional-host-current-js-v1.json',
      sha256:'f'.repeat(64)},
    glossary:{candidateSha256:sha(candidate),
      product:{path:'packages/demos/src/generated/nms-l02-p060-terms-v1.ts',
        bytes:product.length,sha256:sha(product)},
      sourceSelection:P060_GLOSSARY_SOURCE_DISPOSITION.sourceSelection,
      originalL2XmlResolved:false,historicalHostAssociationEstablished:false,
      originalRuntimeLookupVerified:false,modernSelectionByScreenkeyTerm:false,
      conditionalModernLabelResolutionReviewed:true}};
}

test('real P058 descriptor extends only P060: 59/64, 20 terms, Fraction reused',()=>{
  const base=realPredecessor(),before=structuredClone(base),facts=provenance();
  assert.equal(base.productBridge.registeredAnimationCount,58);
  assert.equal(base.glossary.length,13);
  const result=extendNmsL02P060Descriptor(base,facts);
  assert.equal(result.pages.length,64);
  assert.equal(result.productBridge.registeredAnimationCount,59);
  assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered').length,59);
  assert.deepEqual(result.productBridge.selectedAnimationIds,[
    ...Array.from({length:52},(_,index)=>id(index+1)),
    id(55),id(56),id(57),id(58),id(59),id(60),id(63)]);
  for(let index=0;index<64;index++)if(index!==59)
    assert.equal(result.pages[index],base.pages[index],`predecessor page ${index+1}`);
  assert.deepEqual(result.pages[59].rendererAvailability,{kind:'registered',moduleKey:id(60),
    runtimeQuery:{frameDomain:'sprite-391',language:'fixed-en',scenario:'source-static-frame',seed:'0'}});
  assert.equal(result.pages[59].runtimeEvidenceBoundary?.naturalTraceValidation,'not-established');
  assert.equal(result.pages[59].runtimeEvidenceBoundary?.audioAcceptance,'not-established');
  assert.equal(result.glossary.length,20);
  for(let index=0;index<13;index++)assert.equal(result.glossary[index],base.glossary[index]);
  assert.equal(result.glossary.find(term=>term.id==='fraction'),
    base.glossary.find(term=>term.id==='fraction'));
  assert.deepEqual(result.glossary.slice(13).map(term=>term.id),
    P060_SOURCE_TERMS.filter(term=>term.id!=='fraction').map(term=>term.id));
  assert.equal(result.glossary.find(term=>term.id==='decimal-fraction')?.sourceKeyAttribute,
    'Decimal fraction');
  assert.equal(P060_DESCRIPTOR_GLOSSARY_QUALIFICATION.modernSelectionByScreenkeyTerm,false);
  assert.equal(P060_DESCRIPTOR_GLOSSARY_QUALIFICATION.historicalHostAssociationEstablished,false);
  assert.equal(result.source.candidateFreezeManifestPath,facts.freeze.path);
  assert.equal(result.source.candidateFreezeManifestSha256,facts.freeze.sha256);
  assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
  assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
  assert(base.releaseId.length+1+facts.calibrationId.length>256,'real predecessor exposes cumulative ID regression');
  assert.doesNotThrow(()=>createMemoryOnlyLessonHost({releaseId:result.releaseId,
    releaseMemberIds:result.pages.map(page=>page.animationId),currentAnimationId:id(60),mode:'audit'}));
  assert.deepEqual(base,before);
});

test('formal extension rejects predecessor and source/proof packet mutations',()=>{
  const base=realPredecessor(),facts=provenance();
  for(const change of [
    (copy:any)=>{copy.productBridge.registeredAnimationCount=57;},
    (copy:any)=>{copy.productBridge.selectedAnimationIds.pop();},
    (copy:any)=>{copy.pages[59].source.assetId='swf-wrong';},
    (copy:any)=>{copy.pages[59].sectionPageOrdinal=5;},
    (copy:any)=>{copy.pages[59].rendererAvailability={kind:'registered',moduleKey:id(60)};},
    (copy:any)=>{copy.pages[58].nextPlacementId=id(61);},
    (copy:any)=>{copy.pages[51].rendererAvailability={kind:'unavailable',reason:'drift'};},
    (copy:any)=>{copy.source.sourceXmlSha256='0'.repeat(64);},
    (copy:any)=>{copy.productBridge.acceptanceEffects.audioAccepted=true;},
    (copy:any)=>{copy.glossary.find((term:any)=>term.id==='fraction').definitions.en='drift';},
    (copy:any)=>{copy.glossary.push({...copy.glossary[0],id:'decimal-fraction'});},
  ]) {
    const wrong=structuredClone(base) as any;change(wrong);
    assert.throws(()=>extendNmsL02P060Descriptor(wrong,facts),
      /NMS_L02_P060_(DESCRIPTOR|CANDIDATE)_INVALID/u);
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
    assert.throws(()=>extendNmsL02P060Descriptor(base,wrong),
      /NMS_L02_P060_DESCRIPTOR_INVALID/u);
  }
});
