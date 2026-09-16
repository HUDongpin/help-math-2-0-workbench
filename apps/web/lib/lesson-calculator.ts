export type CalculatorOperator = '+' | '-' | '*' | '/';

export type CalculatorEvaluation =
  | {ok: true; value: number}
  | {ok: false; display: 'undefined'};

export function evaluateCalculator(
  operator: CalculatorOperator,
  left: number,
  right: number
): CalculatorEvaluation {
  switch (operator) {
    case '+':
      return {ok: true, value: left + right};
    case '-':
      return {ok: true, value: left - right};
    case '*':
      return {ok: true, value: left * right};
    case '/':
      if (right === 0) return {ok: false, display: 'undefined'};
      return {ok: true, value: left / right};
    default: {
      const exhaustive: never = operator;
      return exhaustive;
    }
  }
}

export function isCalculatorOperator(value: string): value is CalculatorOperator {
  return value === '+' || value === '-' || value === '*' || value === '/';
}
