/** P064 source-quiz state-3 contract. No import-time filesystem reads: the
 * producer and common proof reader recheck these literal pins against bytes. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const P064_ADMISSION_ID='shared-nms002-l02-p064';
export const P064_ADMISSION_CALIBRATION='g678-nms-l02-p064-source-quiz-current-js-v1';
export const P064_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P064_SOURCE=Object.freeze({path:'G6-G8-shared/NMS002/L2/FQ/L2FQ02.swf',bytes:55392,
 sha256:'f655f05d7be5576503a66f52909b322bd3fce3e7b51a7fcda52291f755bf346c'});
export const P064_XML=Object.freeze({path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
 sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'});
export const P064_RUN_PATH=`work/g678-shared-page-factory/${P064_ADMISSION_CALIBRATION}/run-manifest.json`;
export const P064_MEMBER_PATH=`work/g678-shared-page-factory/${P064_ADMISSION_CALIBRATION}/members/${P064_ADMISSION_ID}/member-manifest.json`;
export const P064_CANONICAL_MODULE_PATH=`packages/demos/src/modules/${P064_ADMISSION_ID}.tsx`;
export const P064_CANONICAL_TIMELINE_PATH=`packages/demos/src/timelines/${P064_ADMISSION_ID}.ts`;
export const P064_FREEZE_PATH=`catalog/product-bridge-calibrations/${P064_ADMISSION_CALIBRATION}.json`;
export const P064_FRAGMENT_PATH=P064_FREEZE_PATH.replace(/\.json$/u,'.fragment.json');
export const P064_PROOF_PATH=`work/g678-workflow/candidates/${P064_ADMISSION_ID}-v1.json`;
export const P064_ACCEPTANCE_KEYS=Object.freeze(['authoritativeOriginalRuntime','fidelityAccepted',
 'audioAccepted','humanVisualAccepted','ownerAccepted','strictComplete','published']);
export const P064_ACCEPTANCE_EFFECTS=Object.freeze(Object.fromEntries(P064_ACCEPTANCE_KEYS.map(key=>[key,false])));
export const P064_QUIZ_CONTRACT=Object.freeze({path:'migrations/shared-nms002-l02-p064/audit/source-quiz-contract-v1.json',bytes:2285,
 sha256:'943270c7fdeefd4226e5f13a9d2679cf277c9415efbe8b5e979798cd12a537e5'});
export const P064_QUESTION_IR=Object.freeze({path:'migrations/shared-nms002-l02-p064/audit/question-content-ir-v1.json',bytes:408932,
 sha256:'ecc84d6053005e5d34f9f1dd615144a6a1c5638bf650bf572ff071f42169c350'});
export const P064_DISPLAY_LIST=Object.freeze({path:'migrations/shared-nms002-l02-p064/audit/active-display-list-v1.json',bytes:663633,
 sha256:'34f152e4a002b38931c57f9be29c1759a48da232a400c4544a4f34d1be51deb8'});
export const P064_AUDIO_INDEX=Object.freeze({path:'migrations/shared-nms002-l02-p064/audit/audio-source-candidates-v1.json',bytes:109156,
 sha256:'60937f89ba02f67723dc534d5e6316517e82325053d3bacafe903c28b1510e58'});
export const P064_PRESENTATION=Object.freeze({path:'packages/demos/src/nms-l02-p064-presentation-data-v1.ts',bytes:247635,
 sha256:'518c44531318be4295f26afce53336e27c07f4799459b8d317f41a209dd8cc0e'});
export const P064_SOURCE_RISK_MODULE=Object.freeze({path:'packages/demos/src/nms-l02-p064-source-risk-candidate.ts',bytes:1657,
 sha256:'440bc7150528f0c9e3783167e3f4008dcf6d135ac893ed1762a08517fb6a4cc0'});
export const P064_QUIZ_STATE=Object.freeze({path:'packages/demos/src/nms-l02-p064-quiz-state-candidate.ts',bytes:3794,
 sha256:'b3d1d13f00656d064a6e8f65335402cc815f8d38892e425d0679da730e7d3700'});
export const P064_QUIZ_COMPONENT=Object.freeze({path:'packages/demos/src/nms-l02-p064-quiz-candidate.tsx',bytes:17135,
 sha256:'ce78fe64a9614c69b0c8bc11c81d0ad933a0ff887030d260b059ed38563b6a67'});
export const P064_HOST_SCORE=Object.freeze({path:'packages/demos/src/nms-l02-p064-host-score-candidate.ts',bytes:1961,
 sha256:'4b0e5e308482004437d79d6546601c1190ac252ba9d85ee27bbef007ef1d929d'});
export const P064_PRODUCT_MODULE=Object.freeze({path:'packages/demos/src/nms-l02-p064-product-module-v1.tsx',bytes:4934,
 sha256:'0a7fc367b68ce9296c1fa5fbdada3ecfdcc48423cd216644e6aaff68a1dd299d'});
export const P064_RUNTIME_ADAPTER=Object.freeze({path:'apps/web/components/nms-l02-p064-lesson-runtime-v1.tsx',bytes:6153,
 sha256:'93b4aa1e05ab0d5c8b99adc26ab130cf995efaa6cb39c8e5bc805edee87fb5dc'});
export const P064_BROWSER_MAIN=Object.freeze({path:'output/nms-l02-p064-product-20260928/browser/candidate-v4/evidence.json',bytes:696224,
 sha256:'18bc6f32edcf73dd6e1513554d6c426f5cd9465453409735bddb6667f14ed173'});
export const P064_BROWSER_REVIEW_BRANCHES=Object.freeze({path:'output/nms-l02-p064-product-20260928/browser-review-branches/candidate-v1/evidence.json',bytes:69317,
 sha256:'1f48445825c52e35ddd31bccfb0f21eb4bf529c4de6e1eb8dbe4fa55b55bf37e'});
export const P064_DISPOSITION=Object.freeze({path:'output/nms-l02-p064-product-20260928/admission/source-risk-disposition-v1.json',bytes:5357,
 sha256:'63cd525e03459441dee7278fc29096cd053ebc879b61e90a9bd1500b83b7b4f1'});
export const P064_ANSWER_MAP_SHA256='c6cbb2c34f5cad0f6314340a701cb5868c44a72c135aecce1fa4f1848acca100';
export const P064_SCRIPT_AUDIT=Object.freeze({mainSpriteId:1258,
 mainFrameOneSha256:'480d21cd236fb63365d4db7b5dc14777c0ec854191c91e052f40d7ee7427ff04',
 resultSpriteId:17,resultFrameTwoSha256:'6bc233ce1b89ed3819951a8836b0dd0d7ea8cb2e5d15e8646c3f6b95ac9dbc66',
 englishAudioButtonSha256:'8bbeee06a2f6f663596208db1822c70c1b96e8c3034be27327169ac1f2e2a45e',
 spanishAudioButtonSha256:'a2e4af1cd1fa0b238c8cc73348d24070857ef9e3db12862551437bef99cf397d',
 reviewButtonSha256:'d51b52523ac0e44edbc12fd740c8156c95f1359a0873b10ac8d22fe729d41829',
 totalExported:159,correctOptionHandlers:35,wrongOptionHandlers:105});
export const P064_RUNTIME=Object.freeze({stage:{width:800,height:600},rootFrameCount:10,
 rootBeginFrame:6,frameDomain:'sprite-1258',frameCount:90,fps:12,language:'fixed-en',
 scenario:'source-quiz-seeded',seed:'0',rendererBinding:'maintained-dom-quiz-state-v1',
 questionBankSize:35,drawCount:10,optionCount:4,
 selection:'random-index-without-replacement',sourceTimelineSeekAvailable:false,
 hostPlaybackCompletion:false,postReviewHostExitResolved:false,
 deterministicCandidateRngOriginalParityEstablished:false,originalRuntimeParityEstablished:false});
/** Exact host-owned dependencies in the P064 DOM producer's separate list. */
export const P064_SHARED_DEPENDENCIES=Object.freeze([
 {path:'apps/web/components/animation-runtime.tsx',bytes:57458,sha256:'c21101c76c36cc8d062f832b2392491434c8e5c1ca0dc77edd24e233e0b74829'},
 {path:'apps/web/lib/lesson-runtime-adapter.ts',bytes:759,sha256:'19447d12fb0e1deea862b1e27217d4c476a358f89175544de081f5bd10731239'},
 {path:'apps/web/tsconfig.json',bytes:3202,sha256:'738d6e2ec305b75ab64d144ab333a0539ca026a30e575ccbd0185365f041cf50'},
 {path:'lib/g678-admission-proof.mjs',bytes:8258,sha256:'d8a54b9e982dd31689b03ed502b9e81c574996c2167893336235b41cd83cf6db'},
 {path:'packages/demos/src/contract.ts',bytes:17646,sha256:'56e5fc3c1dbde872646ebbc519f8c7d8a9d6dd0d55e37e1c44f4ad1a47798180'},
 {path:'packages/demos/src/lesson-host-contract.ts',bytes:17528,sha256:'183fc9ec36c99797147ba1fb8a5132cde60254b40279ca5fc76302806098200b'},
 {path:'scripts/private-current-js-registry.mjs',bytes:7326,sha256:'6b61308caca87a41c707b83072b010ec51631cd5b65726e948137f523ef83201'},
]);
export const P064_INHERITED_HOST_OVERLAPS=Object.freeze([]);
export const P064_REVIEWED_CORE_INPUTS=Object.freeze([P064_QUIZ_CONTRACT,P064_QUESTION_IR,
 P064_DISPLAY_LIST,P064_AUDIO_INDEX,P064_PRESENTATION,P064_SOURCE_RISK_MODULE,
 P064_QUIZ_STATE,P064_QUIZ_COMPONENT,P064_HOST_SCORE,P064_PRODUCT_MODULE,
 P064_RUNTIME_ADAPTER,P064_BROWSER_MAIN,P064_BROWSER_REVIEW_BRANCHES,P064_DISPOSITION]);
