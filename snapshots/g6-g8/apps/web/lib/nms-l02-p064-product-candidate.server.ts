import 'server-only';
import {getWorkspaceRoot} from './catalog';
import {readJsonPin, readPin} from '../../../lib/g678-admission-proof.mjs';
import {nmsL02P062AdmissionDescriptor} from './nms-l02-p062-admission.server';
import {nmsL02P064CandidateDescriptorV1} from './nms-l02-p064-candidate-descriptor-v1';

const ID='shared-nms002-l02-p064';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE={path:'G6-G8-shared/NMS002/L2/FQ/L2FQ02.swf',bytes:55392,
 sha256:'f655f05d7be5576503a66f52909b322bd3fce3e7b51a7fcda52291f755bf346c'};
const XML={path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
 sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'};
const CONTRACT={path:'migrations/shared-nms002-l02-p064/audit/source-quiz-contract-v1.json',bytes:2285,
 sha256:'943270c7fdeefd4226e5f13a9d2679cf277c9415efbe8b5e979798cd12a537e5'};
const QUESTIONS={path:'migrations/shared-nms002-l02-p064/audit/question-content-ir-v1.json',bytes:408932,
 sha256:'ecc84d6053005e5d34f9f1dd615144a6a1c5638bf650bf572ff071f42169c350'};
const DISPLAY={path:'migrations/shared-nms002-l02-p064/audit/active-display-list-v1.json',bytes:663633,
 sha256:'34f152e4a002b38931c57f9be29c1759a48da232a400c4544a4f34d1be51deb8'};
const AUDIO={path:'migrations/shared-nms002-l02-p064/audit/audio-source-candidates-v1.json',bytes:109156,
 sha256:'60937f89ba02f67723dc534d5e6316517e82325053d3bacafe903c28b1510e58'};
const PRESENTATION={path:'packages/demos/src/nms-l02-p064-presentation-data-v1.ts',bytes:247635,
 sha256:'518c44531318be4295f26afce53336e27c07f4799459b8d317f41a209dd8cc0e'};
function requireValue(ok:unknown,message:string):asserts ok {
 if(!ok)throw Error(`P064_PRODUCT_CANDIDATE: ${message}`);
}

/** Source-locked local projection, not an admission proof or registry writer.
 * Resource routes independently verify each requested source MP3. */
export function nmsL02P064ProductCandidateDescriptor(seed=0){
 requireValue(process.env.NODE_ENV!=='production'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT,'local source environment');
 requireValue(Number.isSafeInteger(seed)&&seed>=0&&seed<=0xffffffff,'uint32 seed');
 const root=getWorkspaceRoot();
 readPin(SOURCE_ROOT,SOURCE);readPin(SOURCE_ROOT,XML);
 const contract=readJsonPin(root,CONTRACT),questions=readJsonPin(root,QUESTIONS),
  display=readJsonPin(root,DISPLAY),audio=readJsonPin(root,AUDIO);
 readPin(root,PRESENTATION);
 for(const item of [contract,questions,display,audio])requireValue(
  item.schemaVersion===1&&item.animationId===ID&&
  item.source.relativePath===SOURCE.path&&item.source.sha256===SOURCE.sha256,'exact source binding');
 requireValue(contract.source.bytes===SOURCE.bytes&&contract.scripts.mainSpriteId===1258&&
  contract.quiz.bankSize===35&&contract.quiz.drawCount===10&&contract.quiz.optionCount===4,
  'source quiz contract');
 requireValue(questions.sourceQuizContractSha256===CONTRACT.sha256&&
  questions.mainSprite.symbolId===1258&&questions.mainSprite.frames===90&&questions.questions.length===35,
  'source questions and frame domain');
 requireValue(display.questionContentIrSha256===QUESTIONS.sha256&&
  display.mainSprite.symbolId===1258&&display.mainSprite.frames===90,'active display linkage');
 requireValue(audio.questionContentIrSha256===QUESTIONS.sha256&&audio.sourceMediaRows.length===350&&
  audio.authority==='source-media-candidate-index-only','unaccepted audio source index');
 const predecessor=nmsL02P062AdmissionDescriptor();
 requireValue(predecessor.registered===true,'registered P062 predecessor');
 return nmsL02P064CandidateDescriptorV1(predecessor.descriptor,seed);
}
