import assert from 'node:assert/strict';
import test from 'node:test';
import {build,createVectorPool} from './build-g678-alg-l11-p033-instructional-sequence.mjs';

test('complete p033 source sequence rebuild is deterministic and compact',async()=>{
  const {data,manifest}=await build({check:true});
  assert.equal(data.frames.length,606);assert.equal(data.controls[46].length,3);
  assert.ok(manifest.generated.bytes<4*1024*1024);
  assert.ok(Object.values(data.gates).every(value=>value===false));
});

test('vector pool deduplicates renamed equivalent dependencies and rejects unbound references',()=>{
  const pool=createVectorPool();
  const make=id=>`<svg width="800" height="600"><g transform="translate(0 0)"><use xlink:href="#${id}"/></g><defs><g id="${id}"><path d="M0 0L1 1"/></g></defs></svg>`;
  assert.equal(pool.add(make('first')),pool.add(make('second')));assert.equal(pool.pool.size,1);
  assert.throws(()=>pool.add('<svg><g transform="translate(0 0)"><use xlink:href="#absent"/></g><defs></defs></svg>'));
});
