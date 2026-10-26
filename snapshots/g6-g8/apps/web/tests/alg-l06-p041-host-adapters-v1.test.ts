import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const read=(page:string)=>readFileSync(path.join(process.cwd(),
 `apps/web/components/g678-alg-l06-${page}-host-lesson-v1.tsx`),'utf8');
const rows=(source:string)=>[...source.matchAll(
 /\{animationId:\s*'([^']+)',\s*audioEnabled:\s*(true|false)(?:,\s*glossaryClosePolicy:\s*'([^']+)'\s+as\s+const)?,\s*Component:\s*(\w+)\s*\}/gu
)].map(match=>({animationId:match[1],audioEnabled:match[2]==='true',
 glossaryClosePolicy:match[3]??null,Component:match[4]}));

test('P041 adds one source-owned adapter over exact P038 host sequence',()=>{
 const predecessor=rows(read('p038')),current=rows(read('p041'));
 assert.equal(predecessor.length,24);
 assert.equal(current.length,25);
 assert.deepEqual(current[0],{animationId:'shared-alg001-l06-p041',audioEnabled:true,
  glossaryClosePolicy:'stay-paused',Component:'G678AlgL6P041RuntimeV1'});
 assert.deepEqual(current.slice(1),predecessor);
 assert.equal(new Set(current.map(row=>row.animationId)).size,25);
});
