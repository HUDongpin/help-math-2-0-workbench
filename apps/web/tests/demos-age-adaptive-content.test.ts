import assert from 'node:assert/strict';
import test from 'node:test';

import {enContent} from '../content/en/index';
import {esContent} from '../content/es/index';

const expectedAgeModes = ['elementary', 'middle', 'high'];
const expectedLanguageModes = ['english', 'spanish', 'dual'];

test('the English and Spanish demos expose the same three independent experience axes', () => {
  for (const content of [enContent.pages.demos, esContent.pages.demos]) {
    assert.deepEqual(
      content.experience.modes.map((mode) => mode.id),
      expectedAgeModes,
    );
    assert.deepEqual(
      content.experience.languageOptions.map((mode) => mode.id),
      expectedLanguageModes,
    );
    assert.equal(content.experience.stops.length, 8);
    assert.equal(
      new Set(content.experience.stops.map((stop) => stop.activityTitle.english)).size,
      8,
    );
    assert.equal(
      new Set(content.experience.stops.map((stop) => stop.activityTitle.spanish)).size,
      8,
    );
    for (const stop of content.experience.stops) {
      assert.ok(stop.activityPrompt.english.length > 0);
      assert.ok(stop.activityPrompt.spanish.length > 0);
    }
    for (const branch of Object.values(content.experience.scaffoldDirections)) {
      assert.ok(branch.english.length > 0);
      assert.ok(branch.spanish.length > 0);
    }
    assert.match(content.experience.fixedLevelValue, /Grade 4|cuarto grado/i);
    assert.equal(content.evidence.facts[0].value, '39');
    assert.equal(content.evidence.facts[1].value, '1');
    assert.equal(content.evidence.facts[2].value, '0 / 40');
  }
});

test('the public product concept remains fail-closed for unreleased course routes', () => {
  for (const content of [enContent.pages.demos, esContent.pages.demos]) {
    assert.equal(content.hero.primaryAction?.href, '#experience');
    assert.equal(content.hero.secondaryAction?.href, '#evidence');

    const serialized = JSON.stringify(content);
    assert.doesNotMatch(serialized, /\/courses\//);
    assert.doesNotMatch(serialized, /executive-preview/);
    assert.match(serialized, /0 \/ 40/);
    assert.match(serialized, /Unpublished|No publicada/);
  }
});

test('every age experience preserves dignified support access and a scripted Nova boundary', () => {
  for (const content of [enContent.pages.demos, esContent.pages.demos]) {
    assert.equal(content.experience.modes.length, 3);
    assert.ok(content.experience.readAloudLabel.length > 0);
    assert.ok(content.experience.stepByStepLabel.length > 0);
    assert.ok(content.experience.visualModelLabel.length > 0);
    assert.ok(content.experience.reducedMotionLabel.length > 0);
    assert.equal(content.experience.novaPrompts.length, 3);
    assert.match(
      `${content.experience.novaPrivacyNote.english} ${content.experience.novaPrivacyNote.spanish}`,
      /No student data|No se envían/i,
    );
    assert.match(content.evidence.note, /not a|no es un curso/i);
  }
});
