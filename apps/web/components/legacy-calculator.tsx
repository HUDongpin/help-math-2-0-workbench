'use client';

import {useReducer} from 'react';

import {
  G4_L3_LEGACY_CALCULATOR_KEY_BOUNDS,
  INITIAL_LEGACY_CALCULATOR_STATE,
  legacyCalculatorKeyboardAction,
  modernCalculatorKeyboardAction,
  reduceLegacyCalculator,
  reduceModernCalculator,
  type LegacyCalculatorAction,
  type LegacyCalculatorSourceKey,
} from '@/lib/legacy-calculator';

export interface LegacyCalculatorEvidence {
  readonly behaviorKind:
    | 'ffdec-actionscript-static-candidate'
    | 'modern-support-only';
  readonly sourceAnimationId?: string;
  readonly sourceSwfSha256?: string;
  readonly panel?: Readonly<{
    asset: string;
    height: number;
    sha256: string;
    width: number;
  }>;
}

type CalculatorKey = Readonly<{
  action: LegacyCalculatorAction;
  className?: string;
  englishLabel: string;
  id: string;
  label: string;
  spanishLabel: string;
}>;

const LEGACY_KEYS: readonly CalculatorKey[] = Object.freeze([
  {
    action: {type: 'memory-add'},
    englishLabel: 'Add display to memory',
    id: 'memory-add',
    label: 'M+',
    spanishLabel: 'Sumar la pantalla a la memoria',
  },
  {
    action: {type: 'memory-recall-clear'},
    englishLabel: 'Recall and clear memory',
    id: 'memory-recall-clear',
    label: 'MRC',
    spanishLabel: 'Recuperar y borrar la memoria',
  },
  {
    action: {type: 'clear-display'},
    englishLabel: 'Clear display',
    id: 'clear-display',
    label: 'C',
    spanishLabel: 'Borrar la pantalla',
  },
  {
    action: {type: 'clear-entry'},
    englishLabel: 'Clear entry and pending operation',
    id: 'clear-entry',
    label: 'CE',
    spanishLabel: 'Borrar entrada y operación pendiente',
  },
  {
    action: {type: 'digit', digit: '1'},
    englishLabel: 'One',
    id: 'digit-1',
    label: '1',
    spanishLabel: 'Uno',
  },
  {
    action: {type: 'digit', digit: '2'},
    englishLabel: 'Two',
    id: 'digit-2',
    label: '2',
    spanishLabel: 'Dos',
  },
  {
    action: {type: 'digit', digit: '3'},
    englishLabel: 'Three',
    id: 'digit-3',
    label: '3',
    spanishLabel: 'Tres',
  },
  {
    action: {type: 'operator', operator: '/'},
    englishLabel: 'Divide',
    id: 'operator-divide',
    label: '÷',
    spanishLabel: 'Dividir',
  },
  {
    action: {type: 'digit', digit: '4'},
    englishLabel: 'Four',
    id: 'digit-4',
    label: '4',
    spanishLabel: 'Cuatro',
  },
  {
    action: {type: 'digit', digit: '5'},
    englishLabel: 'Five',
    id: 'digit-5',
    label: '5',
    spanishLabel: 'Cinco',
  },
  {
    action: {type: 'digit', digit: '6'},
    englishLabel: 'Six',
    id: 'digit-6',
    label: '6',
    spanishLabel: 'Seis',
  },
  {
    action: {type: 'operator', operator: '*'},
    englishLabel: 'Multiply',
    id: 'operator-multiply',
    label: '×',
    spanishLabel: 'Multiplicar',
  },
  {
    action: {type: 'digit', digit: '7'},
    englishLabel: 'Seven',
    id: 'digit-7',
    label: '7',
    spanishLabel: 'Siete',
  },
  {
    action: {type: 'digit', digit: '8'},
    englishLabel: 'Eight',
    id: 'digit-8',
    label: '8',
    spanishLabel: 'Ocho',
  },
  {
    action: {type: 'digit', digit: '9'},
    englishLabel: 'Nine',
    id: 'digit-9',
    label: '9',
    spanishLabel: 'Nueve',
  },
  {
    action: {type: 'operator', operator: '-'},
    englishLabel: 'Subtract',
    id: 'operator-subtract',
    label: '−',
    spanishLabel: 'Restar',
  },
  {
    action: {type: 'digit', digit: '0'},
    englishLabel: 'Zero',
    id: 'digit-0',
    label: '0',
    spanishLabel: 'Cero',
  },
  {
    action: {type: 'decimal'},
    englishLabel: 'Decimal point',
    id: 'decimal',
    label: '.',
    spanishLabel: 'Punto decimal',
  },
  {
    action: {type: 'equals'},
    englishLabel: 'Equals',
    id: 'equals',
    label: '=',
    spanishLabel: 'Igual',
  },
  {
    action: {type: 'operator', operator: '+'},
    englishLabel: 'Add',
    id: 'operator-add',
    label: '+',
    spanishLabel: 'Sumar',
  },
  {
    action: {type: 'percent'},
    className: 'lesson-shell2__calculator-key--percent',
    englishLabel: 'Percent',
    id: 'percent',
    label: '%',
    spanishLabel: 'Por ciento',
  },
  {
    action: {type: 'square-root'},
    className: 'lesson-shell2__calculator-key--square-root',
    englishLabel: 'Square root',
    id: 'square-root',
    label: '√',
    spanishLabel: 'Raíz cuadrada',
  },
]);

