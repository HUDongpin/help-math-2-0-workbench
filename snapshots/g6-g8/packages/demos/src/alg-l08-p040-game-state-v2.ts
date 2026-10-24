import { P040_GAME as C } from './alg-l08-p040-game-config-v1';

export type P040Question = (typeof C.questions)[number];
export type P040Box = (typeof C.boxes)[number];
export type P040AnswerFlag = 'Right' | 'Wrong';
export type P040Controls = { start: boolean; clear: boolean; draw: boolean; show: boolean; repeat: boolean };
export type P040Game = {
  queue: number[];
  question: number | null;
  /** quizA/quiz persist when doInit clears only the visible txtEQ. */
  gradingQuestion: number | null;
  answerLabel: string;
  /** Diagnostic draw history includes the source's otherwise invisible double draw. */
  draws: number[];
  rng: number;
  score: number;
  scoreCells: string;
  car: { x: number; y: number; rotation: 0 | 90 | 180; frame: 1 | 2 };
  startX: number | undefined;
  startY: number | undefined;
  moveFlag: boolean;
  ansFlag: P040AnswerFlag | null;
  /** The page never initializes quizTryCount. Preserve AVM1 undefined++ as NaN. */
  quizTryCount: number | undefined;
  ansY: string;
  ansC: string;
  checkAns: string;
  responseAns: string;
  answered: boolean | undefined;
  LB: boolean;
  EB: boolean;
  gridEnabled: boolean;
  individuallyDisabled: string[];
  selected: string[];
  gridGeneration: number;
  solution: { visible: boolean; frame: number | null; playing: boolean | null };
  feedback: { kind: P040AnswerFlag; frame: number }[];
  controls: P040Controls;
};
export type P040State = {
  epoch: number;
  seed: number;
  mainFrame: number;
  mainPlaying: boolean;
  quizSection: boolean;
  startFlag: boolean | undefined;
  playFinal: boolean;
  popup: boolean;
  game: P040Game | null;
  /** Main737 references a name for which the frozen source has no instance. */
  missingFinalTarget: boolean;
  terminalControls: { start: boolean; repeat: boolean };
  retainedGlobals: Pick<P040Game, 'rng' | 'gradingQuestion' | 'answered' | 'startX' | 'startY' | 'ansFlag' | 'quizTryCount'> | null;
  unresolvedAction: 'draw-without-initialized-quizA' | 'correct-draw-with-empty-source-label' | null;
};
export type P040Action = { epoch: number } & (
  | { type: 'early-start' | 'early-skip' | 'enter-game' | 'start' | 'clear' | 'draw' | 'show-directions' | 'close-directions' | 'instruction-repeat' | 'terminal-repeat' | 'terminal-new-game' | 'tick' }
  | { type: 'pick'; box: string }
  | { type: 'replay' }
);

// The source uses AVM1 random(length), which carries no reproducible seed. The
// modern adapter uses this explicit 32-bit LCG and stores its state for Replay.
export function p040NextRandom(seed: number): number {
  return (Math.imul(seed >>> 0, 1664525) + 1013904223) >>> 0;
}
export function createP040State(seed = 1, epoch = 1): P040State {
  return { epoch, seed: seed >>> 0, mainFrame: 1, mainPlaying: true, quizSection: false,
    startFlag: undefined, playFinal: false, popup: false, game: null,
    missingFinalTarget: false, terminalControls: { start: true, repeat: true }, retainedGlobals: null, unresolvedAction: null };
}
export function p040Question(s: P040State): P040Question | null {
  return s.game?.question == null ? null : C.questions[s.game.question] ?? null;
}
export function p040Box(name: string): P040Box | null {
  return C.boxes.find(b => b.name === name) ?? null;
}
/** Deliberately retains indexOf prefix matches; this is not geometric grading. */
export function p040SourcePredicate(answerString: string, ansY: string, ansC: string): boolean {
  return answerString.indexOf(ansY) !== -1 && answerString.indexOf(ansC) !== -1;
}

