#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {build as verifyVisualPredecessor} from './build-g678-alg-l11-d-instructional-candidate-manifest.mjs';
import {build as verifyFeedbackAssets} from './build-g678-alg-l11-p034-feedback.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT='catalog/g678-alg-l11-p034-feedback-candidate-v1.json';
const PREDECESSOR='catalog/g678-alg-l11-d-instructional-candidate-v1.json';
const EVIDENCE='output/playwright/g678-alg-l11-p034-feedback-v1/evidence.json';
const VECTORS='work/g678-shared-page-factory/g678-alg-l11-p034-feedback-vector-verification-v1/verification.json';
const RUN='work/g678-shared-page-factory/g678-alg-l11-p034-feedback-generated-v1/run.json';
const VALIDATION='work/g678-shared-page-factory/g678-alg-l11-p034-feedback-final-validation-v1';
const MODULE='packages/demos/src/g678-alg-l11-p034-feedback-candidate.tsx';
const TEST='packages/demos/tests/g678-alg-l11-p034-feedback-candidate.test.ts';
const hash=b=>createHash('sha256').update(b).digest('hex'),json=x=>JSON.stringify(x,null,2)+'\n';
async function binding(relative){assert.ok(!path.isAbsolute(relative)&&!relative.split('/').includes('..'));
  const full=path.join(ROOT,relative),s=await lstat(full);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1);
  const b=await readFile(full),after=await lstat(full);assert.equal(s.ino,after.ino);assert.equal(s.mtimeMs,after.mtimeMs);
  return{path:relative,bytes:b.length,sha256:hash(b)};}
