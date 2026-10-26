import {P005_AUDIO_RUNS, P005_AUDIO_SCHEDULE, resolveP005AudioSample,
  type P005AudioPosition} from './alg-l12-p005-audio-schedule';
import {P005AudioTransport} from './alg-l12-p005-audio-transport';

const rate = P005_AUDIO_SCHEDULE.sampleRate;
const frameSamples = P005_AUDIO_SCHEDULE.samplesPerFrame;
const terminal = P005_AUDIO_SCHEDULE.terminalTimelineSample;
const lastRun = P005_AUDIO_RUNS[1];
const terminalSourceEnd = Math.min(lastRun.sourceEndSample,
  lastRun.sourceStartSample + terminal - lastRun.timelineStartSample);

/** This composes the existing hypothesis; none of its offsets gains authority.
 * A caller supplies the complete verified decode and drives tick() from its RAF.
 * Boundary/readiness waits are candidate behavior, not original Flash timing. */
export const P005_AUDIO_CANDIDATE_CLOCK_POLICY = Object.freeze({
  status: 'inferred-unregistered-natural-audio-candidate',
  sourceSha256: P005_AUDIO_SCHEDULE.sourceSha256,
  audioSha256: P005_AUDIO_SCHEDULE.audioSha256,
  sampleRate: rate,
  fps: P005_AUDIO_SCHEDULE.fps,
  frameCount: 968,
  terminalTimelineSample: terminal,
  terminalTailSamples: lastRun.sourceEndSample - terminalSourceEnd,
  registered: false,
  originalRuntime: false,
  synchronizationAccepted: false,
  audioAccepted: false,
  mutedByDefault: true,
  clockAuthority: 'inferred-candidate-only',
  boundaryWaitPolicy: 'hold-at-unstarted-run-until-caller-tick-and-async-start-settle',
  terminalPolicy: 'clip-at-frame-968-candidate; nonzero-source-tail-unresolved',
  initialZeroBlockFrame: 24,
  sourceMissingBlockInterval: Object.freeze({firstFrame: 340, lastFrame: 383}),
} as const);

export type P005AudioCandidateState =
  'paused' | 'starting' | 'playing' | 'interrupted' | 'ended' | 'error' | 'closed';
export type P005AudioCandidatePhase =
  'preroll' | 'first-run' | 'initial-zero-block' | 'first-run-depleted' |
  'missing-block-gap' | 'second-run' | 'terminal';
export type P005AudioCandidateSnapshot = Readonly<{
  state: P005AudioCandidateState;
  timelineSample: number;
  frame: number;
  phase: P005AudioCandidatePhase;
  audio: ReturnType<P005AudioTransport['snapshot']>;
  error: string | null;
}>;

function phase(sample: number): P005AudioCandidatePhase {
  const position = resolveP005AudioSample(sample);
  if (position.kind === 'terminal') return 'terminal';
  if (position.kind === 'preroll') return 'preroll';
  if (position.kind === 'active') {
    if (position.group === 2) return 'second-run';
    return Math.floor(sample / frameSamples) + 1 === 24 ? 'initial-zero-block' : 'first-run';
  }
  // Run depletion precedes the authored blockless interval. In particular,
  // frame338 still has a positive source block; "gap" does not prove silence.
  return sample < 339 * frameSamples ? 'first-run-depleted' : 'missing-block-gap';
}

export class P005AudioCandidateClock {
  readonly policy = P005_AUDIO_CANDIDATE_CLOCK_POLICY;
  private readonly transport: P005AudioTransport;
  private state: P005AudioCandidateState = 'paused';
  private timelineSample = 0;
  private anchor: {sample: number; time: number} | null = null;
  private activeGroup: 1 | 2 | null = null;
  private generation = 0;
  private error: string | null = null;
  private closing: Promise<void> | null = null;
  private readonly stateChanged = () => {
    if (this.context.state !== 'running' && (this.state === 'playing' || this.state === 'starting'))
      this.interrupt();
  };

  constructor(private readonly context: AudioContext, buffer: AudioBuffer) {
    // Transport validates the complete mono decode and owns this context.
    this.transport = new P005AudioTransport(context, buffer);
    context.addEventListener('statechange', this.stateChanged);
  }

  private current(generation: number) {
    return this.state !== 'closed' && this.generation === generation;
  }

  private cancel() {
    this.generation++;
    this.transport.pause();
    this.activeGroup = null;
    this.anchor = null;
  }

  private captureTime() {
    if (!this.anchor) return;
    const elapsed = Math.floor(Math.max(0, this.context.currentTime - this.anchor.time) * rate + 1e-7);
    let sample = Math.min(terminal, Math.max(this.timelineSample, this.anchor.sample + elapsed));
    if (this.activeGroup !== null) {
      const run = P005_AUDIO_RUNS[this.activeGroup - 1]!;
      const audioSample = run.timelineStartSample + this.transport.snapshot().sample - run.sourceStartSample;
      sample = Math.min(terminal, Math.max(sample, audioSample));
    }
    const unstarted = P005_AUDIO_RUNS.find(run =>
      run.group !== this.activeGroup && this.timelineSample <= run.timelineStartSample);
    if (unstarted && sample >= unstarted.timelineStartSample) {
      // Never skip a run's beginning merely because the caller's RAF was late.
      sample = unstarted.timelineStartSample;
      this.anchor = null;
    }
    this.timelineSample = sample;
  }

