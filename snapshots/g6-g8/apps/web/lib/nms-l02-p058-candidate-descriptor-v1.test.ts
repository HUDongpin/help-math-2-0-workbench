import assert from 'node:assert/strict';
import test from 'node:test';
import {nmsL02P057AdmissionDescriptor} from './nms-l02-p057-admission.server';
import {nmsL02P058CandidateDescriptorV1} from './nms-l02-p058-candidate-descriptor-v1';
import {P058_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p058-terms-v1';

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
  return nmsL02P057AdmissionDescriptor();
 }finally{
  for(const [key,value] of [['NODE_ENV',saved.nodeEnv],['VERCEL',saved.vercel],
   ['VERCEL_ENV',saved.vercelEnv],['HELP_MATH_G678_SOURCE_ROOT',saved.sourceRoot]] as const)
   if(value===undefined)delete env[key];else env[key]=value;
 }
}

test('actual admitted P057 predecessor projects one unregistered P058 without changing real count',()=>{
 const admitted=realPredecessor();assert.equal(admitted.registered,true);
 const base=admitted.descriptor,before=clone(base),candidate=nmsL02P058CandidateDescriptorV1(base);
 assert.deepEqual(base,before,'the admitted descriptor is not mutated');
 assert.equal(base.productBridge.registeredAnimationCount,57);
 assert.equal(base.pages.filter(page=>page.rendererAvailability.kind==='registered').length,57);
 assert.equal(candidate.productBridge.registeredAnimationCount,57,'real registration count stays at 57');
 assert.equal(candidate.productBridge.selectedAnimationIds.length,57);
 assert.deepEqual(candidate.productBridge.selectedAnimationIds,base.productBridge.selectedAnimationIds);
 assert.equal(candidate.pages.filter(page=>page.rendererAvailability.kind==='registered').length,58,
  'the local candidate is renderable in addition to the 57 real members');
 assert.equal(candidate.pages.length,64);
 assert.equal(candidate.glossary.length,13);
 assert.equal(base.glossary.length,12);
 for(let i=0;i<64;i++)if(i!==57)assert.equal(candidate.pages[i],base.pages[i],`old page ${i+1}`);
 for(let i=0;i<base.glossary.length;i++)assert.equal(candidate.glossary[i],base.glossary[i]);
 assert.equal(candidate.glossary.filter(term=>term.id==='show').length,1);
 assert.equal(candidate.glossary.find(term=>term.id==='show')?.sourceKeyAttribute,'Show');
 assert.deepEqual(candidate.glossary.find(term=>term.id==='show')?.definitions,
  P058_SOURCE_TERMS.find(term=>term.id==='show')?.definitions);
 const p058=candidate.pages[57];
 assert.equal(p058.animationId,'shared-nms002-l02-p058');
 assert.equal(p058.placementId,p058.animationId);
 assert.equal(p058.globalPageOrdinal,58);
 assert.equal(p058.sectionCode,'TS');assert.equal(p058.sectionPageOrdinal,4);
 assert.equal(p058.source.sourceOccurrence,58);
 assert.equal(p058.source.assetId,
  'swf-fc26d0a7049db6b8ce5532cfbed1fcb380c75e503d9c7cb7974bea73b8505d57');
 assert.equal(p058.previousPlacementId,'shared-nms002-l02-p057');
 assert.equal(p058.nextPlacementId,'shared-nms002-l02-p059');
 assert.deepEqual(p058.rendererAvailability,{kind:'registered',moduleKey:p058.animationId,
  runtimeQuery:{frameDomain:'sprite-37',language:'fixed-en',scenario:'source-static-frame',seed:'0'}});
 assert.equal(p058.runtimeEvidenceBoundary?.actionScriptExecution,'not-executed');
 assert.equal(p058.runtimeEvidenceBoundary?.naturalTraceValidation,'not-established');
 assert.equal(p058.runtimeEvidenceBoundary?.audioAcceptance,'not-established');
 assert.equal(p058.runtimeEvidenceBoundary?.productVisualBehaviorComposite,'not-established');
 assert(Object.values(candidate.productBridge.acceptanceEffects).every(value=>value===false));
 assert.throws(()=>nmsL02P058CandidateDescriptorV1(candidate),/P058_CANDIDATE_PREDECESSOR/u);
});

test('P058 projection rejects predecessor count, order, source, and glossary drift',()=>{
 const base=realPredecessor().descriptor;
 const changes:Array<(copy:Mutable<typeof base>)=>void>=[
  copy=>{copy.productBridge.registeredAnimationCount=56;},
  copy=>{copy.productBridge.selectedAnimationIds=copy.productBridge.selectedAnimationIds.slice(0,-1);},
  copy=>{copy.pages[57].source.assetId='swf-'+'0'.repeat(64);},
  copy=>{copy.pages[57].sectionPageOrdinal=3;},
  copy=>{copy.pages[57].previousPlacementId=null;},
  copy=>{copy.pages[58].globalPageOrdinal=58;},
  copy=>{(copy.productBridge.acceptanceEffects as unknown as {audioAccepted:boolean}).audioAccepted=true;},
  copy=>{copy.glossary.push({...clone(P058_SOURCE_TERMS[5]),definitions:{en:'wrong',es:'wrong'}});},
 ];
 for(const change of changes){
  const wrong=clone(base) as Mutable<typeof base>;change(wrong);
  assert.throws(()=>nmsL02P058CandidateDescriptorV1(wrong),
   /P058_CANDIDATE_PREDECESSOR|P058_CANDIDATE_GLOSSARY_COLLISION/u);
 }
});
