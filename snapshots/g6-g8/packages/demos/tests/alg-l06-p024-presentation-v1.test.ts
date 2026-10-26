import assert from 'node:assert/strict';
import test from 'node:test';
import {p024InitialState,p024Reduce,type P024State} from '../src/alg-l06-p024-state-v1';
import {P024_PRESENTATION_BINDING,p024PresentationState} from '../src/alg-l06-p024-presentation-v1';

const main=(frame:number,phase:P024State['phase']='main')=>
 ({...p024InitialState(),phase,mainFrame:frame,quizSection:phase==='quiz'} as P024State);

test('pinned source gates reveal local text and hits only after exact mask frames',()=>{
 assert.equal(P024_PRESENTATION_BINDING.pins.nativeReport.sha256,
  'fe27c245d012df7740daf26fec68a53d84bd1bf8bba55635aa80233699146796');
 assert.equal(P024_PRESENTATION_BINDING.pins.geometry.sha256,
  'a8a4f89e64b730bf3349b50a11979e08e544ae5503473afd49ce0d1312f67966');
 assert.equal(p024PresentationState(main(6)).main.table.sourceGeometryReady,false);
 const seven=p024PresentationState(main(7));
 assert.equal(seven.main.table.sourceGeometryReady,true);
 assert.deepEqual(seven.glossary.filter(x=>x.interactionReady).map(x=>x.key),
  ['Range','Function','Output','Set']);
 assert.equal(p024PresentationState(main(79)).glossary.find(x=>x.key==='Function table')?.interactionReady,false);
 assert.equal(p024PresentationState(main(80)).glossary.find(x=>x.key==='Function table')?.interactionReady,true);
 assert.equal(p024PresentationState(main(108)).main.paragraphCompleteInk,false);
 assert.equal(p024PresentationState(main(109)).main.paragraphCompleteInk,true);
 assert.equal(p024PresentationState(main(133)).glossaryInstances.find(x=>x.context==='Range in question')?.sourceReady,false);
 assert.equal(p024PresentationState(main(134)).glossaryInstances.find(x=>x.context==='Range in question')?.sourceReady,true);
 assert.equal(p024PresentationState(main(141)).main.questionCompleteInk,false);
 assert.equal(p024PresentationState(main(142)).main.questionCompleteInk,true);
 assert(!p024PresentationState(main(141)).main.visibleText.some(x=>x.sourceTextId===41));
 assert(p024PresentationState(main(142)).main.visibleText.some(x=>x.sourceTextId===41));
});

test('answers require the actual quiz phase at frame 154, not quizSection during feedback',()=>{
 assert.equal(p024PresentationState(main(153,'quiz')).main.answers.length,0);
 const quiz=p024PresentationState(main(154,'quiz'));
 assert.deepEqual(quiz.main.answers.map(x=>x.label),['A','B','C','D']);
 assert(quiz.main.answers.every(x=>x.label!==null&&x.value!==null));
 const wrong=p024Reduce(main(154,'quiz'),{type:'answer',answer:'D',variant:1});
 assert.equal(wrong.quizSection,true);
 const feedback=p024PresentationState(wrong);
 assert.equal(feedback.main.answers.length,0);
 assert(!feedback.main.visibleText.some(x=>x.answerOption));
 assert.deepEqual(feedback.currentSceneIds,['sprite-208','sprite-69']);
 assert(feedback.glossary.every(x=>x.interactionReady),
  'source-ready companion terms stay available during nonmodal feedback');
 const held=p024PresentationState({...wrong,glossary:'Range',playing:false});
 assert(held.glossary.every(x=>!x.interactionReady));
 const popup=p024PresentationState({...wrong,phase:'popup',feedbackFrame:22,playing:false});
 assert(popup.glossary.every(x=>!x.interactionReady),'wrong feedback popup stays modal');
});

