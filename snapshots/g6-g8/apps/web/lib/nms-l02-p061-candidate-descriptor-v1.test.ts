import assert from 'node:assert/strict';
import test from 'node:test';
import {nmsL02P060AdmissionDescriptor} from './nms-l02-p060-admission.server';
import {nmsL02P061CandidateDescriptorV1} from './nms-l02-p061-candidate-descriptor-v1';
import {P061_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p061-terms-v1';

const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const env:Record<string,string|undefined>=process.env;
const clone=<T,>(value:T):T=>structuredClone(value);
type Mutable<T>=T extends object?{-readonly [K in keyof T]:Mutable<T[K]>}:T;
function realPredecessor(){
 const saved={nodeEnv:process.env.NODE_ENV,vercel:process.env.VERCEL,
  vercelEnv:process.env.VERCEL_ENV,sourceRoot:process.env.HELP_MATH_G678_SOURCE_ROOT};
 try{
  env.NODE_ENV='development';
  delete process.env.VERCEL;delete process.env.VERCEL_ENV;
  process.env.HELP_MATH_G678_SOURCE_ROOT=sourceRoot;
  return nmsL02P060AdmissionDescriptor();
 }finally{
  for(const [key,value] of [['NODE_ENV',saved.nodeEnv],['VERCEL',saved.vercel],
   ['VERCEL_ENV',saved.vercelEnv],['HELP_MATH_G678_SOURCE_ROOT',saved.sourceRoot]] as const)
   if(value===undefined)delete env[key];else env[key]=value;
 }
}

test('actual admitted P060 projects P061 as page 60 without inventing registration',()=>{
 const admitted=realPredecessor();assert.equal(admitted.registered,true);
 const base=admitted.descriptor,before=clone(base),candidate=nmsL02P061CandidateDescriptorV1(base);
 assert.deepEqual(base,before,'the registered predecessor is not mutated');
 assert.equal(base.productBridge.registeredAnimationCount,59);
 assert.equal(base.pages.filter(page=>page.rendererAvailability.kind==='registered').length,59);
 assert.equal(candidate.productBridge,base.productBridge);
 assert.equal(candidate.productBridge.selectedAnimationIds.length,59);
 assert.equal(candidate.pages.filter(page=>page.rendererAvailability.kind==='registered').length,60);
 assert.equal(candidate.pages.length,64);
 assert.equal(candidate.glossary.length,25);
 assert.equal(base.glossary.length,20);
 for(let i=0;i<64;i++)if(i!==60)assert.equal(candidate.pages[i],base.pages[i],`old page ${i+1}`);
 for(let i=0;i<20;i++)assert.equal(candidate.glossary[i],base.glossary[i]);
 assert.deepEqual(candidate.glossary.slice(20).map(term=>term.id),
  ['equivalent-decimal','express','denominator','percent','equivalent-fraction']);
 assert.equal(candidate.glossary.filter(term=>term.id==='decimal-fraction').length,1);
 assert.deepEqual(candidate.glossary.find(term=>term.id==='decimal-fraction')?.definitions,
  P061_SOURCE_TERMS.find(term=>term.id==='decimal-fraction')?.definitions);
 const page=candidate.pages[60];
 assert.equal(page.animationId,'shared-nms002-l02-p061');
 assert.equal(page.globalPageOrdinal,61);
 assert.equal(page.sectionCode,'TS');assert.equal(page.sectionPageOrdinal,7);
 assert.equal(page.source.assetId,
  'swf-4712cc077841cc0d16ea63c0c10827b933a0904a80eef010ec8f04eed5ffa50a');
 assert.equal(page.previousPlacementId,'shared-nms002-l02-p060');
 assert.equal(page.nextPlacementId,'shared-nms002-l02-p062');
 assert.deepEqual(page.rendererAvailability,{kind:'registered',moduleKey:page.animationId,
  runtimeQuery:{frameDomain:'sprite-315',language:'fixed-en',scenario:'source-static-frame',seed:'0'}});
 assert.equal(page.runtimeEvidenceBoundary?.audioAcceptance,'not-established');
 assert.equal(page.runtimeEvidenceBoundary?.productVisualBehaviorComposite,'not-established');
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
 assert.throws(()=>nmsL02P061CandidateDescriptorV1(candidate),/P061_CANDIDATE_INVALID/u);
});

test('P061 projection rejects predecessor identity, order, source and glossary drift',()=>{
 const base=realPredecessor().descriptor;
 const changes:Array<(copy:Mutable<typeof base>)=>void>=[
  copy=>{copy.productBridge.registeredAnimationCount=58;},
  copy=>{copy.productBridge.selectedAnimationIds=copy.productBridge.selectedAnimationIds.slice(0,-1);},
  copy=>{copy.pages[60].source.assetId='swf-'+'0'.repeat(64);},
  copy=>{copy.pages[60].sectionPageOrdinal=6;},
  copy=>{copy.pages[60].previousPlacementId=null;},
  copy=>{copy.pages[59].globalPageOrdinal=59;},
  copy=>{(copy.productBridge.acceptanceEffects as unknown as {audioAccepted:boolean}).audioAccepted=true;},
  copy=>{copy.glossary.find(term=>term.id==='decimal-fraction')!.definitions.en='wrong';},
 ];
 for(const change of changes){
  const wrong=clone(base) as Mutable<typeof base>;change(wrong);
  assert.throws(()=>nmsL02P061CandidateDescriptorV1(wrong),/P061_CANDIDATE_INVALID/u);
 }
});
