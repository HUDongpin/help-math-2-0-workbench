// Use the existing maintained glossary extractor/decoder. No XML source rewrite.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolveSourceGlossary} from '/Volumes/Life /HELP MATH 2.0-g678-implementation/scripts/build-g678-alg-l11-instructional-successor-glossary.mjs';
const here=path.dirname(new URL(import.meta.url).pathname);
const model=JSON.parse(fs.readFileSync(path.join(here,'../source/SOURCE-STATIC.json'),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const output=[];
for(const page of model.pages){
 const xml={},source={};
 for(const [lang,name] of [['en','L1KTE01.xml'],['es','L1KTS01.xml']]){
  const pin=page.controls[0].dictionary[lang].source,bytes=fs.readFileSync(pin.path);
  assert.equal(bytes.length,pin.bytes);assert.equal(sha(bytes),pin.sha256);xml[lang]=bytes.toString('utf8');
  source[lang]={assetId:'G678'+name,path:'HELP_KEYTERMS/KT/XML/'+name,sha256:pin.sha256};
 }
 const resolved=resolveSourceGlossary(xml,page.controls.map(c=>c.sourceKeyAttribute),source);
 for(const c of page.controls){
  const entry=resolved.find(e=>e.sourceKeyAttribute===c.sourceKeyAttribute);assert(entry,'exact original source key; no implicit alias');
  for(const lang of ['en','es'])assert.equal(entry.sourceEntrySha256[lang],c.dictionary[lang].matches[0].sourceEntrySha256);
 }
 output.push({animationId:page.animationId,entries:resolved});
}
console.log(JSON.stringify(output));
