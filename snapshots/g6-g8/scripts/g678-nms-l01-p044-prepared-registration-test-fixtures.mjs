import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,realpath,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {ROOT,REGISTRY,PRIOR,AUTHORITY,BASE_AUTHORITY,CATALOG,PLANNER,PROPOSED_FREEZE,PROPOSED_FRAGMENT,encode,binding,composeP044Registration}
  from './plan-g678-nms-l01-p044-registration.mjs';
import {seed,snapshot} from './g678-nms-l01-p042-readable-registration-test-fixtures.mjs';
import {readBoundActivationFile} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
export {seed,snapshot,encode};
export const read=file=>readFileSync(path.join(ROOT,file));
export const parse=bytes=>JSON.parse(bytes.toString('utf8'));
export function fixture(){
  const inputs={witnessBytes:read(PRIOR.registry.path),priorFreezeBytes:read(PRIOR.freeze.path),priorFragmentBytes:read(PRIOR.fragment.path),
    sourceBytes:read(AUTHORITY.path),baseSourceBytes:read(BASE_AUTHORITY.path),catalogBytes:read(CATALOG.path),priorActivationBytes:read(PRIOR.activation.path),plannerBytes:read(PLANNER)};
  const result=composeP044Registration({priorFreeze:parse(inputs.priorFreezeBytes),priorFragment:parse(inputs.priorFragmentBytes),priorRegistry:parse(inputs.witnessBytes),
    source:parse(inputs.sourceBytes),sourceBase:parse(inputs.baseSourceBytes),pagesCatalog:parse(inputs.catalogBytes),plannerBinding:binding(PLANNER,inputs.plannerBytes)});
  return{inputs:{...inputs,freezeBytes:result.freezeBytes,fragmentBytes:result.fragmentBytes},result,witnessBytes:inputs.witnessBytes};
}
export async function temporary(t){
  const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'helpmath-p044-379-registration-test-')));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const f=fixture(),i=f.inputs;
  await seed(root,[[REGISTRY,i.witnessBytes],[PRIOR.registry.path,i.witnessBytes,0o444],[PRIOR.freeze.path,i.priorFreezeBytes],
    [PRIOR.fragment.path,i.priorFragmentBytes],[AUTHORITY.path,i.sourceBytes],[BASE_AUTHORITY.path,i.baseSourceBytes],[CATALOG.path,i.catalogBytes],
    [PRIOR.activation.path,i.priorActivationBytes],[PLANNER,i.plannerBytes],[PROPOSED_FREEZE,i.freezeBytes,0o444],[PROPOSED_FRAGMENT,i.fragmentBytes,0o444]]);
  return{root,...f};
}
// Temp fixture validates canonical prepared bytes, not real private source paths.
// Actual CLI calls prepare379 --check, including the full stable candidate closure.
export async function checkTemporaryPrepared({root,inputs,result}){
  for(const[file,bytes]of[[PROPOSED_FREEZE,inputs.freezeBytes],[PROPOSED_FRAGMENT,inputs.fragmentBytes]]){
    const actual=await readBoundActivationFile(root,file,binding(file,bytes));assert.equal(actual.mode&0o222,0);
  }
  const live=(await readBoundActivationFile(root,REGISTRY)).buffer;
  assert.ok(live.equals(inputs.witnessBytes)||live.equals(result.nextRegistryBytes));return 0;
}
