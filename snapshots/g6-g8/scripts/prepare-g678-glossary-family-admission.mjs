#!/usr/bin/env node
/** Reusable one-member glossary admission producer. Config is the only page-
 * specific input; this command never activates a registry, host or index. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin,readPin,readPageProof,readRegistryTransaction,
  sha256,uniquePins,verifyHostVersion} from '../lib/g678-admission-proof.mjs';
import {FAMILY_ACCEPTANCE_KEYS,FAMILY_CONFIG_PATH,projectGlossaryFamilySource,
  validateGlossaryFamilyAdmissionSemantics} from '../lib/g678-glossary-family-admission.mjs';
import {prepareAdmissionCandidate} from './lib/g678-admission-candidate.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUTPUT='output/alg-l12-next-glossary-20260927';
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const demand=(condition,why)=>assert(condition,`G678_FAMILY_PREPARE: ${why}`);

function physicalRoot(selected,expected) {
  demand(selected===expected && fs.realpathSync(selected)===selected &&
    fs.lstatSync(selected).isDirectory() && !fs.lstatSync(selected).isSymbolicLink(),
  `physical authorized source root: ${expected}`);
}
function activeHost(root,id) {
  const source=fs.readFileSync(path.join(root,'apps/web/lib/g678-admission-activation.ts'),'utf8');
  const match=source.match(/export const G678_ADMISSION_INDEX = (\{[\s\S]*?\}) as const;/);
  demand(match,'active admission index');
  const index=readJsonPin(root,JSON.parse(match[1]));
  demand(index.kind==='g678-admission-index-v1' &&
    !index.pages.some(item=>item.animationId===id),'new page only');
  return {pin:index.host,host:verifyHostVersion(root,index.host)};
}

/** The separate pair_resource_tests audit must produce this hash-pinned
 * review receipt before the candidate can be prepared or served. */
export function verifyGlobalReadDisposition(root,config) {
  const value=config.globalReadDisposition;
  demand(value?.status==='reviewed' && value.evidence,'global S-read disposition is pending');
  const receipt=readJsonPin(root,value.evidence);
  demand(receipt.schemaVersion===1 &&
    receipt.kind==='g678-glossary-global-read-disposition-v1' &&
    receipt.animationId===config.animationId &&
    receipt.sourceSwfSha256===config.source.sha256 &&
    receipt.sourceCatalogSha256===config.sourceFacts.sourceCatalogSha256 &&
    receipt.pairResourceTestsPassed===true && receipt.reviewed===true &&
    receipt.operationSideEffectParity==='unestablished' &&
    ['source-parity-preserved','qualified-modern-deviation'].includes(receipt.decision),
  'reviewed pair_resource_tests disposition identity');
  assert.deepStrictEqual(receipt.globalReadControls,config.sourceFacts.globalReadControls,
    'exact Locate/Point global reads');
  demand(typeof receipt.finding==='string' && receipt.finding.length>0,
    'written source-qualified finding');
  return receipt;
}

function currentInputs(root,config,sourceFacts) {
  const paths=[config.configPath,...config.pageInputPaths,
    ...sourceFacts.sourcePins.slice(1).map(item=>item.path),
    ...(config.globalReadDisposition.evidence?[config.globalReadDisposition.evidence.path]:[])];
  const member=config.animationId.match(/-(p\d{3})$/)?.[1];
  demand(member && paths.every(item=>typeof item==='string' && !path.isAbsolute(item) &&
    !item.includes('..') && !/\/(p\d{3})\//.test(item.replace(`/${member}/`,'/')) &&
    !Object.values(config.sourceInventoryPaths).includes(item) &&
    !config.sharedHostPaths.includes(item) &&
    item!=='packages/demos/private-current-js-registry.json'),
  'P015-only page ownership');
  const pins=new Map([...new Set(paths)].map(relative=>[relative,pinFile(root,relative)]));
  for(const extracted of sourceFacts.sourcePins.slice(1))
    assert.deepStrictEqual(pins.get(extracted.path),extracted,
      `source extraction ${extracted.path}`);
  return pins;
}

