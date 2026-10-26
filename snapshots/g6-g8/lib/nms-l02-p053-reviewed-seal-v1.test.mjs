import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile} from './g678-admission-proof.mjs';
import * as S from './nms-l02-p053-proof-semantics-v1.mjs';
import * as R from './nms-l02-p053-reviewed-seal-v1.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('reviewed DOM seal reads exact physical run/member and all 41 inputs',()=>{
 const {run,member,artifacts}=R.readP053ReviewedDom(ROOT);
 assert.equal(run.inputs.length,41);
 assert.equal(run.externalEvidence.length,135);
 assert.equal(member.sourceRun.sha256,R.P053_DOM_RUN.sha256);
 assert.deepEqual(artifacts.module,R.P053_DOM_MODULE);
 for(const item of [R.P053_DOM_RUN,R.P053_DOM_MEMBER,R.P053_DOM_MODULE,
  R.P053_DOM_TIMELINE])assert.deepEqual(pinFile(ROOT,item.path),item);
 const broken=structuredClone(run);
 broken.audio.localeAutoPlayback=true;
 assert.throws(()=>S.validateP053DomManifests(broken,member,artifacts),
  /independent full-buffer audio/u);
});

test('reviewed local evidence retains separate failed port step and successful resume',()=>{
 assert.equal(R.validateP053ReviewedEvidence(ROOT),true);
 const paths=R.P053_PAGE_SUPPORT_PATHS;
 assert.equal(paths.length,new Set(paths).size);
 assert(paths.includes('output/nms-l02-p053-product-20260928/production/product-v2-real-root-resume-receipt.json'));
 assert(paths.includes('output/nms-l02-p053-product-20260928/admission/source-risk-disposition-v1.json'));
 for(const item of [...R.P053_REVIEWED_EVIDENCE_PINS,...R.P053_REVIEWED_PROBE_PINS])
  assert.deepEqual(pinFile(ROOT,item.path),item);
 assert.throws(()=>R.validateP053ReviewedProofClosure(ROOT,{}),
  /page proof file inventory/u);
});
