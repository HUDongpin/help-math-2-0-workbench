import assert from 'node:assert/strict';
import test from 'node:test';
import {nmsL02P061AdmissionDescriptor} from './nms-l02-p061-admission.server';
import {nmsL02P062CandidateDescriptorV1} from './nms-l02-p062-candidate-descriptor-v1';

const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const env:Record<string,string|undefined>=process.env;
type Mutable<T>=T extends object?{-readonly [K in keyof T]:Mutable<T[K]>}:T;
const clone=<T,>(value:T):T=>structuredClone(value);

function realPredecessor(){
 const saved={nodeEnv:env.NODE_ENV,vercel:env.VERCEL,vercelEnv:env.VERCEL_ENV,
  sourceRoot:env.HELP_MATH_G678_SOURCE_ROOT};
 try{
  env.NODE_ENV='development';delete env.VERCEL;delete env.VERCEL_ENV;
  env.HELP_MATH_G678_SOURCE_ROOT=sourceRoot;
  const actual=nmsL02P061AdmissionDescriptor();
  assert.equal(actual.registered,true,'P061 must be registered, not projected');
  return actual.descriptor;
 }finally{
  for(const [key,value] of [['NODE_ENV',saved.nodeEnv],['VERCEL',saved.vercel],
   ['VERCEL_ENV',saved.vercelEnv],['HELP_MATH_G678_SOURCE_ROOT',saved.sourceRoot]] as const)
   if(value===undefined)delete env[key];else env[key]=value;
 }
}

test('actual registered P061 projects one P062 candidate without new glossary or registration',()=>{
 const base=realPredecessor(),before=clone(base),candidate=nmsL02P062CandidateDescriptorV1(base);
 assert.deepEqual(base,before,'real predecessor stays unchanged');
 assert.equal(base.productBridge.registeredAnimationCount,60);
 assert.equal(base.pages.filter(page=>page.rendererAvailability.kind==='registered').length,60);
 assert.equal(candidate.productBridge,base.productBridge);
 assert.equal(candidate.productBridge.selectedAnimationIds.length,60);
 assert.equal(candidate.pages.filter(page=>page.rendererAvailability.kind==='registered').length,61);
 assert.equal(candidate.pages.length,64);
 assert.equal(candidate.glossary,base.glossary);
 assert.equal(candidate.glossary.length,25);
 for(let i=0;i<64;i++)if(i!==61)assert.equal(candidate.pages[i],base.pages[i],`old page ${i+1}`);
 const page=candidate.pages[61];
 assert.equal(page.animationId,'shared-nms002-l02-p062');
 assert.equal(page.globalPageOrdinal,62);assert.equal(page.sectionCode,'TS');
 assert.equal(page.sectionPageOrdinal,8);
 assert.equal(page.source.assetId,
  'swf-5a075362f005aab68406d5fae2378f622a64520ec19e4b03b9ac9abbbd5faa50');
 assert.equal(page.previousPlacementId,'shared-nms002-l02-p061');
 assert.equal(page.nextPlacementId,'shared-nms002-l02-p063');
 assert.deepEqual(page.rendererAvailability,{kind:'registered',moduleKey:page.animationId,
  runtimeQuery:{frameDomain:'sprite-315',language:'fixed-en',scenario:'source-static-frame',seed:'0'}});
 assert.equal(page.runtimeEvidenceBoundary?.audioAcceptance,'not-established');
 assert.equal(page.runtimeEvidenceBoundary?.productVisualBehaviorComposite,'not-established');
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
 assert.throws(()=>nmsL02P062CandidateDescriptorV1(candidate),/P062_CANDIDATE_INVALID/u);
});

test('P062 projection rejects count, source, order, acceptance and glossary drift',()=>{
 const base=realPredecessor();
 const changes:Array<(copy:Mutable<typeof base>)=>void>=[
  copy=>{copy.productBridge.registeredAnimationCount=59;},
  copy=>{copy.productBridge.selectedAnimationIds=copy.productBridge.selectedAnimationIds.slice(0,-1);},
  copy=>{copy.pages[61].source.assetId='swf-'+'0'.repeat(64);},
  copy=>{copy.pages[61].sectionPageOrdinal=7;},
  copy=>{copy.pages[61].previousPlacementId=null;},
  copy=>{copy.pages[60].globalPageOrdinal=60;},
  copy=>{(copy.productBridge.acceptanceEffects as unknown as {audioAccepted:boolean}).audioAccepted=true;},
  copy=>{copy.glossary[0].sourceKeyAttribute=copy.glossary[1].sourceKeyAttribute;},
 ];
 for(const change of changes){
  const wrong=clone(base) as Mutable<typeof base>;change(wrong);
  assert.throws(()=>nmsL02P062CandidateDescriptorV1(wrong),/P062_CANDIDATE_INVALID/u);
 }
});