function validateResourceAudits(root,config,pins) {
  for(const exception of config.sourceFacts.glossaryEntryHashExceptions??[]) {
    assert.deepStrictEqual(pins.get(exception.evidence.path),exception.evidence,
      'reviewed dictionary exception pin');
    const audit=readJsonPin(root,exception.evidence);
    demand(audit.entry==='Ordered pair' && audit.locale==='es' &&
      audit.source?.sha256===config.keyterms[1].sha256 &&
      audit.rawSha256===exception.sourceEntrySha256 &&
      audit.lfNormalizedSha256===exception.extractionLfNormalizedEntrySha256 &&
      audit.rawBytes===823 && audit.lfNormalizedBytes===822 && audit.crlfCount===1,
      'exact Spanish Ordered pair CRLF evidence');
  }
  const metadata=readJsonPin(root,pins.get(config.resourcePins.runtimeMetadataPath));
  demand(metadata.animationId===config.animationId &&
    metadata.sourceSwfSha256===config.source.sha256 &&
    metadata.frameDomain===config.sourceFacts.frameDomain &&
    metadata.rootFrame===config.sourceFacts.rootFrame &&
    metadata.frameCount===config.sourceFacts.frameCount &&
    metadata.runtimeSha256===config.resourcePins.nativeRuntime.sha256 &&
    metadata.runtimeBytes===config.resourcePins.nativeRuntime.bytes &&
    metadata.sourceCanvas?.sha256 &&
    metadata.renderScale===2 && metadata.requiredCanvas?.width===1600 &&
    metadata.requiredCanvas?.height===1200 &&
    metadata.nativeTextSuppressionApplied===true &&
    metadata.nativeTextReplacementRequired===true &&
    metadata.registered===false && metadata.audioAccepted===false &&
    metadata.originalRuntimeAccepted===false && metadata.fidelityAccepted===false,
  'native runtime provenance and acceptance flags');
  const audio=readJsonPin(root,pins.get(config.resourcePins.sourceAudioStructurePath));
  demand(audio.animationId===config.animationId &&
    audio.sourceSwfSha256===config.source.sha256 &&
    audio.frameDomain===config.sourceFacts.frameDomain &&
    audio.sourceAlignmentAccepted===false && audio.listeningAccepted===false,
  'source audio audit remains qualification only');
  assert.deepStrictEqual(audio.structure,config.sourceAudioExpected,
    'exact configured source audio structure');
  return {metadata,audio};
}

export function buildGlossaryFamilyPacket({config,configPin,sourceFacts,pins,audits}) {
  const get=relative=>{const pin=pins.get(relative);demand(pin,`page input ${relative}`);return pin;};
  const id=config.animationId,r=config.resourcePins,s=config.selectedPage;
  const entry={key:id,module:`./modules/${id}`,maturity:'private-current-js',
    complexityLane:'interactive-understood',artifacts:{
      module:get(`packages/demos/src/modules/${id}.tsx`),
      timeline:get(`packages/demos/src/timelines/${id}.ts`),
      runtime:r.canonicalRuntime,
    }};
  const packet={schemaVersion:1,calibrationId:config.calibrationId,
    sourceRoot:config.sourceRoot,scope:'private-engineering',deploymentScope:'local-only',
    familyConfig:config,familyConfigPin:configPin,source:config.source,sourceXml:config.sourceXml,
    optionalSpanishAudio:{source:config.spanishAudio,automaticLocalePlayback:false,
      spokenLanguageVerified:false,listeningAccepted:false},sourceFacts,
    selectedPages:[{animationId:id,placementId:id,assetId:`swf-${config.source.sha256}`,
      stableLessonKey:s.stableLessonKey,sourceSha256:config.source.sha256,
      moduleCode:s.moduleCode,lessonNumber:s.lessonNumber,
      globalPageOrdinal:s.globalPageOrdinal,sectionCode:s.sectionCode,
      sectionPageOrdinal:s.sectionPageOrdinal,complexityLane:'interactive-understood',
      implementationLane:s.implementationLane,
      runtime:{stage:{width:800,height:600},rootFrameCount:config.sourceFacts.rootFrameCount,
        rootBeginFrame:config.sourceFacts.rootFrame,frameDomain:config.sourceFacts.frameDomain,
        frameCount:config.sourceFacts.frameCount,livePlaybackEndFrame:config.sourceFacts.frameCount,
        fps:config.sourceFacts.fps,language:'fixed-en',scenario:s.scenario,seed:'0',
        renderScale:2,canvas:{width:1600,height:1200},
        canvasRenderer:{...r.canonicalRuntime,
          url:`/flash-assets/g678-local/${id}/typography.js?sha256=${r.nativeRuntime.sha256}`}},
      runtimeEvidenceBoundary:{runtimeKind:'source-structure-bound-modern-current-js-candidate',
        actionScriptExecution:'not-executed',naturalTraceValidation:'not-established',
        audioAcceptance:'not-established',
        replaySemantics:'modern-full-frame-terminal-hold-original-runtime-parity-not-established',
        productBehavior:'maintained-glossary-pause-adapter-implemented',
        productVisualBehaviorComposite:'not-established'}}],
    entry,visual:{runtime:r.canonicalRuntime,nativeRuntime:r.nativeRuntime,
      metadata:get(r.runtimeMetadataPath),sourceCanvasSha256:audits.metadata.sourceCanvas.sha256},
    audio:{main:r.mainAudio,structure:get(r.sourceAudioStructurePath),
      structureFacts:{...audits.audio.structure,sourceAlignmentAccepted:false,listeningAccepted:false}},
    glossary:{sourceButtonCount:config.sourceFacts.controlCount,stopPath:'animation_mc.animation',
      closePolicy:'remain-paused',additionalGlobalReadParity:'unestablished',
      operationSideEffectParity:'unestablished',disposition:config.globalReadDisposition.evidence},
    integrity:{scope:'single-family-member-source-and-implementation',
      completeTransitiveClosure:false,
      qualification:'This family member source, native runtime and audio are page-owned; generic admission and My Lesson host are independently pinned by the host version.',
      files:uniquePins([...pins.values(),r.canonicalRuntime])},
    acceptanceEffects:Object.fromEntries(FAMILY_ACCEPTANCE_KEYS.map(key=>[key,false])),
    productCalibrationPassed:false,scaleOutAuthorized:false};
  return {packet,entry};
}

