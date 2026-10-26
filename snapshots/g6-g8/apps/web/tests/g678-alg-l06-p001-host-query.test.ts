import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isP001LocalHostQuery} from '../lib/g678-alg-l06-p001-host-query';

test('P001 local host accepts only its direct URL and My Lesson language link', () => {
  assert.equal(isP001LocalHostQuery({host: '1'}), true);
  assert.equal(isP001LocalHostQuery({host: '1', mode: 'focus'}), true);
  for (const query of [{}, {mode: 'focus'}, {host: '0'}, {host: ['1']},
    {host: '1', mode: 'full'}, {host: '1', mode: ['focus']},
    {host: '1', mode: 'focus', extra: '1'}]) {
    assert.equal(isP001LocalHostQuery(query), false);
  }
});