export const P064_REQUIRED_PAGE_PATHS=Object.freeze([P064_RUN_PATH,P064_MEMBER_PATH,
 P064_CANONICAL_MODULE_PATH,P064_CANONICAL_TIMELINE_PATH,...P064_REVIEWED_CORE_INPUTS.map(pin=>pin.path),
 'lib/nms-l02-p064-admission-semantics-v1.mjs',
 'lib/nms-l02-p064-admission-semantics-v1.test.mjs',
 'scripts/prepare-nms-l02-p064-admission.mjs',
 'scripts/prepare-nms-l02-p064-admission.test.mjs']);

const same=(a,b,label)=>assert.deepStrictEqual(a,b,`NMS_L02_P064_ADMISSION: ${label}`);
const demand=(ok,label)=>assert(ok,`NMS_L02_P064_ADMISSION: ${label}`);
const sorted=values=>[...values].sort((a,b)=>a.localeCompare(b));
const pin=(value,path)=>demand(value&&typeof value==='object'&&!Array.isArray(value)&&
 Object.keys(value).sort().join(',')==='bytes,path,sha256'&&value.path===path&&
 Number.isSafeInteger(value.bytes)&&value.bytes>=0&&value.bytes<=64*1024*1024&&
 /^[a-f0-9]{64}$/u.test(value.sha256),`bounded pin ${path}`);
