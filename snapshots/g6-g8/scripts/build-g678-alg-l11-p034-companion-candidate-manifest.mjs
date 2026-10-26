#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {build as verifyPredecessor} from './build-g678-alg-l11-p034-feedback-candidate-manifest.mjs';
import {build as verifyLearnerProjection} from './build-g678-alg-l11-p034-learner-math.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT='catalog/g678-alg-l11-p034-companion-candidate-v1.json';
const EVIDENCE='output/playwright/g678-alg-l11-p034-companion-v1/evidence.json';
const PREDECESSOR='catalog/g678-alg-l11-p034-feedback-candidate-v1.json';
const MODULE='packages/demos/src/g678-alg-l11-p034-companion-candidate.tsx';
const VALIDATION='work/g678-shared-page-factory/g678-alg-l11-p034-companion-final-validation-v1';
const TESTS=['packages/demos/tests/g678-alg-l11-p034-feedback-candidate.test.ts','packages/demos/tests/g678-alg-l11-p034-companion-candidate.test.tsx'];
const hash=b=>createHash('sha256').update(b).digest('hex'),json=x=>JSON.stringify(x,null,2)+'\n';
async function binding(p){assert.ok(!path.isAbsolute(p)&&!p.split('/').includes('..'));const full=path.join(ROOT,p),s=await lstat(full);
  assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1);const b=await readFile(full),after=await lstat(full);
  assert.equal(s.ino,after.ino);assert.equal(s.mtimeMs,after.mtimeMs);return{path:p,bytes:b.length,sha256:hash(b)};}
