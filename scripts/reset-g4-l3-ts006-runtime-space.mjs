import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID,createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,lstat,realpath,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareDisposableRuntimeProfile} from './prepare-g4-l3-ts006-disposable-runtime-profile.mjs';
import {applyDisposableProfileSelection} from './select-g4-l3-ts006-disposable-runtime-profiles.mjs';
import {writeCurrentAccountProfileReadiness} from './build-g4-l3-ts006-current-account-profile-readiness.mjs';
import {buildPendingProjectorLaunchPlan} from './launch-g4-l3-ts006-pending-projector.mjs';
import {TS006_CAPTURE_ROOT,TS006_CAPTURE_DESTINATION_FILE} from './g4-l3-ts006-capture-destination.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE=path.dirname(TS006_CAPTURE_ROOT);
const SELECTION='work/g4-l3-ts006-original-runtime-authorization-intake/current-session-profile-selection.json';
const digest=b=>createHash('sha256').update(b).digest('hex');
const pretty=v=>JSON.stringify(v,null,2)+'\n';
const execute=promisify(execFile);

async function stopped(name){
  let running=false;
  try{await execute('/usr/bin/pgrep',['-x',name]);running=true;}
  catch(error){assert.equal(error.code,1,`Unable to establish ${name} process state`);}
  assert(!running,`Close the active ${name} session before preparing a new pair`);
}
async function ordinary(p){
  const s=await lstat(p);assert(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1);
  assert.equal(await realpath(p),p);return await readFile(p);
}

export async function resetTs006RuntimeSpace(){
  await stopped('Flash Player');await stopped('g4-l3-runtime-capture');
  await execute(process.execPath,['scripts/prepare-g4-l3-ts006-original-runtime-session-kits.mjs','--check'],{cwd:ROOT,timeout:30000});
  const previousSelection=await ordinary(path.join(ROOT,SELECTION));
  const configPath=path.join(ROOT,TS006_CAPTURE_DESTINATION_FILE);
  const previousConfig=await ordinary(configPath);const config=JSON.parse(previousConfig);
  assert.equal(config.evidenceType,'g4-l3-ts006-capture-destination-selection');
  assert.equal(config.captureRoot,TS006_CAPTURE_ROOT);assert.equal(config.operator,'Dr. Peter Hu');
  assert.equal(config.profileSelectionSha256,digest(previousSelection));
  assert.equal(await realpath(TS006_CAPTURE_ROOT),TS006_CAPTURE_ROOT);
  const rotationId=randomUUID();const archive=path.join(BASE,'rotations',rotationId);
  await mkdir(archive,{recursive:true,mode:0o700});
  const before={};
  for(const relative of [SELECTION,TS006_CAPTURE_DESTINATION_FILE,
      'reports/g4-l3-ts006-current-account-profile-readiness.json','reports/g4-l3-ts006-current-account-profile-readiness.md']){
    const bytes=await ordinary(path.join(ROOT,relative));const retained=path.join(archive,'before-'+path.basename(relative));
    await writeFile(retained,bytes,{flag:'wx',mode:0o400});
    before[relative]={sha256:digest(bytes),bytes:bytes.length,retained};
  }
  const profiles=[];
  for(const language of ['en','es']){
    const sessionId=`ts006-${language}-${randomUUID()}`;
    const p=await prepareDisposableRuntimeProfile({language,sessionId});
    profiles.push({language,sessionId,path:p.path});
  }
  const selected=await applyDisposableProfileSelection({enSessionId:profiles[0].sessionId,esSessionId:profiles[1].sessionId,
    expectedSelectionSha256:digest(previousSelection)});
  // Retain the old exact configuration, then update only this destination pointer.
  assert.equal(digest(await ordinary(configPath)),digest(previousConfig),'Capture configuration changed concurrently');
  const next={...config,profileSelectionSha256:selected.selection.sha256};
  const temporary=configPath+'.'+rotationId+'.tmp';
  await writeFile(temporary,pretty(next),{flag:'wx',mode:0o400});await rename(temporary,configPath);
  const updated=await writeCurrentAccountProfileReadiness();
  assert.equal(updated.report.executionGate.runtimeSessionsExecuted,0);
  const plans=[];
  for(const language of ['en','es']){
    const plan=await buildPendingProjectorLaunchPlan({language});
    assert.equal(plan.preflight.executionGate.pendingCandidateRuntimeLaunchReady,true);
    assert.equal(plan.preflight.executionGate.promotableRuntimeLaunchReady,false);
    const output=path.join(archive,`launch-plan-${language}.json`);
    await writeFile(output,pretty(plan),{flag:'wx',mode:0o400});
    plans.push({language,sessionId:plan.sessionId,launchPlan:output,captureOutput:plan.captureOutputDirectory});
  }
  const receipt={schemaVersion:1,status:'fresh-session-pair-selected-and-preflighted',createdAt:new Date().toISOString(),rotationId,
    operator:'Dr. Peter Hu',profiles,plans,selectionTransaction:selected,before,
    previousProfilesAndCapturesPreserved:true,oldProfilesReused:false,newMacosAccountsCreated:0,
    flashLaunched:false,screenCaptureStarted:false,originalRuntimeAccepted:false,audioAccepted:false,
    humanAccepted:false,ownerAccepted:false,productCalibrationPassed:false};
  const output=path.join(archive,'rotation-receipt.json');await writeFile(output,pretty(receipt),{flag:'wx',mode:0o400});
  return {path:output,...receipt};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert.deepEqual(process.argv.slice(2),['--new-pair'],
    'Usage: node scripts/reset-g4-l3-ts006-runtime-space.mjs --new-pair');
  console.log(pretty(await resetTs006RuntimeSpace()));
}