const sourceRef=artifact=>artifact?.source?.relativePath===P064_SOURCE.path&&
 artifact.source.sha256===P064_SOURCE.sha256;

/** Verify all 140 answer symbols against source IR, active display, script
 * answer handlers and the maintained presentation before freezing a packet. */
export function validateP064SourceInventory({contract,questionIr,displayList,presentation}){
 for(const [label,item] of [['contract',contract],['question IR',questionIr],
   ['display list',displayList]]){
  demand(item?.schemaVersion===1&&item.animationId===P064_ADMISSION_ID&&sourceRef(item),label);
 }
 same(contract.source,{relativePath:P064_SOURCE.path,bytes:P064_SOURCE.bytes,
  sha256:P064_SOURCE.sha256},'physical quiz source');
 same(contract.scripts,P064_SCRIPT_AUDIT,'159 exact source script digests/handler counts');
 same(contract.quiz.correctOptions.length,35,'35 source correct options');
 demand(contract.quiz.bankSize===35&&contract.quiz.drawCount===10&&contract.quiz.optionCount===4&&
  contract.quiz.selection==='random-index-without-replacement','source selection semantics');
 same(contract.quiz.gradeBands,[
  {minCorrect:0,maxCorrect:3,label:'Unsatisfactory'},
  {minCorrect:4,maxCorrect:6,label:'Partially Proficient'},
  {minCorrect:7,maxCorrect:8,label:'Proficient'},
  {minCorrect:9,maxCorrect:10,label:'Advanced'},
 ],'source grade bands');
 demand(questionIr.sourceQuizContractSha256===P064_QUIZ_CONTRACT.sha256&&
  questionIr.mainSprite.symbolId===1258&&questionIr.mainSprite.frames===90&&
  displayList.questionContentIrSha256===P064_QUESTION_IR.sha256&&
  displayList.mainSprite.symbolId===1258&&displayList.mainSprite.frames===90,
  'source quiz/active display chain');
 demand(presentation?.schemaVersion===1&&presentation.animationId===P064_ADMISSION_ID&&
  presentation.sourceSwfSha256===P064_SOURCE.sha256&&
  presentation.sourceQuestionIrSha256===P064_QUESTION_IR.sha256,
  'maintained presentation source chain');
 demand(questionIr.questions.length===35&&displayList.questions.length===35&&
  presentation.questions.length===35,'complete 35-question bank');
 const answerMap=[],instanceNames=new Set();
 for(let index=0;index<35;index++){
  const number=index+1,q=questionIr.questions[index],visible=displayList.questions[index],
   presented=presentation.questions[index];
  demand(q.questionId===number&&q.questionFrame===number+1&&q.reviewFrame===number+54&&
   visible.questionId===number&&visible.questionFrame===q.questionFrame&&
   visible.reviewFrame===q.reviewFrame&&presented.id===number&&
   presented.questionFrame===q.questionFrame&&presented.reviewFrame===q.reviewFrame,
   `Q${number} source/review frames`);
  demand(q.options.length===4&&presented.options.length===4&&
   q.correctOption===contract.quiz.correctOptions[index]&&
   presented.correctLetter==='ABCD'[q.correctOption-1],`Q${number} four answers`);
  const options=[];
  for(let optionIndex=0;optionIndex<4;optionIndex++){
   const source=q.options[optionIndex],shown=presented.options[optionIndex],
    instance=source.instance,letter='ABCD'[optionIndex];
   demand(source.option===optionIndex+1&&shown.letter===letter&&
    shown.sourceInstance===instance.name&&shown.sourceSpriteId===instance.symbolId&&
    shown.correct===(q.correctOption===optionIndex+1)&&
    visible.activePlacements.some(row=>row.name===instance.name&&
     row.symbolId===instance.symbolId),`Q${number} option ${letter} source placement`);
   demand(!instanceNames.has(instance.name),`unique answer instance ${instance.name}`);
   instanceNames.add(instance.name);
   options.push({option:optionIndex+1,instanceName:instance.name,symbolId:instance.symbolId});
  }
  answerMap.push({questionId:number,questionFrame:q.questionFrame,
   reviewFrame:q.reviewFrame,correctOption:q.correctOption,options});
 }
 same(instanceNames.size,140,'all 140 unique answer placements');
 same(createHash('sha256').update(JSON.stringify(answerMap)).digest('hex'),
  P064_ANSWER_MAP_SHA256,'full 35x4 source answer map');
 const q5Fields=questionIr.questions[4].frameDeltaPlacements.filter(row=>
  /^Txt(?:10|[1-9])$/u.test(row.name??''));
 same(q5Fields.map(row=>row.name),Array.from({length:10},(_,i)=>`Txt${i+1}`),
  'Q5 exact ten editable fields');
 demand(q5Fields.every(row=>row.kind==='DefineEditText'&&row.rawText==='0'),
  'Q5 source defaults are zero, runtime values unknown');
 same(questionIr.sourceDerivedReviewLookupMisses,[
  {questionId:10,option:4,clickedInstanceName:'A10Opt4 ',computedReviewName:'R10Opt4 '},
  {questionId:21,option:3,clickedInstanceName:'A21Opt3',computedReviewName:'R21Opt3'},
  {questionId:23,option:3,clickedInstanceName:'A231Opt3',computedReviewName:'R231Opt3'},
 ],'three source-derived review lookup misses');
 return true;
}

