#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {build as verifyVisualPredecessor} from './build-g678-alg-l11-d-instructional-candidate-manifest.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT='catalog/g678-alg-l11-p044-host-score-candidate-v1.json';
const PREDECESSOR='catalog/g678-alg-l11-d-instructional-candidate-v1.json';
const EVIDENCE='output/playwright/g678-alg-l11-p044-host-score-v1/evidence.json';
const VALIDATION='work/g678-shared-page-factory/g678-alg-l11-p044-host-score-final-validation-v1';
const MODULE='packages/demos/src/g678-alg-l11-p044-host-score-candidate.tsx';
const TEST='packages/demos/tests/g678-alg-l11-p044-host-score-candidate.test.ts';
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';
const command=promisify(execFile);
async function binding(relative){
  assert.ok(!path.isAbsolute(relative)&&!relative.split('/').includes('..'));
  const full=path.join(ROOT,relative),before=await lstat(full);
  assert.ok(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1);
  const bytes=await readFile(full),after=await lstat(full);
  assert.equal(before.ino,after.ino);assert.equal(before.mtimeMs,after.mtimeMs);
  return{path:relative,bytes:bytes.length,sha256:hash(bytes)};
}
async function parse(relative){return JSON.parse(await readFile(path.join(ROOT,relative),'utf8'));}

