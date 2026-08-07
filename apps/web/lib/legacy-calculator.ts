export type LegacyCalculatorOperator = '' | '+' | '-' | '*' | '/' | '=';

export interface LegacyCalculatorState {
  readonly clearOnNextDigit: boolean;
  readonly decimalEntered: boolean;
  readonly display: string;
  readonly memory: number;
  readonly operand1: number | string | null;
  readonly operator: LegacyCalculatorOperator;
}

export type LegacyCalculatorSourceKey =
  | 'M+'
  | 'MRC'
  | 'C'
  | 'CE'
  | '1'
  | '2'
  | '3'
  | '÷'
  | '4'
  | '5'
  | '6'
  | '×'
  | '7'
  | '8'
  | '9'
  | '−'
  | '0'
  | '.'
  | '='
  | '+'
  | '%'
  | '√';

export interface LegacyCalculatorSourceBounds {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

/**
 * Visible button bounds in the 363 × 488 G4 L3 source-panel asset. These
 * preserve the non-uniform source rows instead of approximating them with an
 * equal-height CSS grid.
 */
export const G4_L3_LEGACY_CALCULATOR_KEY_BOUNDS: Readonly<
  Record<LegacyCalculatorSourceKey, LegacyCalculatorSourceBounds>
> = Object.freeze({
  'M+': Object.freeze({x: 41, y: 165, width: 58, height: 25}),
  MRC: Object.freeze({x: 116, y: 165, width: 58, height: 25}),
  C: Object.freeze({x: 192, y: 165, width: 58, height: 25}),
  CE: Object.freeze({x: 268, y: 165, width: 57, height: 25}),
  '1': Object.freeze({x: 38, y: 204, width: 65, height: 38}),
  '2': Object.freeze({x: 113, y: 204, width: 65, height: 38}),
  '3': Object.freeze({x: 188, y: 204, width: 65, height: 38}),
  '÷': Object.freeze({x: 263, y: 204, width: 65, height: 38}),
  '4': Object.freeze({x: 38, y: 255, width: 65, height: 38}),
  '5': Object.freeze({x: 113, y: 255, width: 65, height: 38}),
  '6': Object.freeze({x: 188, y: 255, width: 65, height: 38}),
  '×': Object.freeze({x: 263, y: 255, width: 65, height: 38}),
  '7': Object.freeze({x: 38, y: 307, width: 65, height: 38}),
  '8': Object.freeze({x: 113, y: 307, width: 65, height: 38}),
  '9': Object.freeze({x: 188, y: 307, width: 65, height: 38}),
  '−': Object.freeze({x: 263, y: 307, width: 65, height: 38}),
  '0': Object.freeze({x: 38, y: 365, width: 65, height: 38}),
  '.': Object.freeze({x: 113, y: 365, width: 65, height: 38}),
  '=': Object.freeze({x: 188, y: 365, width: 65, height: 38}),
  '+': Object.freeze({x: 263, y: 365, width: 65, height: 38}),
  '%': Object.freeze({x: 189, y: 421, width: 64, height: 39}),
  '√': Object.freeze({x: 264, y: 421, width: 64, height: 39}),
});

export type LegacyCalculatorAction =
  | Readonly<{type: 'digit'; digit: string}>
  | Readonly<{type: 'decimal'}>
  | Readonly<{type: 'operator'; operator: Exclude<LegacyCalculatorOperator, '' | '='>}>
  | Readonly<{type: 'equals'}>
  | Readonly<{type: 'square-root'}>
  | Readonly<{type: 'percent'}>
  | Readonly<{type: 'memory-add'}>
  | Readonly<{type: 'memory-recall-clear'}>
  | Readonly<{type: 'clear-display'}>
  | Readonly<{type: 'clear-entry'}>;

export const INITIAL_LEGACY_CALCULATOR_STATE: LegacyCalculatorState =
  Object.freeze({
    clearOnNextDigit: false,
    decimalEntered: false,
    display: '0',
    memory: 0,
    operand1: null,
    operator: '',
  });

function displayNumber(value: number): string {
  // ActionScript assigned Number values directly to the dynamic display text.
  // String() preserves the useful JavaScript equivalents, including Infinity
  // and NaN, without inventing locale formatting or rounding.
  return String(value);
}

function addDigit(
  state: LegacyCalculatorState,
  digit: string,
): LegacyCalculatorState {
  const prepared = state.clearOnNextDigit
    ? {
        ...state,
        clearOnNextDigit: false,
        decimalEntered: false,
        display: '0',
      }
    : state;
  return {
    ...prepared,
    display: prepared.display === '0' && digit !== '.'
      ? digit
      : `${prepared.display}${digit}`,
  };
}

function applyOperator(
  state: LegacyCalculatorState,
  newOperator?: Exclude<LegacyCalculatorOperator, '' | '='>,
): LegacyCalculatorState {
  const left = Number(state.operand1 ?? 0);
  const right = Number(state.display);
  const result = state.operator === '+'
    ? left + right
    : state.operator === '-'
      ? left - right
      : state.operator === '*'
        ? left * right
        : state.operator === '/'
          ? left / right
          : null;
  // The source DoOperator only assigns a Number result inside one of the four
  // arithmetic branches. With no pending operator (or after "="), it leaves
  // display text such as "0." untouched.
  const display = result === null ? state.display : displayNumber(result);
  return {
    ...state,
    clearOnNextDigit: true,
    decimalEntered: false,
    display,
    operand1: newOperator ? (result ?? state.display) : state.operand1,
    operator: newOperator ?? '=',
  };
}

export function reduceLegacyCalculator(
  state: LegacyCalculatorState,
  action: LegacyCalculatorAction,
): LegacyCalculatorState {
  switch (action.type) {
    case 'digit':
      if (!/^[0-9]$/.test(action.digit)) return state;
      return addDigit(state, action.digit);
    case 'decimal':
      if (state.decimalEntered) return state;
      return {
        ...addDigit(state, '.'),
        decimalEntered: true,
      };
    case 'operator':
      return applyOperator(state, action.operator);
    case 'equals':
      return applyOperator(state);
    case 'square-root':
      return {
        ...state,
        display: displayNumber(Math.sqrt(Number.parseFloat(state.display))),
      };
    case 'percent':
      return {
        ...state,
        display: displayNumber(Number.parseFloat(state.display) / 100),
      };
    case 'memory-add':
      return {
        ...state,
        memory: state.memory + Number(state.display),
      };
    case 'memory-recall-clear':
      return {
        ...state,
        clearOnNextDigit: true,
        display: displayNumber(state.memory),
        memory: 0,
      };
    case 'clear-display':
      return {
        ...state,
        decimalEntered: false,
        display: '0',
      };
    case 'clear-entry':
      return {
        ...state,
        clearOnNextDigit: false,
        decimalEntered: false,
        display: '0',
        operand1: null,
        operator: '',
      };
  }
}

export function legacyCalculatorKeyboardAction(
  key: string,
): LegacyCalculatorAction | null {
  if (/^[0-9]$/.test(key)) return {type: 'digit', digit: key};
  if (key === '.' || key === ',') return {type: 'decimal'};
  if (key === '+') return {type: 'operator', operator: '+'};
  if (key === '-') return {type: 'operator', operator: '-'};
  if (key === '*' || key.toLowerCase() === 'x') {
    return {type: 'operator', operator: '*'};
  }
  if (key === '/') return {type: 'operator', operator: '/'};
  if (key === '=' || key === 'Enter') return {type: 'equals'};
  if (key === '%') return {type: 'percent'};
  return null;
}
