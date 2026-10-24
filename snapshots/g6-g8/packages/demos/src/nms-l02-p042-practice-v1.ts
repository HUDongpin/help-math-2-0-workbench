/** P042 sprite 261 / frame 625: adjacent-color transfers.
 * Source: 6dce91764e5744cf72cbdb2a2d1a10990a1c3eb1f42f5aace4cb3be33a67fad0.
 * Mathematical correction: clamp to the pair total, and reduce fractions by GCD.
 * These corrections are not claims of original-runtime parity.
 */
export type P042Percentages = readonly [number, number, number, number];
export type P042Handle = 0 | 1 | 2;

export function replayP042Practice(): P042Percentages {
  return [25, 25, 25, 25];
}

function validate(values: P042Percentages): void {
  if (values.length !== 4 || values.some(value => !Number.isInteger(value) || value < 0 || value > 100)
    || values.reduce((sum, value) => sum + value, 0) !== 100) {
    throw new RangeError('P042 requires four nonnegative integer percentages totaling 100.');
  }
}

/** Set one component; transfer its change to the next color, as in the source. */
export function setP042Percentage(
  values: P042Percentages, handle: P042Handle, requested: number,
): P042Percentages {
  validate(values);
  if (!Number.isInteger(handle) || handle < 0 || handle > 2 || !Number.isFinite(requested)) {
    throw new RangeError('P042 requires one of three handles and a finite percentage.');
  }
  const pairTotal = values[handle] + values[handle + 1];
  const next = [...values] as [number, number, number, number];
  next[handle] = Math.max(0, Math.min(pairTotal, Math.round(requested)));
  next[handle + 1] = pairTotal - next[handle];
  return next;
}

export function p042EquivalentForms(percent: number): {
  numerator: number; denominator: number; decimal: string; percent: string;
} {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new RangeError('P042 percentage must be an integer from 0 to 100.');
  }
  // Source explicitly displays zero as 0/100; retain that teaching convention.
  let a = percent, b = 100;
  while (b !== 0) [a, b] = [b, a % b];
  const divisor = percent === 0 ? 1 : a;
  return {
    numerator: percent / divisor,
    denominator: 100 / divisor,
    decimal: String(percent / 100),
    percent: `${percent}%`,
  };
}
