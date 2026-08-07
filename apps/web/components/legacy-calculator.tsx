'use client';

import {useReducer} from 'react';

import {
  G4_L3_LEGACY_CALCULATOR_KEY_BOUNDS,
  INITIAL_LEGACY_CALCULATOR_STATE,
  legacyCalculatorKeyboardAction,
  reduceLegacyCalculator,
  type LegacyCalculatorAction,
  type LegacyCalculatorSourceKey,
} from '@/lib/legacy-calculator';

export interface LegacyCalculatorEvidence {
  readonly behaviorKind:
    | 'ffdec-actionscript-static-candidate'
    | 'modern-support-only';
  readonly sourceAnimationId: string;
  readonly sourceSwfSha256: string;
  readonly panel?: Readonly<{
    asset: string;
    height: number;
    sha256: string;
    width: number;
  }>;
}

const KEYS: readonly Readonly<{
  action: LegacyCalculatorAction;
  className?: string;
  englishLabel: string;
  label: LegacyCalculatorSourceKey;
  spanishLabel: string;
}>[] = Object.freeze([
  {
    action: {type: 'memory-add'},
    englishLabel: 'Add display to memory',
    label: 'M+',
    spanishLabel: 'Sumar la pantalla a la memoria',
  },
  {
    action: {type: 'memory-recall-clear'},
    englishLabel: 'Recall and clear memory',
    label: 'MRC',
    spanishLabel: 'Recuperar y borrar la memoria',
  },
  {
    action: {type: 'clear-display'},
    englishLabel: 'Clear display',
    label: 'C',
    spanishLabel: 'Borrar la pantalla',
  },
  {
    action: {type: 'clear-entry'},
    englishLabel: 'Clear entry and pending operation',
    label: 'CE',
    spanishLabel: 'Borrar entrada y operación pendiente',
  },
  {
    action: {type: 'digit', digit: '1'},
    englishLabel: 'One',
    label: '1',
    spanishLabel: 'Uno',
  },
  {
    action: {type: 'digit', digit: '2'},
    englishLabel: 'Two',
    label: '2',
    spanishLabel: 'Dos',
  },
  {
    action: {type: 'digit', digit: '3'},
    englishLabel: 'Three',
    label: '3',
    spanishLabel: 'Tres',
  },
  {
    action: {type: 'operator', operator: '/'},
    englishLabel: 'Divide',
    label: '÷',
    spanishLabel: 'Dividir',
  },
  {
    action: {type: 'digit', digit: '4'},
    englishLabel: 'Four',
    label: '4',
    spanishLabel: 'Cuatro',
  },
  {
    action: {type: 'digit', digit: '5'},
    englishLabel: 'Five',
    label: '5',
    spanishLabel: 'Cinco',
  },
  {
    action: {type: 'digit', digit: '6'},
    englishLabel: 'Six',
    label: '6',
    spanishLabel: 'Seis',
  },
  {
    action: {type: 'operator', operator: '*'},
    englishLabel: 'Multiply',
    label: '×',
    spanishLabel: 'Multiplicar',
  },
  {
    action: {type: 'digit', digit: '7'},
    englishLabel: 'Seven',
    label: '7',
    spanishLabel: 'Siete',
  },
  {
    action: {type: 'digit', digit: '8'},
    englishLabel: 'Eight',
    label: '8',
    spanishLabel: 'Ocho',
  },
  {
    action: {type: 'digit', digit: '9'},
    englishLabel: 'Nine',
    label: '9',
    spanishLabel: 'Nueve',
  },
  {
    action: {type: 'operator', operator: '-'},
    englishLabel: 'Subtract',
    label: '−',
    spanishLabel: 'Restar',
  },
  {
    action: {type: 'digit', digit: '0'},
    englishLabel: 'Zero',
    label: '0',
    spanishLabel: 'Cero',
  },
  {
    action: {type: 'decimal'},
    englishLabel: 'Decimal point',
    label: '.',
    spanishLabel: 'Punto decimal',
  },
  {
    action: {type: 'equals'},
    englishLabel: 'Equals',
    label: '=',
    spanishLabel: 'Igual',
  },
  {
    action: {type: 'operator', operator: '+'},
    englishLabel: 'Add',
    label: '+',
    spanishLabel: 'Sumar',
  },
  {
    action: {type: 'percent'},
    className: 'lesson-shell2__calculator-key--percent',
    englishLabel: 'Percent',
    label: '%',
    spanishLabel: 'Por ciento',
  },
  {
    action: {type: 'square-root'},
    className: 'lesson-shell2__calculator-key--square-root',
    englishLabel: 'Square root',
    label: '√',
    spanishLabel: 'Raíz cuadrada',
  },
]);