export async function build({check=false}={}){
  await verifyVisualPredecessor({check:true});
  assert.equal((await binding(PREDECESSOR)).sha256,'80c275faf64cf03861388ac13dc0a0a35ca738619debe4926bb157fe91b4dcf8');
  assert.equal((await binding(EVIDENCE)).sha256,'9d04010fa785854f58613faaea2438b094bd986cd934a2999a7dc6ca37942fad');
  const evidence=await parse(EVIDENCE);
  assert.equal(evidence.status,'passed');assert.equal(evidence.records.length,3);
  assert.deepEqual(evidence.records.map(({permission,motion})=>({permission,motion})),[
    {permission:true,motion:'no-preference'},{permission:true,motion:'reduce'},{permission:false,motion:'reduce'},
  ]);
  const requiredSteps=['two-real-host-records','real-host-rejected-no-local-advance','replay-reset-real-host',
    'ten-real-host-acks-before-completion','post-review-replay-cleared-real-score'];
  const screenshots=[];
  for(const record of evidence.records){
    assert.equal(record.status,'passed');assert.deepEqual(record.errors,[]);assert.deepEqual(record.requests,[]);
    if(record.permission)assert.deepEqual(record.trace.map(row=>row.step),requiredSteps);
    for(const key of ['blockedScreenshot','resultScreenshot','screenshot'])if(record[key]){
      assert.deepEqual(await binding(record[key].path),record[key]);screenshots.push(record[key]);
    }
    for(const entry of record.final.audit){
      assert.deepEqual(Object.keys(entry.request),entry.request.type==='record-fq-score'
        ?['type','questionId','correct','pointsAwarded','pointsPossible']:['type']);
      assert.ok(['record-fq-score','reset-fq-score'].includes(entry.request.type));
    }
  }
  for(const key of ['registered','productCalibrationPassed','authoritativeOriginalRuntime','visualFidelityAccepted',
    'audioAccepted','humanVisualAccepted','ownerAccepted','strictComplete','released','published'])assert.equal(evidence[key],false);
  assert.equal(new Set(evidence.inputs.map(input=>input.path)).size,evidence.inputs.length);
  for(const input of evidence.inputs)assert.deepEqual(await binding(input.path),input,'mounted input drifted');
  const files=await Promise.all([...new Set([...evidence.inputs.map(input=>input.path),
    'scripts/build-g678-alg-l11-p044-host-score-candidate-manifest.mjs'])].sort().map(binding));
  if(!check){
    await mkdir(path.join(ROOT,VALIDATION));
    const results=[];
    for(const [label,args]of[
      ['unit',['--import','tsx','--test',TEST]],
      ['demos-typecheck',['node_modules/typescript/bin/tsc','--noEmit','-p','packages/demos/tsconfig.json']],
    ]){
      const result=await command('node',args,{cwd:ROOT,encoding:'buffer',maxBuffer:8*1024*1024}).catch(async error=>{
        await writeFile(path.join(ROOT,VALIDATION,`${label}.failed.stdout`),error.stdout??'',{flag:'wx'});
        await writeFile(path.join(ROOT,VALIDATION,`${label}.failed.stderr`),error.stderr??'',{flag:'wx'});throw error;
      });
      await writeFile(path.join(ROOT,VALIDATION,`${label}.stdout`),result.stdout,{flag:'wx'});
      await writeFile(path.join(ROOT,VALIDATION,`${label}.stderr`),result.stderr,{flag:'wx'});
      if(label==='unit')assert.match(result.stdout.toString(),/pass 3\b/);
      results.push({command:['node',...args],exitCode:0,stdout:await binding(`${VALIDATION}/${label}.stdout`),
        stderr:await binding(`${VALIDATION}/${label}.stderr`)});
    }
    assert.deepEqual(await Promise.all(files.map(file=>binding(file.path))),files,'input changed during validation');
    await writeFile(path.join(ROOT,VALIDATION,'validation.json'),json({files,results}),{flag:'wx'});
  }
  const validation=await parse(`${VALIDATION}/validation.json`);assert.deepEqual(validation.files,files);
  for(const result of validation.results){
    assert.equal(result.exitCode,0);assert.deepEqual(await binding(result.stdout.path),result.stdout);
    assert.deepEqual(await binding(result.stderr.path),result.stderr);
  }
  const manifest={schemaVersion:1,artifactType:'g678-alg-l11-p044-source-typed-host-score-candidate',
    candidateId:'g678-alg-l11-p044-host-score-v1',animationId:'shared-alg001-l11-p044',
    predecessor:await binding(PREDECESSOR),module:await binding(MODULE),
    moduleExport:'G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE',files,
    sourceQuestionIds:'shared-alg001-l11-p044-q1 through shared-alg001-l11-p044-q24; current deterministic 10-question selection only',
    hostContract:{capabilities:['fq-scoring'],storage:'memory-only',storesPersonalData:false,
      requests:['record-fq-score','reset-fq-score'],rawAnswersInHostRequests:false,
      answerAdvancementRequiresExactAllowedAggregateAcknowledgment:true,
      completionRequiresAllTenOrderedSelectedSourceQuestionAcknowledgments:true,
      blockedRecordLocksAdvancementAndCompletion:true,replayRequiresRealHostReset:true,fullSourceReviewPreserved:true},
    validation:{unitTestsPassed:3,demosTypecheckPassed:true,receipt:await binding(`${VALIDATION}/validation.json`),
      mountedRecordsPassed:3,evidence:await binding(EVIDENCE),screenshots,boundary:evidence.boundary},
    scope:'Separate maintained successor only; frozen D visual v1 and generated wrappers are unchanged. Mounted test-loader evidence is not registered My Lesson evidence.',
    limitations:['Not yet registered in the current product registry or successor wrappers.',
      'D3 source audio playback integration and mathematical text alternatives remain implementation work.',
      'Original-runtime evidence, named-human visual/audio review, Owner acceptance and strict completion remain independent unresolved gates.'],
    gates:{successorRegistered:false,registeredMyLessonBrowserQa:false,productCalibrationPassed:false,
      authoritativeOriginalRuntime:false,visualFidelityAccepted:false,audioAccepted:false,humanVisualAccepted:false,
      ownerAccepted:false,strictComplete:false,released:false,published:false,scaleOutAuthorized:false}};
  const bytes=json(manifest);
  if(check)assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),bytes);
  else await writeFile(path.join(ROOT,OUT),bytes,{flag:'wx'});
  console.log(json({check,path:OUT,bytes:Buffer.byteLength(bytes),sha256:hash(bytes),unitTests:3,mountedRecords:3}));
  return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
