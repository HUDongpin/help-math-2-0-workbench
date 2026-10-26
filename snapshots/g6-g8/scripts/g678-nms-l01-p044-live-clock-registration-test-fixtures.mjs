import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,realpath,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {ROOT,REGISTRY,PRIOR,SOURCE,CANDIDATE,SELF,PROPOSED_FREEZE,PROPOSED_FRAGMENT,encode,binding,composeRepairRegistration} from './prepare-g678-nms-l01-p044-live-clock-registration.mjs';
import {seed,snapshot} from './g678-nms-l01-p042-readable-registration-test-fixtures.mjs';
import {readBoundActivationFile} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
export {seed,snapshot,encode};
export const read=file=>readFileSync(path.join(ROOT,file)),parse=b=>JSON.parse(b.toString('utf8'));
export function fixture(){const inputs={witnessBytes:read(PRIOR.registry.path),priorFreezeBytes:read(PRIOR.freeze.path),priorFragmentBytes:read(PRIOR.fragment.path),
  sourceBytes:read(SOURCE.path),priorSourceBytes:read(PRIOR.source.path),candidateBytes:read(CANDIDATE.path),priorActivationBytes:read(PRIOR.activation.path),
  priorBridgeBytes:read(PRIOR.bridge.path),preparerBytes:read(SELF)};
  const result=composeRepairRegistration({priorFreeze:parse(inputs.priorFreezeBytes),priorFragment:parse(inputs.priorFragmentBytes),priorRegistry:parse(inputs.witnessBytes),
    source:parse(inputs.sourceBytes),priorSource:parse(inputs.priorSourceBytes),candidate:parse(inputs.candidateBytes),plannerBinding:binding(SELF,inputs.preparerBytes)});
  return{inputs:{...inputs,freezeBytes:result.freezeBytes,fragmentBytes:result.fragmentBytes},result,witnessBytes:inputs.witnessBytes};}
export async function temporary(t){const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'helpmath-p044-379-v2-activation-test-')));t.after(()=>rm(root,{recursive:true,force:true}));const f=fixture(),i=f.inputs;
  await seed(root,[[REGISTRY,i.witnessBytes],[PRIOR.registry.path,i.witnessBytes,0o444],[PRIOR.freeze.path,i.priorFreezeBytes],[PRIOR.fragment.path,i.priorFragmentBytes],
    [SOURCE.path,i.sourceBytes],[PRIOR.source.path,i.priorSourceBytes],[CANDIDATE.path,i.candidateBytes],[PRIOR.activation.path,i.priorActivationBytes],
    [PRIOR.bridge.path,i.priorBridgeBytes,0o444],[SELF,i.preparerBytes],[PROPOSED_FREEZE,i.freezeBytes,0o444],[PROPOSED_FRAGMENT,i.fragmentBytes,0o444]]);return{root,...f};}
export async function checkTemporaryPrepared({root,inputs,result}){for(const[p,b]of[[PROPOSED_FREEZE,inputs.freezeBytes],[PROPOSED_FRAGMENT,inputs.fragmentBytes]]){
  const file=await readBoundActivationFile(root,p,binding(p,b));assert.equal(file.mode&0o222,0);}
  const live=(await readBoundActivationFile(root,REGISTRY)).buffer;assert.ok(live.equals(inputs.witnessBytes)||live.equals(result.nextRegistryBytes));return 0;}