export function validateP064Disposition(disposition){
 demand(disposition?.schemaVersion===1&&
  disposition.kind==='nms-l02-p064-local-current-js-source-risk-disposition-v1'&&
  disposition.animationId===P064_ADMISSION_ID&&
  disposition.scope==='local-only-private-current-js-state-3'&&
  disposition.authority==='source-locked-maintained-modern-quiz-candidate',
  'state-3-only disposition');
 same(disposition.source,P064_SOURCE,'disposition source');
 same(disposition.sourceQuizContract,P064_QUIZ_CONTRACT,'disposition scripts');
 same(disposition.questionIr,P064_QUESTION_IR,'disposition question IR');
 same(disposition.displayList,P064_DISPLAY_LIST,'disposition display list');
 same(disposition.scriptDigests,P064_SCRIPT_AUDIT,'disposition exact source scripts');
 same(disposition.answerSemantics,{bankSize:35,optionsPerQuestion:4,optionPlacements:140,
  drawCount:10,selection:'random-index-without-replacement',
  answerMapSha256:P064_ANSWER_MAP_SHA256,
  deterministicCandidateRngOriginalParityEstablished:false},'disposition 35x4 answers/RNG');
 const cases=disposition.riskCases;
 demand(Array.isArray(cases)&&cases.length===4,'four explicit source-risk cases');
 same(cases[0],{id:'q5-dynamic-fields',questionId:5,
  sourceFields:Array.from({length:10},(_,i)=>`Txt${i+1}`),sourceDefaultForEach:'0',
  originalRuntimeValueAndVisibilityEstablished:false,
  currentJsTreatment:'modern-number-line-interpretation-with-visible-source-risk-notice',
  sourceEquivalenceClaimed:false},'Q5 modern interpretation');
 for(const [index,expected] of [
  [1,{id:'q10-option-d-review-lookup',questionId:10,option:4,
   clickedInstanceName:'A10Opt4 ',computedReviewName:'R10Opt4 ',
   computedFeedbackField:'TxtFeed4 ',feedbackFieldLookup:'missing-in-static-source'}],
  [2,{id:'q21-option-c-review-lookup',questionId:21,option:3,
   clickedInstanceName:'A21Opt3',computedReviewName:'R21Opt3',
   computedFeedbackField:'TxtFeed3',feedbackFieldLookup:'matched-in-static-source'}],
  [3,{id:'q23-option-c-review-lookup',questionId:23,option:3,
   clickedInstanceName:'A231Opt3',computedReviewName:'R231Opt3',
   computedFeedbackField:'TxtFeed3',feedbackFieldLookup:'matched-in-static-source'}],
 ])same(cases[index],{...expected,reviewInstanceLookup:'missing-in-static-source',
  currentJsTreatment:'modern-answer-summary-with-visible-source-risk-notice',
  originalRuntimeBehaviorEstablished:false},expected.id);
 same(disposition.postReview,{phase:'host-exit-unresolved',
  legacyReportOrNetworkRequestExecuted:false,hostPlaybackCompletionCallbackFired:false,
  currentJsPageReviewAutomaticallyGranted:false,originalHostExitEstablished:false},
  'unresolved host exit cannot complete page');
 same(disposition.evidence,{mainHostBrowser:P064_BROWSER_MAIN,
  reviewBranchesBrowser:P064_BROWSER_REVIEW_BRANCHES,
  reviewedBranchCases:['q5-question','q10-option-d','q21-option-c','q23-option-c']},
  'two exact local My Lesson browser receipts');
 demand(disposition.historicalHandoffDisposition?.preservedUnchanged===true&&
  disposition.historicalHandoffDisposition.originalHostNaturalTraceStillRequiredForOriginalRuntimeAndFidelityGates===true&&
  disposition.historicalHandoffDisposition.state3ConditionalEngineeringScopeReviewedSeparately===true,
  'historical hold preserved for later gates');
 same(disposition.acceptanceEffects,P064_ACCEPTANCE_EFFECTS,'all seven acceptance gates false');
 demand(disposition.productCalibrationPassed===false&&disposition.scaleOutAuthorized===false,
  'no factory calibration or scale-out');
  return true;
}

