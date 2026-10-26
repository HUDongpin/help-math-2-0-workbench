import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {hitTestP006Candidate, p006CandidateHitRegions} from '../src/alg-l12-p006-glossary-hit';
import {advanceP006Glossary, initialP006GlossaryState, requestP006GlossaryAfterVerifiedHit} from '../src/alg-l12-p006-glossary-state';

test('source-derived rectangular hit specification is reproducible', () => {
  const result = spawnSync('python3', ['scripts/build-g678-alg-l12-p006-hit-spec.py', '--check'],
    {cwd: new URL('../../../', import.meta.url), encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
});

test('mask prevents early activation despite button display-list presence', () => {
  for (let frame = 249; frame <= 285; frame++) assert.deepEqual(p006CandidateHitRegions(frame), []);
  for (const [id, first] of [[48, 286], [49, 311], [50, 314], [51, 332]]) {
    assert(!p006CandidateHitRegions(first - 1).some(h => h.characterId === id));
    assert(p006CandidateHitRegions(first).some(h => h.characterId === id));
  }
  for (const frame of [0, 248, 343, 249.5, NaN, Infinity]) assert.deepEqual(p006CandidateHitRegions(frame), []);
});

test('all nonempty candidate rectangles have valid centers and reject exact edges', () => {
  for (let frame = 1; frame <= 342; frame++) {
    for (const hit of p006CandidateHitRegions(frame)) {
      const [l, t, r, b] = hit.rect;
      assert(l < r && t < b && l >= 0 && r <= 800 && t >= 0 && b <= 600);
      assert.equal(hitTestP006Candidate(frame, (l + r) / 2, (t + b) / 2), hit.characterId);
      assert.equal(hitTestP006Candidate(frame, l, t), null);
      assert.equal(hitTestP006Candidate(frame, r, b), null);
      const state = advanceP006Glossary(initialP006GlossaryState(), frame - 1);
      const resolved = requestP006GlossaryAfterVerifiedHit(state, hit.characterId, true);
      assert.equal(resolved.pendingGlossary?.sourceCharacterId, hit.characterId);
    }
  }
  assert.equal(hitTestP006Candidate(342, NaN, 10), null);
  assert.equal(hitTestP006Candidate(342, 10, Infinity), null);
  assert.deepEqual(p006CandidateHitRegions(338), p006CandidateHitRegions(342));
});

test('returned geometry cannot mutate generated source state', () => {
  const before = p006CandidateHitRegions(342);
  Reflect.set(before[0].rect, '0', -999);
  assert.notEqual(p006CandidateHitRegions(342)[0].rect[0], -999);
});
