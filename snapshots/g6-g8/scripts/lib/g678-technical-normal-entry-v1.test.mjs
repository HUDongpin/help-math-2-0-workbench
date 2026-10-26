import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';
import {fixture} from './g678-technical-assessor-fixture-v1.mjs';import {assessPage} from './g678-technical-assessor-v1.mjs';
function setup(t){const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'normal-entry-')));t.after(()=>fs.rmSync(root,{recursive:true}));const f=fixture(root);f.contract.terminal.startPolicy='normal-course-entry-or-play';f.saveContract();for(const c of f.raw.cells){const a=c.documents[0].samples[0];a.atMs=1;a.host={paused:false};const url=`http://127.0.0.1:3331/${c.config.locale}/migration-status/g678-course/nms002/1`;c.entry={requestedUrl:url,committedUrl:url,responseStatus:200,navigation:{name:url,type:'navigate',startTime:0,responseEnd:.5},sourceActionsCalled:false,sourceStateWritten:false};c.entryPin=f.put(c.cellId+'/normal-entry.json',c.entry);Object.assign(c.flows[0],{startKind:'normal-entry',eventSequences:[]});}return f;}
test('normal course autoplay retains actual navigation and initial source state without inventing a DOM click',t=>{const f=setup(t),r=assessPage(f);assert.equal(r.status,'pass',JSON.stringify(r.issues));});
for(const [name,change]of [
 ['wrong course',c=>{c.entry.committedUrl=c.entry.requestedUrl=c.entry.navigation.name='http://127.0.0.1:3331/en/migration-status/g678-course/alg001/6';}],
 ['failed navigation',c=>{c.entry.responseStatus=500;}],
 ['state injection',c=>{c.entry.sourceStateWritten=true;}],
 ['navigation after initial sample',c=>{c.entry.navigation.responseEnd=10;}],
 ['normal-entry reused for Replay',c=>{c.documents[0].samples[0].identity.replay=1;}],
])test('normal entry rejects '+name,t=>{const f=setup(t),c=f.raw.cells[0];change(c);c.entryPin=f.put(c.cellId+'/changed-entry.json',c.entry);const r=assessPage(f);assert(r.issues.some(i=>i.code==='trusted-public-start-required'),JSON.stringify(r.issues));});
test('caller entry claim does not replace pinned browser navigation',t=>{const f=setup(t);f.raw.cells[0].entry.responseStatus=201;const r=assessPage(f);assert(r.issues.some(i=>i.code==='trusted-public-start-required'));});
