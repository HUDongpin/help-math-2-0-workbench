/** IN007's exact source activity: frame 247, buttons 128/130, txtEntry and Box_1..100.
 * Keep Number/string-division semantics; arbitrary modulo rules are not substituted.
 */
export interface In007Interaction {
  readonly seed: number;
  readonly replay: number;
  readonly entry: string;
  readonly shaded: readonly number[];
}
export type In007Action =
  | Readonly<{type: 'entry'; value: string}>
  | Readonly<{type: 'shade'}>
  | Readonly<{type: 'clear'}>;

export function createIn007Interaction(seed: number, replay = 0): In007Interaction {
  return {seed: seed >>> 0, replay, entry: '', shaded: []};
}

export function reduceIn007Interaction(state: In007Interaction, action: In007Action, sourceFrame: number): In007Interaction {
  // The authored controls and dynamic txtEntry do not exist before the quiz hold.
  if (!Number.isInteger(sourceFrame) || sourceFrame < 247 || sourceFrame > 250) return state;
  if (action.type === 'entry') return {...state, entry: action.value.replace(/[^0-9]/g, '')};
  if (action.type === 'clear') return {...state, entry: '', shaded: []};
  if (state.entry === '') return state;
  const value = Number(state.entry);
  if (value < 1 || value > 100) return state;
  const shaded: number[] = [];
  for (let cell = 1; cell <= 100; cell++) {
    if ((cell / value).toString().indexOf('.') === -1) shaded.push(cell);
  }
  return {...state, shaded};
}
