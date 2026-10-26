import assert from 'node:assert/strict';
import test from 'node:test';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {algL6P003FormalDescriptor} from '../lib/alg-l06-p003-formal-admission-v1.server';
import {ALG_L06_P004_ADMISSION_CALIBRATION,ALG_L06_P004_ADMISSION_ID,
  extendAlgL6P004Descriptor,type AlgL06P004DescriptorInput}
  from '../lib/alg-l06-p004-descriptor-extension-v1';
import {getWorkspaceRoot} from '../lib/catalog';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const env=process.env as Record<string,string|undefined>;
Object.assign(env,{NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
  HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'});
delete env.VERCEL;delete env.VERCEL_ENV;
const root=getWorkspaceRoot();
const base=algL6P003FormalDescriptor();
const source={path:'G6-G8-shared/ALG001/L6/RW/L6RW04.swf',bytes:1115626,
  sha256:'514867e794dbc86059a452c5f1091cabfabf73e6f7918d0d28d9cf7ee604573e'};
const sourceXml={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
  sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const modulePin={path:'packages/demos/src/modules/shared-alg001-l06-p004.tsx',bytes:2974,
  sha256:'d8bc6cfe4b2672d49fc51bb0a1c9a845b95c2e1b06e14535c5d7b94f5bf464ab'};
const timelinePin={path:'packages/demos/src/timelines/shared-alg001-l06-p004.ts',bytes:1234,
  sha256:'586818cdfe18b6afd22048825c17a1be6bf4610b1348c8f4497c5b42c06c0b06'};
const runtimePin={path:'work/g678-shared-page-factory/g678-alg-l06-p004-current-js-20260928-v1/members/shared-alg001-l06-p004/canvas-renderer.js',bytes:7342336,
  sha256:'6b6f124262c8b90517151ea77eee43a30843c170211d4cd76404e584c876c2d8'};
const glossaryPin={path:'migrations/shared-alg001-l06-p004/audit/source-glossary-v1.json',
  bytes:15869,sha256:'0cb0789f117db00855a5be1c1123121cdd64b7eba03b2f64ddce3d7f81f999e0'};
for(const pin of [source,sourceXml])readPin(SOURCE_ROOT,pin);
for(const pin of [modulePin,timelinePin,runtimePin])readPin(root,pin);
const glossary=readJsonPin(root,glossaryPin) as AlgL06P004DescriptorInput['glossary'];

/** Source, glossary, module and timeline are real pinned bytes. The freeze
 * and registration are in-memory shape fixtures until formal admission. */
const planned:AlgL06P004DescriptorInput={
  packet:{calibrationId:ALG_L06_P004_ADMISSION_CALIBRATION,deploymentScope:'local-only',
    sourceRoot:SOURCE_ROOT,sourceXml,source,
    freezeManifest:{path:`catalog/product-bridge-calibrations/${ALG_L06_P004_ADMISSION_CALIBRATION}.json`,
      bytes:1,sha256:'a'.repeat(64)},
    selectedPages:[{animationId:ALG_L06_P004_ADMISSION_ID,
      placementId:ALG_L06_P004_ADMISSION_ID,sourceSha256:source.sha256,
      globalPageOrdinal:4,sourceOccurrence:4,sectionCode:'RW',sectionPageOrdinal:3,
      runtime:{frameDomain:'sprite-95',frameCount:831,rootFrameCount:10,
        rootBeginFrame:6,fps:12,stage:{width:800,height:600},
        scenario:'source-static-frame',seed:'0',canvasRenderer:runtimePin,
        hostPlaybackCompletion:false}}],
    entry:{key:ALG_L06_P004_ADMISSION_ID,module:`./modules/${ALG_L06_P004_ADMISSION_ID}`,
      maturity:'private-current-js',artifacts:{module:modulePin,timeline:timelinePin,
        runtime:runtimePin}},
    acceptanceEffects:base.productBridge.acceptanceEffects,
    productCalibrationPassed:false,scaleOutAuthorized:false},
  registration:{calibrationId:ALG_L06_P004_ADMISSION_CALIBRATION,
    deploymentScope:'local-only',maturity:'private-current-js',
    freezeManifestSha256:'a'.repeat(64),moduleSha256:modulePin.sha256,
    timelineSha256:timelinePin.sha256,runtimeSha256:runtimePin.sha256},
  glossary,
};
function reject(change:(value:any,predecessor:any)=>void){
  const value=structuredClone(planned),predecessor=structuredClone(base);
  change(value,predecessor);
  assert.throws(()=>extendAlgL6P004Descriptor(predecessor,value),
    /ALG_L06_P004_DESCRIPTOR_INVALID/u);
}

test('source-backed P003 predecessor gains only RW3 and five canonical terms',()=>{
  assert.equal(base.pages.length,60);
  assert.equal(base.productBridge.registeredAnimationCount,20);
  assert.equal(base.pages[3].rendererAvailability.kind,'unavailable');
  const result=extendAlgL6P004Descriptor(base,planned);
  assert.equal(result.pages.length,60);
  assert.equal(result.productBridge.registeredAnimationCount,21);
  assert.equal(result.pages.filter(page=>page.rendererAvailability.kind==='registered').length,21);
  assert.equal(result.productBridge.pageOnlyDescriptorMemberCount,60);
  assert.equal(result.course.href,
    '/migration-status/g678-calibration/shared-alg001-l06-p004/continuous-v1');
  for(let index=0;index<60;index++)if(index!==3)assert.equal(result.pages[index],base.pages[index]);
  assert.equal(result.pages[3].rendererAvailability.kind,'registered');
  if(result.pages[3].rendererAvailability.kind==='registered'){
    assert.equal(result.pages[3].rendererAvailability.moduleKey,ALG_L06_P004_ADMISSION_ID);
    assert.deepEqual(result.pages[3].rendererAvailability.runtimeQuery,
      {frameDomain:'sprite-95',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
  }
  assert.equal(result.pages[3].presentation?.pageInteractionCompanionTargetIdSuffix,
    'p004-source-readable');
  assert.equal(result.pages[3].labels,base.pages[3].labels);
  assert.equal(result.pages[3].runtimeEvidenceBoundary?.naturalTraceValidation,'not-established');
  assert.deepEqual(result.glossary.slice(0,base.glossary.length),base.glossary);
  assert.deepEqual(result.glossary.slice(base.glossary.length).map(entry=>entry.id),
    ['input','output','relation','value','rule']);
  assert.equal(result.glossary.filter(entry=>entry.id==='function').length,1);
  assert.equal(result.glossary.filter(entry=>entry.id==='output').length,1);
  assert.equal(result.glossary.length,base.glossary.length+5);
  assert.equal(result.support,base.support);
  assert.deepEqual(result.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
  assert(Object.values(result.productBridge.acceptanceEffects).every(value=>value===false));
  assert.equal(base.productBridge.registeredAnimationCount,20);
});

test('wrong source, ordinal, runtime and registration identity fail closed',()=>{
  reject(value=>{value.packet.source.sha256='f'.repeat(64);});
  reject(value=>{value.packet.sourceXml.bytes=1;});
  reject(value=>{value.packet.selectedPages[0].globalPageOrdinal=5;});
  reject(value=>{value.packet.selectedPages[0].sectionPageOrdinal=2;});
  reject(value=>{value.packet.selectedPages[0].runtime.frameDomain='root';});
  reject(value=>{value.packet.selectedPages[0].runtime.hostPlaybackCompletion=true;});
  reject(value=>{value.packet.entry.artifacts.runtime.sha256='f'.repeat(64);});
  reject(value=>{value.packet.freezeManifest.path='catalog/unrelated.json';});
  reject(value=>{value.registration.freezeManifestSha256='f'.repeat(64);});
  reject(value=>{value.packet.acceptanceEffects.ownerAccepted=true;});
});

test('changed predecessor, duplicated terms and implicit case normalization fail closed',()=>{
  reject((_,predecessor)=>{predecessor.productBridge.registeredAnimationCount=21;});
  reject((_,predecessor)=>{predecessor.pages[3].source.assetId='swf-'+'f'.repeat(64);});
  reject((_,predecessor)=>{predecessor.pages[3].nextPlacementId='shared-alg001-l06-p006';});
  reject((_,predecessor)=>{predecessor.productBridge.selectedAnimationIds.reverse();});
  reject((_,predecessor)=>{predecessor.glossary.find((row:any)=>row.id==='function').definitions.en='other';});
  reject(value=>{value.glossary.entries[6].canonicalDictionaryKey='output';});
  reject(value=>{value.glossary.entries[6].occurrenceIds=['59@110'];});
  reject(value=>{value.glossary.entries[1].id='input';});
  reject(value=>{value.glossary.entries[0].source.en.sha256='f'.repeat(64);});
});
