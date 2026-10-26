import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,rename,rm,realpath} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {guardedReplacement} from './activate-g678-frozen16-glossary-registration.mjs';

async function fixture(t){
  const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'frozen-glossary-activation-')));
  t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(path.join(root,'recovery'));
  const before=new Map([['registry.json',Buffer.from('old-registry')],['local.ts',Buffer.from('old-local')],['metadata.ts',Buffer.from('old-metadata')],['public.ts',Buffer.from('public')]]);
  const after=new Map([...before].map(([p,b])=>[p,p==='public.ts'?b:Buffer.from('new-'+p)]));
  for(const[p,b]of before)await writeFile(path.join(root,p),b);
  return {root,before,after,targets:['registry.json','local.ts','metadata.ts'],recovery:'recovery/run',verify:async()=>{},postflight:async()=>{}};
}
test('writes only three exact targets and preserves recoverable originals',async t=>{
  const f=await fixture(t),r=await guardedReplacement(f);assert.equal(r.completed.length,3);assert.equal(r.backups.length,4);
  for(const[p,b]of f.after)assert((await readFile(path.join(f.root,p))).equals(b));
});
test('failed replacement restores owned bytes and retains the failure receipt',async t=>{
  const f=await fixture(t);let n=0;
  await assert.rejects(guardedReplacement({...f,replace:async(a,b)=>{if(++n===2)throw Error('injected rename failure');await rename(a,b);}}),/injected/);
  for(const[p,b]of f.before)assert((await readFile(path.join(f.root,p))).equals(b));
  assert.equal(JSON.parse(await readFile(path.join(f.root,f.recovery,'failure.json'))).rollback,true);
});
test('concurrent edits are preserved and prohibit automatic rollback',async t=>{
  const f=await fixture(t);let n=0;
  await assert.rejects(guardedReplacement({...f,replace:async(a,b)=>{if(++n===2){await writeFile(path.join(f.root,'public.ts'),'concurrent-user-edit');throw Error('concurrent drift');}await rename(a,b);}}),/concurrent/);
  assert.equal((await readFile(path.join(f.root,'public.ts'))).toString(),'concurrent-user-edit');
  assert.equal(JSON.parse(await readFile(path.join(f.root,f.recovery,'failure.json'))).rollback,false);
});
test('postflight failure restores every owned target',async t=>{
  const f=await fixture(t);await assert.rejects(guardedReplacement({...f,postflight:async()=>{throw Error('generator mismatch');}}),/generator/);
  for(const[p,b]of f.before)assert((await readFile(path.join(f.root,p))).equals(b));
});
