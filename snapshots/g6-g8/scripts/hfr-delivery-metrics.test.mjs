import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {intervalMetrics,summarizeDelivery} from './hfr-delivery-metrics.mjs';

const SCRIPT=fileURLToPath(new URL('./hfr-delivery-metrics.mjs',import.meta.url));
const a='shared-test-l01-p001', b='shared-test-l01-p002';
const at=seconds=>new Date(Date.parse('2026-10-12T00:00:00Z')+seconds*1000).toISOString();
function fixture(run) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'hfr-delivery-metrics-'));
  const write=(name,value)=>{const absolute=path.join(root,name);fs.mkdirSync(path.dirname(absolute),{recursive:true});fs.writeFileSync(absolute,JSON.stringify(value));return pin(name);};
  const pin=name=>{const bytes=fs.readFileSync(path.join(root,name));return {path:name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};};
  const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
  const before=write('baseline.json',{calibrations:[{entries:[{key:a}]}]});
  const registry=write('registry.json',{calibrations:[{entries:[{key:a},{key:b}]}]});
  write('catalog.json',{lessons:[{pages:[{animationId:a},{animationId:b}]}]});
  write('start.json',{event:'start',unit:'test-delivery',at:at(0),registryIds:[a]});
  const success=write('success.json',{pages:[b],registry,snapshots:[{target:'packages/demos/private-current-js-registry.json',pin:before}]});
  const readback=write('readback.json',{at:at(60),registry,formalRegistered:2,registeredRoutePostflightPending:true});
  const stable=write('stable.json',{startedAt:at(70),finishedAt:at(90),exitCode:0,status:'stable-command-passed',drift:null,registrySha256:registry.sha256,animationIds:[b]});
  const suite=write('suite.json',{startedAt:at(71),finishedAt:at(89),passed:true,expected:1,results:[{script:'postflight.js',exitCode:0}]});
  const command=write('command.json',{exitCode:0});
  const postflightPin=write('postflight.json',{caseId:'replay',mode:'registered',animationId:b,startedAt:at(72),finishedAt:at(88),passed:true});
  const evidenceManifest=write('manifest.json',{inputPins:[postflightPin],rawCases:1});
  write('candidate.json',{caseId:'replay',mode:'candidate',animationId:b,startedAt:at(20),finishedAt:at(30),passed:false,error:'source mismatch'});
  write('retry.json',{caseId:'replay',mode:'candidate',animationId:b,startedAt:at(40),finishedAt:at(50),passed:true});
  write('stage-a.json',{startedAt:at(10),finishedAt:at(40),exitCode:0});
  write('stage-b.json',{startedAt:at(30),finishedAt:at(60),exitCode:0});
  write('terminal.json',{closedAt:at(100),animationId:b,registered:2,registry,success,readback,candidateAttempts:2,selectedCandidateAndCompatibilityCases:1,
    registeredRoutePostflightPending:false,registeredPostflight:{stable,suite,command,evidenceManifest,cases:1}});
  const options={root,start:'start.json',baseline:'baseline.json',terminal:'terminal.json',registry:'registry.json',catalog:'catalog.json',unit:'test-delivery',
    cases:['candidate.json','retry.json','postflight.json'],stages:[{label:'source',path:'stage-a.json'},{label:'generation',path:'stage-b.json'}]};
  try{return run({root,options,write,read,pin});}finally{fs.rmSync(root,{recursive:true,force:true});}
}

test('counts terminal closed pages separately from registration and preserves failed attempts',()=>fixture(({options})=>{
  const r=summarizeDelivery(options);
  assert.deepEqual(r.issues,[]);assert.deepEqual(r.closure.newlyClosedPageIds,[b]);
  assert.equal(r.attempts.unique,3);assert.equal(r.attempts.failed,1);
  assert.equal(r.time.endToEndSeconds,100);assert.equal(r.registry.terminalCount,2);
  assert.equal(r.firstPass.rate,0);assert.equal(r.firstPass.total,1);
}));

test('overlapping stages retain totals, union coverage and unclassified wall time',()=>fixture(({options})=>{
  const r=summarizeDelivery(options);
  assert.deepEqual(r.time.accounting,{summedSeconds:60,coveredSeconds:50,overlapSeconds:10,unclassifiedSeconds:50});
  assert.deepEqual(r.time.stages.map(s=>s.seconds),[30,30]);
  assert.deepEqual(intervalMetrics([{start:0,finish:20000},{start:0,finish:10000}],5000,15000),
    {summedSeconds:30,coveredSeconds:10,overlapSeconds:5,unclassifiedSeconds:0});
}));

test('registry-only or missing postflight cannot become delivery closure',()=>fixture(({options,read,write})=>{
  const d=read('terminal.json');delete d.registeredPostflight;d.registeredRoutePostflightPending=true;write('terminal.json',d);
  const r=summarizeDelivery(options);
  assert.equal(r.closure.supported,false);assert.deepEqual(r.closure.registeredOnlyPageIds,[b]);
  assert.equal(r.time.endToEndSeconds,null);assert.match(r.issues.join('\n'),/postflight/);
}));

test('failed pinned postflight stays failed even with a closure claim and passed raw case',()=>fixture(({options,read,write})=>{
  const suite=read('suite.json');suite.passed=false;suite.results[0].exitCode=1;
  const d=read('terminal.json');d.registeredPostflight.suite=write('suite.json',suite);write('terminal.json',d);
  const r=summarizeDelivery(options);assert.equal(r.closure.supported,false);assert.match(r.issues.join('\n'),/failed/);
}));

