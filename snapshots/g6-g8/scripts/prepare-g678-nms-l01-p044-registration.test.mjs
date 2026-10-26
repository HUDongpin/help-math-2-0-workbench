import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,lstat} from 'node:fs/promises';
import path from 'node:path';
import {prepare379} from './prepare-g678-nms-l01-p044-registration.mjs';
import {ROOT,REGISTRY,PRIOR,PROPOSED_FREEZE,PROPOSED_FRAGMENT,binding} from './plan-g678-nms-l01-p044-registration.mjs';
async function snapshot(){return Promise.all([REGISTRY,PRIOR.registry.path,PROPOSED_FREEZE,PROPOSED_FRAGMENT].map(async file=>{
  const stat=await lstat(path.join(ROOT,file),{bigint:true});return{...binding(file,await readFile(path.join(ROOT,file))),ino:String(stat.ino),mode:String(stat.mode),mtimeNs:String(stat.mtimeNs)};
}));}
test('actual379 preparation check revalidates source closure and leaves live registry and prepared outputs byte/stat identical',async()=>{
  const before=await snapshot(),result=await prepare379({check:true});assert.deepEqual(await snapshot(),before);
  assert.equal(result.mode,'check');assert.equal(result.filesWritten,0);assert.equal(result.registryChanged,false);assert.equal(result.activationExecuted,false);
  assert.equal(result.preservedPageCount,378);assert.equal(result.registrationCountAfterActivation,379);
  assert.equal(result.proposedRegistry.sha256,'e68a3d39213766e220795a4f0a16412e09a0e830c9978a66bcd7dd02361372cb');
});
test('ambiguous write-and-check mode rejects before filesystem access',async()=>{await assert.rejects(prepare379({write:true,check:true}));});