function clone(s: P040State): P040State {
  const g = s.game;
  return { ...s, terminalControls: { ...s.terminalControls }, game: g && { ...g,
    queue: [...g.queue], draws: [...g.draws], car: { ...g.car },
    individuallyDisabled: [...g.individuallyDisabled], selected: [...g.selected],
    solution: { ...g.solution }, feedback: g.feedback.map(f => ({ ...f })), controls: { ...g.controls } } };
}
function initializeGame(s: P040State): void {
  // Named/depth-identical clone replacement becomes a generation-owned grid.
  // This declares lifecycle ownership without claiming AVM1 event-order parity.
  const prior = s.game;
  const globals = prior ?? s.retainedGlobals;
  s.game = { queue: C.questions.map(q => q.index), question: null, gradingQuestion: globals?.gradingQuestion ?? null, answerLabel: '', draws: [],
    rng: globals?.rng ?? s.seed, score: 0, scoreCells: '00000',
    car: { x: -208.4, y: -20, rotation: 0, frame: prior?.car.frame ?? 1 }, startX: globals?.startX, startY: globals?.startY,
    moveFlag: false, ansFlag: globals?.ansFlag ?? null, quizTryCount: globals?.quizTryCount,
    ansY: 'Undefined', ansC: 'Undefined', checkAns: '', responseAns: 'Undefined',
    answered: globals?.answered, LB: true, EB: false, gridEnabled: false,
    individuallyDisabled: [], selected: [], gridGeneration: prior?.gridGeneration ?? 1,
    solution: { visible: false, frame: 1, playing: false }, feedback: prior?.feedback.map(f => ({ ...f })) ?? [],
    controls: { start: prior?.controls.start ?? true, clear: false, draw: false, show: prior?.controls.show ?? true, repeat: false } };
  s.playFinal = false;
  s.popup = false;
  s.unresolvedAction = null;
}
function enableGrid(g: P040Game): void { g.gridEnabled = true; g.individuallyDisabled = []; }
function clearGrid(g: P040Game): void {
  g.ansY = 'Undefined'; g.ansC = 'Undefined'; g.checkAns = ''; g.responseAns = 'Undefined';
  g.LB = false; g.EB = false; g.selected = []; g.individuallyDisabled = [];
  g.gridGeneration += 1; g.controls.clear = false; g.controls.draw = false;
  // Source doClearGrid does not reset answered or call enableMC.
}
function randomQuestion(g: P040Game): void {
  enableGrid(g);
  if (!g.queue.length) g.queue = C.questions.map(q => q.index);
  g.answered = false;
  g.rng = p040NextRandom(g.rng);
  const offset = Math.floor((g.rng / 0x100000000) * g.queue.length);
  g.question = g.queue.splice(offset, 1)[0]!;
  g.gradingQuestion = g.question;
  g.answerLabel = C.questions[g.question]!.label;
  g.draws.push(g.question);
}
function start(s: P040State): void {
  initializeGame(s);
  const g = s.game!;
  g.controls.clear = true; g.controls.draw = true;
  s.startFlag = false;
  clearGrid(g); randomQuestion(g); g.responseAns = ''; g.LB = false; g.EB = false;
}
function enterGame(s: P040State): void {
  s.mainFrame = C.gameFrame; s.mainPlaying = false; s.quizSection = true;
  s.game = null;
  if (s.startFlag === true) start(s); else initializeGame(s);
  s.missingFinalTarget = false;
}
function scoreCells(g: P040Game): void {
  const raw = String(g.score);
  // Source only updates lengths 1..3, including a minus sign if one occurs.
  if (raw.length >= 1 && raw.length <= 3) g.scoreCells = raw.padStart(5, '0');
}
function draw(s: P040State): void {
  const g = s.game!;
  const q = g.gradingQuestion === null ? null : C.questions[g.gradingQuestion];
  g.LB = false; g.EB = false;
  const right = q !== null && p040SourcePredicate(q.answerString, g.ansY, g.ansC);
  if (right) {
    if (g.answerLabel === '') {
      // doInit clears ansLabel even when its old quizA remains. Preserve known
      // independent grading/feedback effects while leaving gotoAndPlay("")
      // frame and playback semantics explicitly unknown for this source shim.
      s.unresolvedAction = 'correct-draw-with-empty-source-label';
      g.solution = { visible: true, frame: null, playing: null };
    } else {
      g.solution = { visible: true, frame: q!.labelFrame, playing: q!.labelFrame !== 1 };
    }
  } else {
    g.quizTryCount = g.quizTryCount === undefined ? Number.NaN : g.quizTryCount + 1;
  }
  clearGrid(g); g.gridEnabled = false; s.startFlag = false;
  g.controls.start = false; g.controls.clear = false; g.controls.draw = false;
  if (right) {
    if (g.car.y <= -226 && g.car.rotation === 0) g.car.rotation = 90;
    if (g.car.x >= 261 && g.car.rotation === 90) g.car.rotation = 180;
  } else {
    if (g.car.y <= -230 && g.car.rotation === 180) g.car.rotation = 90;
    if (g.car.x <= -208.4 && g.car.rotation === 90) g.car.rotation = 0;
  }
  g.startX = g.car.x; g.startY = g.car.y;
  if (right) { g.score += 25; scoreCells(g); }
  else if (g.startY !== -20) { g.score -= 25; scoreCells(g); }
  const kind: P040AnswerFlag = right ? 'Right' : 'Wrong';
  g.feedback = [...g.feedback.filter(f => f.kind !== kind), { kind, frame: 2 }]
    .sort((a, b) => (a.kind === 'Wrong' ? 0 : 1) - (b.kind === 'Wrong' ? 0 : 1));
}
function finishMotion(s: P040State, g: P040Game): void {
  g.moveFlag = false; g.car.frame = 1; s.startFlag = true;
  g.controls.start = true; g.controls.clear = true; g.controls.draw = true;
  g.solution = { visible: false, frame: 1, playing: false };
  clearGrid(g); enableGrid(g); randomQuestion(g);
}
function motion(s: P040State, g: P040Game): void {
  const c = g.car;
  if (g.ansFlag === 'Right') {
    if (c.rotation === 0) {
      if (c.y >= g.startY! - 100) c.y -= 5; else finishMotion(s, g);
    } else if (c.rotation === 90) {
      if (c.x <= g.startX! + 115) c.x += 5; else finishMotion(s, g);
    } else if (c.y <= g.startY! + 75) c.y += 5; else finishMotion(s, g);
  } else if (g.ansFlag === 'Wrong') {
    if (c.y === -20) randomQuestion(g);
    if (c.rotation === 0) {
      if (c.y <= g.startY! + 100 && c.y < -20) c.y += 5; else finishMotion(s, g);
    } else if (c.rotation === 90) {
      if (c.x >= g.startX! - 116.25 && c.x > -208.4) c.x -= 5; else finishMotion(s, g);
    } else if (c.y >= g.startY! - 75 && c.y > -230) c.y -= 5; else finishMotion(s, g);
  }
  if (c.rotation === 180 && c.x >= 261 && c.y >= 90) {
    // The source's unqualified control writes are on car scope. No corrected
    // parent writes are invented; main737 removes these game objects anyway.
    s.quizSection = false; s.playFinal = true; s.mainPlaying = true;
  }
}
function terminal(s: P040State): void {
  if (s.game) {
    const { rng, gradingQuestion, answered, startX, startY, ansFlag, quizTryCount } = s.game;
    s.retainedGlobals = { rng, gradingQuestion, answered, startX, startY, ansFlag, quizTryCount };
  }
  s.mainFrame = C.finalFrame; s.mainPlaying = false; s.game = null; s.popup = false;
  s.terminalControls = { start: true, repeat: true }; s.missingFinalTarget = true;
}
function tick(s: P040State): void {
  if (s.mainFrame !== C.gameFrame) return;
  if (s.mainPlaying) { terminal(s); return; }
  const g = s.game!;
  // Modern tick ordering is explicit: existing motion first, then solution and
  // feedback. Feedback terminal arms motion for the next tick, never this tick.
  if (g.moveFlag) motion(s, g);
  if (g.solution.playing && g.solution.frame !== null) {
    g.solution.frame += 1;
    if (g.solution.frame % 10 === 0) g.solution.playing = false;
  }
  const ongoing: P040Game['feedback'] = [];
  // Independent sprite owners may overlap after Directions/Close re-enables
  // Draw. The adapter orders Wrong then Right if both terminate on one tick;
  // source AVM1 callback ordering and overlapping audio are still unverified.
  for (const feedback of g.feedback) {
    feedback.frame += 1;
    const end = feedback.kind === 'Right' ? C.rightFeedbackEnd : C.wrongFeedbackEnd;
    if (feedback.frame === end) {
      g.moveFlag = true; g.ansFlag = feedback.kind; g.car.frame = 2;
    } else ongoing.push(feedback);
  }
  g.feedback = ongoing;
}

