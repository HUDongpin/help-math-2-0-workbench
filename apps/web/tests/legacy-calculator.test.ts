import assert from 'node:assert/strict';
import test from 'node:test';

import {
  G4_L3_LEGACY_CALCULATOR_KEY_BOUNDS,
  INITIAL_LEGACY_CALCULATOR_STATE,
  legacyCalculatorKeyboardAction,
  modernCalculatorKeyboardAction,
  reduceLegacyCalculator,
  reduceModernCalculator,
  type LegacyCalculatorAction,
  type LegacyCalculatorSourceKey,
  type LegacyCalculatorState,
} from '../lib/legacy-calculator';

function run(actions: readonly LegacyCalculatorAction[]): LegacyCalculatorState {
  return actions.reduce(
    reduceLegacyCalculator,
    INITIAL_LEGACY_CALCULATOR_STATE,
  );
}

function runModern(
  actions: readonly LegacyCalculatorAction[],
): LegacyCalculatorState {
  return actions.reduce(
    reduceModernCalculator,
    INITIAL_LEGACY_CALCULATOR_STATE,
  );
}

test('digit and decimal input follows the source AddDigit clear contract', () => {
  assert.deepEqual(run([
    {type: 'digit', digit: '0'},
    {type: 'digit', digit: '4'},
    {type: 'decimal'},
    {type: 'decimal'},
    {type: 'digit', digit: '5'},
  ]), {
    ...INITIAL_LEGACY_CALCULATOR_STATE,
    decimalEntered: true,
    display: '4.5',
  });
});

test('operators apply immediately and equals preserves the displayed result', () => {
  const state = run([
    {type: 'digit', digit: '1'},
    {type: 'digit', digit: '2'},
    {type: 'operator', operator: '+'},
    {type: 'digit', digit: '3'},
    {type: 'operator', operator: '*'},
    {type: 'digit', digit: '2'},
    {type: 'equals'},
  ]);
  assert.equal(state.display, '30');
  assert.equal(state.operator, '=');
  assert.equal(state.clearOnNextDigit, true);
});

test('operator and equals preserve display text when no arithmetic branch runs', () => {
  const decimalThenEquals = run([
    {type: 'decimal'},
    {type: 'equals'},
  ]);
  assert.equal(decimalThenEquals.display, '0.');

  const decimalThenOperator = run([
    {type: 'decimal'},
    {type: 'operator', operator: '+'},
  ]);
  assert.equal(decimalThenOperator.display, '0.');
  assert.equal(decimalThenOperator.operand1, '0.');

  assert.equal(reduceLegacyCalculator(
    decimalThenEquals,
    {type: 'operator', operator: '*'},
  ).display, '0.');
});

test('C clears only the display while CE resets the pending operation', () => {
  const displayCleared = run([
    {type: 'digit', digit: '8'},
    {type: 'operator', operator: '+'},
    {type: 'digit', digit: '4'},
    {type: 'clear-display'},
    {type: 'digit', digit: '2'},
    {type: 'equals'},
  ]);
  assert.equal(displayCleared.display, '10');

  const entryCleared = run([
    {type: 'digit', digit: '8'},
    {type: 'operator', operator: '+'},
    {type: 'clear-entry'},
    {type: 'digit', digit: '2'},
    {type: 'equals'},
  ]);
  assert.equal(entryCleared.display, '2');
  assert.equal(entryCleared.operator, '=');
});

test('M+ and MRC preserve the source one-button recall-and-clear behavior', () => {
  const state = run([
    {type: 'digit', digit: '7'},
    {type: 'memory-add'},
    {type: 'clear-display'},
    {type: 'digit', digit: '3'},
    {type: 'memory-add'},
    {type: 'memory-recall-clear'},
  ]);
  assert.equal(state.display, '10');
  assert.equal(state.memory, 0);
  assert.equal(state.clearOnNextDigit, true);
});

test('square root, percent, and divide by zero retain source-like Number text', () => {
  assert.equal(run([
    {type: 'digit', digit: '9'},
    {type: 'square-root'},
  ]).display, '3');
  assert.equal(run([
    {type: 'digit', digit: '5'},
    {type: 'digit', digit: '0'},
    {type: 'percent'},
  ]).display, '0.5');
  assert.equal(run([
    {type: 'digit', digit: '1'},
    {type: 'operator', operator: '/'},
    {type: 'digit', digit: '0'},
    {type: 'equals'},
  ]).display, 'Infinity');
});

test('keyboard mapping is an explicit modern enhancement with a small allowlist', () => {
  assert.deepEqual(legacyCalculatorKeyboardAction('7'), {type: 'digit', digit: '7'});
  assert.deepEqual(legacyCalculatorKeyboardAction('x'), {type: 'operator', operator: '*'});
  assert.deepEqual(legacyCalculatorKeyboardAction('Enter'), {type: 'equals'});
  assert.equal(legacyCalculatorKeyboardAction('Escape'), null);
  assert.equal(legacyCalculatorKeyboardAction('Backspace'), null);
});

