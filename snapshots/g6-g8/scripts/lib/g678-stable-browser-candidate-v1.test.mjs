import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pinFile} from '../../lib/g678-admission-proof.mjs';
import {runStableBrowser} from './g678-stable-browser-candidate-v1.mjs';
function fixture(t) {
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'g678-browser-stable-')));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.writeFileSync(path.join(root,'input.js'),'original');
 fs.writeFileSync(path.join(root,'candidate.json'),JSON.stringify({schemaVersion:1,kind:'g678-stable-browser-candidate-v1',root,
  animationIds:['fixture'],host:{path:'fixture'},files:[pinFile(root,'input.js')],external:[]}));
 return {root,candidatePin:pinFile(root,'candidate.json'),receipt:'output/result.json',command:process.execPath};
}
test('stable command receives a pinned candidate and retained success receipt',async t=>{
 const result=await runStableBrowser({...fixture(t),args:['-e','process.exit(0)']});
 assert.equal(result.status,'stable-command-passed');assert.equal(result.drift,null);
});
test('preflight drift prevents launching the command',async t=>{
 const options=fixture(t);fs.writeFileSync(path.join(options.root,'input.js'),'changed');
 await assert.rejects(runStableBrowser({...options,args:['-e','throw Error("must not launch")']}),/current bytes/);
 const receipt=JSON.parse(fs.readFileSync(path.join(options.root,options.receipt)));
 assert.equal(receipt.phase,'preflight');assert.equal(receipt.exitCode,null);
});
test('edit then revert during a run remains a failed run',async t=>{
 const options=fixture(t);
 await assert.rejects(runStableBrowser({...options,args:['-e',
  'const fs=require("node:fs");fs.writeFileSync("input.js","changed");fs.writeFileSync("input.js","original");setTimeout(()=>process.exit(0),500);']}),/input-(change|rename)|stable metadata/);
 const receipt=JSON.parse(fs.readFileSync(path.join(options.root,options.receipt)));
 assert.equal(receipt.status,'failed');assert.match(receipt.drift??receipt.error,/input-(change|rename)|stable metadata/);
});
test('browser assertion failure retains a failed receipt',async t=>{
 const options=fixture(t);
 await assert.rejects(runStableBrowser({...options,args:['-e','process.exit(2)']}),/browser command must succeed/);
 assert.equal(JSON.parse(fs.readFileSync(path.join(options.root,options.receipt))).exitCode,2);
});