const MODERN_KEYS: readonly CalculatorKey[] = Object.freeze([
  {
    action: {type: 'clear-entry'},
    className: 'lesson-shell2__calculator-key--function',
    englishLabel: 'All clear',
    id: 'clear',
    label: 'AC',
    spanishLabel: 'Borrar todo',
  },
  {
    action: {type: 'toggle-sign'},
    className: 'lesson-shell2__calculator-key--function',
    englishLabel: 'Change sign',
    id: 'toggle-sign',
    label: '±',
    spanishLabel: 'Cambiar signo',
  },
  {
    action: {type: 'percent'},
    className: 'lesson-shell2__calculator-key--function',
    englishLabel: 'Percent',
    id: 'percent',
    label: '%',
    spanishLabel: 'Por ciento',
  },
  {
    action: {type: 'operator', operator: '/'},
    className: 'lesson-shell2__calculator-key--operator',
    englishLabel: 'Divide',
    id: 'operator-divide',
    label: '÷',
    spanishLabel: 'Dividir',
  },
  {
    action: {type: 'digit', digit: '7'},
    englishLabel: 'Seven',
    id: 'digit-7',
    label: '7',
    spanishLabel: 'Siete',
  },
  {
    action: {type: 'digit', digit: '8'},
    englishLabel: 'Eight',
    id: 'digit-8',
    label: '8',
    spanishLabel: 'Ocho',
  },
  {
    action: {type: 'digit', digit: '9'},
    englishLabel: 'Nine',
    id: 'digit-9',
    label: '9',
    spanishLabel: 'Nueve',
  },
  {
    action: {type: 'operator', operator: '*'},
    className: 'lesson-shell2__calculator-key--operator',
    englishLabel: 'Multiply',
    id: 'operator-multiply',
    label: '×',
    spanishLabel: 'Multiplicar',
  },
  {
    action: {type: 'digit', digit: '4'},
    englishLabel: 'Four',
    id: 'digit-4',
    label: '4',
    spanishLabel: 'Cuatro',
  },
  {
    action: {type: 'digit', digit: '5'},
    englishLabel: 'Five',
    id: 'digit-5',
    label: '5',
    spanishLabel: 'Cinco',
  },
  {
    action: {type: 'digit', digit: '6'},
    englishLabel: 'Six',
    id: 'digit-6',
    label: '6',
    spanishLabel: 'Seis',
  },
  {
    action: {type: 'operator', operator: '-'},
    className: 'lesson-shell2__calculator-key--operator',
    englishLabel: 'Subtract',
    id: 'operator-subtract',
    label: '−',
    spanishLabel: 'Restar',
  },
  {
    action: {type: 'digit', digit: '1'},
    englishLabel: 'One',
    id: 'digit-1',
    label: '1',
    spanishLabel: 'Uno',
  },
  {
    action: {type: 'digit', digit: '2'},
    englishLabel: 'Two',
    id: 'digit-2',
    label: '2',
    spanishLabel: 'Dos',
  },
  {
    action: {type: 'digit', digit: '3'},
    englishLabel: 'Three',
    id: 'digit-3',
    label: '3',
    spanishLabel: 'Tres',
  },
  {
    action: {type: 'operator', operator: '+'},
    className: 'lesson-shell2__calculator-key--operator',
    englishLabel: 'Add',
    id: 'operator-add',
    label: '+',
    spanishLabel: 'Sumar',
  },
  {
    action: {type: 'digit', digit: '0'},
    className: 'lesson-shell2__calculator-key--zero',
    englishLabel: 'Zero',
    id: 'digit-0',
    label: '0',
    spanishLabel: 'Cero',
  },
  {
    action: {type: 'decimal'},
    englishLabel: 'Decimal point',
    id: 'decimal',
    label: '.',
    spanishLabel: 'Punto decimal',
  },
  {
    action: {type: 'equals'},
    className: 'lesson-shell2__calculator-key--operator',
    englishLabel: 'Equals',
    id: 'equals',
    label: '=',
    spanishLabel: 'Igual',
  },
]);

