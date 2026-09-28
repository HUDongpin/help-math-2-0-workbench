import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const TS006_CAPTURE_ROOT='/Volumes/American Dream/hudongpin/helpmath-execution-20260906-01a0747f/flash-runtime-space-v1/captures';
const INTAKE='work/g4-l3-ts006-original-runtime-authorization-intake';
export const TS006_CAPTURE_DESTINATION_FILE=`${INTAKE}/capture-destination-selection.json`;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

async function bound(file){
  const info=await lstat(file);
  assert(info.isFile()&&!info.isSymbolicLink()&&info.nlink===1,'Destination input must be an ordinary single-link file');
  assert.equal(await realpath(file),file,'Destination input path must not contain symlinks');
  const bytes=await readFile(file);
  return {binding:{path:file,bytes:bytes.length,sha256:digest(bytes)},value:JSON.parse(bytes)};
}

// Defaults retain the historical destination when no selection is present.
// An external destination must bind the current two sessions and exact approved
// directory; this does not change the capture threshold or any review gate.
export async function readTs006CaptureDestination({projectRoot=ROOT,approvedCaptureRoot=TS006_CAPTURE_ROOT}={}){
  const configPath=path.join(projectRoot,TS006_CAPTURE_DESTINATION_FILE);
  let exists;
  try{exists=await lstat(configPath);}catch(error){if(error.code==='ENOENT')return null;throw error;}
  assert(exists);
  const config=await bound(configPath);
  const selection=await bound(path.join(projectRoot,INTAKE,'current-session-profile-selection.json'));
  const value=config.value;
  assert.deepEqual(Object.keys(value).sort(),['schemaVersion','evidenceType','operator','captureRoot','profileSelectionSha256'].sort());
  assert.equal(value.schemaVersion,1);
  assert.equal(value.evidenceType,'g4-l3-ts006-capture-destination-selection');
  assert.equal(value.operator,'Dr. Peter Hu');
  assert.equal(value.profileSelectionSha256,selection.binding.sha256,'Capture destination has stale session bindings');
  assert.equal(value.captureRoot,approvedCaptureRoot,'Capture destination is outside the approved directory');
  assert.equal(await realpath(value.captureRoot),value.captureRoot,'Capture directory must not contain symlinks');
  const rootInfo=await lstat(value.captureRoot);
  assert(rootInfo.isDirectory()&&!rootInfo.isSymbolicLink());
  assert.equal(rootInfo.mode&0o777,0o700,'Capture directory must be private 0700');
  assert.deepEqual(selection.value.profiles.map(p=>p.language),['en','es']);
  const outputs=[];
  for(const profile of selection.value.profiles){
    assert(new RegExp(`^ts006-${profile.language}-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`).test(profile.sessionId));
    const output=path.join(value.captureRoot,profile.sessionId);
    let information;
    try{information=await lstat(output);}catch(error){if(error.code!=='ENOENT')throw error;}
    assert(!information,'Refusing an existing capture output');
    outputs.push({language:profile.language,sessionId:profile.sessionId,path:output});
  }
  return {configuration:config.binding,profileSelection:selection.binding,captureRoot:value.captureRoot,sessionOutputDirectories:outputs};
}
