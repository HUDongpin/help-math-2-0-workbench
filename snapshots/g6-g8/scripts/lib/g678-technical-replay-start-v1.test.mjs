import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fixture} from './g678-technical-assessor-fixture-v1.mjs';
import {assessPage} from './g678-technical-assessor-v1.mjs';
function setup(t) {const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'replay-causality-')));t.after(()=>fs.rmSync(root,{recursive:true}));return fixture(root);}
function replayStart(f){for(const cell of f.raw.cells){const flow=cell.flows.find(x=>x.kind==='natural-playback'&&x.before===4);Object.assign(flow,{startKind:'replay',eventSequences:[4],replayFlowBefore:3,replayFlowAfter:4});cell.documents[0].events=cell.documents[0].events.filter(e=>e.sequence!==5);}}
test('actual old-owner Replay input may initiate the verified new-owner natural run',t=>{const f=setup(t);replayStart(f);const r=assessPage(f);assert.equal(r.status,'pass',JSON.stringify(r.issues));});
for(const [name,mutate]of [
 ['unrelated click',f=>{f.raw.cells[0].documents[0].events[0].action='canvas';}],
 ['wrong Replay link',f=>{replayStart(f);f.raw.cells[0].flows.find(x=>x.startKind==='replay').replayFlowAfter=5;}],
 ['synthetic Replay',f=>{replayStart(f);f.raw.cells[0].documents[0].events.find(e=>e.sequence===4).synthetic=true;}],
 ['different Replay events',f=>{replayStart(f);f.raw.cells[0].flows.find(x=>x.startKind==='replay').eventSequences=[1];}],
 ['old owner not retired',f=>{replayStart(f);f.raw.cells[0].flows.find(x=>x.kind==='replay').retired.activeAudio=1;}],
])test('natural start rejects '+name,t=>{const f=setup(t);mutate(f);const r=assessPage(f);assert(r.issues.some(i=>i.code==='trusted-public-start-required'),JSON.stringify(r.issues));});