export function reduceP040(s: P040State, a: P040Action): P040State {
  if (a.epoch !== s.epoch) return s;
  if (a.type === 'replay') return createP040State(s.seed, s.epoch + 1);
  const n = clone(s); const g = n.game;
  if (a.type === 'early-start' || a.type === 'early-skip' || a.type === 'enter-game') {
    if (n.mainFrame >= C.gameFrame) return s;
    if (a.type === 'early-start') n.startFlag = true;
    enterGame(n); return n;
  }
  if (a.type === 'instruction-repeat' || a.type === 'terminal-repeat') {
    if ((a.type === 'terminal-repeat' && (n.mainFrame !== C.finalFrame || !n.terminalControls.repeat)) ||
        (a.type === 'instruction-repeat' && !(n.mainFrame >= 600 && n.mainFrame < C.gameFrame))) return s;
    if (a.type === 'terminal-repeat') n.quizSection = false;
    n.mainFrame = C.repeatFrame; n.mainPlaying = true; n.game = null; n.popup = false;
    return n;
  }
  if (a.type === 'terminal-new-game') {
    if (n.mainFrame !== C.finalFrame || !n.terminalControls.start) return s;
    enterGame(n); return n;
  }
  if (a.type === 'tick') { tick(n); return n; }
  if (a.type === 'show-directions' && n.mainFrame === C.finalFrame) {
    n.terminalControls.start = false; n.terminalControls.repeat = false; n.popup = true; return n;
  }
  if (a.type === 'close-directions' && n.mainFrame === C.finalFrame && n.popup) {
    n.terminalControls.start = true; n.terminalControls.repeat = true; n.popup = false; return n;
  }
  if (!g || n.mainFrame !== C.gameFrame) return s;
  switch (a.type) {
    case 'start': if (!g.controls.start) return s; start(n); break;
    case 'pick': {
      const box = p040Box(a.box);
      if (!g.gridEnabled || !box || g.individuallyDisabled.includes(a.box)) return s;
      g.responseAns = ''; g.controls.clear = true;
      if (box.assignedSlot === 'AnsY') g.ansY = a.box; else g.ansC = a.box;
      g.checkAns = g.checkAns ? g.checkAns + '~' + a.box : a.box;
      if (!g.selected.includes(a.box)) g.selected.push(a.box);
      if (g.checkAns.split('~').length >= 2) {
        g.gridEnabled = false; g.controls.draw = true; g.controls.clear = true;
        g.responseAns = g.checkAns; g.checkAns = ''; g.LB = true; g.EB = true; g.answered = true;
      }
      break;
    }
    case 'clear':
      if (!g.controls.clear) return s;
      g.solution = { visible: false, frame: 1, playing: false }; clearGrid(g); enableGrid(g); break;
    case 'draw':
      if (!g.controls.draw) return s;
      // Closing directions before Start can enable picks without initializing
      // quizA. Its AVM1 undefined-method result is outside this JS logic shim.
      // Keep that path explicitly unresolved instead of inventing a grade.
      if (g.gradingQuestion === null) { n.unresolvedAction = 'draw-without-initialized-quizA'; break; }
      draw(n); break;
    case 'show-directions':
      if (!g.controls.show) return s;
      g.controls.draw = false; g.controls.clear = false; g.gridEnabled = false;
      g.controls.start = false; g.controls.show = false; n.popup = true; break;
    case 'close-directions':
      if (!n.popup) return s;
      if (g.answered) { g.gridEnabled = false; g.controls.draw = true; g.controls.clear = true; }
      else {
        enableGrid(g); g.controls.draw = false;
        if (g.ansY === '' || g.ansY === 'Undefined') g.controls.clear = false;
        else { g.individuallyDisabled = [g.ansY]; g.controls.clear = true; }
      }
      g.controls.start = true; g.controls.show = true; n.popup = false; break;
    default: return s;
  }
  return n;
}
