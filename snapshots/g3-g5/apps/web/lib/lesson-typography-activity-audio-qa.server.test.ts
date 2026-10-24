import assert from 'node:assert/strict';
import test from 'node:test';
import {isLocalLessonTypographyActivityAudioQa} from './lesson-typography-activity-audio-qa.server';

const admitted = Object.freeze({NODE_ENV:'development',
  NEXT_PUBLIC_HELP_MATH_LESSON_TYPOGRAPHY:'candidate-v1',
  HELP_MATH_CURRENT_JS_CANDIDATE_QA:'current-js-candidate-profile-v1'});

test('exact local development candidates admit declared activity audio QA', () => {
  for (const host of ['localhost','localhost:3388','127.0.0.1','127.0.0.1:3388','[::1]','[::1]:3388']) {
    assert.equal(isLocalLessonTypographyActivityAudioQa(host,admitted),true,host);
  }
});

test('production, test environments and either absent or changed candidate flag remain denied', () => {
  for (const NODE_ENV of ['production','test','',undefined]) assert.equal(isLocalLessonTypographyActivityAudioQa('localhost:3388',{...admitted,NODE_ENV}),false);
  for (const key of ['NEXT_PUBLIC_HELP_MATH_LESSON_TYPOGRAPHY','HELP_MATH_CURRENT_JS_CANDIDATE_QA']) {
    for (const value of ['',undefined,'true','candidate-v2']) assert.equal(isLocalLessonTypographyActivityAudioQa('localhost:3388',{...admitted,[key]:value}),false);
  }
});

test('remote, malformed, forwarded and ambiguous hosts never admit local activity QA', () => {
  for (const host of [null,undefined,'','helpmath.ai','www.helpmath.ai','localhost.example.com','127.0.0.2',
    '127.0.0.1.example.com','[::ffff:127.0.0.1]','::1','http://localhost','localhost/path',
    'localhost@evil.example','evil.example@localhost','localhost, evil.example',' localhost','localhost ',
    'localhost:0','localhost:65536','localhost:333333','localhost:abc','localhost:']) {
    assert.equal(isLocalLessonTypographyActivityAudioQa(host,admitted),false,String(host));
  }
});


test('fixed local production QA requires both exact controlled-local flags and no provider environment', () => {
  const local = {...admitted, NODE_ENV: 'production',
    HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW: 'current-js-1751-controlled-preview-v1',
    HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_LOCAL: 'current-js-1751-controlled-preview-v1'};
  assert.equal(isLocalLessonTypographyActivityAudioQa('127.0.0.1:3390', local), true);
  for (const flag of ['HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW', 'HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_LOCAL']) {
    for (const value of [undefined, '', 'true']) assert.equal(isLocalLessonTypographyActivityAudioQa('localhost', {...local, [flag]: value}), false);
  }
  for (const VERCEL_ENV of ['preview', 'production', 'development', '']) {
    for (const env of [admitted, local]) assert.equal(isLocalLessonTypographyActivityAudioQa('localhost', {...env, VERCEL_ENV}), false);
  }
  for (const host of ['helpmath.ai', 'www.helpmath.ai', 'preview.vercel.app']) assert.equal(isLocalLessonTypographyActivityAudioQa(host, local), false);
});
