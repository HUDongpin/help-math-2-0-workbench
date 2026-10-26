import assert from 'node:assert/strict';
import {test} from 'node:test';
import TEXT from '../src/generated/geo001-l06-p002-text-ir-v1.json';
import {geoL06P002MainState} from '../src/geo-l06-p002-display-state-v1';
import {geoL06P002TeachingState} from '../src/geo-l06-p002-teaching-state-v1';

const at = (frame: number, lang: 'en' | 'es' = 'en', replay = 0) =>
  geoL06P002TeachingState(geoL06P002MainState(frame, {
    frame, frameDomain: 'sprite-230', scenario: 'default', lang, seed: 0, replay,
  }));

test('source text IR preserves all 16 exact text definitions without losing risks', () => {
  assert.equal(TEXT.definitions.length, 16);
  assert.equal(TEXT.definitions.find(item => item.characterId === 209)?.runs.map(run => run.text).join(''),
    'Area is the amount of surface in a two-dimensional figure.');
  assert(TEXT.sourceRisks.includes('bitmap-text-unclassified'));
  assert(TEXT.sourceRisks.includes('mask-filter-blend-semantics-unresolved'));
});

test('all main frames have deterministic teaching text and source emphasis', () => {
  for (let frame = 1; frame <= 1216; frame++) {
    const state = at(frame);
    assert.equal(state.parts.map(part => part.text).join(''), state.definition);
    assert.equal(state.parts.filter(part => part.highlighted).length,
      state.highlightedKey === null ? 0 : 1);
    assert.equal(state.sourceTeachingTextIds.every(id => id >= 209), true);
  }
  assert.equal(at(981).definitionVisible, false);
  assert.equal(at(982).definitionVisible, false);
  assert.equal(at(982).definitionOpacity, 0);
  assert.equal(at(983).definitionVisible, true);
  assert.equal(at(983).definitionOpacity, 0.25);
  assert.equal(at(986).definitionOpacity, 1);
  assert.equal(at(989).highlightedKey, 'Area');
  assert.equal(at(1007).highlightedKey, 'Surface');
  assert.equal(at(1018).highlightedKey, 'Two dimensional');
  assert.equal(at(1029).highlightedKey, 'Figure');
  assert.equal(at(1124).termsVisible, false);
  assert.equal(at(1125).termsVisible, false);
  assert.equal(at(1125).termsOpacity, 0);
  assert.equal(at(1126).termsVisible, true);
  assert.equal(at(1126).termsOpacity, 51 / 256);
  assert.equal(at(1130).termsOpacity, 1);
  assert.equal(at(1132).highlightedTerm, 'radius');
  assert.equal(at(1166).highlightedTerm, 'diameter');
  assert.equal(at(1216).terms, 'radius, diameter');
});

test('Spanish route remains disclosed English source fallback; Replay resets text state', () => {
  const es = at(1132, 'es', 3);
  assert.equal(es.requestedLanguage, 'es');
  assert.equal(es.sourceContentLanguage, 'en');
  assert.equal(es.spanishSourceFallback, true);
  assert.equal(es.highlightedTerm, 'radius');
  assert.equal(at(1, 'es', 4).definitionVisible, false);
  assert.equal(at(1, 'es', 4).termsVisible, false);
});
