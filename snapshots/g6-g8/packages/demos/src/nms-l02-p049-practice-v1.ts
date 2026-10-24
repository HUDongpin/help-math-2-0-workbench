/** Source L2TI08.swf 896e38a05c5e6392f7e9284aa278a5b7e10c13b15f7911fa09d1dc9b1de865b2.
 * Buttons67/140/150; sprite156 stops327/350/370, branch385; callbacks72/143/153/74.
 * Native phase completions are clock/audio events, not original ActionScript execution.
 */
export type P049Phase = 'intro' | 'ready' | 'correct-feedback' | 'wrong-feedback' | 'answer-transition' | 'outro' | 'complete';
export interface P049State {
  readonly phase: P049Phase;
  readonly question: 0 | 1 | 2;
  readonly digits: readonly [string, string];
  readonly wrongAttempts: number;
  readonly correctCount: number;
  readonly helpOpen: boolean;
  readonly hintOpen: boolean;
  readonly replay: number;
  readonly token: number;
}
export type P049Event =
  | {type: 'input'; field: 0 | 1; value: string}
  | {type: 'submit' | 'close-hint' | 'replay'}
  | {type: 'help'; open: boolean}
  | {type: 'phase-finished'; token: number};
export const P049_QUESTION_STOPS = [327, 350, 370] as const;
export const P049_ANSWER_DIGITS = [['8', '0'], ['3', '7'], ['9', '8']] as const;
export function p049Initial(replay = 0, token = 0): P049State {
  return {phase:'intro',question:0,digits:['',''],wrongAttempts:0,correctCount:0,helpOpen:false,hintOpen:false,replay,token};
}
export function p049AnswerMatches(question: 0 | 1 | 2, digits: readonly [string,string]): boolean {
  const answer = P049_ANSWER_DIGITS[question];
  return digits[0] === answer[0] && (digits[1] === answer[1] || (question === 0 && digits[1] === ''));
}
/** Main frame range after source parent.play(), before the next stop or final branch. */
export function p049TransitionFrames(question: 0 | 1 | 2): readonly [number,number] {
  return [P049_QUESTION_STOPS[question] + 1, question === 2 ? 385 : P049_QUESTION_STOPS[question + 1]!];
}
export function p049OutroStart(state: P049State): 386 | 411 {
  return state.correctCount === 3 ? 386 : 411;
}
/** Shared source-timed answer display for live, static and text presentations. */
export function p049DisplayedDigits(state:P049State,frame:number):readonly [string,string]{
 const transitioning=state.phase==='answer-transition'||state.phase==='outro'||state.phase==='complete';
 if(transitioning&&state.question===2&&frame>=371&&frame<390)return ['',''];
 return transitioning&&frame>=[328,351,390][state.question]! ? P049_ANSWER_DIGITS[state.question] : state.digits;
}
export function p049Reduce(s: P049State, e: P049Event): P049State {
  if (e.type === 'replay') return p049Initial(s.replay + 1, s.token + 1);
  if (e.type === 'close-hint') {
    // Source button118 restores input immediately. Native clock cancels this attempt's audio.
    return s.phase === 'wrong-feedback' && s.hintOpen
      ? {...s,phase:'ready',hintOpen:false,token:s.token+1} : s;
  }
  if (e.type === 'phase-finished') {
    if (e.token !== s.token || s.helpOpen) return s;
    if (s.phase === 'intro') return {...s,phase:'ready',token:s.token+1};
    if (s.phase === 'correct-feedback') return {...s,phase:'answer-transition',correctCount:s.correctCount+1,token:s.token+1};
    if (s.phase === 'wrong-feedback') {
      // First wrong keeps the source hint visible; second wrong resumes the parent timeline.
      return s.wrongAttempts >= 2 ? {...s,phase:'answer-transition',token:s.token+1} : s;
    }
    if (s.phase === 'answer-transition') {
      if (s.question === 2) return {...s,phase:'outro',token:s.token+1};
      return {...s,phase:'ready',question:(s.question+1) as 1 | 2,digits:['',''],wrongAttempts:0,token:s.token+1};
    }
    if (s.phase === 'outro') return {...s,phase:'complete',token:s.token+1};
    return s;
  }
  if (e.type === 'help') return s.phase === 'ready' ? {...s,helpOpen:e.open} : s;
  if (s.phase !== 'ready' || s.helpOpen) return s;
  if (e.type === 'input') {
    // Source fields have no maxLength/restrict. Do not trim or numerically coerce answers.
    return {...s,digits:e.field === 0 ? [e.value,s.digits[1]] : [s.digits[0],e.value]};
  }
  if (e.type === 'submit') {
    if (p049AnswerMatches(s.question,s.digits)) return {...s,phase:'correct-feedback',token:s.token+1};
    const wrongAttempts = s.wrongAttempts + 1;
    return {...s,phase:'wrong-feedback',wrongAttempts,hintOpen:wrongAttempts===1,token:s.token+1};
  }
  return s;
}