async function parse(p){return JSON.parse(await readFile(path.join(ROOT,p),'utf8'));}
export async function build({check=false}={}){
  await verifyPredecessor({check:true});await verifyLearnerProjection({check:true});
  assert.equal((await binding(EVIDENCE)).sha256,'8cf9fa04b596024f3a9470a03c3008cc0877115de54849beddc6bf541f1f9740');
  const evidence=await parse(EVIDENCE);assert.equal(evidence.status,'passed');assert.equal(evidence.records.length,5);
  assert.equal(evidence.reviewerSolutionMetadataInBundle,false);const screenshots=[],geometry=[];
  for(const record of evidence.records){assert.equal(record.status,'passed');assert.deepEqual(record.errors,[]);assert.deepEqual(record.requests,[]);assert.equal(record.final.treeCount,1);
    for(const screenshot of record.screenshots){assert.deepEqual(await binding(screenshot.path),screenshot);screenshots.push(screenshot);}
    for(const g of record.geometry){assert.equal(g.actionTrees,1);assert.equal(g.sourceButtons,0);assert.equal(g.cards.length,12);assert.equal(g.portalOutsideSourcePlane,true);
      assert.ok(g.documentWidth<=g.viewport+1);assert.ok(g.gap>=8);
      for(const card of g.cards){assert.equal(card.fontSize,20);assert.ok(card.width>=44&&card.height>=44);assert.ok(card.scrollWidth<=card.clientWidth+1);}
      if(g.viewport<=480)assert.equal(new Set(g.cards.map(c=>Math.round(c.x))).size,1);
      geometry.push({viewport:g.viewport,columns:g.gridColumns,gap:g.gap,minCardWidth:Math.min(...g.cards.map(c=>c.width)),
        minCardHeight:Math.min(...g.cards.map(c=>c.height)),mathFontPx:20,mathLineHeightPx:[...new Set(g.cards.map(c=>c.lineHeight))],horizontalOverflow:false});
    }
  }
  assert.deepEqual(evidence.records.slice(0,2).map(r=>r.config.width),[1100,390]);
  assert.equal(evidence.records[2].config.provided,false);assert.equal(evidence.records[3].config.present,false);assert.equal(evidence.records[4].config.permission,false);
  for(const input of evidence.inputs)assert.deepEqual(await binding(input.path),input,'mounted input drift');
  const files=await Promise.all([...new Set([...evidence.inputs.map(i=>i.path),...TESTS,
    'scripts/build-g678-alg-l11-p034-companion-candidate-manifest.mjs'])].sort().map(binding));
  if(!check){await mkdir(path.join(ROOT,VALIDATION));const results=[];
    for(const[label,args]of[['unit',['--import','tsx','--test',...TESTS]],['demos-typecheck',['node_modules/typescript/bin/tsc','--noEmit','-p','packages/demos/tsconfig.json']]]){
      const result=await promisify(execFile)('node',args,{cwd:ROOT,encoding:'buffer',maxBuffer:8*1024*1024}).catch(async error=>{
        await writeFile(path.join(ROOT,VALIDATION,`${label}.failed.stdout`),error.stdout??'',{flag:'wx'});await writeFile(path.join(ROOT,VALIDATION,`${label}.failed.stderr`),error.stderr??'',{flag:'wx'});throw error;});
      await writeFile(path.join(ROOT,VALIDATION,`${label}.stdout`),result.stdout,{flag:'wx'});await writeFile(path.join(ROOT,VALIDATION,`${label}.stderr`),result.stderr,{flag:'wx'});
      if(label==='unit')assert.match(result.stdout.toString(),/pass 7\b/);results.push({command:['node',...args],exitCode:0,
        stdout:await binding(`${VALIDATION}/${label}.stdout`),stderr:await binding(`${VALIDATION}/${label}.stderr`)});
    }
    assert.deepEqual(await Promise.all(files.map(f=>binding(f.path))),files);await writeFile(path.join(ROOT,VALIDATION,'validation.json'),json({files,results}),{flag:'wx'});
  }
  const validation=await parse(`${VALIDATION}/validation.json`);assert.deepEqual(validation.files,files);
  for(const result of validation.results){assert.equal(result.exitCode,0);assert.deepEqual(await binding(result.stdout.path),result.stdout);assert.deepEqual(await binding(result.stderr.path),result.stderr);}
  const manifest={schemaVersion:1,artifactType:'g678-alg-l11-p034-literal-math-responsive-companion-candidate',candidateId:'g678-alg-l11-p034-companion-v1',
    animationId:'shared-alg001-l11-p034',module:await binding(MODULE),moduleExport:'G678_ALG_L11_P034_COMPANION_CANDIDATE_MODULE',predecessor:await binding(PREDECESSOR),files,
    learnerMath:{cards:24,projection:await binding('packages/demos/src/generated/g678-alg-l11-p034-learner-math-v1.ts'),
      sourceMap:await binding('catalog/g678-alg-l11-p034-math-source-map-v1.json'),sourceMapBundled:false,reviewerSolutionMetadataBundled:false,
      visibleFormat:'literal Unicode source mathematics',spokenLanguage:'en',accessibleName:'literal expression only',mathFontPx:20},
    presentation:{sourcePlane:{width:800,height:600,sourceArtPreserved:true,actionableControls:0},
      companionContract:'pageInteractionCompanionTargetId + data-page-interaction-companion-host=true',
      controllerCount:1,actionableTreeCount:1,smallScreenColumns:1,minControlHeightPx:48,minCardHeightPx:72,gapPx:8,visibleFocusOutlinePx:3,
      standaloneFallback:true,lateRemovedInvalidTargetStatePreserved:true,sourceGeometryChangesForResponsiveText:false},
    behavior:{hostCapability:'practice-feedback',automaticSourceFeedbackTerminal:true,manualContinue:false,hostAcknowledgmentBeforeLocalOutcome:true,
      hostResetBeforePairCountAndUnlock:true,replayAndLevelReset:true,pausePreservesFeedbackClock:true},
    validation:{unitTestsPassed:7,demosTypecheckPassed:true,receipt:await binding(`${VALIDATION}/validation.json`),mountedRecordsPassed:5,
      evidence:await binding(EVIDENCE),screenshots,geometry,keyboard:['Enter','Space','Tab'],mouse:true,touch:true,boundary:evidence.boundary},
    scope:'New unregistered maintained candidate only. No existing renderer, registry, descriptor, CSS, frozen wrappers or source evidence edits.',
    limitations:['Actual registered My Lesson companion descriptor still must select this module and provide the existing host slot.',
      'Browser accessible-name checks are not named-human screen-reader acceptance; English speech only, Spanish spoken alternatives pending.',
      'Larger body text,375px/390px and landscape checks are bounded tests, not complete browser zoom/assistive-technology coverage.',
      'Source audio remains extracted and unrouted; no URL or playback was invented.',
      'Source-art reconstruction and responsive controls are engineering evidence, not original-runtime visual acceptance.'],
    gates:{successorRegistered:false,registeredMyLessonBrowserQa:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,
      audioIntegrated:false,audioAccepted:false,humanVisualAccepted:false,screenReaderHumanAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false}};
  const bytes=json(manifest);if(check)assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),bytes);else await writeFile(path.join(ROOT,OUT),bytes,{flag:'wx'});
  console.log(json({check,path:OUT,bytes:Buffer.byteLength(bytes),sha256:hash(bytes),unitTests:7,mountedRecords:5}));return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