/** These are candidate host observations, not an original Flash trace. */
export function validateP064BrowserEvidence(main,branches){
 demand(main?.kind==='nms-l02-p064-my-lesson-candidate-browser-plan-v1'&&
  main.animationId===P064_ADMISSION_ID&&
  main.status==='candidate-my-lesson-browser-passed-not-acceptance'&&
  main.formal===false&&main.registeredPageCount===61&&
  main.renderableCount===62&&main.activePageCount===64&&
  main.inputsUnchanged===true&&main.browserProcessExited===true&&
  main.originalRuntimeParityEstablished===false&&
  main.audioListeningAccepted===false&&main.strictComplete===false,
  'local main candidate evidence, no acceptance');
 demand(Array.isArray(main.cases)&&main.cases.length===2,'EN/ES main host cases');
 for(const [index,expected] of [[0,{name:'en-desktop-q10-risk',questionId:10,
   answer:'D',correct:9}],[1,{name:'es-mobile-q5-risk',questionId:5,
   answer:'B',correct:10}]]){
  const item=main.cases[index];
  demand(item.name===expected.name&&item.status===main.status&&item.formal===false&&
   item.ready===true&&item.expectedFirstQuestion===expected.questionId&&
   item.firstAnswer===expected.answer&&item.questionSequence?.length===10&&
   item.reviewSequence?.length===10&&
   item.questionSequence[0].questionId===expected.questionId&&
   item.reviewSequence[0].questionId===expected.questionId&&
   item.observations.some(row=>row.phase==='finish'&&row.fq?.attempted===10&&
    row.fq.correct===expected.correct)&&
   item.observations.some(row=>row.phase==='host-exit-unresolved'),
   `${expected.name} ten-answer host path`);
 }
 demand(branches?.kind==='nms-l02-p064-review-branches-browser-plan-v1'&&
  branches.animationId===P064_ADMISSION_ID&&
  branches.status==='candidate-review-branches-passed-not-acceptance'&&
  branches.formal===false&&branches.registeredPageCount===61&&
  branches.renderableCount===62&&branches.activePageCount===64&&
  branches.inputsUnchanged===true&&branches.browserProcessExited===true&&
  branches.originalRuntimeParityEstablished===false&&
  branches.audioListeningAccepted===false&&branches.strictComplete===false,
  'local review branch candidate evidence, no acceptance');
 demand(Array.isArray(branches.cases)&&branches.cases.length===2,'Q21/Q23 risk cases');
 for(const [index,expected] of [[0,{name:'en-desktop-q21-c',questionId:21,
   review:'R21Opt3',correct:'D'}],[1,{name:'es-mobile-q23-c',questionId:23,
   review:'R231Opt3',correct:'B'}]]){
  const item=branches.cases[index];
  demand(item.name===expected.name&&item.status===branches.status&&
   item.firstQuestion===expected.questionId&&item.selected==='C'&&
   item.sourceCorrect===expected.correct&&item.reviewInstance===expected.review&&
   item.questions?.length===10&&item.reviews?.length===10&&
   item.reviews[0].questionId===expected.questionId&&
   item.reviews[0].risk===expected.review&&
   item.hostPageMarkedComplete==='false'&&
   item.observations.some(row=>row.phase==='host-exit-unresolved'),
   `${expected.name} missing review lookup disclosed, host exit blocked`);
 }
 return true;
}

