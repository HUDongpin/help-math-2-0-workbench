import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {measureWorkUnits, assertUnclaimedIntegrationPages} from './g678-workflow.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a='shared-test-l01-p001', b='shared-test-l01-p002', c='shared-test-l01-p003';
const finish=(unit,pages,rework=false)=>({event:'finish',unit,lane:'advanced-manual',
 at:'2026-10-03T01:00:00.000Z',elapsedSeconds:120,outcome:'integrated',rework,
 newlyIntegratedPages:pages,evidence:{path:`${unit}.json`}});

test('observations before or after finish correct missed flags without changing history',()=>{
 const logs=[{event:'rework-observed',unit:'before',reason:'source repair'},
  finish('before',[a]),finish('after',[b]),
  {event:'rework-observed',unit:'after',reason:'late bookkeeping correction'}];
 const original=structuredClone(logs), result=measureWorkUnits(logs);
 assert.equal(result.newlyIntegratedPages,2);
 for(const unit of result.unitSeconds){
  assert.equal(unit.rework,true);
  assert.equal(unit.finishRework,false);
  assert.equal(unit.reworkObservationCount,1);
 }
 assert.deepEqual(logs,original);
});

test('finish flags survive without observations; unrelated observations do not transfer',()=>{
 const result=measureWorkUnits([finish('flag',[a],true),finish('clean',[b]),
  {event:'rework-observed',unit:'orphan',reason:'unassigned repair'}]);
 assert.deepEqual(result.unitSeconds.map(u=>[u.rework,u.finishRework,u.reworkObservationCount]),
  [[true,true,0],[false,false,0]]);
 assert.equal(result.reworkEvents.length,1);
});

test('overlapping duplicate claims count unique pages and expose original ownership',()=>{
 const result=measureWorkUnits([finish('first',[a,b]),finish('second',[a,c])]);
 assert.equal(result.integrationClaimCount,4);
 assert.equal(result.newlyIntegratedPages,3);
 assert.deepEqual(result.duplicateIntegrationClaims,[{animationId:a,units:['first','second']}]);
 assert.deepEqual(result.unitSeconds.map(u=>u.pages),[2,2]);
});

test('duplicate guard rejects the entire mixed claim instead of silently filtering',()=>{
 const pages=[a,b];
 assert.throws(()=>assertUnclaimedIntegrationPages([finish('first',[a])],pages),
  /integration pages already claimed: shared-test-l01-p001/);
 assert.deepEqual(pages,[a,b]);
 assert.doesNotThrow(()=>assertUnclaimedIntegrationPages([finish('first',[a])],[b]));
});

test('open and infrastructure units add zero pages and keep elapsed time semantics',()=>{
 const result=measureWorkUnits([
  {event:'start',unit:'open',lane:'factory',at:'2026-10-03T00:00:00.000Z'},
  {...finish('infra',[]),lane:'infrastructure',outcome:'infrastructure'},
 ],Date.parse('2026-10-03T00:46:00.000Z'));
 assert.equal(result.newlyIntegratedPages,0);
 assert.equal(result.completedUnits,1);
 assert.equal(result.unitSeconds[0].secondsPerIntegratedPage,null);
 assert.equal(result.openUnits[0].elapsedSeconds,2760);
 assert.equal(result.openUnits[0].reviewDue,true);
});

function fixture(callback){
 const root=fs.realpathSync(fs.mkdtempSync(path.join(ROOT,'.metrics-test-')));
 const write=(relative,value)=>{
  const target=path.join(root,relative);fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,typeof value==='string'?value:JSON.stringify(value));
 };
 try{
  for(const relative of ['scripts/g678-workflow.mjs','lib/g678-admission-proof.mjs',
   'packages/demos/scripts/generate-registry.mjs','scripts/private-current-js-registry.mjs']){
   const target=path.join(root,relative);fs.mkdirSync(path.dirname(target),{recursive:true});
   fs.copyFileSync(path.join(ROOT,relative),target);
  }
  write('packages/demos/private-current-js-registry.json',{
   calibrations:[{entries:[{key:a},{key:b}]}],
  });
  const startTime=new Date(Date.now()-10000).toISOString();
  write('work/g678-workflow/events.jsonl',['one','two'].map(unit=>JSON.stringify({
   event:'start',unit,lane:'factory',at:startTime,registryIds:[],
  })).join('\n')+'\n');
  const receipt=(name,pages)=>{
   const relative=`receipts/${name}.json`;
   write(relative,{kind:'g678-host-verification-v1',checkedAt:new Date(Date.now()-1000).toISOString(),
    pageErrors:[],results:pages.flatMap(animationId=>['en','es'].map(locale=>({
     animationId,locale,status:200,ready:true,formal:true,
    })))});
   return relative;
  };
  const run=(unit,evidence)=>spawnSync(process.execPath,[path.join(root,'scripts/g678-workflow.mjs'),
   'finish',unit,'integrated',evidence],{cwd:root,encoding:'utf8'});
  const log=()=>fs.readFileSync(path.join(root,'work/g678-workflow/events.jsonl'),'utf8');
  callback({receipt,run,log});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}

test('CLI rejects a second overlapping integration claim before append',()=>fixture(({receipt,run,log})=>{
 const evidence=receipt('same-page',[a]);
 const first=run('one',evidence);assert.equal(first.status,0,first.stderr);
 const before=log();
 const firstFinish=JSON.parse(before.trim().split('\n').at(-1));
 assert.deepEqual(firstFinish.newlyIntegratedPages,[a]); // EN + ES is still one page.
 const second=run('two',evidence);
 assert.notEqual(second.status,0);
 assert.match(second.stderr,/integration pages already claimed/);
 assert.equal(log(),before,'rejected claim must not append or rewrite history');
}));

test('CLI permits overlapping units that integrate different pages',()=>fixture(({receipt,run,log})=>{
 for(const [unit,page] of [['one',a],['two',b]]){
  const result=run(unit,receipt(unit,[page]));assert.equal(result.status,0,result.stderr);
 }
 const result=measureWorkUnits(log().trim().split('\n').map(JSON.parse));
 assert.equal(result.newlyIntegratedPages,2);
 assert.equal(result.integrationClaimCount,2);
 assert.deepEqual(result.duplicateIntegrationClaims,[]);
}));
