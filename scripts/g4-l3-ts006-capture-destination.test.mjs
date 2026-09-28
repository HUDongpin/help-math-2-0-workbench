import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,readFile,realpath,chmod,rename,symlink,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {readTs006CaptureDestination,TS006_CAPTURE_DESTINATION_FILE} from './g4-l3-ts006-capture-destination.mjs';

async function fixture(t){
  const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'helpmath-capture-destination-')));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const storage=path.join(root,'capture-storage');await mkdir(storage,{mode:0o700});
  const configPath=path.join(root,TS006_CAPTURE_DESTINATION_FILE);await mkdir(path.dirname(configPath),{recursive:true});
  const profiles=[{language:'en',sessionId:'ts006-en-00000000-0000-4000-8000-000000000001'},
    {language:'es',sessionId:'ts006-es-00000000-0000-4000-8000-000000000002'}];
  const selectionPath=path.join(path.dirname(configPath),'current-session-profile-selection.json');
  const bytes=JSON.stringify({profiles});await writeFile(selectionPath,bytes);
  const config={schemaVersion:1,evidenceType:'g4-l3-ts006-capture-destination-selection',operator:'Dr. Peter Hu',captureRoot:storage,
    profileSelectionSha256:createHash('sha256').update(bytes).digest('hex')};
  await writeFile(configPath,JSON.stringify(config));
  return {root,storage,configPath,config,profiles,selectionPath,read:()=>readTs006CaptureDestination({projectRoot:root,approvedCaptureRoot:storage})};
}
test('binds two distinct new output directories to the current selected sessions',async t=>{
  const f=await fixture(t);const r=await f.read();assert.equal(r.sessionOutputDirectories.length,2);
  assert.deepEqual(r.sessionOutputDirectories.map(r=>r.path),f.profiles.map(p=>path.join(f.storage,p.sessionId)));
});
test('missing destination retains legacy behavior',async t=>{
  const f=await fixture(t);await rename(f.configPath,f.configPath+'.retained');assert.equal(await f.read(),null);
});
test('rejects stale profile selection',async t=>{
  const f=await fixture(t);await writeFile(f.selectionPath,JSON.stringify({profiles:f.profiles,changed:true}));
  await assert.rejects(f.read(),/stale session bindings/);
});
test('rejects a different storage directory',async t=>{
  const f=await fixture(t);f.config.captureRoot=f.root;await writeFile(f.configPath,JSON.stringify(f.config));
  await assert.rejects(f.read(),/outside the approved directory/);
});
test('rejects a symlink storage directory',async t=>{
  const f=await fixture(t);await rename(f.storage,f.storage+'.actual');await symlink(f.storage+'.actual',f.storage);
  await assert.rejects(f.read(),/must not contain symlinks/);
});
test('rejects a non-private output parent',async t=>{
  const f=await fixture(t);await chmod(f.storage,0o755);await assert.rejects(f.read(),/private 0700/);
});
test('rejects a preexisting capture output',async t=>{
  const f=await fixture(t);await mkdir(path.join(f.storage,f.profiles[0].sessionId));
  await assert.rejects(f.read(),/existing capture output/);
});
test('rejects a linked configuration input',async t=>{
  const f=await fixture(t);await rename(f.configPath,f.configPath+'.actual');await symlink(f.configPath+'.actual',f.configPath);
  await assert.rejects(f.read(),/ordinary single-link/);
});
test('rejects invalid language/session identity even when the config hash matches',async t=>{
  const f=await fixture(t);f.profiles[0].sessionId='../escape';const bytes=JSON.stringify({profiles:f.profiles});
  await writeFile(f.selectionPath,bytes);f.config.profileSelectionSha256=createHash('sha256').update(bytes).digest('hex');
  await writeFile(f.configPath,JSON.stringify(f.config));await assert.rejects(f.read());
});