export function LegacyCalculator({
  evidence,
  onRequestClose,
  spanish,
}: {
  evidence: LegacyCalculatorEvidence;
  onRequestClose: () => void;
  spanish: boolean;
}) {
  const [state, dispatch] = useReducer(
    reduceLegacyCalculator,
    INITIAL_LEGACY_CALCULATOR_STATE,
  );
  const sourcePanel = evidence.panel !== undefined;

  return <section
    aria-label={spanish ? 'Calculadora HELP Math' : 'HELP Math calculator'}
    className={`lesson-shell2__calculator ${
      sourcePanel ? 'lesson-shell2__calculator--source-panel' : ''
    }`}
    data-behavior-authority={evidence.behaviorKind}
    data-panel-authority={sourcePanel
      ? 'ffdec-static-structural-candidate'
      : 'modern-support-only'}
    data-panel-sha256={evidence.panel?.sha256}
    data-source-animation-id={evidence.sourceAnimationId}
    data-source-swf-sha256={evidence.sourceSwfSha256}
    onKeyDown={(event) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.target instanceof HTMLButtonElement &&
          (event.key === 'Enter' || event.key === ' '))
      ) return;
      const action = legacyCalculatorKeyboardAction(event.key);
      if (!action) return;
      event.preventDefault();
      dispatch(action);
    }}
  >
    <p className="lesson-shell2__calculator-boundary">
      {evidence.behaviorKind === 'ffdec-actionscript-static-candidate'
        ? (spanish
            ? 'Candidato funcional derivado del ActionScript estático del shell; los casos límite aún requieren ejecución original.'
            : 'Functional candidate derived from the shell’s static ActionScript; edge cases still require original-runtime validation.')
        : (spanish
            ? 'Calculadora moderna de apoyo; no se presenta como comportamiento Flash recuperado.'
            : 'Modern support calculator; it is not presented as recovered Flash behavior.')}
    </p>
    <div
      aria-label={spanish
        ? 'Teclado: números, punto, operadores, porcentaje e Intro'
        : 'Keyboard: numbers, decimal, operators, percent, and Enter'}
      className="lesson-shell2__calculator-frame"
      role="group"
      tabIndex={0}
    >
      {evidence.panel
        ? <>
            {/* This exact PNG is a source-static structural candidate. Live
                display text and hit targets are separate modern DOM layers. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              aria-hidden="true"
              className="lesson-shell2__calculator-source-image"
              height={evidence.panel.height}
              src={evidence.panel.asset}
              width={evidence.panel.width}
            />
            <button
              aria-label={spanish ? 'Cerrar calculadora' : 'Close calculator'}
              className="lesson-shell2__calculator-close"
              onClick={onRequestClose}
              type="button"
            />
          </>
        : null}
      <output
        aria-atomic="true"
        aria-label={spanish ? 'Pantalla de la calculadora' : 'Calculator display'}
        aria-live="polite"
        className="lesson-shell2__calculator-display"
        title={state.display}
      >
        {state.display}
      </output>
      <div
        aria-label={spanish ? 'Teclas de la calculadora' : 'Calculator keys'}
        className="lesson-shell2__calculator-keys"
        role="group"
      >
        {KEYS.map((key) =>
          {
            const sourceBounds =
              G4_L3_LEGACY_CALCULATOR_KEY_BOUNDS[key.label];
            return <button
              aria-label={spanish ? key.spanishLabel : key.englishLabel}
              className={key.className}
              data-key-label={key.label}
              data-source-height={sourceBounds.height}
              data-source-width={sourceBounds.width}
              data-source-x={sourceBounds.x}
              data-source-y={sourceBounds.y}
              key={`${key.label}-${key.englishLabel}`}
              onClick={() => dispatch(key.action)}
              style={sourcePanel
                ? {
                    height: `${(sourceBounds.height / 488) * 100}%`,
                    left: `${(sourceBounds.x / 363) * 100}%`,
                    top: `${(sourceBounds.y / 488) * 100}%`,
                    width: `${(sourceBounds.width / 363) * 100}%`,
                  }
                : undefined}
              type="button"
            >
              <span>{key.label}</span>
            </button>;
          }
        )}
      </div>
    </div>
    <p className="lesson-shell2__calculator-memory" aria-live="polite">
      {spanish ? 'Memoria' : 'Memory'}: {String(state.memory)}
    </p>
    <small>
      {spanish
        ? 'El teclado es una mejora accesible de HELP Math 2.0; no es evidencia de paridad del teclado Flash.'
        : 'Keyboard input is a HELP Math 2.0 accessibility enhancement, not evidence of Flash keyboard parity.'}
    </small>
  </section>;
}
