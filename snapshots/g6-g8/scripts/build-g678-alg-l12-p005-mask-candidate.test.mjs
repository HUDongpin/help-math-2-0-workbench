import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {correctP005Masks,auditP005Masks} from './build-g678-alg-l12-p005-mask-candidate.mjs';
const work=new URL('../migrations/shared-alg001-l12-p005/',import.meta.url);
test('only source-exclusive mask paint changes; paths and all other bytes retained',()=>{
 const old=readFileSync(new URL('candidate-v1/canvas-renderer.js',work),'utf8');
 const next=correctP005Masks(old);
 const a=old.split('\n'),b=next.split('\n');
 assert.equal(a.length,b.length);
 const changes=a.flatMap((line,i)=>line===b[i]?[]:[[line,b[i]]]);
 assert.deepEqual(changes,[['\tctx.fillStyle=tocolor(ctrans.apply([66,60,196,0.3529412]));','\tctx.fillStyle="rgba(255,255,255,1)";'],['\tctx.fillStyle=tocolor(ctrans.apply([54,107,231,0.4627451]));','\tctx.fillStyle="rgba(255,255,255,1)";']]);
 assert.throws(()=>correctP005Masks(next),/exact source mask alpha/);
 assert.throws(()=>correctP005Masks(''),/unique mask function/);
});
test('XML library proves exactly two exclusive clipDepth masks',()=>{
 assert.equal(auditP005Masks(fileURLToPath(new URL('audit/movie.xml',work))).uses.length,2);
});
test('v2 deterministically rebuilds without replacing predecessor',()=>{
 const p=spawnSync(process.execPath,[fileURLToPath(new URL('./build-g678-alg-l12-p005-mask-candidate.mjs',import.meta.url)),'--check'],{encoding:'utf8'});
 assert.equal(p.status,0,p.stderr);
});
