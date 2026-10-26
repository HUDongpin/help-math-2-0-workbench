#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const INPUT='catalog/g678-alg-l11-p034-math-source-map-v1.json';
const OUT='packages/demos/src/generated/g678-alg-l11-p034-learner-math-v1.ts';
const RUN='work/g678-shared-page-factory/g678-alg-l11-p034-learner-math-v1';
const hash=b=>createHash('sha256').update(b).digest('hex'),json=x=>JSON.stringify(x,null,2)+'\n';
async function binding(p){const b=await readFile(path.join(ROOT,p));return{path:p,bytes:b.length,sha256:hash(b)};}
export async function build({check=false}={}){
  const input=await binding(INPUT);assert.equal(input.sha256,'bdbaa57f3e5db2b1bac33f3350142f8190d9562d53562963c7adbb6ee36c33b6');
  const map=JSON.parse(await readFile(path.join(ROOT,INPUT),'utf8'));assert.equal(map.cards.length,24);assert.equal(map.ambiguities.length,0);
  const data=map.cards.map(c=>({cardId:c.cardId,sourceCharacterId:c.sourceCharacterId,expression:c.literalAlternative.expression,
    spoken:c.literalAlternative.spoken,spokenLanguage:c.literalAlternative.spokenLanguage}));
  for(const row of data)assert.deepEqual(Object.keys(row),['cardId','sourceCharacterId','expression','spoken','spokenLanguage']);
  const generated='// Generated from hash-bound literal alternatives only. No reviewer solution/pair metadata.\nexport const G678_ALG_L11_P034_LEARNER_MATH = '+JSON.stringify(data)+' as const;\n';
  const receipt={schemaVersion:1,artifactType:'p034-literal-only-learner-projection',builder:await binding(path.relative(ROOT,fileURLToPath(import.meta.url))),input,
    generated:{path:OUT,bytes:Buffer.byteLength(generated),sha256:hash(generated)},cards:24,fields:Object.keys(data[0]),solutionMetadataBundled:false,
    gates:{registered:false,productCalibrationPassed:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false}};
  if(check){assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),generated);assert.equal(await readFile(path.join(ROOT,RUN,'run.json'),'utf8'),json(receipt));}
  else{await mkdir(path.join(ROOT,RUN));await writeFile(path.join(ROOT,OUT),generated,{flag:'wx'});await writeFile(path.join(ROOT,RUN,'run.json'),json(receipt),{flag:'wx'});}
  console.log(json({check,...receipt.generated}));return data;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
