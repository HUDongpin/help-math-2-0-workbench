import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import animationModule from '../../../packages/demos/src/modules/shared-alg001-l06-p004';
import {p004PresentationTextSnapshot} from '../../../packages/demos/src/alg-l06-p004-text-presentation-v1';
import {prepareG678LessonTypography} from '../lib/g678-lesson-typography-presentation';
import {lessonTypographyLanguages} from '../lib/lesson-typography-policy';

const context = (frame: number) => ({frame, frameDomain: 'sprite-95', rootFrame: 6,
  scenario: 'source-static-frame', lang: 'en' as const, seed: 0, replay: 2});

test('actual P004 module is accepted by host preparation and retains a separate original drawing renderer', async () => {
  assert.equal(await prepareG678LessonTypography(animationModule, false), animationModule);
  assert.equal(await prepareG678LessonTypography(animationModule, true), animationModule);
  assert.notEqual(animationModule.Renderer, animationModule.textPresentation.Renderer);
  assert.equal(animationModule.textPresentation.getSnapshot, p004PresentationTextSnapshot);
  assert.deepEqual(animationModule.audioCues, []);
  assert.equal(animationModule.transport?.audioDisposition, 'disabled-while-inspecting');
});

test('real source drawing and native math coexist; original capture renderer has no companion text', () => {
  const c = context(130), state = animationModule.getFrameState(c.frame, c);
  const Composite = animationModule.textPresentation.Renderer!;
  const Original = animationModule.Renderer;
  const html = renderToStaticMarkup(<Composite {...c} state={state} uiLanguage="es" />);
  assert.match(html, /data-course-canvas="shared-alg001-l06-p004"/);
  assert.match(html, /data-p004-native-text="true"/);
  assert.match(html, /M = \$0\.50 × C/);
  assert.match(html, /data-p004-source-fallback="true"/);
  assert.match(html, /lang="en"/);
  assert.match(html, /data-p004-text-replay="2"/);
  const capture = renderToStaticMarkup(<Original {...c} state={state} />);
  assert.match(capture, /data-course-canvas="shared-alg001-l06-p004"/);
  assert.doesNotMatch(capture, /data-p004-native-text/);
});

test('generic host English visual fallback and custom Spanish UI use identical source blocks through all frames', () => {
  const languages = lessonTypographyLanguages(undefined, 'es', animationModule.textPresentation.binding);
  assert.equal(languages.visualLanguage, 'en');
  assert.equal(languages.uiLanguage, 'es');
  for (let frame = 1; frame <= 831; frame++) {
    const c = context(frame), state = animationModule.getFrameState(frame, c);
    const generic = animationModule.textPresentation.getSnapshot(state, c);
    const custom = p004PresentationTextSnapshot(undefined, {...c, lang: 'es'});
    assert.deepEqual(generic.blocks, custom.blocks, `frame ${frame}`);
    assert.deepEqual(generic.suppressedInstances, []);
    assert.equal(custom.identity.language, 'es');
    assert.equal(custom.identity.replay, 2);
  }
});
