import assert from 'node:assert/strict';
import test from 'node:test';

import {enContent} from '../content/en';
import {esContent} from '../content/es';

test('EN and ES public policy copy distinguish the public lesson from protected Family access', () => {
  for (const content of [enContent, esContent]) {
    const familySection = content.pages.privacy.sections.find(
      (section) => section.id === 'family-portal',
    );

    assert.ok(familySection, 'Family Portal privacy section must exist');
    assert.equal(content.pages.privacy.effectiveDate.includes('2026'), true);
    assert.match(content.pages.privacy.reviewNotice, /DRAFT|BORRADOR/u);
    assert.match(
      `${content.pages.privacy.hero.summary} ${familySection.paragraphs.join(' ')}`,
      /Family Portal|Familia/u,
    );
    assert.match(
      familySection.paragraphs.join(' '),
      /Real family access|familias reales/u,
    );
  }
});

test('EN and ES support copy keeps Family school-invited, default-off, and separate from legacy accounts', () => {
  for (const content of [enContent, esContent]) {
    const accountStatus = content.pages.support.currentStatus.items.find(
      (item) => item.id === 'accounts',
    );
    const accessFaq = content.pages.support.faqs.find(
      (faq) => faq.id === 'family-access',
    );

    assert.ok(accountStatus);
    assert.ok(accessFaq);
    assert.match(accountStatus.description, /school|escuela/u);
    assert.match(accountStatus.description, /default|predeterminada/u);
    assert.match(accessFaq.answer, /no public|No hay registro público/u);
    assert.match(accessFaq.answer, /historical|históricas/u);
  }
});

test('draft terms do not promote the Family candidate into a real-family release', () => {
  for (const content of [enContent, esContent]) {
    const terms = [
      content.pages.terms.hero.summary,
      content.pages.terms.reviewNotice,
      ...content.pages.terms.sections.flatMap((section) => section.paragraphs),
    ].join(' ');

    assert.match(terms, /Family Portal|Familia/u);
    assert.match(terms, /Owner|titular/u);
    assert.match(terms, /legal/u);
    assert.match(terms, /real-family|piloto real/u);
  }
});

test('account-status copy separates protected current access from legacy credentials', () => {
  for (const content of [enContent, esContent]) {
    const loginCopy = [
      content.pages.login.hero.summary,
      content.pages.login.safetyNote,
      ...content.pages.login.options.cards.map((card) => card.description),
    ].join(' ');

    assert.match(loginCopy, /protected|protegido/u);
    assert.match(loginCopy, /historical|históricas|anteriores/u);
    assert.match(loginCopy, /school|escuela/u);
    assert.equal(
      content.pages.login.hero.primaryAction.href.endsWith('/sign-in'),
      true,
    );
  }
});
