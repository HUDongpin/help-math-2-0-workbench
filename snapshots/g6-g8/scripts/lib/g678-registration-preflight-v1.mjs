/** Read-only preflight through the production writer's validators. No registry,
 * generated dispatch, page proof, or activation file is written here. */
import assert from 'node:assert/strict';
import {validateFragment} from '../upsert-private-current-js-calibration.mjs';
import {upsertPrivateCurrentJsCalibration} from '../private-current-js-registry.mjs';
import {isHfrArtifactEntry,validateHfrCurrentProducer} from './hfr-artifact-binding-v1.mjs';
import {DISPATCH,REGISTRY,pinFile,readJsonPin,readRegistryTransaction,registrySources} from '../../lib/g678-admission-proof.mjs';

export async function preflightRegistration({root,fragment,transaction=readRegistryTransaction(root),exact=false}) {
 const inputs=[REGISTRY,...DISPATCH].map(file=>pinFile(root,file));
 const calibration=fragment.calibration??fragment;
 // This pure writer call catches canonical path/key/duplicate failures before
 // loading expensive runtime artifacts. Draft fragments may omit artifact pins.
 if(exact)upsertPrivateCurrentJsCalibration(transaction.registry,calibration);
 const validated=await validateFragment(root,calibration);
 assert.equal(validated.deploymentScope,'local-only','G678 preflight is local-only');
 if(fragment.calibration)assert(fragment.schemaVersion===1&&
  fragment.artifactType==='private-current-js-calibration-fragment-v1'&&
  fragment.freeze.path===validated.freezePath&&fragment.freeze.bytes===validated.freeze.bytes.length&&
  fragment.freeze.sha256===validated.freeze.sha256,'fragment wrapper binds exact freeze');
 const bound={...calibration,freezeManifestBytes:validated.freeze.bytes.length,
  freezeManifestSha256:validated.freeze.sha256,
  entries:calibration.entries.map(entry=>({...entry,artifacts:validated.entryArtifacts.get(entry.key)}))};
 if(exact)assert.deepEqual(bound,calibration,'supplied registration is exactly what the real writer binds');
 const existing=transaction.registry.calibrations.find(c=>c.calibrationId===bound.calibrationId);
 if(!existing)for(const entry of bound.entries)if(isHfrArtifactEntry(entry))
  validateHfrCurrentProducer(root,bound,entry,validated.freeze.value);
 const projected=upsertPrivateCurrentJsCalibration(transaction.registry,bound);
 registrySources(projected); // Both production dispatch generators must accept it.
 if(existing)assert.deepEqual(existing,bound,'preflight must not silently replace an existing calibration');
 assert.deepEqual(inputs,[REGISTRY,...DISPATCH].map(file=>pinFile(root,file)),'read-only registry transaction remained stable');
 return {status:'registration-contract-passed',registered:Boolean(existing),registration:bound,
  inputs,freeze:{path:validated.freezePath,bytes:validated.freeze.bytes.length,sha256:validated.freeze.sha256},
  note:'Writer contract only; real My Lesson/browser and independent acceptance gates remain required.'};
}

export async function preflightRegistrationFile(root,file) {
 const pin=pinFile(root,file);
 const result=await preflightRegistration({root,fragment:readJsonPin(root,pin)});
 assert.deepEqual(pinFile(root,file),pin,'fragment remained stable during preflight');
 return {...result,fragment:pin};
}
