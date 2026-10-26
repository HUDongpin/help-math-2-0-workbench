#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE='work/g678-shared-page-factory/g678-alg-l11-residual-routing-audit-v1/shared-alg001-l11-p034/ffdec-export/scripts';
const OUT='packages/demos/src/generated/g678-alg-l11-p034-source-fade-v1.ts';
const RUN='work/g678-shared-page-factory/g678-alg-l11-p034-source-fade-v1';
const hash=b=>createHash('sha256').update(b).digest('hex');
async function binding(p){const b=await readFile(path.join(ROOT,p));return{path:p,bytes:b.length,sha256:hash(b)};}
function body(script,name){const start=script.indexOf(`function ${name}()`);assert.ok(start>=0);let first=script.indexOf('{',start),depth=0;for(let index=first;index<script.length;index++){if(script[index]==='{')depth++;if(script[index]==='}'&&--depth===0)return script.slice(first,index+1);}throw new Error('unterminated source function');}
export async function build({check=false}={}){
  const auditPath='catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json';const auditBinding=await binding(auditPath);assert.equal(auditBinding.sha256,'03e9ba9bb7af3baa2df8bc1792834bd74ca502a56bc041f3a8860dc51dffec42');
  const audit=JSON.parse(await readFile(path.join(ROOT,auditPath),'utf8'));const scripts=[];
  for(const card of audit.behaviorContracts.p034MatchingGame.cards){
    const frame=card.level===1?2:4;const dir=`${BASE}/DefineSprite_225/frame_${frame}`;
    const matches=(await readdir(path.join(ROOT,dir))).filter(p=>p.startsWith(`PlaceObject2_${card.sourceCharacterId}_`));assert.equal(matches.length,1);
    const file=`${dir}/${matches[0]}/CLIPACTIONRECORD on(release).as`;const script=await readFile(path.join(ROOT,file),'utf8');
    assert.deepEqual([...script.matchAll(/setInterval\(fadeOut(\d+),(\d+)\)/g)].map(m=>[Number(m[1]),Number(m[2])]),[[1,100],[2,100]]);
    for(const name of['fadeOut1','fadeOut2']){const code=body(script,name);
      assert.match(code,/_alpha -= 40/);assert.match(code,/_alpha = _alpha - 40/);
      assert.equal([...code.matchAll(/_alpha > 0/g)].length,2);
      assert.equal([...code.matchAll(/_visible = false/g)].length,2);
      assert.equal([...code.matchAll(/_visible = true/g)].length,2);
      assert.equal([...code.matchAll(/clearInterval\(intervalID\)/g)].length,2);
    }
    scripts.push({cardId:`level-${card.level}-${card.sourceInstanceName}`,...await binding(file)});
  }
  assert.equal(scripts.length,24);
  const data={schemaVersion:1,sourceAudit:auditBinding,sourceScripts:scripts,intervalMs:100,
    initialSourceAlpha:100,alphaDecrementPerTick:40,firstPictureVisibleTick:1,firstTransparentTick:3,
    sourceVisibleFalseTick:4,settledAfterMs:400,scheduledFunctions:['fadeOut1','fadeOut2'],
    unscheduledDefinitions:['fadeOut3','fadeOut4'],sourceTimer:'setInterval',
    reducedMotionDisposition:'display final revealed state without timed fade',
    acceptanceEffect:'none',audioImplemented:false};
  const generated='// Generated from all24 source card release scripts. Do not hand edit.\nexport const G678_ALG_L11_P034_SOURCE_FADE = '+JSON.stringify(data)+' as const;\n';
  const manifest={builder:await binding(path.relative(ROOT,fileURLToPath(import.meta.url))),generated:{path:OUT,bytes:Buffer.byteLength(generated),sha256:hash(generated)},sourceAudit:auditBinding,sourceScripts:scripts};
  if(check){assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),generated);assert.equal(await readFile(path.join(ROOT,RUN,'run.json'),'utf8'),JSON.stringify(manifest,null,2)+'\n');}
  else{await mkdir(path.join(ROOT,RUN));await writeFile(path.join(ROOT,OUT),generated,{flag:'wx'});await writeFile(path.join(ROOT,RUN,'run.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});}
  console.log(JSON.stringify({check,sourceScripts:24,intervalMs:100,settledAfterMs:400,generated:manifest.generated}));return data;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
