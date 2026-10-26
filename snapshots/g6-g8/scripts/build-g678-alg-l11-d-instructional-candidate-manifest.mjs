#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT='catalog/g678-alg-l11-d-instructional-candidate-v1.json';
const VALIDATION='work/g678-shared-page-factory/g678-alg-l11-d-instructional-final-validation-v1';
const BROWSER='output/playwright/g678-alg-l11-d-instructional-v7-completion/evidence.json';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const TESTS=[
  'packages/demos/tests/g678-alg-l11-tranche-d-instructional-candidates.test.tsx',
  'packages/demos/tests/g678-alg-l11-p033-instructional-candidate.test.tsx',
  'packages/demos/tests/g678-alg-l11-p034-source-reveal.test.ts',
  'packages/demos/tests/g678-alg-l11-p034-source-fade.test.ts',
  'scripts/build-g678-alg-l11-tranche-d-instructional-visuals.test.mjs',
  'scripts/build-g678-alg-l11-p033-instructional-sequence.test.mjs',
  'scripts/build-g678-alg-l11-p034-source-reveal.test.mjs',
  'scripts/build-g678-alg-l11-p034-source-fade.test.mjs',
];
const GENERATED=[
  'g678-alg-l11-tranche-d-instructional-visuals-v1','g678-alg-l11-p033-instructional-sequence-v1',
  'g678-alg-l11-p034-source-reveal-v1','g678-alg-l11-p034-source-fade-v1',
].map(name=>`packages/demos/src/generated/${name}.ts`);
const BUILD_RUNS=[
  'work/g678-shared-page-factory/g678-alg-l11-tranche-d-instructional-visuals-v1-generated/run.json',
  'work/g678-shared-page-factory/g678-alg-l11-p033-instructional-sequence-generated-v1/run.json',
  'work/g678-shared-page-factory/g678-alg-l11-p034-source-reveal-v2/run.json',
  'work/g678-shared-page-factory/g678-alg-l11-p034-source-fade-v1/run.json',
];
async function binding(relative,{absolute=false}={}){
  const full=absolute?relative:path.join(ROOT,relative);const before=await lstat(full);
  assert.ok(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1);
  const bytes=await readFile(full);const after=await lstat(full);
  assert.equal(before.ino,after.ino);assert.equal(before.mtimeMs,after.mtimeMs);
  return{path:relative,bytes:bytes.length,sha256:hash(bytes)};
}
async function parse(relative){return JSON.parse(await readFile(path.join(ROOT,relative),'utf8'));}
const command=promisify(execFile);
export async function build({check=false}={}){
  const auditPath='catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json';const audit=await parse(auditPath);
  assert.equal((await binding(auditPath)).sha256,'03e9ba9bb7af3baa2df8bc1792834bd74ca502a56bc041f3a8860dc51dffec42');
  const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;assert.ok(sourceRoot&&path.isAbsolute(sourceRoot));assert.equal(await realpath(sourceRoot),sourceRoot);
  const sources=[];
  for(const page of audit.pages){const source=await binding(path.join(sourceRoot,page.source.path),{absolute:true});
    assert.equal(source.sha256,page.source.sha256);assert.equal(source.bytes,page.source.bytes);assert.equal((await lstat(source.path)).mode&0o222,0);
    sources.push({animationId:page.animationId,...page.source,physicallyReverifiedReadOnly:true});}
  const evidence=await parse(BROWSER);assert.equal(evidence.status,'passed');assert.equal(evidence.records.length,30);
  assert.ok(evidence.records.every(record=>record.status==='passed'&&record.errors.length===0&&record.requests.length===0));
  for(const input of evidence.inputs)assert.deepEqual(await binding(input.path),input,'mounted browser input drifted');
  assert.equal(evidence.records.filter(record=>record.id.endsWith('p033')).length,3);
  assert.equal(evidence.records.filter(record=>record.id.endsWith('p034')).length,2);
  assert.equal(evidence.records.filter(record=>record.id.endsWith('p044')).length,25);
  const filePaths=[...new Set([...evidence.inputs.map(input=>input.path),...TESTS,...GENERATED,...BUILD_RUNS,
    'work/g678-shared-page-factory/g678-alg-l11-p033-instructional-vector-inspection-v1/verification.json'])].sort();
  const files=await Promise.all(filePaths.map(p=>binding(p)));
  if(!check){
    await mkdir(path.join(ROOT,VALIDATION));
    const commands=[['node',['--import','tsx','--test',...TESTS],'unit'],
      ['node',['node_modules/typescript/bin/tsc','--noEmit','-p','packages/demos/tsconfig.json'],'demos-typecheck']];
    const results=[];
    for(const[executable,args,label]of commands){
      const result=await command(executable,args,{cwd:ROOT,encoding:'buffer',maxBuffer:8*1024*1024}).catch(async error=>{
        await writeFile(path.join(ROOT,VALIDATION,`${label}.failed.stdout`),error.stdout??'',{flag:'wx'});
        await writeFile(path.join(ROOT,VALIDATION,`${label}.failed.stderr`),error.stderr??'',{flag:'wx'});throw error;});
      await writeFile(path.join(ROOT,VALIDATION,`${label}.stdout`),result.stdout,{flag:'wx'});
      await writeFile(path.join(ROOT,VALIDATION,`${label}.stderr`),result.stderr,{flag:'wx'});
      if(label==='unit')assert.match(result.stdout.toString(),/pass 21\b/);
      results.push({command:[executable,...args],exitCode:0,stdout:await binding(`${VALIDATION}/${label}.stdout`),stderr:await binding(`${VALIDATION}/${label}.stderr`)});
    }
    assert.deepEqual(await Promise.all(filePaths.map(p=>binding(p))),files,'source changed during validation');
    await writeFile(path.join(ROOT,VALIDATION,'validation.json'),JSON.stringify({files,results},null,2)+'\n',{flag:'wx'});
  }
  const validation=await parse(`${VALIDATION}/validation.json`);assert.deepEqual(validation.files,files);
  for(const result of validation.results){assert.equal(result.exitCode,0);assert.deepEqual(await binding(result.stdout.path),result.stdout);assert.deepEqual(await binding(result.stderr.path),result.stderr);}
  const manifest={schemaVersion:1,artifactType:'g678-alg-l11-tranche-d-instructional-candidate-manifest',
    candidateId:'g678-alg-l11-d-instructional-successor-v1',builder:await binding(path.relative(ROOT,fileURLToPath(import.meta.url))),
    sourceAudit:await binding(auditPath),sources,files,
    selectedPages:[
      {animationId:'shared-alg001-l11-p033',modulePath:'packages/demos/src/g678-alg-l11-p033-instructional-candidate.tsx',moduleExport:'G678_ALG_L11_D_INSTRUCTIONAL_P033_MODULE',
        runtime:{rootFrameCount:10,mainFrameDomain:'sprite-116',mainFrameCount:606,sourceStopFrame:605},
        coverage:{mainVisualFrames:606,nestedControlsMaintained:true,sourcePopup:true,authoredRepeatSkip:true,selectedLevelSurvivesAuthoredJumps:true}},
      {animationId:'shared-alg001-l11-p034',modulePath:'packages/demos/src/g678-alg-l11-tranche-d-instructional-candidates.tsx',moduleExport:'G678_ALG_L11_D_INSTRUCTIONAL_P034_MODULE',
        runtime:{rootFrameCount:10,mainFrameDomain:'sprite-225',mainFrameCount:5},
        coverage:{mathematicalCards:24,levels:2,sourcePictureTiles:24,sourceFadeIntervalMs:100,sourceFadeSettledMs:400,completionRequiresSixPairsAndSettledFades:true}},
      {animationId:'shared-alg001-l11-p044',modulePath:'packages/demos/src/g678-alg-l11-tranche-d-instructional-candidates.tsx',moduleExport:'G678_ALG_L11_D_INSTRUCTIONAL_P044_MODULE',
        runtime:{rootFrameCount:10,mainFrameDomain:'sprite-1083',mainFrameCount:69},
        coverage:{questionPrompts:24,actualChoices:96,sampledQuestions:10,actualContentDuringReview:true,completionRequiresTenResponses:true,scoreAndReviewRetainedAfterResolution:true}},
    ],
    validation:{unitTestsPassed:21,demosTypecheckPassed:true,receipt:await binding(`${VALIDATION}/validation.json`),
      mountedRuntime:{recordCount:30,boundary:evidence.boundary,evidence:await binding(BROWSER)},
      sourceVectorNormalization:{p033ExactFrames:606,originalRuntime:false,evidence:await binding('work/g678-shared-page-factory/g678-alg-l11-p033-instructional-vector-inspection-v1/verification.json')}},
    scope:'NEW candidate modules only; mounted evidence uses explicit test-loader, not official registry or actual My Lesson registration',
    limitations:[
      'Original-runtime evidence, visual/audio fidelity, named human and Owner acceptance remain unestablished.',
      'D3 source audio assets, triggers, playback/stop/pause/replay integration are the next implementation task; audio acceptance is additionally separate.',
      'Complex mathematical text alternatives remain an accessibility review and implementation item.',
      'p033 initial source mcRepeat art says Skip Directions while its source handler goes to RepeatDirection frame11; source art and handler are preserved.',
      'p034/p044 hold the maintained interaction entry in the host while branch state owns the selected source level/question; this normalization does not assert original-runtime frame fidelity.',
    ],
    gates:{successorRegistered:false,registeredMyLessonBrowserQa:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,
      visualFidelityAccepted:false,audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false,scaleOutAuthorized:false}};
  const bytes=JSON.stringify(manifest,null,2)+'\n';
  if(check)assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),bytes);else await writeFile(path.join(ROOT,OUT),bytes,{flag:'wx'});
  console.log(JSON.stringify({check,path:OUT,bytes:Buffer.byteLength(bytes),sha256:hash(bytes),pages:3,tests:21,mountedRecords:30}));
  return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
