import assert from 'node:assert/strict';
import test from 'node:test';
import {lessonTextKeyTermRequestAllowed, validateLessonTextKeyTerms} from './lesson-text-keyterms';
import type {LessonTextKeyTermsCapability} from './lesson-text-contract';
const capability:LessonTextKeyTermsCapability={indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',
  sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  entryIds:['en-0424-79116d5cfb19']};
const request={type:'open-keyterm',entryId:capability.entryIds[0]!,sourceAnimationId:'source-page',
  playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'} as const;
test('modern source glossary adapter validates exact source and admits only the authored page targets',()=>{
  validateLessonTextKeyTerms(capability);
  assert.equal(lessonTextKeyTermRequestAllowed(capability,request,'source-page'),true);
  assert.equal(lessonTextKeyTermRequestAllowed(capability,{...request,entryId:'en-0134-4aa1672f260e'},'source-page'),false);
  assert.equal(lessonTextKeyTermRequestAllowed(capability,request,'another-page'),false);
  assert.equal(lessonTextKeyTermRequestAllowed(undefined,request,'source-page'),false);
  assert.equal(lessonTextKeyTermRequestAllowed(capability,{...request,playbackDisposition:'reversible-support-pause'},'source-page'),false);
  assert.equal(lessonTextKeyTermRequestAllowed(capability,{type:'legacy',operation:'getURL',target:'https://example.org'},'source-page'),false);
});
test('wrong source bytes, mixed index IDs and duplicate entries are rejected before module activation',()=>{
  for(const value of [{...capability,sourceSha256:'0'.repeat(64)}, {...capability,sourceAssetId:'other.xml'},
    {...capability,entryIds:[]}, {...capability,entryIds:[...capability.entryIds,...capability.entryIds]},
    {...capability,entryIds:['es-0424-79116d5cfb19']}]) assert.throws(()=>validateLessonTextKeyTerms(value));
});

const sourceCapability: LessonTextKeyTermsCapability = {...capability, entryIds: [], sourceKeyBindings: [
  {sourceButtonId: 27, sourceKey: 'Data tables', frameDomain: 'sprite70', startFrame: 85, endFrame: 110},
  {sourceButtonId: 28, sourceKey: 'strategies', frameDomain: 'sprite70', startFrame: 85, endFrame: 110},
]};
const sourceRequest = {type: 'open-keyterm-by-source-key', sourceKey: 'Data tables', sourceButtonId: 27,
  frameDomain: 'sprite70', frame: 85, sourceAnimationId: 'source-page',
  playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'} as const;
test('raw source queries require exact authored button, key, frame window, active page and current frame', () => {
  validateLessonTextKeyTerms(sourceCapability);
  const current = {frame: 85, frameDomain: 'sprite70'};
  assert.equal(lessonTextKeyTermRequestAllowed(sourceCapability, sourceRequest, 'source-page', current), true);
  assert.equal(lessonTextKeyTermRequestAllowed(sourceCapability, {...sourceRequest,frame:110}, 'source-page', {...current,frame:110}), true);
  for (const patch of [{sourceKey:'data tables'}, {sourceKey:'Data tables '}, {sourceButtonId:28},
    {sourceAnimationId:'other-page'}, {frameDomain:'root'}, {frame:84}, {frame:111}, {frame:86}]) {
    assert.equal(lessonTextKeyTermRequestAllowed(sourceCapability, {...sourceRequest,...patch}, 'source-page', current), false, JSON.stringify(patch));
  }
  for (const frame of [84,111]) assert.equal(lessonTextKeyTermRequestAllowed(sourceCapability,
    {...sourceRequest,frame}, 'source-page', {...current,frame}),false);
  assert.equal(lessonTextKeyTermRequestAllowed(sourceCapability, sourceRequest, 'source-page'), false);
  assert.equal(lessonTextKeyTermRequestAllowed(sourceCapability, sourceRequest, 'source-page', {...current,capture:true}), false);
  assert.equal(lessonTextKeyTermRequestAllowed(capability, sourceRequest, 'source-page', current), false);
  assert.equal(lessonTextKeyTermRequestAllowed({...sourceCapability,sourceSha256:'0'.repeat(64)}, sourceRequest, 'source-page', current), false);
  assert.equal(lessonTextKeyTermRequestAllowed(sourceCapability, {...sourceRequest,sourceKey:'strategies',sourceButtonId:28}, 'source-page', current), true);
});
test('source-key declarations reject malformed or empty windows while entryId-only capabilities remain valid', () => {
  const binding = sourceCapability.sourceKeyBindings![0]!;
  for (const sourceKeyBindings of [[],[binding,binding], [{...binding,sourceButtonId:0}],
    [{...binding,sourceKey:''}], [{...binding,sourceKey:'bad\nkey'}], [{...binding,startFrame:0}],
    [{...binding,endFrame:84}], [{...binding,frameDomain:''}]]) {
    assert.throws(() => validateLessonTextKeyTerms({...sourceCapability,sourceKeyBindings}));
  }
  validateLessonTextKeyTerms(capability);
  assert.equal(lessonTextKeyTermRequestAllowed(capability, request, 'source-page'),true);
});
