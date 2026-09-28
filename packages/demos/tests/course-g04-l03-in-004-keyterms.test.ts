import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {IN004_KEYTERM_ENTRIES} from '../src/modules/course-g04-l03-in-004';
import {COURSE_G04_L03_IN_004_GLOSSARY} from '../src/timelines/course-g04-l03-in-004-number-line-drag-interaction';

test('both IN004 glossary actions resolve the intended existing product definition', () => {
  const index = JSON.parse(readFileSync(new URL('../../../apps/web/public/generated/g4-grade-wide-keyterms-en.json', import.meta.url), 'utf8'));
  for (const {term, definition} of COURSE_G04_L03_IN_004_GLOSSARY) {
    const matches = index.entries.filter((entry: {id: string}) => entry.id === IN004_KEYTERM_ENTRIES[term]);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].titles.en, term);
    assert.equal(matches[0].definitions.en, definition);
  }
});