async function parse(p){return JSON.parse(await readFile(path.join(ROOT,p),'utf8'));}
export async function build({check=false}={}){
  await verifyVisualPredecessor({check:true});const source=await verifyFeedbackAssets({check:true});
  assert.equal((await binding(EVIDENCE)).sha256,'40e2685f1e2b036937443b5553e3754288441a6d8988d5bfdf649a98033148bc');
  const evidence=await parse(EVIDENCE);assert.equal(evidence.status,'passed');assert.equal(evidence.records.length,3);
  assert.deepEqual(evidence.records.map(({permission,motion,width})=>({permission,motion,width})),[
    {permission:true,motion:'no-preference',width:1100},{permission:true,motion:'reduce',width:390},{permission:false,motion:'reduce',width:390}]);
  const screenshots=[];
  for(const record of evidence.records){assert.equal(record.status,'passed');assert.deepEqual(record.errors,[]);assert.deepEqual(record.requests,[]);
    if(record.permission)assert.deepEqual(record.trace.map(t=>t.step),['blocked-record-before-local-outcome','wrong-terminal-automatic-reset-after-pause',
      'correct-pair-count-only-at-terminal','blocked-terminal-reset-holds-pair-count','level-change-clears-game-clock-and-host','six-source-feedback-terminals-before-completion']);
    for(const key of['wrongScreenshot','correctScreenshot','completeScreenshot','screenshot'])if(record[key]){
      assert.deepEqual(await binding(record[key].path),record[key]);screenshots.push(record[key]);}
    for(const entry of record.final.audit){assert.ok(['record-practice-feedback','reset-practice-feedback'].includes(entry.request.type));
      assert.deepEqual(Object.keys(entry.request),entry.request.type==='record-practice-feedback'?['type','interactionId','outcome','branchIndex','branchCount']
        :entry.request.interactionId?['type','interactionId']:['type']);}
  }
  assert.equal(evidence.audioIntegrated,false);assert.equal(evidence.registered,false);
  for(const input of evidence.inputs)assert.deepEqual(await binding(input.path),input,'mounted input drift');
  const vectors=await parse(VECTORS);assert.equal(vectors.frames,55);assert.equal(vectors.records.length,55);
  assert.ok(vectors.records.every(row=>row.rasterExact===true));assert.deepEqual(await binding(vectors.contactSheet.path),vectors.contactSheet);
  const extraction=await parse(RUN);const files=await Promise.all([...new Set([...evidence.inputs.map(i=>i.path),
    'scripts/build-g678-alg-l11-p034-feedback-candidate-manifest.mjs','scripts/build-g678-alg-l11-p034-feedback.mjs',
    'scripts/extract-g678-alg-l11-p034-feedback.mjs','scripts/g678-alg-l11-p034-feedback-source.py',
    'scripts/verify-g678-alg-l11-p034-feedback-vectors.mjs',VECTORS,...extraction.audioAssets.map(i=>i.path)])].sort().map(binding));
  if(!check){await mkdir(path.join(ROOT,VALIDATION));const results=[];
    for(const[label,args]of[['unit',['--import','tsx','--test',TEST]],['demos-typecheck',['node_modules/typescript/bin/tsc','--noEmit','-p','packages/demos/tsconfig.json']]]){
      const result=await promisify(execFile)('node',args,{cwd:ROOT,encoding:'buffer',maxBuffer:8*1024*1024}).catch(async error=>{
        await writeFile(path.join(ROOT,VALIDATION,`${label}.failed.stdout`),error.stdout??'',{flag:'wx'});
        await writeFile(path.join(ROOT,VALIDATION,`${label}.failed.stderr`),error.stderr??'',{flag:'wx'});throw error;});
      await writeFile(path.join(ROOT,VALIDATION,`${label}.stdout`),result.stdout,{flag:'wx'});await writeFile(path.join(ROOT,VALIDATION,`${label}.stderr`),result.stderr,{flag:'wx'});
      if(label==='unit')assert.match(result.stdout.toString(),/pass 4\b/);
      results.push({command:['node',...args],exitCode:0,stdout:await binding(`${VALIDATION}/${label}.stdout`),stderr:await binding(`${VALIDATION}/${label}.stderr`)});
    }
    assert.deepEqual(await Promise.all(files.map(f=>binding(f.path))),files);await writeFile(path.join(ROOT,VALIDATION,'validation.json'),json({files,results}),{flag:'wx'});
  }
  const validation=await parse(`${VALIDATION}/validation.json`);assert.deepEqual(validation.files,files);
  for(const result of validation.results){assert.equal(result.exitCode,0);assert.deepEqual(await binding(result.stdout.path),result.stdout);assert.deepEqual(await binding(result.stderr.path),result.stderr);}
  const manifest={schemaVersion:1,artifactType:'g678-alg-l11-p034-source-feedback-typed-host-candidate',candidateId:'g678-alg-l11-p034-feedback-v1',
    animationId:'shared-alg001-l11-p034',predecessor:await binding(PREDECESSOR),module:await binding(MODULE),moduleExport:'G678_ALG_L11_P034_FEEDBACK_CANDIDATE_MODULE',files,
    runtime:{rootFrameCount:10,mainFrameDomain:'sprite-225',fps:12,feedback:source.feedback.map(({sourceInstanceName,characterId,startFrame,terminalFrame,branchIndex,branchCount,outcome,pointsDelta,durationMs})=>
      ({sourceInstanceName,characterId,startFrame,terminalFrame,branchIndex,branchCount,outcome,pointsDelta,durationMs}))},
    behavior:{typedHostCapability:'practice-feedback',hostAcknowledgmentBeforeLocalOutcome:true,automaticFeedbackCompletion:true,manualContinue:false,
      pointsAndFadeStartOnSecondCard:true,pairCounterAdvancesOnlyAtCorrectTerminal:true,hostResetBeforeCardsReenabled:true,
      pauseHoldsChildClock:true,replayAndLevelChangeResetGameAndHost:true,reducedMotion:'static source child midpoint with source automatic duration and pause retained',rawCardAnswersInHostRequests:false},
    audio:{required:true,integrated:false,deliveryStatus:'unrouted-source-candidate',assets:extraction.audioAssets,
      fullEofDecodePassed:2,sourceSampleSeekMetadataRetained:true,substitutedExternalAudio:false,assetUrls:[],
      unresolved:['No admitted G678-local route for extracted work-root MP3 payloads.','Current interactive-audio contract has play-from-zero/stop-reset, not source stream pause/resume/sample-position semantics.','Correct stream includes frame1 priming while source trigger begins child2; playback offset is not inferred.']},
    validation:{unitTestsPassed:4,demosTypecheckPassed:true,receipt:await binding(`${VALIDATION}/validation.json`),mountedRecordsPassed:3,
      evidence:await binding(EVIDENCE),screenshots,sourceVectorFramesExact:55,sourceVectorEvidence:await binding(VECTORS),boundary:evidence.boundary},
    scope:'Separate maintained candidate, no edits to frozen D v1/current wrappers/registry/shared runtime. Test-loader is not actual registered My Lesson.',
    limitations:['Source audio assets are extracted and decoded but not delivered or played.','Mobile three-column mathematical card readability and text alternatives require further product accessibility review.',
      'Feedback art uses a maintained center overlay; source vector/frame reconstruction is not original-runtime placement/fidelity acceptance.'],
    gates:{successorRegistered:false,registeredMyLessonBrowserQa:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,
      audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false,scaleOutAuthorized:false}};
  const bytes=json(manifest);if(check)assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),bytes);else await writeFile(path.join(ROOT,OUT),bytes,{flag:'wx'});
  console.log(json({check,path:OUT,bytes:Buffer.byteLength(bytes),sha256:hash(bytes),unitTests:4,mountedRecords:3,sourceVectorFramesExact:55}));return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
