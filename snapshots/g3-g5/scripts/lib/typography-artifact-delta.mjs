// Prepared compatibility branch derived from the Oct 9 normalize/resolve prototype
// and the current r3 historical-alias + Map overlay. Not installed in a reader.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';

const SHA=/^[a-f0-9]{64}$/;
const CHECKS='catalog/typography-v1/checks/';
const KINDS=new Set(['lesson-typography-check-v1','lesson-typography-implementation-v1']);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const tuple=r=>({path:r.path,sha256:r.sha256,bytes:r.bytes});
const same=assert.deepEqual;

export function reference(r) {
  assert(r&&typeof r.path==='string'&&r.path&&!path.isAbsolute(r.path)&&!r.path.includes('\\')&&
    !r.path.split('/').some(p=>!p||p==='.'||p==='..'),'unsafe artifact reference');
  assert(SHA.test(r.sha256??'')&&Number.isSafeInteger(r.bytes)&&r.bytes>=0,'invalid artifact reference');
  return tuple(r);
}

export function normalizeReferences(refs,{allowEmpty=false}={}) {
  assert(Array.isArray(refs)&&(allowEmpty||refs.length),'artifact inventory missing');
  const seen=new Set();
  return refs.map(r=>{const t=reference(r);same(Object.keys(r).sort(),['bytes','path','sha256'],'unsupported artifact tuple fields');assert(!seen.has(t.path),'duplicate artifact path');seen.add(t.path);return t;})
    .sort((a,b)=>a.path.localeCompare(b.path,'en'));
}

export const inventorySha256=refs=>hash(JSON.stringify(normalizeReferences(refs)));

export function applyCustodyAliases(refs,aliases) {
  assert(aliases.kind==='actual-prior-family-historical-preimages'&&Array.isArray(aliases.rows),'wrong custody aliases');
  const byIdentity=new Map();
  for(const row of aliases.rows) {
    const logical=reference(row.logical),archive=reference(row.archive),key=logical.path+'#'+logical.sha256;
    assert.equal(logical.sha256,archive.sha256,'custody hash substitution');
    assert.equal(logical.bytes,archive.bytes,'custody byte substitution');
    assert(!byIdentity.has(key),'duplicate custody alias');byIdentity.set(key,{logical,archive});
  }
  const mapped=new Map();
  for(const r of normalizeReferences(refs)) {
    const alias=byIdentity.get(r.path+'#'+r.sha256);
    if(alias)same(alias.logical,r,'custody logical identity mismatch');
    const next=alias?.archive??r;
    if(mapped.has(next.path))same(mapped.get(next.path),next,'conflicting custody target');
    mapped.set(next.path,next);
  }
  return normalizeReferences([...mapped.values()]);
}

// The producer first constructs its existing legacy final Map. This derives only
// the residual upserts after custody + shared proofs. There is no removal opcode.
export function localOverlayForExactFinal(parent,aliases,shared,legacyFinal) {
  const map=new Map(applyCustodyAliases(parent,aliases).map(r=>[r.path,r]));
  for(const r of normalizeReferences(shared,{allowEmpty:true}))map.set(r.path,r);
  const final=normalizeReferences(legacyFinal),target=new Map(final.map(r=>[r.path,r]));
  for(const key of map.keys())assert(target.has(key),'arbitrary artifact removal is not supported');
  return final.filter(r=>!map.has(r.path)||JSON.stringify(map.get(r.path))!==JSON.stringify(r));
}

export function createTypographyArtifactResolver({records,readBytes}) {
  assert(records instanceof Map&&typeof readBytes==='function');
  const cache=new Map(),metadata=new Map();
  async function document(r) {
    r=reference(r);const key=r.path+'#'+r.sha256+'#'+r.bytes;
    if(metadata.has(key))return metadata.get(key);
    const bytes=await readBytes(r.path);assert.equal(bytes.length,r.bytes,'metadata byte count mismatch: '+r.path);
    assert.equal(hash(bytes),r.sha256,'metadata hash mismatch: '+r.path);
    const value=JSON.parse(bytes);metadata.set(key,value);return value;
  }
  async function resolve(r,placementId,visiting=new Set(),depth=0) {
    r=reference(r);
    assert(!visiting.has(r.path),'artifact predecessor cycle');
    const indexed=records.get(r.path);
    assert(indexed&&r.path.startsWith(CHECKS)&&!r.path.slice(CHECKS.length).includes('/'),'predecessor is not a scanned check record');
    assert(depth<records.size,'artifact predecessor depth exceeded');
    same(reference(indexed),r,'predecessor scan identity mismatch');
    assert.equal(indexed.placementId,placementId,'cross-page predecessor');
    const key=r.path+'#'+r.sha256;
    if(cache.has(key))return cache.get(key);
    const record=await document(r);
    assert.equal(record.placementId,placementId,'check body placement mismatch');
    assert(KINDS.has(record.kind),'unrecognized predecessor check kind');
    visiting.add(r.path);
    let resolved;
    try {
      if(record.schemaVersion===1) {
        assert.equal(record.artifactDelta,undefined,'schema 1 cannot carry lean artifacts');
        resolved=normalizeReferences(record.artifacts);
      } else {
        assert.equal(record.schemaVersion,2,'unsupported lean check schema');
        const d=record.artifactDelta;
        assert(d&&d.schemaVersion===1,'missing artifact delta');
        same(Object.keys(d).sort(),['schemaVersion','predecessor','custodyAliases','sharedArtifacts','resolvedCount','resolvedSha256'].sort(),'unexpected artifact delta fields');
        const parent=await resolve(d.predecessor,placementId,visiting,depth+1);
        const aliases=await document(d.custodyAliases),shared=await document(d.sharedArtifacts);
        assert(shared.schemaVersion===1&&shared.kind==='lesson-typography-shared-artifacts-v1','wrong shared artifact document');
        const map=new Map(applyCustodyAliases(parent,aliases).map(x=>[x.path,x]));
        for(const ref of normalizeReferences(shared.artifacts,{allowEmpty:true}))map.set(ref.path,ref);
        for(const ref of normalizeReferences(record.artifacts,{allowEmpty:true}))map.set(ref.path,ref);
        resolved=normalizeReferences([...map.values()]);
        assert.equal(resolved.length,d.resolvedCount,'resolved artifact count mismatch');
        assert.equal(inventorySha256(resolved),d.resolvedSha256,'resolved artifact digest mismatch');
      }
      cache.set(key,resolved);return resolved;
    } finally {visiting.delete(r.path);}
  }
  return {resolve};
}
