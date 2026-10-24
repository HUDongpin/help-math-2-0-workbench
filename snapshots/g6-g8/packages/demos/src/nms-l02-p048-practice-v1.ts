/** Source: L2TI07.swf SHA18786203d58efb8aa54c3701e72838887d0702ff03d68819830938a252facce7.
 * Script498/330 and buttons419,422,437; callbacks448/25,450/25.
 * Audio/intro clocks are separate. Seeded RNG is a native reproducibility adapter.
 */
export type P048Phase = 'intro' | 'ready' | 'wrong-feedback' | 'correct-feedback' | 'reveal' | 'continuation' | 'complete';
export interface P048State {
  readonly phase: P048Phase;
  readonly remaining: readonly number[];
  readonly target: number | null;
  readonly question: number;
  readonly value: number;
  readonly attempts: number;
  readonly helpOpen: boolean;
  readonly seed: number;
  readonly rng: number;
  readonly replay: number;
  readonly token: number;
}
export type P048Event =
  | {type: 'intro-finished'; token: number}
  | {type: 'input'; value: number}
  | {type: 'submit' | 'reset' | 'close-feedback' | 'replay'}
  | {type: 'help'; open: boolean}
  | {type: 'phase-finished'; token: number};
export function p048Initial(seed = 0, replay = 0, token = 0): P048State {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('P048_SEED');
  return {phase:'intro', remaining:[85,50,25], target:null, question:0, value:0, attempts:0, helpOpen:false, seed, rng:seed, replay, token};
}
function nextQuestion(s: P048State): P048State {
  if (!s.remaining.length) return {...s,phase:'continuation',helpOpen:false,token:s.token+1};
  const rng = (Math.imul(s.rng,1664525)+1013904223)>>>0;
  const index = Math.floor(rng / 0x100000000 * s.remaining.length);
  return {...s,phase:'ready',remaining:s.remaining.filter((_,i)=>i!==index),target:s.remaining[index]!,question:s.question+1,value:0,attempts:0,helpOpen:false,rng,token:s.token+1};
}
export function p048Reduce(s: P048State, e: P048Event): P048State {
  if (e.type==='replay') return p048Initial(s.seed,s.replay+1,s.token+1);
  if (e.type==='intro-finished') return s.phase==='intro'&&e.token===s.token?nextQuestion(s):s;
  if (e.type==='phase-finished') {
    if(e.token!==s.token||s.helpOpen)return s;
    if(s.phase==='correct-feedback'||s.phase==='reveal')return nextQuestion(s);
    if(s.phase==='continuation')return {...s,phase:'complete',token:s.token+1};
    return s;
  }
  if(e.type==='help')return s.phase==='ready'?{...s,helpOpen:e.open}:s;
  if(e.type==='close-feedback') {
    if(s.phase!=='wrong-feedback')return s;
    return s.attempts>=2
      ? {...s,phase:'reveal',value:s.target!,token:s.token+1}
      : {...s,phase:'ready',token:s.token+1};
  }
  if(s.phase!=='ready'||s.helpOpen)return s;
  if(e.type==='input') {
    if(!Number.isInteger(e.value)||e.value<0||e.value>100)throw Error('P048_HUNDREDTHS');
    return {...s,value:e.value};
  }
  if(e.type==='reset')return {...s,value:0}; // Source reset does not reset tryCount.
  if(e.type==='submit')return {...s,attempts:s.attempts+1,phase:s.value===s.target?'correct-feedback':'wrong-feedback',token:s.token+1};
  return s;
}
export function p048Decimal(value: number): string {
  if(!Number.isInteger(value)||value<0||value>100)throw Error('P048_HUNDREDTHS');
  return `${Math.floor(value/100)}.${String(value%100).padStart(2,'0')}`;
}
/** Consistent native answer-reveal position; original mismatching X values remain in audit. */
export function p048SliderX(value: number): number {
  p048Decimal(value);
  return Math.max(-330,Math.min(-75,(value-31)*150/59-250));
}
