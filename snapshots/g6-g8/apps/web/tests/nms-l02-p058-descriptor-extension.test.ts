import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {P058_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p058-terms-v1';
import {nmsL02P057AdmissionDescriptor} from '../lib/nms-l02-p057-admission.server';
import {extendNmsL02P058Descriptor,P058_DESCRIPTOR_GLOSSARY_QUALIFICATION,
 type NmsL02P058DescriptorProvenance} from '../lib/nms-l02-p058-descriptor-extension';

const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const env:Record<string,string|undefined>=process.env;
const sourceSha='fc26d0a7049db6b8ce5532cfbed1fcb380c75e503d9c7cb7974bea73b8505d57';
const id=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
function realPredecessor(){
 const saved={nodeEnv:process.env.NODE_ENV,vercel:process.env.VERCEL,
  vercelEnv:process.env.VERCEL_ENV,sourceRoot:process.env.HELP_MATH_G678_SOURCE_ROOT};
 try{
  env.NODE_ENV='development';delete process.env.VERCEL;delete process.env.VERCEL_ENV;
  process.env.HELP_MATH_G678_SOURCE_ROOT=sourceRoot;
  const result=nmsL02P057AdmissionDescriptor();
  assert(result.registered,'P057 must be a real registered predecessor');
  return result.descriptor;
 }finally{
  for(const [key,value] of [['NODE_ENV',saved.nodeEnv],['VERCEL',saved.vercel],
   ['VERCEL_ENV',saved.vercelEnv],['HELP_MATH_G678_SOURCE_ROOT',saved.sourceRoot]] as const)
   if(value===undefined)delete env[key];else env[key]=value;
 }
}
function provenance():NmsL02P058DescriptorProvenance{
 const swf=readFileSync(`${sourceRoot}/G6-G8-shared/NMS002/L2/TS/L2TS05.swf`);
 assert.equal(swf.length,113754);assert.equal(sha(swf),sourceSha);
 const xml=readFileSync(`${sourceRoot}/G6-G8-shared/NMS002/L2/index.xml`);
 assert.equal(xml.length,12845);
 assert.equal(sha(xml),'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61');
 const product=readFileSync(new URL('../../../packages/demos/src/generated/nms-l02-p058-terms-v1.ts',import.meta.url));
 assert.equal(product.length,11518);
 assert.equal(sha(product),'bed47b321546dd4400ef7e553623bc21347627e9d00f41519fc82f3b9c34e677');
 const candidate=readFileSync(new URL('../../../output/nms-l02-p058-glossary-20260927/conditional-bank.json',import.meta.url));
 assert.equal(sha(candidate),'7fc26d3389ffac81a9cfc4c8d560822ce49b5096cfa54b8d52465ebfefa478aa');
 return {calibrationId:'g678-nms-l02-p058-conditional-host-current-js-v1',
  sourceXml:{path:'G6-G8-shared/NMS002/L2/index.xml',bytes:xml.length,sha256:sha(xml)},
  source:{path:`${sourceRoot}/G6-G8-shared/NMS002/L2/TS/L2TS05.swf`,
   bytes:swf.length,sha256:sha(swf)},
  selectedPage:{animationId:id(58),placementId:id(58),assetId:`swf-${sourceSha}`,
   globalPageOrdinal:58,sourceOccurrence:58,sectionCode:'TS',sectionPageOrdinal:4,
   sourceSha256:sourceSha,runtime:{frameDomain:'sprite-37',frameCount:274,
    rootBeginFrame:6,fps:12,stage:{width:800,height:600},scenario:'source-static-frame'}},
  // The future producer must replace this syntactically valid fixture with a verified freeze pin.
  freeze:{path:'catalog/product-bridge-calibrations/g678-nms-l02-p058-conditional-host-current-js-v1.json',
   sha256:'f'.repeat(64)},
  glossary:{candidateSha256:sha(candidate),
   product:{path:'packages/demos/src/generated/nms-l02-p058-terms-v1.ts',bytes:product.length,
    sha256:sha(product)},
   sourceSelection:'identified-indexMI-export-literal-L1-bank-path',
   originalL2XmlResolved:false,historicalHostAssociationEstablished:false,
   originalRuntimeLookupVerified:false}};
}

test('real admitted P057 extends only P058 and adds one qualified Show term',()=>{
 const base=realPredecessor(),before=structuredClone(base),facts=provenance();
 const result=extendNmsL02P058Descriptor(base,facts);
 assert.equal(base.productBridge.registeredAnimationCount,57);
 assert.equal(base.glossary.length,12);
 assert.equal(result.productBridge.registeredAnimationCount,58);
 assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered').length,58);
 assert.deepEqual(result.productBridge.selectedAnimationIds,
  [...Array.from({length:52},(_,index)=>id(index+1)),id(55),id(56),id(57),id(58),id(59),id(63)]);
 for(let i=0;i<64;i++)if(i!==57)assert.equal(result.pages[i],base.pages[i],`old page ${i+1}`);
 assert.deepEqual(result.pages[57].rendererAvailability,{kind:'registered',moduleKey:id(58),
  runtimeQuery:{frameDomain:'sprite-37',language:'fixed-en',scenario:'source-static-frame',seed:'0'}});
 assert.equal(result.pages[57].globalPageOrdinal,58);
 assert.equal(result.pages[57].sectionCode,'TS');
 assert.equal(result.pages[57].sectionPageOrdinal,4);
 assert.equal(result.pages[57].source.sourceOccurrence,58);
 assert.equal(result.pages[57].source.assetId,`swf-${sourceSha}`);
 assert.equal(result.glossary.length,13);
 for(let i=0;i<base.glossary.length;i++)assert.equal(result.glossary[i],base.glossary[i]);
 assert.deepEqual(result.glossary.slice(-1).map(term=>term.id),['show']);
 assert.equal(result.glossary.find(term=>term.id==='show')?.sourceKeyAttribute,'Show');
 assert.deepEqual(result.glossary.find(term=>term.id==='show')?.definitions,
  P058_SOURCE_TERMS.find(term=>term.id==='show')?.definitions);
 assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(result.pages[57].runtimeEvidenceBoundary?.naturalTraceValidation,'not-established');
 assert.equal(result.pages[57].runtimeEvidenceBoundary?.audioAcceptance,'not-established');
 assert.equal(result.pages[57].runtimeEvidenceBoundary?.productVisualBehaviorComposite,'not-established');
 assert.equal(result.source.candidateFreezeManifestPath,facts.freeze.path);
 assert.equal(result.source.candidateFreezeManifestSha256,facts.freeze.sha256);
 assert.equal(P058_DESCRIPTOR_GLOSSARY_QUALIFICATION.historicalHostAssociationEstablished,false);
 assert.equal(P058_DESCRIPTOR_GLOSSARY_QUALIFICATION.originalRuntimeLookupVerified,false);
 assert.deepEqual(base,before);
});

test('P058 extension rejects predecessor, source, freeze, and qualified glossary drift',()=>{
 const base=realPredecessor(),facts=provenance();
 for(const change of [
  (copy:any)=>{copy.productBridge.registeredAnimationCount=56;},
  (copy:any)=>{copy.pages[57].source.assetId='swf-wrong';},
  (copy:any)=>{copy.pages[57].rendererAvailability={kind:'registered',moduleKey:id(58)};},
  (copy:any)=>{copy.pages[56].nextPlacementId=id(59);},
  (copy:any)=>{copy.productBridge.selectedAnimationIds.pop();},
  (copy:any)=>{copy.productBridge.acceptanceEffects.audioAccepted=true;},
  (copy:any)=>{copy.glossary.push({...P058_SOURCE_TERMS[5],definitions:{en:'wrong',es:'wrong'}});},
 ]){const wrong=structuredClone(base) as any;change(wrong);
  assert.throws(()=>extendNmsL02P058Descriptor(wrong,facts),/NMS_L02_P058_DESCRIPTOR_INVALID/u);}
 for(const change of [
  (copy:any)=>{copy.source.sha256='0'.repeat(64);},
  (copy:any)=>{copy.selectedPage.runtime.frameCount=328;},
  (copy:any)=>{copy.selectedPage.sectionPageOrdinal=3;},
  (copy:any)=>{copy.freeze.path='catalog/product-bridge-calibrations/wrong.json';},
  (copy:any)=>{copy.freeze.sha256='bad';},
  (copy:any)=>{copy.glossary.candidateSha256='0'.repeat(64);},
  (copy:any)=>{copy.glossary.product.sha256='0'.repeat(64);},
  (copy:any)=>{copy.glossary.originalL2XmlResolved=true;},
 ]){const wrong=structuredClone(facts) as any;change(wrong);
  assert.throws(()=>extendNmsL02P058Descriptor(base,wrong),/NMS_L02_P058_DESCRIPTOR_INVALID/u);}
});
