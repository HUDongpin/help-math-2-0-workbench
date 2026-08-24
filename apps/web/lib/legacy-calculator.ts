export type LegacyCalculatorOperator = '' | '+' | '-' | '*' | '/' | '=';

export interface LegacyCalculatorState {
  /** Modern support only: controls whether the shared clear key reads AC. */
  readonly allClearAvailable: boolean;
  readonly clearOnNextDigit: boolean;
  readonly decimalEntered: boolean;
  readonly display: string;
  readonly memory: number;
  readonly operand1: number | string | null;
  readonly operator: LegacyCalculatorOperator;
  /**
   * Modern-support repeated-equals state. The source-derived reducer leaves
   * these fields untouched, so legacy presentation keeps its recovered
   * one-shot equals behavior.
   */
  readonly repeatOperand: number | null;
  readonly repeatOperator: Exclude<LegacyCalculatorOperator, '' | '='> | null;
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
  | Readonly<{type: 'clear-entry'}>
  | Readonly<{type: 'delete-last'}>
  | Readonly<{type: 'toggle-sign'}>;

export const INITIAL_LEGACY_CALCULATOR_STATE: LegacyCalculatorState =
  Object.freeze({
    allClearAvailable: true,
    clearOnNextDigit: false,
    decimalEntered: false,
    display: '0',
    memory: 0,
    operand1: null,
    operator: '',
    repeatOperand: null,
    repeatOperator: null,
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
        repeatOperand: null,
        repeatOperator: null,
      };
    case 'delete-last':
    case 'toggle-sign':
      // These are modern-support actions. Keeping them inert here preserves
      // the source-derived reducer contract used by the legacy presentation.
      return state;
  }
}

function isBinaryOperator(
  operator: LegacyCalculatorOperator,
): operator is Exclude<LegacyCalculatorOperator, '' | '='> {
  return operator === '+' || operator === '-' || operator === '*' ||
    operator === '/';
}

function calculate(
  left: number,
  operator: Exclude<LegacyCalculatorOperator, '' | '='>,
  right: number,
) {
  if (operator === '+') return left + right;
  if (operator === '-') return left - right;
  if (operator === '*') return left * right;
  return left / right;
}

function modernDisplayNumber(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  if (Object.is(value, -0)) return '0';
  // The support calculator is intentionally a small K-12-friendly surface,
  // not an IEEE-754 debugger. Twelve significant digits suppress familiar
  // binary artifacts such as 0.1 + 0.2 while retaining ample classroom range.
  return String(Number.parseFloat(value.toPrecision(12)));
}

/**
 * HELP Math's modern basic-calculator behavior.
 *
 * This is a deliberately narrow interoperable subset: immediate four-function
 * arithmetic, contextual percent, sign change, delete-last, C/AC, and repeated
 * equals. It is not an Apple product emulation and the IBM reference supplied
 * for this work is an RPG calculation-specification reference, not a calculator
 * UI standard. No external conformance claim is made here.
 */
export function reduceModernCalculator(
  state: LegacyCalculatorState,
  action: LegacyCalculatorAction,
): LegacyCalculatorState {
  switch (action.type) {
    case 'clear-entry':
      return INITIAL_LEGACY_CALCULATOR_STATE;
    case 'clear-display':
      if (state.operator === '=' || state.display === 'Error') {
        return INITIAL_LEGACY_CALCULATOR_STATE;
      }
      return {
        ...state,
        allClearAvailable: true,
        clearOnNextDigit: false,
        decimalEntered: false,
        display: '0',
      };
    case 'delete-last': {
      if (state.operator === '=' || state.display === 'Error') {
        return INITIAL_LEGACY_CALCULATOR_STATE;
      }
      if (state.clearOnNextDigit) {
        return {
          ...state,
          allClearAvailable: false,
          clearOnNextDigit: false,
          decimalEntered: false,
          display: '0',
        };
      }
      const shortened = state.display.slice(0, -1);
      const display = shortened === '' || shortened === '-' ? '0' : shortened;
      return {
        ...state,
        allClearAvailable: false,
        decimalEntered: display.includes('.'),
        display,
      };
    }
    case 'toggle-sign': {
      if (state.display === '0' || state.display === 'Error') return state;
      return {
        ...state,
        allClearAvailable: false,
        display: state.display.startsWith('-')
          ? state.display.slice(1)
          : `-${state.display}`,
      };
    }
    case 'digit':
    case 'decimal': {
      const startingNewCalculation = state.operator === '=' &&
        state.clearOnNextDigit;
      const next = {
        ...reduceLegacyCalculator(state, action),
        allClearAvailable: false,
      };
      return startingNewCalculation
        ? {
            ...next,
            operand1: null,
            operator: '',
            repeatOperand: null,
            repeatOperator: null,
          }
        : next;
    }
    case 'operator': {
      // A second operator before a new digit replaces the pending operator;
      // it must not reuse the displayed left operand as the right operand.
      if (isBinaryOperator(state.operator) && state.clearOnNextDigit) {
        return {
          ...state,
          allClearAvailable: false,
          operator: action.operator,
          repeatOperand: null,
          repeatOperator: null,
        };
      }
      return {
        ...reduceLegacyCalculator(state, action),
        allClearAvailable: false,
        repeatOperand: null,
        repeatOperator: null,
      };
    }
    case 'equals': {
      if (isBinaryOperator(state.operator)) {
        const left = Number(state.operand1 ?? state.display);
        const right = Number(state.display);
        return {
          ...state,
          allClearAvailable: false,
          clearOnNextDigit: true,
          decimalEntered: false,
          display: modernDisplayNumber(calculate(left, state.operator, right)),
          operand1: left,
          operator: '=',
          repeatOperand: right,
          repeatOperator: state.operator,
        };
      }
      if (state.operator === '=' && state.repeatOperator !== null &&
          state.repeatOperand !== null) {
        const left = Number(state.display);
        return {
          ...state,
          allClearAvailable: false,
          clearOnNextDigit: true,
          decimalEntered: false,
          display: modernDisplayNumber(
            calculate(left, state.repeatOperator, state.repeatOperand),
          ),
          operand1: left,
        };
      }
      return {...state, clearOnNextDigit: true};
    }
    case 'percent': {
      const entered = Number(state.display);
      const value = (state.operator === '+' || state.operator === '-') &&
          state.operand1 !== null
        ? Number(state.operand1) * entered / 100
        : entered / 100;
      return {
        ...state,
        allClearAvailable: false,
        clearOnNextDigit: true,
        decimalEntered: false,
        display: modernDisplayNumber(value),
      };
    }
    case 'square-root': {
      const value = Math.sqrt(Number(state.display));
      return {
        ...state,
        allClearAvailable: false,
        clearOnNextDigit: true,
        decimalEntered: false,
        display: modernDisplayNumber(value),
      };
    }
    case 'memory-add':
    case 'memory-recall-clear':
      // The modern basic surface does not expose memory keys. Keep the actions
      // valid for a shared type without silently adding a second behavior.
      return state;
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

export function modernCalculatorKeyboardAction(
  key: string,
): LegacyCalculatorAction | null {
  if (key === 'Backspace' || key === 'Delete') return {type: 'delete-last'};
  return legacyCalculatorKeyboardAction(key);
}
