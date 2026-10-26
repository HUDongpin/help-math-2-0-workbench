import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const receiptFile=new URL('../../../migrations/shared-nms002-l02-p054/audit/ruffle-standalone-forensic-v1.json',import.meta.url);
const receipt=JSON.parse(readFileSync(receiptFile,'utf8')) as {
 source:{path:string;sha256:string;modifiedForObservation:boolean};
 harness:{browserSessionClosed:boolean;localServerStopped:boolean};
 ruffle:{version:string;metadata:{width:number;height:number;numFrames:number;frameRate:number}};
 requestAudit:{successfulRequests:string[];externalRequestsObserved:number;
  consoleErrors:number;consoleWarnings:number};
 sourceEntryEvidence:{rootFrame1ActionScript:string;rootFrame1ActionSha256:string;
  rootPlacedSpriteIds:number[];bothSpritePlacementFrame:number};
 observations:{stageBeforeClick:{file:string;sha256:string;width:number;height:number};
  stageAfterCenterClick:{file:string;sha256:string;width:number;height:number};
  centerClickChangedCaptureBytes:boolean};
 authority:string;disposition:string;
 originalRuntimeAccepted:boolean;currentJsRegistered:boolean;
 visualFidelityAccepted:boolean;audioAccepted:boolean;humanAccepted:boolean;
 ownerAccepted:boolean;strictComplete:boolean;published:boolean;
};
const sha=(bytes: Buffer)=>createHash('sha256').update(bytes).digest('hex');
const localFile=(relative:string)=>new URL(`../../../${relative}`,import.meta.url);

test('standalone Ruffle observation remains local and is not original-runtime acceptance',()=>{
 assert.equal(sha(readFileSync(receipt.source.path)),receipt.source.sha256);
 assert.equal(receipt.source.modifiedForObservation,false);
 assert.equal(receipt.ruffle.version,'0.4.1');
 assert.deepEqual(receipt.ruffle.metadata,{width:800,height:600,frameRate:12,
  numFrames:10,swfVersion:6,backgroundColor:'#B8D8F7',
  isActionScript3:false,uncompressedLength:2987765});
 assert.equal(receipt.requestAudit.externalRequestsObserved,0);
 assert.equal(receipt.requestAudit.consoleErrors,0);
 assert.equal(receipt.requestAudit.consoleWarnings,0);
 assert.equal(receipt.requestAudit.successfulRequests.length,7);
 assert.ok(receipt.requestAudit.successfulRequests.every(url=>
  url.startsWith('http://127.0.0.1:54063/')));
 assert.equal(receipt.harness.browserSessionClosed,true);
 assert.equal(receipt.harness.localServerStopped,true);
 assert.equal(receipt.authority,'forensic-ruffle-only');
 assert.equal(receipt.disposition,'standalone-forensic-entry-did-not-exercise-game');
 for(const key of ['originalRuntimeAccepted','currentJsRegistered','visualFidelityAccepted',
  'audioAccepted','humanAccepted','ownerAccepted','strictComplete','published'] as const)
  assert.equal(receipt[key],false,key);
});

test('blank 800x600 captures and source entry action are hash-bound',()=>{
 assert.equal(sha(readFileSync(receipt.sourceEntryEvidence.rootFrame1ActionScript)),
  receipt.sourceEntryEvidence.rootFrame1ActionSha256);
 assert.deepEqual(receipt.sourceEntryEvidence.rootPlacedSpriteIds,[103,731]);
 assert.equal(receipt.sourceEntryEvidence.bothSpritePlacementFrame,6);
 for(const capture of [receipt.observations.stageBeforeClick,
  receipt.observations.stageAfterCenterClick]){
  const bytes=readFileSync(localFile(capture.file));
  assert.equal(sha(bytes),capture.sha256);
  assert.equal(bytes.readUInt32BE(16),capture.width);
  assert.equal(bytes.readUInt32BE(20),capture.height);
  assert.deepEqual([capture.width,capture.height],[800,600]);
 }
 assert.equal(receipt.observations.stageBeforeClick.sha256,
  receipt.observations.stageAfterCenterClick.sha256);
 assert.equal(receipt.observations.centerClickChangedCaptureBytes,false);
});