test('stale or current registry snapshot cannot replace terminal-bound historical bytes',()=>fixture(({options,read,write})=>{
  const registry=read('registry.json');registry.comment='same membership, changed bytes';write('registry.json',registry);
  const r=summarizeDelivery(options);assert.equal(r.registry.terminalCount,2);assert.equal(r.registry.historicalSnapshotMatches,false);
  assert.equal(r.closure.supported,false);assert.equal(r.time.endToEndSeconds,null);
}));

test('duplicate attempt paths and byte-identical copies do not inflate counts',()=>fixture(({options,read,write})=>{
  write('copy.json',read('candidate.json'));options.cases.push('candidate.json','copy.json');
  const r=summarizeDelivery(options);assert.equal(r.attempts.unique,3);assert.equal(r.attempts.failed,1);
  assert.equal(r.attempts.duplicateInputs.length,2);assert.equal(r.closure.supported,true);
}));

test('conflicting duplicate executions are exposed rather than counted twice',()=>fixture(({options,read,write})=>{
  const d=read('candidate.json');d.error='different error';write('conflict.json',d);options.cases.push('conflict.json');
  const r=summarizeDelivery(options);assert.equal(r.attempts.unique,3);assert.equal(r.closure.supported,false);
  assert.match(r.issues.join('\n'),/Conflicting receipts/);
}));

test('partial start and missing timestamps remain unknown; no invented full delivery time',()=>fixture(({options,read,write})=>{
  delete options.unit;
  write('start.json',{startedAt:at(0),kind:'actual-typecheck'});
  const d=read('candidate.json');delete d.startedAt;delete d.finishedAt;write('candidate.json',d);
  const r=summarizeDelivery(options);assert.equal(r.time.observedWindowSeconds,100);assert.equal(r.time.endToEndSeconds,null);
  assert.equal(r.time.windowKind,'partial-observed-stage');assert.equal(r.attempts.unknownDuration,1);
  assert.equal(r.firstPass.rate,null);
}));

test('work-start baseline drift and case path substitution fail closure consistency',()=>fixture(({options,read,write})=>{
  write('start.json',{event:'start',unit:'test-delivery',at:at(0),registryIds:[a,b]});
  write('wrong-postflight.json',read('postflight.json'));options.cases[2]='wrong-postflight.json';
  const r=summarizeDelivery(options);assert.equal(r.closure.supported,false);
  assert.match(r.issues.join('\n'),/Work-start/);assert.match(r.issues.join('\n'),/registered page cases/);
}));

test('failed raw registered case and postflight after claimed closure cannot close a page',()=>fixture(({options,read,write})=>{
  const raw=read('postflight.json');raw.passed=false;write('postflight.json',raw);
  const stable=read('stable.json');stable.finishedAt=at(110);
  const terminal=read('terminal.json');terminal.registeredPostflight.stable=write('stable.json',stable);write('terminal.json',terminal);
  const r=summarizeDelivery(options);assert.equal(r.closure.supported,false);
  assert.match(r.issues.join('\n'),/chronology/);assert.match(r.issues.join('\n'),/registered page cases/);
}));

test('invalid explicit time zone and reversed stage interval remain unknown',()=>fixture(({options,write})=>{
  delete options.unit;
  write('start.json',{startedAt:'2026-10-12T00:00:00'});
  write('stage-a.json',{startedAt:at(40),finishedAt:at(10),exitCode:0});
  const r=summarizeDelivery(options);assert.equal(r.time.observedWindowSeconds,null);assert.equal(r.time.accounting,null);
  assert.equal(r.time.stages[0].seconds,null);assert.equal(r.time.endToEndSeconds,null);
}));

test('raw registered timestamp tampering is rejected against terminal-pinned manifest',()=>fixture(({options,read,write})=>{
  const raw=read('postflight.json');raw.startedAt=at(73);write('postflight.json',raw);
  const r=summarizeDelivery(options);assert.equal(r.closure.supported,false);
  assert.match(r.issues.join('\n'),/Registered raw-case pin mismatch/);
}));

test('arbitrary work-start shape without explicit selected unit cannot imply end-to-end time',()=>fixture(({options})=>{
  delete options.unit;const r=summarizeDelivery(options);assert.equal(r.time.endToEndSeconds,null);
  assert.equal(r.time.observedWindowSeconds,100);assert.equal(r.closure.supported,true);
}));

test('incomplete candidate set leaves first-pass rate unknown',()=>fixture(({options})=>{
  options.cases=options.cases.filter(p=>p!=='candidate.json');
  const r=summarizeDelivery(options);assert.equal(r.firstPass.rate,null);assert.equal(r.closure.supported,true);
}));

test('pinned receipt tampering fails and CLI preserves existing report',()=>fixture(({root,options,read,write})=>{
  const d=read('readback.json');d.formalRegistered=5;write('readback.json',d);
  const r=summarizeDelivery(options);assert.equal(r.closure.supported,false);assert.match(r.issues.join('\n'),/pin mismatch/);
  write('report.json',{preserved:true});
  const argv=['--root',root,...['start','baseline','terminal','registry','catalog'].flatMap(k=>[`--${k}`,options[k]]),'--out','report.json'];
  const result=spawnSync(process.execPath,[SCRIPT,...argv],{encoding:'utf8'});
  assert.equal(result.status,1);assert.deepEqual(read('report.json'),{preserved:true});
}));