/** Read-only plan. It verifies the real registry projection even while the
 * reviewed source disposition and shared host successor are still pending. */
export function buildGlossaryFamilyAdmissionPlan({root=ROOT,
  sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT,
  configPath=FAMILY_CONFIG_PATH}={}) {
  demand(!process.env.VERCEL && !process.env.VERCEL_ENV && process.env.NODE_ENV!=='production',
    'local engineering only');
  demand(typeof configPath==='string' && !path.isAbsolute(configPath) &&
    !configPath.includes('..') && configPath.endsWith('/admission-config.json'),
    'bounded family config path');
  const configPin=pinFile(root,configPath),config=readJsonPin(root,configPin);
  demand(config.configPath===configPath,'config self path');
  physicalRoot(sourceRoot,config.sourceRoot);
  physicalRoot(config.keytermRoot,config.keytermRoot);
  for(const item of [config.source,config.sourceXml,config.spanishAudio])
    assert.deepStrictEqual(pinFile(sourceRoot,item.path),item,`canonical source ${item.path}`);
  for(const item of config.keyterms)
    assert.deepStrictEqual(pinFile(config.keytermRoot,item.path),item,`key term ${item.path}`);
  const sourceInputs=readJsonPin(root,pinFile(root,config.sourceInventoryPaths.sourceInputs));
  const resourceInputs=readJsonPin(root,pinFile(root,config.sourceInventoryPaths.hostResources));
  const {page:sourceFacts}=projectGlossaryFamilySource(config,sourceInputs,resourceInputs);
  const pins=currentInputs(root,config,sourceFacts);
  const r=config.resourcePins;
  for(const resource of [r.nativeRuntime,r.mainAudio])
    assert.deepStrictEqual(pins.get(resource.path),resource,`resource bytes ${resource.path}`);
  demand(r.canonicalRuntime.path.startsWith('work/g678-shared-page-factory/') &&
    r.canonicalRuntime.path.endsWith(`/members/${config.animationId}/canvas-renderer.js`) &&
    r.canonicalRuntime.bytes===r.nativeRuntime.bytes &&
    r.canonicalRuntime.sha256===r.nativeRuntime.sha256,'canonical runtime identity');
  if(fs.existsSync(path.join(root,r.canonicalRuntime.path)))
    assert.deepStrictEqual(pinFile(root,r.canonicalRuntime.path),r.canonicalRuntime,
      'preexisting canonical runtime bytes');
  const nativeBytes=readPin(root,r.nativeRuntime);
  const audits=validateResourceAudits(root,config,pins);
  const {pin:hostPin,host}=activeHost(root,config.animationId);
  const transaction=readRegistryTransaction(root);
  demand(!transaction.registry.calibrations.some(item=>item.calibrationId===config.calibrationId),
    'new calibration only');
  const {packet,entry}=buildGlossaryFamilyPacket({config,configPin,sourceFacts,pins,audits});
  const freeze=`catalog/product-bridge-calibrations/${config.calibrationId}.json`;
  const fragmentPath=`catalog/product-bridge-calibrations/${config.calibrationId}.fragment.json`;
  const candidatePath=`work/g678-workflow/candidates/${config.animationId}-v1.json`;
  const freezeBytes=json(packet),freezePin={path:freeze,bytes:freezeBytes.length,
    sha256:sha256(freezeBytes)};
  const fragment={calibrationId:config.calibrationId,deploymentScope:'local-only',
    freezeManifest:freeze,freezeManifestBytes:freezePin.bytes,
    freezeManifestSha256:freezePin.sha256,entries:[entry]};
  const projectedRegistry=upsertPrivateCurrentJsCalibration(transaction.registry,fragment);
  demand(projectedRegistry.calibrations.some(item=>item.calibrationId===config.calibrationId),
    'real registry validator accepts exact one-member fragment');
  const hostMissing=config.sharedHostPaths.filter(relative=>!host.files.some(pin=>
    pin.path===relative && JSON.stringify(pin)===JSON.stringify(pinFile(root,relative))));
  const external=[...[config.source,config.sourceXml,config.spanishAudio].map(pin=>({root:sourceRoot,pin})),
    ...config.keyterms.map(pin=>({root:config.keytermRoot,pin}))];
  return {config,packet,fragment,freezePin,hostPin,hostMissing,transaction,external,
    outputs:[{path:r.canonicalRuntime.path,bytes:nativeBytes},
      {path:freeze,bytes:freezeBytes},{path:fragmentPath,bytes:json(fragment)}],
    candidatePath,inputCount:pins.size};
}

