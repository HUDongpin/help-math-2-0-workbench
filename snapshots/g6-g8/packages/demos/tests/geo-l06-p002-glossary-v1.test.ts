import assert from 'node:assert/strict';
import {test} from 'node:test';
import GLOSSARY from '../src/generated/geo001-l06-p002-glossary-v1.json';
import {geoL06P002MainState} from '../src/geo-l06-p002-display-state-v1';
import {GEO_L06_P002_GLOSSARY_STATUS, geoL06P002VisibleGlossaryTerms} from '../src/geo-l06-p002-glossary-v1';

const context = {frame: 1, frameDomain: 'sprite-230', scenario: 'default',
  lang: 'en' as const, seed: 0, replay: 0};

test('source buttons expose exactly the four bilingual terms at main frame 987', () => {
  assert.deepEqual(geoL06P002VisibleGlossaryTerms(geoL06P002MainState(986, {...context, frame: 986})), []);
  for (const lang of ['en', 'es'] as const) {
    const state = geoL06P002MainState(987, {...context, frame: 987, lang});
    const terms = geoL06P002VisibleGlossaryTerms(state);
    assert.deepEqual(terms.map(term => term.sourceCharacterId), [211, 212, 213, 214]);
    assert.deepEqual(terms.map(term => term.sourceKeyAttribute),
      ['Figure', 'Area', 'Surface', 'Two dimensional']);
    for (const term of terms) {
      const entry = GLOSSARY.entries.find(item => item.id === term.id);
      assert.equal(term.label, entry?.labels[lang]);
      assert.equal(term.definition, entry?.definitions[lang]);
      assert.equal(term.sourceDefinitionConflict, term.id === 'surface');
    }
  }
});

test('Surface variant conflict and host/companion acceptance remain visible', () => {
  const conflict = GLOSSARY.sourceConflicts.find(item => item.key === 'Surface');
  assert.notEqual(conflict?.englishIndexValue, conflict?.spanishIndexValue);
  assert.equal(conflict?.originalHostSelectionVerified, false);
  assert.equal(GEO_L06_P002_GLOSSARY_STATUS.surfaceEnglishSourceConflict, true);
  assert.equal(GEO_L06_P002_GLOSSARY_STATUS.originalHostLookupVerified, false);
  assert.equal(GEO_L06_P002_GLOSSARY_STATUS.companionMediaVerified, false);
  assert.equal(GEO_L06_P002_GLOSSARY_STATUS.hostInteractionAccepted, false);
});
