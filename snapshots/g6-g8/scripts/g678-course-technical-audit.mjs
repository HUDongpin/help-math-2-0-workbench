#!/usr/bin/env node
/** Local ALG L6 technical inventory, stable collection and independent assessment. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {assertCustody} from '../lib/g678-custody-lease-v1.mjs';
import {pinFile,readPin,readJsonPin} from '../lib/g678-admission-proof.mjs';
import {runStableBrowser} from './lib/g678-stable-browser-candidate-v4.mjs';
import {LESSON,CLI,relativePath,writeNew,lessonInventory,prepareSelectedTechnicalRun,verifySelectedTechnicalCandidate,assessTechnicalRun,resumeTechnicalPlan} from './lib/g678-selected-technical-inputs-v1.mjs';

function options(argv) {
 const out={};for(let i=0;i<argv.length;i+=2){assert(/^--[a-z-]+$/.test(argv[i])&&argv[i+1]&&!argv[i+1].startsWith('--'),'named options require values');assert(!Object.hasOwn(out,argv[i]),'duplicate option');out[argv[i]]=argv[i+1];}return out;
}
function updateRun(root,directory,before,attempt) {
 assertCustody({root,page:attempt.animationId});const file=relativePath(root,directory)+'/run.json';
 readPin(root,before);const run=readJsonPin(root,before);run.attempts.push(attempt);
 const temporary=file+'.'+randomUUID()+'.tmp';fs.writeFileSync(path.join(root,temporary),JSON.stringify(run,null,2)+'\n',{flag:'wx'});
 fs.renameSync(path.join(root,temporary),path.join(root,file));
}
async function collectOne({root,candidatePath,animationId,outputDirectory,runId}) {
 assertCustody({root,page:animationId});const candidate=readJsonPin(root,pinFile(root,relativePath(root,candidatePath)));
 verifySelectedTechnicalCandidate(root,candidate);assert(candidate.animationIds.includes(animationId),'collector page within frozen selection');
 const contracts=readJsonPin(root,candidate.contracts).contracts,contract=contracts.find(c=>c.animationId===animationId);assert(contract,'exact bound contract');
 const collectionConfig=readJsonPin(root,candidate.collectionConfig);
 const module=await import(pathToFileURL(path.join(root,candidate.collector.path)).href);assert.equal(typeof module.collectPage,'function','inspected collector exports collectPage');
 const directory=relativePath(root,outputDirectory);assert(!fs.existsSync(path.join(root,directory)),'new complete attempt directory');fs.mkdirSync(path.join(root,directory),{recursive:true});
 const value=await module.collectPage({root,animationId,contract,contractPin:candidate.contracts,inputPins:contract.inputPins,outputDirectory:path.join(root,directory),runId,collectionConfig});
 const raw=typeof value==='string'?readJsonPin(root,pinFile(root,relativePath(root,value))):value;
 assert(raw?.kind==='g678-full-technical-raw-v1'&&raw.animationId===animationId,'collector returned exact raw page');
 if(typeof value==='string')assert(path.resolve(root,value).startsWith(path.join(root,directory)+'/'),'collector raw belongs to this attempt');
 assertCustody({root,page:animationId});verifySelectedTechnicalCandidate(root,candidate);
 // A collector may save its own raw file. The canonical attempt copy is always new.
 return writeNew(root,directory+'/raw.collected.json',raw);
}
export async function runCli(argv,{root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),stdout=process.stdout}={}) {
 const [action,...rest]=argv,flags=options(rest),emit=value=>stdout.write(JSON.stringify(value,null,2)+'\n');
 if(action==='inventory') {
  assert(Object.keys(flags).every(k=>['--lesson','--out'].includes(k)),'inventory options');const inventory=lessonInventory(root,flags['--lesson']??LESSON);
  if(flags['--out'])writeNew(root,flags['--out'],inventory);emit(inventory);return 0;
 }
 if(action==='assess') {
  assert(Object.keys(flags).every(k=>['--run'].includes(k))&&flags['--run'],'assess requires --run');const result=await assessTechnicalRun({root,runDirectory:flags['--run']});emit(result);return result.exitCode;
 }
 if(action==='_collect') {
  assert(Object.keys(flags).every(k=>['--candidate','--page','--out','--run-id'].includes(k)),'internal collection options');
  emit(await collectOne({root,candidatePath:flags['--candidate'],animationId:flags['--page'],outputDirectory:flags['--out'],runId:flags['--run-id']}));return 0;
 }
 assert.equal(action,'record','Use inventory, record [--resume RUN], or assess');
 assert(Object.keys(flags).every(k=>['--lesson','--contracts','--collector','--config','--out','--pages','--resume'].includes(k)),'record options');
 let directory;
 if(flags['--resume']) {
  assert(Object.keys(flags).length===1,'resume uses the exact frozen config/contracts/collector');directory=relativePath(root,flags['--resume']);
 } else {
  assert(flags['--contracts']&&flags['--collector']&&flags['--config']&&flags['--out'],'record requires contracts, collector, config and new output');
  const ids=flags['--pages']?.split(',');const inventory=lessonInventory(root,flags['--lesson']??LESSON);
  for(const id of ids??inventory.animationIds)assertCustody({root,page:id});
  const prepared=await prepareSelectedTechnicalRun({root,lesson:flags['--lesson']??LESSON,animationIds:ids,contractsPath:flags['--contracts'],collectorPath:flags['--collector'],configPath:flags['--config'],outputDirectory:flags['--out']});
  directory=prepared.outputDirectory;if(!prepared.candidate){emit(prepared);return 1;}
 }
 const resume=await resumeTechnicalPlan({root,runDirectory:directory});
 for(const id of resume.candidate.animationIds)assertCustody({root,page:id});
 for(const animationId of resume.remaining) {
  const id=randomUUID(),attemptDirectory=directory+'/attempts/'+animationId+'/'+id;
  const before=pinFile(root,directory+'/run.json');let stableReceipt=null,raw=null,error=null;
  const receipt='output/g678-technical-stability/'+id+'.json';
  try {
   assertCustody({root,page:animationId});
   await runStableBrowser({root,candidatePin:resume.run.candidate,receipt,command:process.execPath,
    args:[path.join(root,CLI),'_collect','--candidate',resume.run.candidate.path,'--page',animationId,'--out',attemptDirectory,'--run-id',id]});
   stableReceipt=pinFile(root,receipt);raw=pinFile(root,attemptDirectory+'/raw.collected.json');
  } catch(cause) {
   error=String(cause);if(fs.existsSync(path.join(root,receipt)))stableReceipt=pinFile(root,receipt);
   if(fs.existsSync(path.join(root,attemptDirectory+'/raw.collected.json')))raw=pinFile(root,attemptDirectory+'/raw.collected.json');
  }
  updateRun(root,directory,before,{animationId,runId:id,directory:attemptDirectory,stableReceipt,raw,error,finishedAt:new Date().toISOString()});
 }
 const assessment=await assessTechnicalRun({root,runDirectory:directory});emit({run:directory,reusedCompletePages:resume.reused,assessment});return assessment.exitCode;
}
if(import.meta.url.startsWith('file:')&&process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try {process.exitCode=await runCli(process.argv.slice(2));}catch(error){console.error(String(error));process.exitCode=1;}
}
