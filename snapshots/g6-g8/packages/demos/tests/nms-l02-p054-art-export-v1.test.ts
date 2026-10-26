import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const file=new URL('../../../migrations/shared-nms002-l02-p054/audit/art-export-v1.json',import.meta.url);
const bytes=readFileSync(file);
const audit=JSON.parse(bytes.toString('utf8')) as {
 animationId:string;source:{sha256:string};
 export:{count:number;counts:{shapes:number;images:number;buttons:number};
  totalBytes:number;checksumSetSha256:string;
  items:{file:string;bytes:number;sha256:string}[]};
 productionAssetPromotionApproved:boolean;originalRuntimeAccepted:boolean;
 visualFidelityAccepted:boolean};
const hash=(value:Buffer)=>createHash('sha256').update(value).digest('hex');

test('P054 extracted source art is a complete, hash-bound non-product inventory',()=>{
 assert.equal(hash(bytes),'b715b175badc1edfcdf5df81ef7c388ea7e0b2eaac99656c28c74d1762e91974');
 assert.equal(audit.animationId,'shared-nms002-l02-p054');
 assert.equal(audit.source.sha256,'06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8');
 assert.deepEqual(audit.export.counts,{shapes:519,images:12,buttons:5});
 assert.equal(audit.export.count,536);
 assert.equal(audit.export.items.length,536);
 assert.equal(audit.export.items.reduce((sum,item)=>sum+item.bytes,0),46909053);
 const checksumSet=Buffer.from(audit.export.items.map(item=>
  `${item.file}\t${item.bytes}\t${item.sha256}`).join('\n')+'\n');
 assert.equal(hash(checksumSet),audit.export.checksumSetSha256);
 assert.equal(audit.productionAssetPromotionApproved,false);
 assert.equal(audit.originalRuntimeAccepted,false);
 assert.equal(audit.visualFidelityAccepted,false);
});
test('the inventory cannot silently omit a card image or button',()=>{
 const files=new Set(audit.export.items.map(item=>item.file));
 for(const name of ['images/167.png','images/669.png',
  'buttons/DefineButton2_655/combined.svg','buttons/DefineButton2_730/combined.svg'])
  assert.ok(files.has(name),name);
 assert.equal(files.size,audit.export.items.length);
});
