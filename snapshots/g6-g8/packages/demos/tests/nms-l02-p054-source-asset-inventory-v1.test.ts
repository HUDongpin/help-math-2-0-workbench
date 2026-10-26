import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const inventoryFile=new URL('../../../migrations/shared-nms002-l02-p054/asset-inventory.csv',import.meta.url);
const artFile=new URL('../../../migrations/shared-nms002-l02-p054/audit/art-export-v1.json',import.meta.url);
const cardFile=new URL('../../../migrations/shared-nms002-l02-p054/audit/card-display-list-v1.json',import.meta.url);
const scriptFile=new URL('../../../scripts/build-nms-l02-p054-source-asset-inventory-v1.mjs',import.meta.url);
const sha=(bytes: Buffer)=>createHash('sha256').update(bytes).digest('hex');
const bytes=readFileSync(inventoryFile),lines=bytes.toString('utf8').trimEnd().split('\n');
const art=JSON.parse(readFileSync(artFile,'utf8')) as {
 export:{items:{file:string;sha256:string}[]}};
const card=JSON.parse(readFileSync(cardFile,'utf8')) as {
 resources:{sourceCharacterId:number;kind:string;exportedSha256?:string;
  sourceTextSha256?:string}[]};

test('P054 source asset inventory records every frozen export and remains outside product assets',()=>{
 assert.equal(sha(bytes),'bbbd54c44286f41ed373d64ca83e03854fc1fcb18da58be6fba5f9db40e42b75');
 assert.equal(lines.length,588);
 assert.equal(lines[0],
  'asset_id,swf_character_id,library_symbol,type,source_file,source_frame,exported_file,sha256,format,dimensions_or_bounds,font_glyphs,transformation,confidence,license_or_provenance,notes');
 assert.equal(lines.filter(line=>line.startsWith('"source-shape-')).length,519);
 assert.equal(lines.filter(line=>line.startsWith('"source-image-')).length,12);
 assert.equal(lines.filter(line=>line.startsWith('"source-button-')).length,5);
 assert.equal(lines.filter(line=>line.startsWith('"source-text-')).length,51);
 for(const item of art.export.items){
  const match=/(?:shapes|images)\/(\d+)\.(?:svg|png)$|buttons\/DefineButton2_(\d+)\/combined\.svg$/u.exec(item.file);
  assert.ok(match,item.file);
  const kind=item.file.startsWith('shapes/')?'shape':item.file.startsWith('images/')?'image':'button';
  const id=Number(match[1]??match[2]);
  assert.ok(lines.some(line=>line.startsWith(`"source-${kind}-${id}",`)&&
   line.includes(`"${item.sha256}"`)),item.file);
 }
 assert.ok(lines.slice(1).every(line=>line.includes('"verified-static-export"')&&
  line.includes('"owner-provided"')&&!line.includes('/apps/web/')));
});

test('all 37 card display-list resources have matching source asset rows',()=>{
 assert.equal(card.resources.length,37);
 for(const resource of card.resources){
  const kind=resource.kind==='shape'?'shape':'text';
  const digest=resource.exportedSha256??resource.sourceTextSha256;
  assert.ok(lines.some(line=>line.startsWith(`"source-${kind}-${resource.sourceCharacterId}",`)&&
   line.includes(`"${digest}"`)),`source character ${resource.sourceCharacterId}`);
 }
});

test('generator refuses to overwrite an existing source inventory',()=>{
 const before=sha(readFileSync(inventoryFile));
 const result=spawnSync(process.execPath,[fileURLToPath(scriptFile),'--write'],{encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/EEXIST/);
 assert.equal(sha(readFileSync(inventoryFile)),before);
});