export function validateP064AdmissionSemantics(packet,registration){
 demand(packet?.schemaVersion===1&&packet.calibrationId===P064_ADMISSION_CALIBRATION&&
  packet.sourceRoot===P064_SOURCE_ROOT&&packet.scope==='private-engineering'&&
  packet.deploymentScope==='local-only','exact local P064 identity');
 same(packet.source,P064_SOURCE,'source SWF');same(packet.sourceXml,P064_XML,'lesson XML');
 same(packet.selectedPages,[{animationId:P064_ADMISSION_ID,placementId:P064_ADMISSION_ID,
  assetId:`swf-${P064_SOURCE.sha256}`,stableLessonKey:'shared-nms002-l02',
  sourceSha256:P064_SOURCE.sha256,moduleCode:'NMS002',lessonNumber:2,
  globalPageOrdinal:64,sourceOccurrence:64,sectionCode:'FQ',sectionPageOrdinal:2,
  complexityLane:'behavior-heavy',runtime:P064_RUNTIME}],
  'exact FQ2 placement and source-quiz context');
 const entry=packet.entry,artifacts=entry?.artifacts;
 same(Object.keys(entry??{}).sort(),['artifacts','complexityLane','key','maturity','module'],
  'entry keys');
 demand(entry.key===P064_ADMISSION_ID&&entry.module===`./modules/${P064_ADMISSION_ID}`&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy',
  'one maintained DOM product entry');
 same(Object.keys(artifacts??{}).sort(),['kind','memberManifest','module','sourceRun','timeline'],
  'DOM artifact keys');
 demand(artifacts.kind==='maintained-dom-module-v1','maintained DOM not structural output');
 for(const [key,path] of [['module',P064_CANONICAL_MODULE_PATH],
  ['timeline',P064_CANONICAL_TIMELINE_PATH],['sourceRun',P064_RUN_PATH],
  ['memberManifest',P064_MEMBER_PATH]])pin(artifacts[key],path);
 same(packet.sourceQuiz,{contract:P064_QUIZ_CONTRACT,questionIr:P064_QUESTION_IR,
  displayList:P064_DISPLAY_LIST,presentation:P064_PRESENTATION,scripts:P064_SCRIPT_AUDIT,
  bankSize:35,drawCount:10,optionCount:4,answerMapSha256:P064_ANSWER_MAP_SHA256},
  'complete source script and 35x4 answer semantics');
 same(packet.behavior,{disposition:P064_DISPOSITION,sourceRiskModule:P064_SOURCE_RISK_MODULE,
  quizState:P064_QUIZ_STATE,quizComponent:P064_QUIZ_COMPONENT,hostScore:P064_HOST_SCORE,
  runtimeAdapter:P064_RUNTIME_ADAPTER,productModule:P064_PRODUCT_MODULE,
  browserMain:P064_BROWSER_MAIN,browserReviewBranches:P064_BROWSER_REVIEW_BRANCHES,
  postReviewHostExitResolved:false,hostPlaybackCompletion:false,
  deterministicSelectionOriginalRngParity:false},'maintained quiz and qualified host behavior');
 same(packet.audio,{sourceIndex:P064_AUDIO_INDEX,acceptedCueCount:0,
  sourceAlignmentAccepted:false,listeningAccepted:false,localeAutoPlayback:false,
  originalHostAssociationEstablished:false},'source audio remains unaccepted');
 same(packet.glossary,[],'no new FQ glossary or substitution');
 demand(packet.sourceKeyAttributeCalls===0,'no source key attributes');
 same(packet.acceptanceEffects,P064_ACCEPTANCE_EFFECTS,'independent gates remain false');
 demand(packet.productCalibrationPassed===false&&packet.scaleOutAuthorized===false,
  'no factory scale-out');
 pin(packet.freezeManifest,P064_FREEZE_PATH);
 same(registration,{calibrationId:P064_ADMISSION_CALIBRATION,deploymentScope:'local-only',
  freezeManifest:P064_FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[entry]},
  'one exact local registration fragment');
 demand(packet.integrity?.scope==='single-NMS-L02-P064-source-and-implementation'&&
  packet.integrity.completeTransitiveClosure===false&&
  typeof packet.integrity.qualification==='string'&&
  packet.integrity.qualification.includes('Q5')&&
  packet.integrity.qualification.includes('Q10')&&
  packet.integrity.qualification.includes('host-exit')&&
  Array.isArray(packet.integrity.files),'explicit qualified finite page closure');
 same(packet.integrity.sharedDependencies,P064_SHARED_DEPENDENCIES,
  'reviewed shared host dependencies kept separate');
 return true;
}