export function LegacyCalculator({
  evidence,
  onRequestClose,
  presentation = 'source-evidence',
  spanish,
}: {
  evidence: LegacyCalculatorEvidence;
  onRequestClose: () => void;
  presentation?: 'modern-support' | 'source-evidence';
  spanish: boolean;
}) {
  const modernSupport = presentation === 'modern-support';
  const [state, dispatch] = useReducer(
    modernSupport ? reduceModernCalculator : reduceLegacyCalculator,
    INITIAL_LEGACY_CALCULATOR_STATE,
  );
  const sourcePanel = !modernSupport && evidence.panel !== undefined;
  const keys = modernSupport ? MODERN_KEYS : LEGACY_KEYS;

  return <section
    aria-label={spanish ? 'Calculadora HELP Math' : 'HELP Math calculator'}
    className={`lesson-shell2__calculator ${
      sourcePanel ? 'lesson-shell2__calculator--source-panel' : ''
    } ${modernSupport ? 'lesson-shell2__calculator--modern-support' : ''}`}
    data-apple-basic-contract={modernSupport
      ? 'inspired-subset-no-conformance-claim'
      : undefined}
    data-behavior-authority={modernSupport
      ? 'modern-support-only'
      : evidence.behaviorKind}
    data-calculator-presentation={presentation}
    data-ibm-reference-kind={modernSupport
      ? 'rpg-calculation-specification-not-calculator-ui-standard'
      : undefined}
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
      const action = modernSupport
        ? modernCalculatorKeyboardAction(event.key)
        : legacyCalculatorKeyboardAction(event.key);
      if (!action) return;
      event.preventDefault();
      dispatch(action);
    }}
  >
    {modernSupport
      ? null
      : <p className="lesson-shell2__calculator-boundary">
          {evidence.behaviorKind === 'ffdec-actionscript-static-candidate'
            ? (spanish
                ? 'Candidato funcional derivado del ActionScript estático del shell; los casos límite aún requieren ejecución original.'
                : 'Functional candidate derived from the shell’s static ActionScript; edge cases still require original-runtime validation.')
            : (spanish
                ? 'Calculadora moderna de apoyo; no se presenta como comportamiento Flash recuperado.'
                : 'Modern support calculator; it is not presented as recovered Flash behavior.')}
        </p>}
    <div
      aria-label={spanish
        ? `Teclado: números, punto, operadores, porcentaje${
            modernSupport ? ', Retroceso' : ''
          } e Intro`
        : `Keyboard: numbers, decimal, operators, percent${
            modernSupport ? ', Backspace' : ''
          }, and Enter`}
      className="lesson-shell2__calculator-frame"
      role="group"
      tabIndex={0}
    >
      {sourcePanel && evidence.panel
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
      {modernSupport
        ? <button
            aria-label={spanish ? 'Borrar el último dígito' : 'Delete last digit'}
            className="lesson-shell2__calculator-delete"
            onClick={() => dispatch({type: 'delete-last'})}
            type="button"
          >
            <span aria-hidden="true">⌫</span>
          </button>
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
        {keys.map((key) =>
          {
            const sourceBounds = sourcePanel
              ? G4_L3_LEGACY_CALCULATOR_KEY_BOUNDS[
                  key.label as LegacyCalculatorSourceKey
                ]
              : undefined;
            const allClear = modernSupport && key.id === 'clear' &&
              state.allClearAvailable;
            const label = modernSupport && key.id === 'clear'
              ? (allClear ? 'AC' : 'C')
              : key.label;
            const action = modernSupport && key.id === 'clear'
              ? (allClear
                  ? {type: 'clear-entry'} as const
                  : {type: 'clear-display'} as const)
              : key.action;
            const englishLabel = modernSupport && key.id === 'clear'
              ? (allClear ? 'All clear' : 'Clear current entry')
              : key.englishLabel;
            const spanishLabel = modernSupport && key.id === 'clear'
              ? (allClear ? 'Borrar todo' : 'Borrar entrada actual')
              : key.spanishLabel;
            return <button
              aria-label={spanish ? spanishLabel : englishLabel}
              className={key.className}
              data-key-label={label}
              data-source-height={sourceBounds?.height}
              data-source-width={sourceBounds?.width}
              data-source-x={sourceBounds?.x}
              data-source-y={sourceBounds?.y}
              key={key.id}
              onClick={() => dispatch(action)}
              style={sourceBounds
                ? {
                    height: `${(sourceBounds.height / 488) * 100}%`,
                    left: `${(sourceBounds.x / 363) * 100}%`,
                    top: `${(sourceBounds.y / 488) * 100}%`,
                    width: `${(sourceBounds.width / 363) * 100}%`,
                  }
                : undefined}
              type="button"
            >
              <span>{label}</span>
            </button>;
          }
        )}
      </div>
    </div>
    {modernSupport
      ? null
      : <>
          <p className="lesson-shell2__calculator-memory" aria-live="polite">
            {spanish ? 'Memoria' : 'Memory'}: {String(state.memory)}
          </p>
          <small>
            {spanish
              ? 'El teclado es una mejora accesible de HELP Math 2.0; no es evidencia de paridad del teclado Flash.'
              : 'Keyboard input is a HELP Math 2.0 accessibility enhancement, not evidence of Flash keyboard parity.'}
          </small>
        </>}
  </section>;
}
