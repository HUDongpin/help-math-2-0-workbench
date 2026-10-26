import assert from 'node:assert/strict';
import test from 'node:test';
import { p042EquivalentForms, replayP042Practice, setP042Percentage, type P042Handle, type P042Percentages } from '../src/nms-l02-p042-practice-v1';

test('source initial state and deterministic Replay', () => {
  const original = Object.freeze(replayP042Practice());
  assert.deepEqual(original, [25, 25, 25, 25]);
  assert.deepEqual(setP042Percentage(original, 0, 40), [40, 10, 25, 25]);
  assert.deepEqual(original, [25, 25, 25, 25]);
  assert.deepEqual(replayP042Practice(), original);
  assert.notEqual(replayP042Practice(), original);
});

test('recorded source negative-successor trace is bounded mathematically', () => {
  const first = setP042Percentage(replayP042Practice(), 0, 50);
  assert.deepEqual(first, [50, 0, 25, 25]);
  assert.deepEqual(setP042Percentage(first, 1, 50), [50, 25, 0, 25]);
  assert.deepEqual(setP042Percentage([0, 0, 0, 100], 0, 100), [0, 0, 0, 100]);
});

test('all 176851 integer partitions preserve total and untouched components at transfer boundaries', () => {
  let states = 0;
  for (let a = 0; a <= 100; a++) for (let b = 0; b <= 100 - a; b++) for (let c = 0; c <= 100 - a - b; c++) {
    const values: P042Percentages = [a, b, c, 100 - a - b - c]; states++;
    for (const handle of [0, 1, 2] as const) for (const request of [-1, 0, 25, 50, 100, 101]) {
      const next = setP042Percentage(values, handle, request);
      assert.equal(next.reduce((sum, n) => sum + n, 0), 100);
      assert.ok(next.every(n => Number.isInteger(n) && n >= 0 && n <= 100));
      for (let index = 0; index < 4; index++) if (index !== handle && index !== handle + 1) assert.equal(next[index], values[index]);
    }
  }
  assert.equal(states, 176851);
});

test('equivalent forms represent every integer percentage exactly', () => {
  for (let percent = 0; percent <= 100; percent++) {
    const forms = p042EquivalentForms(percent);
    assert.equal(forms.numerator * 100, percent * forms.denominator);
    assert.equal(Number(forms.decimal), percent / 100);
    assert.ok(Number.isInteger(forms.numerator) && Number.isInteger(forms.denominator));
  }
  assert.deepEqual(p042EquivalentForms(0), { numerator: 0, denominator: 100, decimal: '0', percent: '0%' });
  assert.deepEqual(p042EquivalentForms(30), { numerator: 3, denominator: 10, decimal: '0.3', percent: '30%' });
});

test('invalid numeric input and a fourth independent handle fail explicitly', () => {
  for (const value of [NaN, Infinity, -Infinity]) assert.throws(() => setP042Percentage(replayP042Practice(), 0, value), RangeError);
  assert.throws(() => setP042Percentage([25, 25, 25, 24], 0, 20), RangeError);
  assert.throws(() => setP042Percentage(replayP042Practice(), 3 as P042Handle, 20), RangeError);
  for (const value of [-1, 101, 0.5, NaN]) assert.throws(() => p042EquivalentForms(value), RangeError);
});
