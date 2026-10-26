import test from 'node:test';
import assert from 'node:assert/strict';
import {p033LocalPoses} from '../src/nms-l02-p033-source-query-v1';
import {p033SourceNodes} from '../src/nms-l02-p033-feedback-v1';
import {P033_FEEDBACK_IR as IR} from '../src/generated/nms-l02-p033-feedback-ir-v1';
import {P033_ART as ART} from '../src/generated/nms-l02-p033-feedback-art-v1';
import {P033_FEEDBACK_TITLES as TITLES} from '../src/generated/nms-l02-p033-feedback-titles-v1';
test('all20 local domains/552frames remain inspectable, frozen and range checked',()=>{
 let frames=0;assert.equal(Object.keys(IR.domains).length,20);
 for(const [domain,d]of Object.entries(IR.domains))for(let f=1;f<=d.frameCount;f++){
  const poses=p033LocalPoses(domain,f);assert(Object.isFrozen(poses));
  for(const p of poses){assert(Object.isFrozen(p));assert(Object.isFrozen(p.matrix));}
  assert.deepEqual(poses,p033LocalPoses(domain==='root'?domain:'sprite-'+domain,f));
  const nodes=p033SourceNodes(domain,f);assert.equal(new Set(nodes.map(n=>n.instancePath)).size,nodes.length);
  for(const n of nodes){assert(n.matrix.every(Number.isFinite));assert(n.color.every(Number.isFinite));}frames++;
 }
 assert.equal(frames,552);
 for(const d of ['__proto__','toString','sprite-0','221/1','unknown'])assert.throws(()=>p033LocalPoses(d,1));
 for(const f of [0,-1,299,NaN,Infinity,1.1])assert.throws(()=>p033LocalPoses('221',f));
 assert.equal(p033LocalPoses('root',5).length,0);assert(p033LocalPoses('root',6).some(p=>p.characterId===221));
});
test('native titles replace board glyphs without deleting source board decoration',()=>{
 for(const id of ['80','88']as const){assert.equal(ART.art[id].body.match(/<path\b/g)?.length,7);assert.match(ART.art[id].body,/linearGradient/);}
 for(const id of [52,68,91,106])assert.equal(Object.hasOwn(ART.art,id),false);
 assert.equal(Object.values(TITLES).reduce((n,v)=>n+v.length,0),234);
 for(const rows of Object.values(TITLES))for(const r of rows){assert(r.alpha>=0&&r.alpha<=1);assert.equal(r.visible,r.alpha>0);}
 // Wrong3 retains its source scale and inherited popup; nested instances stay distinct.
 const parent=p033LocalPoses('221',130).find(p=>p.characterId===58)!;assert.equal(parent.matrix[0],1.044097900390625);
 assert(p033SourceNodes('58',16).some(n=>n.characterId===54));
 assert(!p033SourceNodes('58',15).some(n=>n.characterId===54));
});