  private observe() {
    if (this.state !== 'playing') return;
    if (this.context.state !== 'running') {this.interrupt(); return;}
    this.captureTime();
    if (this.timelineSample === terminal) {
      this.cancel();
      this.state = 'ended';
    }
  }

  private interrupt() {
    if (this.state === 'playing') this.captureTime();
    this.cancel();
    this.state = this.timelineSample === terminal ? 'ended' : 'interrupted';
  }

  private value(): P005AudioCandidateSnapshot {
    return Object.freeze({state: this.state, timelineSample: this.timelineSample,
      frame: Math.min(968, 1 + Math.floor(this.timelineSample / frameSamples)),
      phase: phase(this.timelineSample), audio: Object.freeze(this.transport.snapshot()), error: this.error});
  }

  snapshot(): P005AudioCandidateSnapshot {
    this.observe();
    return this.value();
  }

  pause() {
    if (this.state === 'closed') return;
    this.observe();
    this.cancel();
    this.state = this.timelineSample === terminal ? 'ended' : 'paused';
  }

  seekFrame(frame: number) {
    if (!Number.isInteger(frame) || frame < 1 || frame > 968) throw Error('P005_CANDIDATE_FRAME');
    if (this.state === 'closed') throw Error('P005_CANDIDATE_CLOSED');
    this.cancel();
    this.timelineSample = (frame - 1) * frameSamples;
    const position = resolveP005AudioSample(this.timelineSample);
    if (position.kind === 'active')
      this.transport.setWindow(position.sourceSample, position.sourceEndSample);
    this.state = this.timelineSample === terminal ? 'ended' : 'paused';
    this.error = null;
  }

  setVolume(volume: number) {this.transport.setVolume(volume);}

  private fail(error: unknown) {
    this.cancel();
    this.state = 'error';
    this.error = error instanceof Error ? error.message : String(error);
  }

  private async startGroup(position: Extract<P005AudioPosition, {kind: 'active'}>, generation: number) {
    this.transport.setWindow(position.sourceSample, position.sourceEndSample);
    const started = await this.transport.play();
    if (!this.current(generation)) return false;
    if (!started || this.context.state !== 'running') throw Error('P005_CANDIDATE_START');
    const run = P005_AUDIO_RUNS[position.group - 1]!;
    const audio = this.transport.snapshot();
    this.timelineSample = Math.min(terminal, run.timelineStartSample + audio.sample - run.sourceStartSample);
    this.activeGroup = position.group;
    this.anchor = {sample: this.timelineSample, time: this.context.currentTime};
    this.state = 'playing';
    this.observe();
    return true;
  }

  async play(): Promise<boolean> {
    if (this.state === 'closed') return false;
    this.observe();
    if (this.state === 'playing') return true;
    if (this.timelineSample === terminal) {this.state = 'ended'; return false;}
    this.cancel();
    const generation = this.generation;
    this.state = 'starting';
    this.error = null;
    try {
      await this.context.resume();
      if (!this.current(generation)) return false;
      if (this.context.state !== 'running') throw Error('P005_CANDIDATE_CONTEXT_NOT_RUNNING');
      const position = resolveP005AudioSample(this.timelineSample);
      if (position.kind === 'active') return await this.startGroup(position, generation);
      this.anchor = {sample: this.timelineSample, time: this.context.currentTime};
      this.state = 'playing';
      return true;
    } catch (error) {
      if (!this.current(generation)) return false;
      this.fail(error);
      throw error;
    }
  }

  /** The caller serializes tick calls. No timer, RAF or implicit page advance is
   * owned here. A pending start freezes the timeline and duplicate ticks do not
   * create extra nodes. AudioContext interruption requires an explicit play. */
  async tick(): Promise<P005AudioCandidateSnapshot> {
    this.observe();
    if (this.state !== 'playing') return this.value();
    const position = resolveP005AudioSample(this.timelineSample);
    if (position.kind !== 'active') {
      if (this.activeGroup !== null) {this.transport.pause(); this.activeGroup = null;}
      return this.value();
    }
    if (this.activeGroup === position.group) return this.value();
    this.cancel();
    const generation = this.generation;
    this.state = 'starting';
    this.error = null;
    try {await this.startGroup(position, generation);}
    catch (error) {
      if (this.current(generation)) {this.fail(error); throw error;}
    }
    return this.value();
  }

  replay(): Promise<boolean> {
    if (this.state === 'closed') return Promise.resolve(false);
    this.seekFrame(1);
    return this.play();
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.observe();
    this.cancel();
    this.state = 'closed';
    this.context.removeEventListener('statechange', this.stateChanged);
    try {this.closing = this.transport.close();}
    catch (error) {this.closing = Promise.reject(error);}
    return this.closing;
  }
}
