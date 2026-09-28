import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {getKeyTermDisplayDefinitions, getKeyTermDisplaySublinks, type KeyTermEntry} from '../components/legacy-key-terms-browser';

test('both G4 indices clarify zero for learners and retain exact source evidence', async () => {
  for (const language of ['en', 'es']) {
    const document = JSON.parse(await readFile(new URL(`../public/generated/g4-grade-wide-keyterms-${language}.json`, import.meta.url), 'utf8'));
    const zero = (document.entries as KeyTermEntry[]).find((entry) => entry.titles.en === 'Zero')!;
    const before = JSON.stringify(zero);
    const learner = getKeyTermDisplayDefinitions(zero, false);
    assert.match(learner.en, /represents none/);
    assert.match(learner.en, /neither negative nor positive/);
    assert.match(learner.es, /cantidad nula/);
    assert.doesNotMatch(learner.es, /no es no/);
    assert.equal(getKeyTermDisplayDefinitions(zero, true), zero.definitions);
    assert.equal(JSON.stringify(zero), before);
  }
});

test('the clarification is limited to exact G4 zero entries and wording', async () => {
  const document = JSON.parse(await readFile(new URL('../public/generated/g4-grade-wide-keyterms-en.json', import.meta.url), 'utf8'));
  const entries = document.entries as KeyTermEntry[];
  const zero = entries.find((entry) => entry.titles.en === 'Zero')!;
  for (const entry of entries.filter((entry) => !['Zero', 'Negative sign', 'Question'].includes(entry.titles.en))) {
    assert.equal(getKeyTermDisplayDefinitions(entry, false), entry.definitions);
  }
  const anotherSource = {...zero, id: 'other-source-zero'};
  assert.equal(getKeyTermDisplayDefinitions(anotherSource, false), anotherSource.definitions);
  const correctedSource = {...zero, definitions: {...zero.definitions, en: 'Updated source definition.'}};
  assert.equal(getKeyTermDisplayDefinitions(correctedSource, false), correctedSource.definitions);
});

test('the G4 question example asks for the mean in both languages while preserving source evidence', async () => {
  for (const language of ['en', 'es']) {
    const document = JSON.parse(await readFile(new URL(`../public/generated/g4-grade-wide-keyterms-${language}.json`, import.meta.url), 'utf8'));
    const entry = (document.entries as KeyTermEntry[]).find((item) => item.titles.en === 'Question')!;
    const before = JSON.stringify(entry);
    const learner = getKeyTermDisplayDefinitions(entry, false);
    assert.equal(learner.en, entry.definitions.en);
    assert.match(learner.es, /la media de este conjunto/);
    assert.doesNotMatch(learner.es, /mediana/);
    const sublinks = getKeyTermDisplaySublinks(entry, false);
    const meanId = language === 'en' ? 'en-0371-4f9ffb111096' : 'es-0395-723ce3bf28fa';
    assert.deepEqual(sublinks.es.filter((link) => link.sourceText === 'media'), [{sourceText: 'media', targetTitle: 'Media', targetEntryId: meanId}]);
    const mean = (document.entries as KeyTermEntry[]).find((item) => item.id === meanId);
    assert.equal(mean?.titles.en, 'Mean');
    assert.equal(mean?.titles.es, 'Media');
    assert.ok(!sublinks.es.some((link) => link.sourceText === 'mediana'));
    assert.equal(sublinks.en, entry.sublinks.en);
    assert.equal(getKeyTermDisplaySublinks(entry, true), entry.sublinks);
    assert.equal(getKeyTermDisplayDefinitions(entry, true), entry.definitions);
    assert.equal(JSON.stringify(entry), before);
    for (const other of [
      {...entry, id: 'another-source-question'},
      {...entry, definitions: {...entry.definitions, en: 'Updated source definition.'}},
      {...entry, definitions: {...entry.definitions, es: 'Definición revisada.'}},
    ]) {
      assert.equal(getKeyTermDisplayDefinitions(other, false), other.definitions);
      assert.equal(getKeyTermDisplaySublinks(other, false), other.sublinks);
    }
  }
});

test('the two G4 negative-sign entries restore the missing zero only for learner display', async () => {
  for (const language of ['en', 'es']) {
    const document = JSON.parse(await readFile(new URL(`../public/generated/g4-grade-wide-keyterms-${language}.json`, import.meta.url), 'utf8'));
    const entry = (document.entries as KeyTermEntry[]).find((item) => item.titles.en === 'Negative sign')!;
    const before = JSON.stringify(entry);
    const learner = getKeyTermDisplayDefinitions(entry, false);
    assert.match(learner.en, /to the left of 0 on the number line/);
    assert.match(learner.en, /−4 is read as negative 4/);
    assert.equal(learner.es, entry.definitions.es);
    assert.equal(getKeyTermDisplayDefinitions(entry, true), entry.definitions);
    assert.equal(JSON.stringify(entry), before);
    for (const other of [
      {...entry, id: 'another-source-negative-sign'},
      {...entry, definitions: {...entry.definitions, en: 'Updated source definition.'}},
    ]) assert.equal(getKeyTermDisplayDefinitions(other, false), other.definitions);
  }
});