test('one selected wrong popup binds its own local frame, captured try count, and source text',()=>{
 const first=p024Reduce(main(154,'quiz'),{type:'answer',answer:'A',variant:2});
 const stopped={...first,phase:'popup' as const,feedbackFrame:23,playing:false};
 const popup=p024PresentationState(stopped);
 assert.deepEqual(popup.currentSceneIds,['sprite-208','sprite-83','sprite-80']);
 assert.equal(popup.popupScene?.frame,1);
 assert.equal(popup.popupScene?.dynamicSourceTextId,79);
 assert.equal(popup.popupScene?.text,'The range is the set of outputs. Try again.');
 assert.equal(popup.popupScene?.sourceBound,true);
 const second=p024Reduce({...main(154,'quiz'),wrongCount:1},
  {type:'answer',answer:'D',variant:3});
 const secondPopup=p024PresentationState({...second,phase:'popup',feedbackFrame:20,playing:false});
 assert.equal(secondPopup.popupScene?.sceneId,'sprite-94');
 assert.equal(secondPopup.popupScene?.dynamicSourceTextId,93);
 assert.equal(secondPopup.popupScene?.text,
  'Since the range is a set, you must put braces around it.');
 const stale=p024PresentationState({...stopped,wrongText:'stale text'});
 assert.equal(stale.popupScene?.sourceBound,false);
 assert.equal(stale.popupScene?.text,null);
 const right=p024Reduce(main(154,'quiz'),{type:'answer',answer:'C',variant:4});
 assert.equal(p024PresentationState(right).popupScene,null);
});

test('native ownership covers every active same-ID instance or falls back to Canvas',()=>{
 const seven=p024PresentationState(main(7));
 assert(seven.main.table.nativeOwned);
 assert(seven.ownership.nativeOwnedByRole.table.includes('sprite-208/depth-29/generation-1'));
 assert(seven.ownership.nativeOwnedByRole.table.includes('sprite-208/depth-34/generation-1'));
 assert(seven.ownership.suppressibleSourceTextIds.includes(14));
 assert(!seven.ownership.suppressibleSourceTextIds.includes(5),
  'the unverified full first sentence remains on Canvas');
 assert(!p024PresentationState(main(228)).main.table.nativeOwned,
  'a later live Output definition with the same source ID prevents table suppression');
 assert(!p024PresentationState(main(295)).ownership.suppressibleSourceTextIds.includes(14),
  'a later live 1 glyph shares the table character ID');
 const quiz=p024PresentationState(main(154,'quiz'));
 const suppressed:readonly number[]=quiz.ownership.suppressibleSourceTextIds;
 for(const id of [20,21,23,24,26,27,29,30])
  assert(!suppressed.includes(id),
   'answer glyph geometry is not verified for Canvas suppression');
});

test('locale fallback, glossary/SA holds, and replay remove only active scene IDs',()=>{
 const es=p024PresentationState({...main(80),locale:'es'});
 assert.equal(es.sourceLanguage,'en');assert.equal(es.localePolicy,'source-en-fallback');
 assert(es.glossary.find(x=>x.key==='Function table')?.interactionReady);
 const held=p024PresentationState({...main(80),glossary:'Range'});
 assert(held.glossary.every(x=>!x.interactionReady));
 const sa=p024PresentationState({...main(80),sa:'playing'});
 assert(sa.glossary.every(x=>!x.interactionReady));
 const wrong=p024Reduce(main(154,'quiz'),{type:'answer',answer:'B',variant:1});
 const oldScenes=p024PresentationState({...wrong,phase:'popup',feedbackFrame:22,playing:false}).currentSceneIds;
 const replay=p024PresentationState(p024Reduce(wrong,{type:'replay'}));
 assert.deepEqual(oldScenes,['sprite-208','sprite-69','sprite-65']);
 assert.deepEqual(replay.currentSceneIds,['sprite-208']);
 assert.deepEqual(replay.ownership.nativeOwnedInstanceIds,[]);
});
