'use client';

import {useMemo, useState} from 'react';

export function LessonCalculator({locale, open}: {locale: 'en' | 'es'; open: boolean}) {
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<'+' | '-' | '*' | '/' | null>(null);
  const [fresh, setFresh] = useState(true);

  const apply = (key: string) => {
    if (key === 'AC') {
      setDisplay('0');
      setStored(null);
      setOperator(null);
      setFresh(true);
      return;
    }
    if (key === '⌫') {
      setDisplay((value) => (value.length <= 1 ? '0' : value.slice(0, -1)));
      return;
    }
    if ('0123456789.'.includes(key)) {
      setDisplay((value) => {
        if (fresh) return key === '.' ? '0.' : key;
        if (key === '.' && value.includes('.')) return value;
        return value === '0' && key !== '.' ? key : `${value}${key}`;
      });
      setFresh(false);
      return;
    }
    const current = Number(display);
    if (!Number.isFinite(current)) return;
    if (key === '=') {
      if (stored == null || operator == null) return;
      const result =
        operator === '+'
          ? stored + current
          : operator === '-'
            ? stored - current
            : operator === '*'
              ? stored * current
              : current === 0
                ? stored
                : stored / current;
      setDisplay(String(result));
      setStored(null);
      setOperator(null);
      setFresh(true);
      return;
    }
    if (key === '+' || key === '-' || key === '*' || key === '/') {
      setStored(current);
      setOperator(key);
      setFresh(true);
    }
  };

  const keys = useMemo(
    () => ['AC', '⌫', '/', '*', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'],
    []
  );

  if (!open) return null;

  return (
    <section
      aria-label={locale === 'es' ? 'Calculadora HELP Math' : 'HELP Math calculator'}
      className="lesson-player__calculator"
      data-calculator="modern-support"
    >
      <output aria-live="polite">{display}</output>
      <div className="lesson-player__calculator-keys">
        {keys.map((key) => (
          <button key={key} onClick={() => apply(key)} type="button">
            {key}
          </button>
        ))}
      </div>
    </section>
  );
}
