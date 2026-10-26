import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pinFile} from '../lib/g678-admission-proof.mjs';
import {verifyCandidateHostInputs} from './lib/g678-admission-candidate-v4.mjs';

function put(root,file,bytes) {
 fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),bytes);
 return pinFile(root,file);
}
function fixture(t) {
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'g678-candidate-host-')));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const file='packages/demos/src/contract.ts';
 const oldest=put(root,file,'oldest'),first=put(root,'retained/first.ts','oldest');
 const middle=put(root,file,'middle'),second=put(root,'retained/second.ts','middle');
 const current=put(root,file,'current');
 const host={files:[current],replacedRoutes:[],legacyInputTransitions:[
  {original:oldest,current,snapshot:first},{original:middle,current,snapshot:second}]};
 return {root,file,host,oldest,middle,current,first,second};
}
test('the exact current input is read without selecting an older same-path transition',t=>{
 const f=fixture(t);assert.doesNotThrow(()=>verifyCandidateHostInputs(f.root,f.host,[f.current]));
});
test('both oldest and intermediate inputs select their own exact witness',t=>{
 const f=fixture(t);for(const pin of [f.oldest,f.middle])assert.doesNotThrow(()=>verifyCandidateHostInputs(f.root,f.host,[pin]));
});
test('a same-path but different historical hash has no candidate authority',t=>{
 const f=fixture(t);assert.throws(()=>verifyCandidateHostInputs(f.root,f.host,[{...f.middle,sha256:'f'.repeat(64)}]),/one exact candidate host transition/u);
});
test('duplicate exact historical transitions are rejected',t=>{
 const f=fixture(t);f.host.legacyInputTransitions.push(structuredClone(f.host.legacyInputTransitions[1]));
 assert.throws(()=>verifyCandidateHostInputs(f.root,f.host,[f.middle]),/one exact candidate host transition/u);
});
test('current host drift rejects both current and historical candidate inputs',t=>{
 const f=fixture(t);put(f.root,f.file,'wrong current');
 for(const pin of [f.current,f.middle])assert.throws(()=>verifyCandidateHostInputs(f.root,f.host,[pin]),/current bytes/u);
});
test('a claimed intermediate witness must have the real original bytes',t=>{
 const f=fixture(t);put(f.root,f.second.path,'wrong witness');
 assert.throws(()=>verifyCandidateHostInputs(f.root,f.host,[f.middle]),/current bytes/u);
});
test('a transition cannot select a target different from the current host pin',t=>{
 const f=fixture(t);f.host.legacyInputTransitions[1].current=f.oldest;
 assert.throws(()=>verifyCandidateHostInputs(f.root,f.host,[f.middle]),/exact current candidate host target/u);
});
test('a path-only replacedRoutes entry gives no historical candidate exception',t=>{
 const f=fixture(t);f.host.legacyInputTransitions=[];f.host.replacedRoutes=[f.file];
 assert.throws(()=>verifyCandidateHostInputs(f.root,f.host,[f.middle]),/one exact candidate host transition/u);
});
test('historical route inputs require their explicit path and exact retained snapshot',t=>{
 const f=fixture(t);f.host.legacyInputTransitions=[];
 f.host.historicalRoutes=[{original:f.middle,snapshot:f.second}];
 assert.throws(()=>verifyCandidateHostInputs(f.root,f.host,[f.middle]),/explicit historical candidate host path/u);
 f.host.replacedRoutes=[f.file];assert.doesNotThrow(()=>verifyCandidateHostInputs(f.root,f.host,[f.middle]));
});
test('multiple host entries for one path are rejected',t=>{
 const f=fixture(t);f.host.files.push({...f.current});
 assert.throws(()=>verifyCandidateHostInputs(f.root,f.host,[f.current]),/unique current candidate host input/u);
});
test('a retained transition cannot exempt a file outside current host membership',t=>{
 const f=fixture(t);f.host.files=[];
 assert.throws(()=>verifyCandidateHostInputs(f.root,f.host,[f.middle]),/current bytes/u);
});
test('page-owned inputs retain their exact current byte check',t=>{
 const f=fixture(t),own=put(f.root,'page.ts','own original');
 assert.doesNotThrow(()=>verifyCandidateHostInputs(f.root,f.host,[own]));
 put(f.root,'page.ts','own changed');assert.throws(()=>verifyCandidateHostInputs(f.root,f.host,[own]),/current bytes/u);
});
test('a historical witness cannot be a symlink',t=>{
 const f=fixture(t),file=path.join(f.root,f.second.path);fs.renameSync(file,`${file}.original`);fs.symlinkSync(`${file}.original`,file);
 assert.throws(()=>verifyCandidateHostInputs(f.root,f.host,[f.middle]),/physical path/u);
});