function exclusiveWrite(root,relative,bytes) {
  const target=path.join(root,relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,bytes,{flag:'wx'});
  assert.deepStrictEqual(pinFile(root,relative),{path:relative,bytes:bytes.length,
    sha256:sha256(bytes)},`readback ${relative}`);
}
export function prepareGlossaryFamilyAdmission(plan,root=ROOT) {
  demand(plan.hostMissing.length===0,'generic admission files need a successor host');
  verifyGlobalReadDisposition(root,plan.config);
  demand([plan.candidatePath,...plan.outputs.map(item=>item.path)].every(relative=>
    !fs.existsSync(path.join(root,relative))),'immutable outputs absent');
  validateGlossaryFamilyAdmissionSemantics({...plan.packet,freezeManifest:plan.freezePin},plan.fragment);
  for(const item of plan.outputs)exclusiveWrite(root,item.path,item.bytes);
  const result=prepareAdmissionCandidate({root,output:plan.candidatePath,
    animationId:plan.config.animationId,packet:{...plan.packet,freezeManifest:plan.freezePin},
    registration:plan.fragment,implementationFiles:[],external:plan.external,
    hostPin:plan.hostPin,transaction:plan.transaction,
    validateSemantics:validateGlossaryFamilyAdmissionSemantics});
  return {status:'FAMILY_CANDIDATE_PREPARED_NOT_REGISTERED',candidate:result.proof,
    outputs:plan.outputs.map(item=>pinFile(root,item.path)),
    registrationEffect:'none',acceptanceEffect:'none'};
}
export function checkGlossaryFamilyAdmission(plan,root=ROOT) {
  demand(plan.hostMissing.length===0,'generic admission files need a successor host');
  verifyGlobalReadDisposition(root,plan.config);
  for(const item of plan.outputs)
    demand(readPin(root,{path:item.path,bytes:item.bytes.length,sha256:sha256(item.bytes)}).equals(item.bytes),
      `immutable output ${item.path}`);
  const projected={...plan.transaction,registry:{...plan.transaction.registry,
    calibrations:[...plan.transaction.registry.calibrations,plan.fragment]}};
  const packet=readPageProof(root,pinFile(root,plan.candidatePath),
    verifyHostVersion(root,plan.hostPin),projected);
  validateGlossaryFamilyAdmissionSemantics(packet,plan.fragment);
  return {status:'FAMILY_CANDIDATE_CHECKED_NOT_REGISTERED',
    candidate:pinFile(root,plan.candidatePath),registrationEffect:'none',acceptanceEffect:'none'};
}
export function main(argv=process.argv.slice(2)) {
  demand(argv.length===1 && ['--dry-run','--prepare','--check'].includes(argv[0]),
    'use --dry-run, --prepare or --check');
  const plan=buildGlossaryFamilyAdmissionPlan();
  const result=argv[0]==='--prepare'?prepareGlossaryFamilyAdmission(plan):
    argv[0]==='--check'?checkGlossaryFamilyAdmission(plan):
    {status:'FAMILY_PROJECTED_INPUTS_VERIFIED_NOT_WRITTEN',
      sourceDisposition:plan.config.globalReadDisposition.status,
      hostMissing:plan.hostMissing,inputCount:plan.inputCount,
      outputPins:plan.outputs.map(item=>({path:item.path,bytes:item.bytes.length,
        sha256:sha256(item.bytes)})),candidatePath:plan.candidatePath,
      registrationEffect:'none',acceptanceEffect:'none'};
  process.stdout.write(JSON.stringify(result)+'\n');
  return result;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try{main();}catch(error){process.stderr.write(`${error.stack??error}\n`);process.exitCode=1;}
}
