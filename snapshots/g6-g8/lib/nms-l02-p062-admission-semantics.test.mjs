import assert from 'node:assert/strict';
import test from 'node:test';
import {buildP062AdmissionPlan} from '../scripts/prepare-nms-l02-p062-admission.mjs';
import * as S from './nms-l02-p062-admission-semantics.mjs';

const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const withSource=fn=>{
 const previous=process.env.HELP_MATH_G678_SOURCE_ROOT;
 try{process.env.HELP_MATH_G678_SOURCE_ROOT=sourceRoot;return fn();}
 finally{if(previous===undefined)delete process.env.HELP_MATH_G678_SOURCE_ROOT;
  else process.env.HELP_MATH_G678_SOURCE_ROOT=previous;}
};

test('P062 immutable DOM seal and proof closure reject sparse and aliased evidence',()=>withSource(()=>{
 const plan=buildP062AdmissionPlan(),proof=plan.proof;
 assert.equal(S.P062_RUN_INPUTS.length,181);
 assert.equal(S.P062_RUN_OUTPUTS.length,20);
 assert.equal(S.P062_SHARED_DEPENDENCIES.length,4);
 assert.equal(S.P062_PAGE_INPUT_PATHS.length,190);
 assert.equal(S.P062_EXTERNAL_EXPECTED.length,8);
 assert.equal(S.validateP062ProofClosure(proof),true);
 assert.equal(proof.packet.sourceKeyAttributeCalls,0);
 assert.equal(proof.packet.glossary.generatedTerms,null);
 assert.equal(proof.packet.editorialCorrections.originalRuntimeVisualTextCorrectionAccepted,false);
 assert(Object.values(proof.packet.acceptanceEffects).every(value=>value===false));
 const sparse=structuredClone(proof);
 sparse.packet.integrity.files=sparse.packet.integrity.files.filter(pin=>pin.path!==S.P062_MAIN_AUDIO.path);
 assert.throws(()=>S.validateP062ProofClosure(sparse),/exact page-owned membership/u);
 const missingHost=structuredClone(proof);
 missingHost.external=missingHost.external.filter(item=>item.pin.sha256!==
  '380cd6581859d0ba9814833f1102b08282198713cf30b5230ce2da76c3e27a74');
 assert.throws(()=>S.validateP062ProofClosure(missingHost),/exact physical source\/host pins/u);
 const alias=structuredClone(proof);
 alias.packet.integrity.files.find(pin=>pin.path===S.P062_MAIN_AUDIO.path).sha256='f'.repeat(64);
 assert.throws(()=>S.validateP062ProofClosure(alias),/immutable DOM run\/input\/output/u);
 const invented=structuredClone(proof);
 invented.packet.sourceKeyAttributeCalls=1;
 assert.throws(()=>S.validateP062ProofClosure(invented),/no glossary KeyAttribute/u);
 const editorial=structuredClone(proof);
 editorial.packet.editorialCorrections.issues=['tax-base'];
 assert.throws(()=>S.validateP062ProofClosure(editorial),/qualified modern math corrections/u);
}));
