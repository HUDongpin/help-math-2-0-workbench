import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,sha256} from './g678-admission-proof.mjs';
import {projectGlossaryFamilySource,validateGlossaryFamilyAdmissionSemantics,
  FAMILY_CONFIG_PATH} from './g678-glossary-family-admission.mjs';
import {buildGlossaryFamilyPacket} from '../scripts/prepare-g678-glossary-family-admission.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(fs.readFileSync(path.join(root,FAMILY_CONFIG_PATH)));
const source=JSON.parse(fs.readFileSync(path.join(root,config.sourceInventoryPaths.sourceInputs)));
const resources=JSON.parse(fs.readFileSync(path.join(root,config.sourceInventoryPaths.hostResources)));
const clone=x=>structuredClone(x);

function projectedCandidate() {
  const reviewed=clone(config);
  const disposition={path:'output/alg-l12-p015-admission-20260927/source-disposition/reviewed.json',
    bytes:2,sha256:sha256(Buffer.from('{}'))};
  reviewed.globalReadDisposition={status:'reviewed',evidence:disposition};
  const configBytes=Buffer.from(JSON.stringify(reviewed,null,2)+'\n');
  const configPin={path:reviewed.configPath,bytes:configBytes.length,sha256:sha256(configBytes)};
  const page=projectGlossaryFamilySource(reviewed,source,resources).page;
  const paths=[...reviewed.pageInputPaths,...page.sourcePins.slice(1).map(item=>item.path)];
  const pins=new Map(paths.map(relative=>[relative,pinFile(root,relative)]));
  pins.set(configPin.path,configPin);pins.set(disposition.path,disposition);
  const audits={metadata:JSON.parse(fs.readFileSync(path.join(root,reviewed.resourcePins.runtimeMetadataPath))),
    audio:JSON.parse(fs.readFileSync(path.join(root,reviewed.resourcePins.sourceAudioStructurePath)))};
  const {packet,entry}=buildGlossaryFamilyPacket({config:reviewed,configPin,
    sourceFacts:page,pins,audits});
  const freeze=Buffer.from(JSON.stringify(packet,null,2)+'\n');
  packet.freezeManifest={path:`catalog/product-bridge-calibrations/${reviewed.calibrationId}.json`,
    bytes:freeze.length,sha256:sha256(freeze)};
  const registration={calibrationId:reviewed.calibrationId,deploymentScope:'local-only',
    freezeManifest:packet.freezeManifest.path,freezeManifestBytes:packet.freezeManifest.bytes,
    freezeManifestSha256:packet.freezeManifest.sha256,entries:[entry]};
  return {packet,registration};
}

test('P015 source projection pins the six controls, glossary and raw/LF Spanish distinction',()=>{
  const {page}=projectGlossaryFamilySource(config,source,resources);
  assert.equal(page.controls.length,6);
  assert.equal(page.frameDomain,'sprite-76');
  assert.equal(page.frameCount,474);
  assert.deepEqual(page.controls.filter(item=>item.action.additionalSourceReads.includes('S'))
    .map(item=>[item.entryId,item.action.additionalReadPosition]),[['locate',2],['point',3]]);
  const exception=config.sourceFacts.glossaryEntryHashExceptions[0];
  assert.equal(exception.status,'reviewed-crlf-normalization');
  assert.deepEqual(pinFile(root,exception.evidence.path),exception.evidence);
  assert.notEqual(exception.sourceEntrySha256,exception.extractionLfNormalizedEntrySha256);
});

test('family validator accepts a fully qualified projected packet but keeps gates false',()=>{
  const {packet,registration}=projectedCandidate();
  assert.equal(validateGlossaryFamilyAdmissionSemantics(packet,registration),true);
  assert.equal(packet.selectedPages[0].runtime.canvasRenderer.path,
    packet.entry.artifacts.runtime.path);
  assert.equal(packet.glossary.operationSideEffectParity,'unestablished');
  assert(Object.values(packet.acceptanceEffects).every(value=>value===false));
});

test('family validator rejects pending disposition, changed S reads and runtime drift',()=>{
  const {packet,registration}=projectedCandidate();
  const pending=clone(packet);
  pending.familyConfig.globalReadDisposition={status:'pending',evidence:null};
  assert.throws(()=>validateGlossaryFamilyAdmissionSemantics(pending,registration));
  const changedRead=clone(packet);
  changedRead.sourceFacts.controls[1].action.additionalReadPosition=3;
  assert.throws(()=>validateGlossaryFamilyAdmissionSemantics(changedRead,registration));
  const changedRuntime=clone(packet);
  changedRuntime.selectedPages[0].runtime.canvasRenderer.path='output/unsafe.js';
  assert.throws(()=>validateGlossaryFamilyAdmissionSemantics(changedRuntime,registration));
});

test('source projection rejects inventory drift without repinning the shared inventory',()=>{
  const changed=clone(source);
  changed.pages.find(item=>item.animationId===config.animationId).controls[0].action.sourceKeyAttribute='Other';
  assert.throws(()=>projectGlossaryFamilySource(config,changed,resources));
});

// Exercise the actual generated metadata shape: identity is the lookup key,
// not a duplicated `key` property inside AnimationModuleRegistration.
test('actual generated metadata is accepted and changed live scope is rejected', async()=>{
 const {localOnlyAnimationModuleRegistrations}=await import('../packages/demos/src/registry.local-only.metadata.generated.ts');
 const freeze=`catalog/product-bridge-calibrations/${config.calibrationId}.json`;
 const packet={...JSON.parse(fs.readFileSync(path.join(root,freeze))),freezeManifest:pinFile(root,freeze)};
 const registration=localOnlyAnimationModuleRegistrations[config.animationId];
 assert.equal(validateGlossaryFamilyAdmissionSemantics(packet,registration),true);
 assert.throws(()=>validateGlossaryFamilyAdmissionSemantics(packet,{...registration,scope:'public'}));
});
