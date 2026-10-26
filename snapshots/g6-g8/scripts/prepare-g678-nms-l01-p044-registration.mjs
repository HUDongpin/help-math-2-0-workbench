#!/usr/bin/env node
// Exact379 preparation; current registry and generated registries are untouched.
import assert from 'node:assert/strict';
import {lstat,readFile,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,REGISTRY,PRIOR,AUTHORITY,BASE_AUTHORITY,CATALOG,PLANNER,PROPOSED_FREEZE,PROPOSED_FRAGMENT,
  composeP044Registration,binding} from './plan-g678-nms-l01-p044-registration.mjs';
import {prepare as checkCandidate} from './prepare-g678-nms-l01-p044-stable-candidate.mjs';
import {readBoundActivationFile} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
export async function prepare379({write=false,check=false}={}){
  assert.ok(!(write&&check));await checkCandidate(true);
  const pins=[PRIOR.freeze,PRIOR.fragment,PRIOR.registry,PRIOR.activation,AUTHORITY,BASE_AUTHORITY,CATALOG];
  const inputs=await Promise.all(pins.map(pin=>readBoundActivationFile(ROOT,pin.path,pin)));
  const byPath=new Map(inputs.map(i=>[i.path,JSON.parse(i.buffer)]));
  const planner=await readBoundActivationFile(ROOT,PLANNER),plannerBinding=binding(PLANNER,planner.buffer);
  const result=composeP044Registration({priorFreeze:byPath.get(PRIOR.freeze.path),priorFragment:byPath.get(PRIOR.fragment.path),priorRegistry:byPath.get(PRIOR.registry.path),
    source:byPath.get(AUTHORITY.path),sourceBase:byPath.get(BASE_AUTHORITY.path),pagesCatalog:byPath.get(CATALOG.path),plannerBinding});
  const witness=inputs.find(i=>i.path===PRIOR.registry.path);assert.equal(witness.mode&0o222,0);
  const live=await readBoundActivationFile(ROOT,REGISTRY);
  assert.ok(live.buffer.equals(witness.buffer)||check&&live.buffer.equals(result.nextRegistryBytes),'Live registry must be exact predecessor (or exact candidate for read-only post-activation check)');
  const outputs=[[PROPOSED_FREEZE,result.freezeBytes],[PROPOSED_FRAGMENT,result.fragmentBytes]];
  if(write)for(const[p]of outputs){const full=path.join(ROOT,p);assert.equal(await realpath(path.dirname(full)),path.dirname(full));await assert.rejects(lstat(full),{code:'ENOENT'});}
  for(const[p,b]of outputs){
    if(check){const actual=await readBoundActivationFile(ROOT,p);assert.equal(actual.mode&0o222,0);assert.ok(actual.buffer.equals(b),p);}
    else if(write){for(const input of inputs)await readBoundActivationFile(ROOT,input.path,binding(input.path,input.buffer));
      await readBoundActivationFile(ROOT,PLANNER,plannerBinding);assert.ok((await readFile(path.join(ROOT,REGISTRY))).equals(live.buffer));
      await writeFile(path.join(ROOT,p),b,{flag:'wx',mode:0o444});}
  }
  assert.ok((await readFile(path.join(ROOT,REGISTRY))).equals(live.buffer));
  return{mode:write?'write':check?'check':'plan',filesWritten:write?2:0,registryChanged:false,activationExecuted:false,
    freeze:binding(PROPOSED_FREEZE,result.freezeBytes),fragment:binding(PROPOSED_FRAGMENT,result.fragmentBytes),
    proposedRegistry:binding(REGISTRY,result.nextRegistryBytes),preservedPageCount:378,registrationCountAfterActivation:379,descriptorAndBridgeAdmissionPending:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const args=process.argv.slice(2);assert.ok(args.length<=1&&(!args[0]||['--plan','--write','--check'].includes(args[0])));
  console.log(JSON.stringify(await prepare379({write:args[0]==='--write',check:args[0]==='--check'}),null,2));}