export function validateP064ProofClosure(proof){
 demand(proof?.schemaVersion===1&&proof.kind==='nms-l02-page-proof-v1'&&
  proof.hostContract==='nms-l02-source-bound-host-v1'&&
  proof.animationId===P064_ADMISSION_ID,'page proof identity');
 pin(proof.freeze,P064_FREEZE_PATH);
 validateP064AdmissionSemantics({...proof.packet,freezeManifest:proof.freeze},proof.registration);
 const own=proof.packet.integrity.files;
 same(own.map(item=>item.path),sorted([...new Set(own.map(item=>item.path))]),
  'sorted unique own file closure');
 for(const item of own)pin(item,item.path);
 const byPath=new Map(own.map(item=>[item.path,item]));
 for(const required of P064_REQUIRED_PAGE_PATHS)demand(byPath.has(required),`required page input ${required}`);
 for(const expected of P064_REVIEWED_CORE_INPUTS)same(byPath.get(expected.path),expected,
  `exact reviewed source/implementation/browser pin ${expected.path}`);
 for(const [kind,key] of [['module','module'],['timeline','timeline'],
  ['source run','sourceRun'],['member manifest','memberManifest']]){
  const expected=proof.packet.entry.artifacts[key];
  same(byPath.get(expected.path),expected,`own ${kind} artifact`);
 }
 for(const dep of P064_SHARED_DEPENDENCIES){
  pin(dep,dep.path);demand(!byPath.has(dep.path),'page/host dependency disjoint');
 }
 same(proof.files.map(item=>item.path),
  sorted([...own.map(item=>item.path),P064_FREEZE_PATH,P064_FRAGMENT_PATH]),
  'proof file membership');
 for(const item of proof.files)pin(item,item.path);
 const files=new Map(proof.files.map(item=>[item.path,item]));
 for(const item of own)same(files.get(item.path),item,`proof retains ${item.path}`);
 same(files.get(P064_FREEZE_PATH),proof.freeze,'freeze pin');
 same(proof.external,[{root:P064_SOURCE_ROOT,pin:P064_SOURCE},
  {root:P064_SOURCE_ROOT,pin:P064_XML}],
  'two real physical source pins');
 return true;
}