test('modern support repeats equals and replaces a pending operator', () => {
  assert.equal(runModern([
    {type: 'digit', digit: '2'},
    {type: 'operator', operator: '+'},
    {type: 'digit', digit: '3'},
    {type: 'equals'},
    {type: 'equals'},
  ]).display, '8');

  assert.equal(runModern([
    {type: 'digit', digit: '2'},
    {type: 'operator', operator: '+'},
    {type: 'operator', operator: '*'},
    {type: 'digit', digit: '3'},
    {type: 'equals'},
  ]).display, '6');
});

test('modern support handles contextual percent and classroom-safe result text', () => {
  assert.equal(runModern([
    {type: 'digit', digit: '2'},
    {type: 'digit', digit: '0'},
    {type: 'digit', digit: '0'},
    {type: 'operator', operator: '+'},
    {type: 'digit', digit: '1'},
    {type: 'digit', digit: '0'},
    {type: 'percent'},
    {type: 'equals'},
  ]).display, '220');

  assert.equal(runModern([
    {type: 'decimal'},
    {type: 'digit', digit: '1'},
    {type: 'operator', operator: '+'},
    {type: 'decimal'},
    {type: 'digit', digit: '2'},
    {type: 'equals'},
  ]).display, '0.3');

  assert.equal(runModern([
    {type: 'digit', digit: '1'},
    {type: 'operator', operator: '/'},
    {type: 'digit', digit: '0'},
    {type: 'equals'},
  ]).display, 'Error');
});

test('modern support distinguishes C from AC when zero is an entered operand', () => {
  const enteredZero = runModern([
    {type: 'digit', digit: '5'},
    {type: 'operator', operator: '+'},
    {type: 'digit', digit: '0'},
  ]);
  assert.equal(enteredZero.display, '0');
  assert.equal(enteredZero.operator, '+');
  assert.equal(enteredZero.allClearAvailable, false);

  const clearedEntry = reduceModernCalculator(
    enteredZero,
    {type: 'clear-display'},
  );
  assert.equal(clearedEntry.operator, '+');
  assert.equal(clearedEntry.allClearAvailable, true);
  assert.deepEqual(
    reduceModernCalculator(clearedEntry, {type: 'clear-entry'}),
    INITIAL_LEGACY_CALCULATOR_STATE,
  );
});

test('modern support changes sign, deletes the last digit, and maps delete keys', () => {
  const state = runModern([
    {type: 'digit', digit: '1'},
    {type: 'digit', digit: '2'},
    {type: 'digit', digit: '3'},
    {type: 'toggle-sign'},
    {type: 'delete-last'},
  ]);
  assert.equal(state.display, '-12');
  assert.deepEqual(
    modernCalculatorKeyboardAction('Backspace'),
    {type: 'delete-last'},
  );
  assert.deepEqual(
    modernCalculatorKeyboardAction('Delete'),
    {type: 'delete-last'},
  );
  assert.equal(legacyCalculatorKeyboardAction('Delete'), null);
});

test('all 22 source-panel keys cover their independent source centers and stay in bounds', () => {
  const panel = {width: 363, height: 488};
  const expectedCenters: Readonly<
    Record<LegacyCalculatorSourceKey, readonly [number, number]>
  > = {
    'M+': [70, 177.5],
    MRC: [145, 177.5],
    C: [221, 177.5],
    CE: [296.5, 177.5],
    '1': [70.5, 223],
    '2': [145.5, 223],
    '3': [220.5, 223],
    '÷': [295.5, 223],
    '4': [70.5, 274],
    '5': [145.5, 274],
    '6': [220.5, 274],
    '×': [295.5, 274],
    '7': [70.5, 326],
    '8': [145.5, 326],
    '9': [220.5, 326],
    '−': [295.5, 326],
    '0': [70.5, 384],
    '.': [145.5, 384],
    '=': [220.5, 384],
    '+': [295.5, 384],
    '%': [221, 440.5],
    '√': [296, 440.5],
  };
  const entries = Object.entries(G4_L3_LEGACY_CALCULATOR_KEY_BOUNDS) as [
    LegacyCalculatorSourceKey,
    (typeof G4_L3_LEGACY_CALCULATOR_KEY_BOUNDS)[LegacyCalculatorSourceKey],
  ][];
  assert.equal(entries.length, 22);

  for (const [key, bounds] of entries) {
    const [centerX, centerY] = expectedCenters[key];
    assert.ok(bounds.x >= 0 && bounds.y >= 0, `${key} starts in panel`);
    assert.ok(
      bounds.x + bounds.width <= panel.width &&
        bounds.y + bounds.height <= panel.height,
      `${key} ends in panel`,
    );
    assert.ok(
      centerX >= bounds.x && centerX <= bounds.x + bounds.width,
      `${key} covers source center x`,
    );
    assert.ok(
      centerY >= bounds.y && centerY <= bounds.y + bounds.height,
      `${key} covers source center y`,
    );
  }

  for (let index = 0; index < entries.length; index += 1) {
    const [leftKey, left] = entries[index];
    for (const [rightKey, right] of entries.slice(index + 1)) {
      const overlaps =
        left.x < right.x + right.width &&
        left.x + left.width > right.x &&
        left.y < right.y + right.height &&
        left.y + left.height > right.y;
      assert.equal(overlaps, false, `${leftKey}/${rightKey} do not overlap`);
    }
  }
});
