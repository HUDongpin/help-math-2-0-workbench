import assert from 'node:assert/strict';
import test from 'node:test';
import {loadAnimationModule, type AnimationModule} from '@helpmath/demos/animation-registry';
import {createPlaybackContext, createRuntimeContext, resolveFrameDomain} from '@helpmath/demos/runtime';
import {G4_L3_LESSON} from '../lib/g4-l3-lesson-navigation';
import {g4L3ProductLanguages} from '../lib/g4-l3-ts006-product';
import {G4_L5_PAGE_ONLY_COURSE_DESCRIPTOR} from '../lib/g4-page-only-course-descriptors.server';

function firstState(animationModule: AnimationModule, lang: 'en' | 'es', query = {}) {
  const metadata = animationModule.runtime ?? animationModule.movie;
  const context = createRuntimeContext({ ...query, lang }, metadata, animationModule.scenarios, animationModule.defaultScenarioByFrameDomain);
  const domain = resolveFrameDomain(metadata, context.frameDomain);
  return animationModule.getFrameState(1, createPlaybackContext(context, 1, 0, domain)) as {
    status?: string;
    blocker?: string | null;
  };
}

test('G4 L3 Spanish uses the available source drawing and keeps Spanish audio', async () => {
  assert.equal(G4_L3_LESSON.pages.length, 39);
  let englishDrawings = 0;
  for (const page of G4_L3_LESSON.pages) {
    const animationModule = await loadAnimationModule(page.animationId);
    assert.ok(animationModule, page.animationId);
    const languages = g4L3ProductLanguages(page.animationId, 'es');
    assert.equal(languages.audioLanguage, 'es');
    assert.equal(firstState(animationModule, languages.visualLanguage).status, 'ready', page.animationId);
    if (page.animationId !== 'course-g04-l03-in-009') {
      assert.equal(firstState(animationModule, 'es').blocker, 'spanish-visual-and-audio-unvalidated', page.animationId);
      assert.equal(languages.visualLanguage, 'en');
      englishDrawings++;
    } else {
      assert.equal(languages.visualLanguage, 'es');
    }
    assert.deepEqual(g4L3ProductLanguages(page.animationId, 'en'), {visualLanguage: 'en', audioLanguage: 'en'});
  }
  assert.equal(englishDrawings, 38);
});

test('G4 L3 language routing does not change unknown or other-course modules', () => {
  for (const id of ['course-g04-l03-unknown', 'course-g04-l05-ir-001']) {
    assert.deepEqual(g4L3ProductLanguages(id, 'es'), {visualLanguage: 'es', audioLanguage: 'es'});
  }
});

test('G4 L5 requests English for its 47 English-only drawings and preserves six product pages', async () => {
  const descriptor = G4_L5_PAGE_ONLY_COURSE_DESCRIPTOR;
  assert.equal(descriptor.pages.length, 53);
  let fixedEnglish = 0;
  let preserved = 0;
  for (const page of descriptor.pages) {
    const renderer = page.rendererAvailability;
    assert.equal(renderer.kind, 'registered');
    if (renderer.kind !== 'registered') continue;
    const animationModule = await loadAnimationModule(renderer.moduleKey);
    assert.ok(animationModule, page.animationId);
    const query = renderer.runtimeQuery;
    if (query?.scenario === 'source-static-frame') {
      assert.equal(query.language, 'fixed-en', page.animationId);
      assert.equal(firstState(animationModule, 'es', query).blocker, 'spanish-visual-and-audio-unvalidated', page.animationId);
      assert.equal(firstState(animationModule, 'en', query).status, 'ready', page.animationId);
      fixedEnglish++;
    } else {
      assert.equal(query?.scenario, 'product-candidate');
      assert.equal(query.language, 'route-locale');
      assert.notEqual(firstState(animationModule, 'es', query).status, 'blocked', page.animationId);
      preserved++;
    }
  }
  assert.equal(fixedEnglish, 47);
  assert.equal(preserved, 6);
});
