import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {algL6P003ContinuousCandidateDescriptor} from '../lib/alg-l06-p003-continuous-candidate-v2.server';
import {getWorkspaceRoot} from '../lib/catalog';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys} from '../../../packages/demos/src/local-only-animation-registry-metadata';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
function environment(){
 const values={NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
  HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',VERCEL:undefined,VERCEL_ENV:undefined};
 const prior=Object.fromEntries(Object.keys(values).map(key=>[key,process.env[key]]));
 for(const [key,value] of Object.entries(values)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 return()=>{for(const [key,value] of Object.entries(prior)){if(value===undefined)delete process.env[key];else process.env[key]=value;}};
}
const sha=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
test('actual current reader preserves 60 source occurrences and overlays only unregistered P003',()=>{
 const restore=environment();try{
  const root=getWorkspaceRoot(), registry=`${root}/packages/demos/private-current-js-registry.json`;
  const before=sha(registry),official=[...registeredLocalOnlyAnimationKeys];
  const result=algL6P003ContinuousCandidateDescriptor();
  assert.equal(result.pages.length,60);assert.equal(result.course.courseShellCount,0);
  assert.equal(result.source.sourceXmlSha256,'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c');
  const xml=readFileSync(`${SOURCE_ROOT}/G6-G8-shared/ALG001/L6/index.xml`,'utf8').replace(/<!--[\s\S]*?-->/gu,'');
  const paths=[...xml.matchAll(/<Page\b[^>]*>([^<]+)<\/Page>/gu)].map(match=>match[1].trim());
  assert.equal(paths.length,60);
  for(const [index,page] of result.pages.entries()){
   const id=`shared-alg001-l06-p${String(index+1).padStart(3,'0')}`;
   assert.equal(page.animationId,id);assert.equal(page.globalPageOrdinal,index+1);
   assert.equal(page.source.assetId,`swf-${sha(`${SOURCE_ROOT}/G6-G8-shared/ALG001/L6/${paths[index]}`)}`);
   assert.equal(page.previousPlacementId,index?result.pages[index-1].placementId:null);
   assert.equal(page.nextPlacementId,index<59?result.pages[index+1].placementId:null);
   if(index!==2)assert.equal(page.rendererAvailability.kind,
    localOnlyAnimationModuleRegistration(id)?'registered':'unavailable');
  }
  assert.equal(result.pages[0].rendererAvailability.kind,'registered');
  assert.equal(result.pages[1].rendererAvailability.kind,'registered');
  assert.equal(result.pages[2].rendererAvailability.kind,'registered');
  assert.equal(result.pages[2].presentation?.pageInteractionCompanionTargetIdSuffix,'p003-source-readable');
  assert.equal(localOnlyAnimationModuleRegistration('shared-alg001-l06-p003'),undefined);
  assert.equal(result.productBridge.registeredAnimationCount,20);
  assert.equal(result.continuousCandidateDisclosure.actualRegisteredLessonPages,19);
  assert.equal(result.continuousCandidateDisclosure.simulatedLessonPages,20);
  assert.equal(result.continuousCandidateDisclosure.officialRegisteredCount,official.length);
  assert.equal(result.continuousCandidateDisclosure.wholeCatalogWitnessCurrent,false);
  assert.equal(result.continuousCandidateDisclosure.registryTransactionSha256,before);
  assert.equal(sha(registry),before);assert.deepEqual(registeredLocalOnlyAnimationKeys,official);
  assert.equal(result.course.href,'/migration-status/g678-calibration/shared-alg001-l06-p003/continuous-v2');
  for(const value of [result.descriptorId,result.calibrationId,result.persistence.storageKey])assert.match(value,/p003-continuous-v2-unregistered/u);
  assert.ok(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
 }finally{restore();}
});
test('reader rejects production, provider environment and incorrect source binding before access',()=>{
 const restore=environment();try{
  for(const [key,value] of [['NODE_ENV','production'],['VERCEL','1'],['VERCEL_ENV','preview'],['HELP_MATH_G678_SOURCE_ROOT','/tmp/wrong']]){
   const prior=process.env[key];process.env[key]=value;
   assert.throws(()=>algL6P003ContinuousCandidateDescriptor(),/local development source environment/u);
   if(prior===undefined)delete process.env[key];else process.env[key]=prior;
  }
 }finally{restore();}
});
